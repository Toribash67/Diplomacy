export async function loadMapGeometry({ mapImageUrl, provinceLabelIds }) {
  const response = await fetch(mapImageUrl);
  const svgText = await response.text();
  const mapDocument = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const labelToProvince = new Map(Object.entries(provinceLabelIds).map(([provinceId, labelId]) => [labelId, provinceId]));
  const provinceGeometry = new Map();
  const provinceLabelPositions = new Map();
  const supplyCenterPositions = new Map();

  for (const label of mapDocument.querySelectorAll("text[id]")) {
    const provinceId = labelToProvince.get(label.id);
    if (!provinceId) continue;
    const labelPosition = parseLabelPosition(label);
    if (labelPosition) {
      provinceLabelPositions.set(provinceId, labelPosition);
    }
    const group = label.closest("g");
    const paths = [...group.querySelectorAll(":scope > path")]
      .map((path) => path.getAttribute("d"))
      .filter(Boolean);
    if (paths.length > 0) {
      provinceGeometry.set(provinceId, paths);
    }
    const supplyCenterPosition = parseSupplyCenterPosition(group);
    if (supplyCenterPosition) {
      supplyCenterPositions.set(provinceId, supplyCenterPosition);
    }
  }

  addExtraProvincePaths(mapDocument, provinceGeometry, provinceLabelIds);
  setImpassableBackground(mapDocument);
  removeEmbeddedMapOverlays(mapDocument);

  return {
    provinceGeometry,
    provinceLabelPositions,
    supplyCenterPositions,
    sanitizedMapImageUrl: URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(mapDocument)], { type: "image/svg+xml" })),
  };
}

function addExtraProvincePaths(mapDocument, geometry, provinceLabelIds) {
  const replacementPathByProvince = {
    nth: ["m171 197v-16c0-3.55 0.7-7.06 2.06-10.33 1.35-3.28 3.34-6.25 5.85-8.76 2.51-2.51 5.48-4.5 8.76-5.85 3.27-1.36 6.78-2.06 10.33-2.06h38l1 6-4 7-2 13 2 6-4 6 2 9 10 8v15h7l-3 13h-34v37l-4 5h-2v-3l-7 13-7 10-18 2-1-7-7-1 11-10 2-9-1-4-6-2-3 2-2-1 3-4 1-13-2-6-5-7v-13l-2-8-4-2-6-1 7-1 7-4 5-8z"],
    nwg: ["m362 33l-5 6-14 5-19 10-4 10-10 11-1 9-6 2-11 25-15 21-8 2-5 8-6-1-22 13h-38c-3.55 0-7.06 0.7-10.33 2.06-3.28 1.35-6.25 3.34-8.76 5.85-2.51 2.51-4.5 5.48-5.85 8.76-1.36 3.27-2.06 6.78-2.06 10.33v16l-13-4-6 1 2-6 7-3 1-4-14-4v-177h214z"],
  };

  for (const [provinceId, paths] of Object.entries(replacementPathByProvince)) {
    geometry.set(provinceId, paths);
  }

  const extraPathByProvince = {
    bul: ["m371 438l-5 1 5 17-6 5 4 3h7l12-4 4 12 8-4 8 2 5-6-1-10"],
    spa: ["m134 417l-11-5-10-5-1-8-11-3-5 1-24-13-13-3-5-6-6-1-2 4-7-3-6 6 2 3-3 12 11-1-1 4 13 1 7 7-1 4-9 1-10 20-5-1 3 10"],
    stp: ["m414 147l-4 5 2 9-10 16 1 6 8 1 3 3h-6l-8 5-1 5-12-1-16 2-2 4 3 3 10 1 12-1 11 12 4 11 12 1 7-4 11-14 8-2 4 4 6-3-1-3 2-13 18-11 13 1 26-15 19-5 30-5"],
  };

  for (const [provinceId, paths] of Object.entries(extraPathByProvince)) {
    geometry.set(provinceId, [...(geometry.get(provinceId) ?? []), ...paths]);
  }

  for (const provinceId of ["swe"]) {
    const label = mapDocument.getElementById(provinceLabelIds[provinceId]);
    const group = label?.closest("g");
    const paths = group ? [...group.querySelectorAll(":scope > path")].map((path) => path.getAttribute("d")).filter(Boolean) : [];
    if (paths.length > 0) {
      geometry.set(provinceId, paths);
    }
  }
}

function parseLabelPosition(label) {
  const transform = label.getAttribute("style")?.match(/matrix\(([^)]+)\)/);
  if (!transform) {
    return undefined;
  }

  const values = transform[1].split(",").map((value) => Number.parseFloat(value.trim()));
  if (values.length !== 6 || values.some(Number.isNaN)) {
    return undefined;
  }

  return [values[4], values[5]];
}

function parseSupplyCenterPosition(group) {
  const path = group?.querySelector(":scope > g#sc > path");
  const pathData = path?.getAttribute("d");
  const match = pathData?.match(/^m\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/i);
  if (!match) {
    return undefined;
  }

  const x = Number.parseFloat(match[1]);
  const y = Number.parseFloat(match[2]);
  return Number.isNaN(x) || Number.isNaN(y) ? undefined : [x, y - 4];
}

function removeEmbeddedMapOverlays(mapDocument) {
  for (const label of mapDocument.querySelectorAll("text")) {
    label.remove();
  }

  for (const supplyCenter of mapDocument.querySelectorAll("g#sc")) {
    supplyCenter.remove();
  }

  const unitAndOwnerClasses = [".s5", ".s6", ".s7", ".s8", ".s9", ".s10", ".s11"].join(",");
  for (const overlay of mapDocument.querySelectorAll(unitAndOwnerClasses)) {
    const group = overlay.closest("g");
    if (group?.id === "sc") {
      continue;
    }
    overlay.remove();
  }
}

function setImpassableBackground(mapDocument) {
  const background = mapDocument.getElementById("Layer 1");
  background?.classList.remove("s0");
  background?.setAttribute("fill", "#dddddd");
}
