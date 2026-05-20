import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { locationId } from "./types.js";
import { buildAdjacency, buildSymmetricAdjacency, edge } from "./variantBuilder.js";

describe("variantBuilder", () => {
  it("creates adjacency entries for isolated locations", () => {
    const alpha = locationId("alpha");
    const bravo = locationId("bravo");

    assert.deepEqual(buildAdjacency([alpha, bravo], []), {
      [alpha]: [],
      [bravo]: [],
    });
  });

  it("deduplicates explicit edges", () => {
    const alpha = locationId("alpha");
    const bravo = locationId("bravo");

    assert.deepEqual(buildAdjacency([alpha, bravo], [edge(alpha, bravo), edge(alpha, bravo)]), {
      [alpha]: [{ to: bravo, unitTypes: ["army", "fleet"] }],
      [bravo]: [],
    });
  });

  it("merges unit types for duplicate destinations", () => {
    const alpha = locationId("alpha");
    const bravo = locationId("bravo");

    assert.deepEqual(buildAdjacency([alpha, bravo], [edge(alpha, bravo, ["army"]), edge(alpha, bravo, ["fleet"])]), {
      [alpha]: [{ to: bravo, unitTypes: ["army", "fleet"] }],
      [bravo]: [],
    });
  });

  it("builds reciprocal edges from location pairs", () => {
    const alpha = locationId("alpha");
    const bravo = locationId("bravo");

    assert.deepEqual(buildSymmetricAdjacency([alpha, bravo], [[alpha, bravo]]), {
      [alpha]: [{ to: bravo, unitTypes: ["army", "fleet"] }],
      [bravo]: [{ to: alpha, unitTypes: ["army", "fleet"] }],
    });
  });
});
