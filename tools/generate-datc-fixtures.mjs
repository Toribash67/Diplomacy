import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error("Usage: node tools/generate-datc-fixtures.mjs DATC_v3_0.html packages/engine/src/datc/datcCases.ts");
  process.exit(1);
}

const html = readFileSync(inputPath, "utf8");
const chapterStart = html.indexOf('<h3><a name="6">6. TEST CASES</a></h3>');

if (chapterStart < 0) {
  throw new Error("Could not find DATC chapter 6.");
}

const chapterHtml = html.slice(chapterStart);
const caseHeadingPattern = /<h4><a name="(6\.[A-J]\.\d+)">([\s\S]*?)<\/a><\/h4>/g;
const headings = [...chapterHtml.matchAll(caseHeadingPattern)];

if (headings.length === 0) {
  throw new Error("No DATC cases found.");
}

const cases = headings.map((heading, index) => {
  const id = heading[1];
  const headingText = textContent(heading[2]);
  const nextHeadingIndex = headings[index + 1]?.index ?? chapterHtml.length;
  const body = chapterHtml.slice((heading.index ?? 0) + heading[0].length, nextHeadingIndex);
  const orderBlocks = [...body.matchAll(/<pre>([\s\S]*?)<\/pre>/g)].map((match) => cleanPre(match[1]));
  const expectation = textContent(body.replace(/<pre>[\s\S]*?<\/pre>/g, "\n")).trim();

  return {
    id,
    section: id.split(".").slice(0, 2).join("."),
    title: headingText.replace(new RegExp(`^${escapeRegExp(id)}\\.?\\s*`), ""),
    orderBlocks,
    expectation,
  };
});

const output = `// Generated from https://webdiplomacy.net/doc/DATC_v3_0.html.
// DATC Chapter 6 test cases are explicitly allowed to be copied separately by the source document.

export interface DatcCase {
  readonly id: string;
  readonly section: string;
  readonly title: string;
  readonly orderBlocks: readonly string[];
  readonly expectation: string;
}

export const datcSource = {
  url: "https://webdiplomacy.net/doc/DATC_v3_0.html",
  version: "3.0",
  chapter: "6. TEST CASES",
} as const;

export const datcCases = ${JSON.stringify(cases, null, 2)} as const satisfies readonly DatcCase[];
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, output);

function cleanPre(value) {
  return decodeEntities(value)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function textContent(value) {
  return decodeEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s+/g, "\n")
      .replace(/\n{3,}/g, "\n\n"),
  ).trim();
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
