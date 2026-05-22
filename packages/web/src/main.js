import { adjudicate, classic1901 } from "/packages/engine/dist/index.js";
import { mapSize, positionForLocation, positionForProvince, provinceLabelIds, unitPositions } from "./mapData.js";

const mapImageUrl = "./assets/diplomacy.svg";
const fleetPath = "M -53.45199966430664 6.447000026702879 L -54.00400161743164 6.474337100982664 L -54.00400161743164 6.499000072479246 L -54.00400161743164 8.999999999999998 L -57 6.881187915802 L -57 -8.881188392639158 L -54.00400161743164 -10.999999999999998 L -54.00400161743164 -8.19200038909912 L -54.00400161743164 -7.89721632003784 L -53.91699981689453 -7.887000083923338 L -52.25199890136719 -7.822999954223631 L -50.5880012512207 -7.887000083923338 L -49.152000427246094 -8.05563163757324 L -48.952999114990234 -8.07900047302246 L -48.386207580566406 -8.19200038909912 L -47.37300109863281 -8.39400005340576 L -47.00767135620117 -8.50005531311035 L -47.01346206665039 -8.381838798522947 L -47.02275848388672 -8.19200038909912 L -47.029052734375 -8.063493728637694 L -47.040000915527344 -7.840000152587889 L -47.04252624511719 -7.822999954223631 L -47.14799880981445 -7.112999916076658 L -47.32600021362305 -6.399000167846678 L -47.57400131225586 -5.705999851226806 L -47.888999938964844 -5.040999889373778 L -48.266998291015625 -4.4089999198913565 L -48.70600128173828 -3.818000078201293 L -49.152000427246094 -3.325955390930175 L -49.20000076293945 -3.2730000019073477 L -49.25902557373047 -3.2194969654083243 L -49.152000427246094 -3.223637580871581 L -48.90999984741211 -3.2330000400543204 L -47.00400161743164 -3.4556522369384757 L -46.573001861572266 -3.506000041961669 L -44.316001892089844 -3.957000017166137 L -43.79316329956055 -4.108688354492187 L -43.80140686035156 -3.9390122890472403 L -43.8233757019043 -3.486665487289428 L -43.8390007019043 -3.1649999618530265 L -43.84257507324219 -3.141000032424926 L -43.99399948120117 -2.1249999999999996 L -44.249000549316406 -1.1050000190734859 L -44.259010314941406 -1.0770000219345088 L -44.60300064086914 -0.11500000208616243 L -44.657474517822266 1.1102230246251565e-16 L -45.053001403808594 0.8349999785423278 L -45.59299850463867 1.7369999885559078 L -46.220001220703125 2.5820000171661373 L -46.92599868774414 3.3610000610351554 L -47.70500183105469 4.066999912261962 L -48.54899978637695 4.692999839782714 L -49.45100021362305 5.2340002059936515 L -50.402000427246094 5.684000015258788 L -51.391998291015625 6.038000106811522 L -52.4119987487793 6.29300022125244 L -53.45199966430664 6.447000026702879 z";
const fleetPathCenter = { x: -50.3966, y: -1 };

const powerColors = {
  austria: "#ff0000",
  england: "#0000ff",
  france: "#00ffff",
  germany: "#808080",
  italy: "#00ff00",
  russia: "#008000",
  turkey: "#ffff00",
};

const board = document.querySelector("#board");
const selection = document.querySelector("#selection");
const powerList = document.querySelector("#powerList");
const phaseLabel = document.querySelector("#phaseLabel");
const orderList = document.querySelector("#orderList");
const resultList = document.querySelector("#resultList");
const submitOrdersButton = document.querySelector("#submitOrders");
const resetGameButton = document.querySelector("#resetGame");
const labelsToggle = document.querySelector("#labelsToggle");
const appShell = document.querySelector(".app-shell");
const sidePane = document.querySelector("#orderPanel");
const paneResizer = document.querySelector("#paneResizer");

const sidePaneWidthStorageKey = "diplomacy.sidePaneWidth";
const defaultSidePaneWidth = 420;
const sidePaneKeyboardStep = 24;
const minimumBoardPaneWidth = 360;
const stackedLayoutQuery = "(max-width: 720px)";

const provinceById = new Map(classic1901.provinces.map((province) => [province.id, province]));
const locationById = new Map(classic1901.locations.map((location) => [location.id, location]));
const powerById = new Map(classic1901.powers.map((power) => [power.id, power]));
const initialLocationByUnitId = new Map(classic1901.initialState.units.map((unit) => [unit.id, unit.location]));

let preferredSidePaneWidth = defaultSidePaneWidth;
let state = cloneState(classic1901.initialState);
let lastResult = undefined;
let lastOrderUnitLabels = new Map();
let selectedProvinceId = "par";
let draftOrders = new Map();
let landProvinceOwners = landProvinceOwnersFromUnits(state.units);
let provinceGeometry = new Map();
let provinceLabelPositions = new Map();
let supplyCenterPositions = new Map();
let sanitizedMapImageUrl = mapImageUrl;

labelsToggle.addEventListener("change", render);
submitOrdersButton.addEventListener("click", submitOrders);
resetGameButton.addEventListener("click", resetGame);

initializePaneResizer();
loadProvinceGeometry();
render();

function initializePaneResizer() {
  if (!appShell || !sidePane || !paneResizer) {
    return;
  }

  preferredSidePaneWidth = readStoredSidePaneWidth() ?? defaultSidePaneWidth;
  setSidePaneWidth(preferredSidePaneWidth, { persist: false, remember: false });

  let activePointerId = undefined;
  let dragStartX = 0;
  let dragStartWidth = preferredSidePaneWidth;

  paneResizer.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    activePointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartWidth = currentSidePaneWidth();
    appShell.classList.add("resizing");
    paneResizer.setPointerCapture(activePointerId);
  });

  paneResizer.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    setSidePaneWidth(dragStartWidth - (event.clientX - dragStartX), { persist: false });
  });

  paneResizer.addEventListener("pointerup", finishResize);
  paneResizer.addEventListener("pointercancel", finishResize);
  paneResizer.addEventListener("lostpointercapture", () => {
    if (activePointerId === undefined) {
      return;
    }

    activePointerId = undefined;
    appShell.classList.remove("resizing");
    storeSidePaneWidth(preferredSidePaneWidth);
  });

  paneResizer.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? sidePaneKeyboardStep * 3 : sidePaneKeyboardStep;
    const { minWidth, maxWidth } = sidePaneResizeBounds();
    let nextWidth = undefined;

    if (event.key === "ArrowLeft") {
      nextWidth = currentSidePaneWidth() + step;
    } else if (event.key === "ArrowRight") {
      nextWidth = currentSidePaneWidth() - step;
    } else if (event.key === "Home") {
      nextWidth = minWidth;
    } else if (event.key === "End") {
      nextWidth = maxWidth;
    }

    if (nextWidth === undefined) {
      return;
    }

    event.preventDefault();
    setSidePaneWidth(nextWidth);
  });

  paneResizer.addEventListener("dblclick", () => {
    setSidePaneWidth(defaultSidePaneWidth);
  });

  window.addEventListener("resize", () => {
    setSidePaneWidth(preferredSidePaneWidth, { persist: false, remember: false });
  });

  function finishResize(event) {
    if (event.pointerId !== activePointerId) {
      return;
    }

    if (paneResizer.hasPointerCapture(event.pointerId)) {
      paneResizer.releasePointerCapture(event.pointerId);
    }

    activePointerId = undefined;
    appShell.classList.remove("resizing");
    storeSidePaneWidth(preferredSidePaneWidth);
  }
}

function setSidePaneWidth(width, options = {}) {
  const { persist = true, remember = true } = options;
  const { minWidth, maxWidth } = sidePaneResizeBounds();
  const fallbackWidth = Number.isFinite(width) ? width : defaultSidePaneWidth;
  const nextWidth = Math.round(clamp(fallbackWidth, minWidth, maxWidth));

  document.documentElement.style.setProperty("--side-pane-width", `${nextWidth}px`);
  paneResizer.setAttribute("aria-valuemin", String(Math.round(minWidth)));
  paneResizer.setAttribute("aria-valuemax", String(Math.round(maxWidth)));
  paneResizer.setAttribute("aria-valuenow", String(nextWidth));
  paneResizer.setAttribute("aria-valuetext", `${nextWidth}px`);

  if (remember) {
    preferredSidePaneWidth = nextWidth;
  }

  if (persist) {
    storeSidePaneWidth(nextWidth);
  }

  return nextWidth;
}

function sidePaneResizeBounds() {
  const rootStyles = getComputedStyle(document.documentElement);
  const minWidth = cssPixelValue(rootStyles.getPropertyValue("--side-pane-min-width"), 320);
  const configuredMaxWidth = cssPixelValue(rootStyles.getPropertyValue("--side-pane-max-width"), 760);
  const resizerWidth = paneResizer.getBoundingClientRect().width
    || cssPixelValue(rootStyles.getPropertyValue("--pane-resizer-width"), 10);
  const shellWidth = appShell.getBoundingClientRect().width || window.innerWidth;
  const viewportMaxWidth = shellWidth - resizerWidth - minimumBoardPaneWidth;
  const maxWidth = Math.max(minWidth, Math.min(configuredMaxWidth, viewportMaxWidth));

  return { minWidth, maxWidth };
}

function currentSidePaneWidth() {
  const sidePaneWidth = sidePane.getBoundingClientRect().width;
  if (sidePaneWidth > 0 && !window.matchMedia(stackedLayoutQuery).matches) {
    return sidePaneWidth;
  }

  return cssPixelValue(getComputedStyle(document.documentElement).getPropertyValue("--side-pane-width"), preferredSidePaneWidth);
}

function readStoredSidePaneWidth() {
  try {
    const width = Number.parseFloat(localStorage.getItem(sidePaneWidthStorageKey));
    return Number.isFinite(width) ? width : undefined;
  } catch {
    return undefined;
  }
}

function storeSidePaneWidth(width) {
  try {
    localStorage.setItem(sidePaneWidthStorageKey, String(Math.round(width)));
  } catch {
    // Ignore storage failures; resizing should still work for the current page.
  }
}

async function loadProvinceGeometry() {
  const response = await fetch(mapImageUrl);
  const svgText = await response.text();
  const document = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const labelToProvince = new Map(Object.entries(provinceLabelIds).map(([provinceId, labelId]) => [labelId, provinceId]));
  const nextGeometry = new Map();
  const nextLabelPositions = new Map();
  const nextSupplyCenterPositions = new Map();

  for (const label of document.querySelectorAll("text[id]")) {
    const provinceId = labelToProvince.get(label.id);
    if (!provinceId) continue;
    const labelPosition = parseLabelPosition(label);
    if (labelPosition) {
      nextLabelPositions.set(provinceId, labelPosition);
    }
    const group = label.closest("g");
    const paths = [...group.querySelectorAll(":scope > path")]
      .map((path) => path.getAttribute("d"))
      .filter(Boolean);
    if (paths.length > 0) {
      nextGeometry.set(provinceId, paths);
    }
    const supplyCenterPosition = parseSupplyCenterPosition(group);
    if (supplyCenterPosition) {
      nextSupplyCenterPositions.set(provinceId, supplyCenterPosition);
    }
  }

  addExtraProvincePaths(document, nextGeometry);
  setImpassableBackground(document);
  removeEmbeddedMapOverlays(document);
  sanitizedMapImageUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(document)], { type: "image/svg+xml" }));
  provinceGeometry = nextGeometry;
  provinceLabelPositions = nextLabelPositions;
  supplyCenterPositions = nextSupplyCenterPositions;
  renderBoard();
}

function render() {
  phaseLabel.textContent = formatPhase(state.phase);
  renderBoard();
  renderSelection();
  renderOrders();
  renderResults();
  renderPowerList();
}

function renderBoard() {
  board.setAttribute("viewBox", `0 0 ${mapSize.width} ${mapSize.height}`);
  board.replaceChildren();
  board.classList.toggle("hide-labels", !labelsToggle.checked);

  board.append(svg("rect", { class: "map-water", x: 0, y: 0, width: mapSize.width, height: mapSize.height }));
  board.append(svg("image", { class: "map-image", href: sanitizedMapImageUrl, x: 0, y: 0, width: mapSize.width, height: mapSize.height }));

  const ownership = svg("g", { class: "ownership-regions" });
  for (const province of classic1901.provinces) {
    ownership.append(renderOwnershipRegion(province));
  }
  board.append(ownership);

  const clickTargets = svg("g", { class: "province-targets" });
  for (const province of classic1901.provinces) {
    clickTargets.append(renderProvinceTarget(province));
  }
  board.append(clickTargets);

  const units = svg("g", { class: "units" });
  for (const unit of state.units) {
    units.append(renderUnit(unit));
  }
  board.append(units);
}

function renderOwnershipRegion(province) {
  const supplyCenterOwner = province.supplyCenter ? state.supplyCenterOwners[province.id] : undefined;
  const lastOccupier = landProvinceOwners[province.id];
  const group = svg("g", { class: "ownership-region" });

  if (supplyCenterOwner) {
    group.append(ownershipLayer(province, supplyCenterOwner, "supply-center-region"));
  }

  if (lastOccupier && lastOccupier !== supplyCenterOwner) {
    group.append(ownershipLayer(province, lastOccupier, "last-occupier-region"));
  }

  return group;
}

function ownershipLayer(province, owner, className) {
  const group = svg("g", { class: className });
  const paths = provinceGeometry.get(province.id) ?? [];
  if (paths.length > 0) {
    for (const path of paths) {
      group.append(svg("path", { d: path, fill: powerColors[owner] }));
    }
    return group;
  }

  const [x, y] = positionForProvince(province.id);
  group.append(svg("circle", { cx: x, cy: y, r: 16, fill: powerColors[owner] }));
  return group;
}

function renderProvinceTarget(province) {
  const [x, y] = positionForProvince(province.id);
  const owner = state.supplyCenterOwners[province.id];
  const radius = province.type === "sea" ? 13 : 11;
  const paths = provinceGeometry.get(province.id) ?? [];
  const group = svg("g", {
    class: `province ${province.type} ${province.id === selectedProvinceId ? "selected" : ""}`,
    tabindex: 0,
    role: "button",
    "aria-label": province.name,
  });

  group.addEventListener("click", () => selectProvince(province.id));
  group.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectProvince(province.id);
    }
  });

  if (paths.length > 0) {
    for (const path of paths) {
      group.append(svg("path", { class: "province-hit", d: path }));
    }
  } else {
    group.append(svg("circle", {
      class: "province-hit",
      cx: x,
      cy: y,
      r: Math.max(radius + 7, 18),
    }));
  }

  if (province.supplyCenter) {
    const [markerX, markerY] = supplyCenterPositions.get(province.id) ?? [x + 9, y - 9];
    group.append(svg("circle", {
      class: "ownership-marker",
      cx: markerX,
      cy: markerY,
      r: 4,
      fill: owner ? powerColors[owner] : "#f6f1dc",
    }));
  }

  const [labelX, labelY] = provinceLabelPositions.get(province.id) ?? [x, y + radius + 10];
  group.append(text(province.id.toUpperCase(), { class: "province-label", x: labelX, y: labelY }));
  return group;
}

function renderUnit(unit) {
  const location = locationById.get(unit.location);
  const province = provinceById.get(location.province);
  const [x, y] = initialLocationByUnitId.get(unit.id) === unit.location
    ? unitPositions[unit.id] ?? positionForLocation(unit.location, location.province)
    : positionForLocation(unit.location, location.province);
  const group = svg("g", {
    class: `unit ${unit.power}`,
    "aria-label": `${powerById.get(unit.power).name} ${unit.type} in ${province.name}`,
  });
  group.append(unitShape(unit.type, x, y, powerColors[unit.power]));
  const labelX = unit.type === "fleet" ? x + 1.4 : x;
  group.append(text(unit.type === "army" ? "A" : "F", { class: "unit-label", x: labelX, y: y + 3 }));
  return group;
}

function renderSelection() {
  const province = provinceById.get(selectedProvinceId);
  const units = unitsInProvince(selectedProvinceId);
  const ownerId = state.supplyCenterOwners[selectedProvinceId];
  const locations = classic1901.locations.filter((location) => location.province === selectedProvinceId);
  const locationNames = locations.map((location) => location.id.toUpperCase()).join(", ");

  selection.replaceChildren();
  selection.append(element("div", { className: "selected-title", textContent: province.name }));
  selection.append(element("div", { className: "meta-row", textContent: `Province: ${province.type}` }));
  selection.append(element("div", { className: "meta-row", textContent: `Locations: ${locationNames}` }));
  selection.append(element("div", { className: "meta-row", textContent: `Supply: ${province.supplyCenter ? ownerName(ownerId) : "No"}` }));

  if (units.length === 0) {
    selection.append(element("div", { className: "empty-row", textContent: "No unit present." }));
  }

  for (const unit of units) {
    const power = powerById.get(unit.power);
    const location = locationById.get(unit.location);
    const row = element("div", { className: "unit-row" });
    row.append(element("span", { className: "swatch", style: `background:${powerColors[unit.power]}` }));
    row.append(element("span", { textContent: `${power.name} ${unit.type} at ${location.id.toUpperCase()}` }));
    selection.append(row);
  }
}

function renderOrders() {
  orderList.replaceChildren();
  submitOrdersButton.disabled = false;

  if (state.phase.type === "retreat") {
    orderList.append(element("p", {
      className: "hint",
      textContent: "Retreat phase: the prototype will disband pending retreats when you submit.",
    }));
    for (const retreat of state.retreats ?? []) {
      const row = element("div", { className: "order-row compact" });
      row.append(element("span", { className: "order-unit", textContent: unitLabel(retreat.unit) }));
      row.append(element("span", { className: "order-summary", textContent: "disband" }));
      orderList.append(row);
    }
    return;
  }

  if (state.phase.type === "build") {
    orderList.append(element("p", {
      className: "hint",
      textContent: "Build phase: submit with no orders to advance for now.",
    }));
    return;
  }

  for (const unit of sortedUnits(state.units)) {
    const currentDraft = draftOrders.get(unit.id) ?? { type: "hold" };
    const row = element("div", { className: "order-row" });
    const unitButton = element("button", { className: "order-unit", type: "button", textContent: unitLabel(unit) });
    unitButton.addEventListener("click", () => selectProvince(locationById.get(unit.location).province));

    const action = element("select", { className: "order-select" });
    action.append(option("hold", "Hold", currentDraft.type === "hold"));
    action.append(option("move", "Move", currentDraft.type === "move"));
    action.addEventListener("change", () => {
      const nextType = action.value;
      draftOrders.set(unit.id, nextType === "move" ? { type: "move", to: legalDestinations(unit)[0]?.id } : { type: "hold" });
      renderOrders();
    });

    const destination = element("select", { className: "order-select" });
    destination.disabled = currentDraft.type !== "move";
    for (const location of legalDestinations(unit)) {
      destination.append(option(location.id, destinationLabel(location), currentDraft.to === location.id));
    }
    destination.addEventListener("change", () => {
      draftOrders.set(unit.id, { type: "move", to: destination.value });
    });

    row.append(unitButton, action, destination);
    orderList.append(row);
  }
}

function renderResults() {
  resultList.replaceChildren();

  if (!lastResult) {
    resultList.append(element("div", { className: "empty-row", textContent: "No adjudication yet." }));
    return;
  }

  const summary = element("div", {
    className: "result-summary",
    textContent: `${Object.values(lastResult.orderResults).length} orders resolved. ${lastResult.retreats.length} retreats pending.`,
  });
  resultList.append(summary);

  for (const result of Object.values(lastResult.orderResults)) {
    if (result.order.id.startsWith("auto:")) continue;
    const row = element("div", { className: `result-row ${result.status}` });
    row.append(element("span", { className: "result-status", textContent: result.status }));
    row.append(element("span", { className: "result-text", textContent: orderResultText(result) }));
    resultList.append(row);
  }
}

function renderPowerList() {
  powerList.replaceChildren();

  for (const power of classic1901.powers) {
    const supplyCenters = Object.values(state.supplyCenterOwners).filter((owner) => owner === power.id).length;
    const units = state.units.filter((unit) => unit.power === power.id).length;
    const row = element("div", { className: "power-row" });
    row.append(element("span", { className: "swatch", style: `background:${powerColors[power.id]}` }));
    row.append(element("span", { className: "power-name", textContent: power.name }));
    row.append(element("span", { className: "power-count", textContent: `${units}/${supplyCenters}` }));
    powerList.append(row);
  }
}

function addExtraProvincePaths(document, geometry) {
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
    const label = document.getElementById(provinceLabelIds[provinceId]);
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

function removeEmbeddedMapOverlays(document) {
  for (const label of document.querySelectorAll("text")) {
    label.remove();
  }

  for (const supplyCenter of document.querySelectorAll("g#sc")) {
    supplyCenter.remove();
  }

  const unitAndOwnerClasses = [".s5", ".s6", ".s7", ".s8", ".s9", ".s10", ".s11"].join(",");
  for (const overlay of document.querySelectorAll(unitAndOwnerClasses)) {
    const group = overlay.closest("g");
    if (group?.id === "sc") {
      continue;
    }
    overlay.remove();
  }
}

function setImpassableBackground(document) {
  const background = document.getElementById("Layer 1");
  background?.classList.remove("s0");
  background?.setAttribute("fill", "#dddddd");
}

function submitOrders() {
  lastOrderUnitLabels = new Map(state.units.map((unit) => [unit.id, unitLabel(unit)]));
  const orders = state.phase.type === "movement"
    ? buildMovementOrders()
    : state.phase.type === "retreat"
      ? buildRetreatOrders()
      : [];

  lastResult = adjudicate(state, orders, classic1901);
  state = cloneState(lastResult.nextState);
  landProvinceOwners = {
    ...landProvinceOwners,
    ...landProvinceOwnersFromUnits(state.units),
  };
  draftOrders = new Map();

  if (!provinceById.has(selectedProvinceId) || unitsInProvince(selectedProvinceId).length === 0) {
    selectedProvinceId = state.units[0] ? locationById.get(state.units[0].location).province : "par";
  }

  render();
}

function buildMovementOrders() {
  return sortedUnits(state.units).map((unit, index) => {
    const draft = draftOrders.get(unit.id) ?? { type: "hold" };
    const id = `order:${state.phase.year}:${state.phase.season}:${index}:${unit.id}`;

    if (draft.type === "move" && draft.to) {
      return { id, type: "move", unitId: unit.id, to: draft.to };
    }

    return { id, type: "hold", unitId: unit.id };
  });
}

function buildRetreatOrders() {
  return (state.retreats ?? []).map((retreat, index) => ({
    id: `retreat:${state.phase.year}:${state.phase.season}:${index}:${retreat.unit.id}`,
    type: "disband",
    unitId: retreat.unit.id,
  }));
}

function legalDestinations(unit) {
  return (classic1901.adjacency[unit.location] ?? [])
    .filter((adjacency) => adjacency.unitTypes.includes(unit.type))
    .map((adjacency) => locationById.get(adjacency.to))
    .filter(Boolean)
    .sort((left, right) => destinationLabel(left).localeCompare(destinationLabel(right)));
}

function selectProvince(provinceId) {
  selectedProvinceId = provinceId;
  render();
}

function resetGame() {
  state = cloneState(classic1901.initialState);
  lastResult = undefined;
  lastOrderUnitLabels = new Map();
  draftOrders = new Map();
  landProvinceOwners = landProvinceOwnersFromUnits(state.units);
  selectedProvinceId = "par";
  render();
}

function unitsInProvince(provinceId) {
  return state.units.filter((unit) => locationById.get(unit.location)?.province === provinceId);
}

function landProvinceOwnersFromUnits(units) {
  return Object.fromEntries(units
    .map((unit) => [locationById.get(unit.location)?.province, unit.power])
    .filter(([provinceId]) => provinceById.get(provinceId)?.type !== "sea"));
}

function sortedUnits(units) {
  return [...units].sort((left, right) => unitLabel(left).localeCompare(unitLabel(right)));
}

function unitLabel(unit) {
  const power = powerById.get(unit.power);
  const location = locationById.get(unit.location);
  return `${power.name} ${unit.type === "army" ? "A" : "F"} ${location.id.toUpperCase()}`;
}

function destinationLabel(location) {
  return location.id.toUpperCase();
}

function orderResultText(result) {
  if (result.order.type === "move") {
    return `${unitName(result.order.unitId)} -> ${String(result.order.to).toUpperCase()}`;
  }

  if (result.order.type === "disband") {
    return `${unitName(result.order.unitId)} disband`;
  }

  return `${unitName(result.order.unitId)} hold`;
}

function unitName(unitId) {
  const previousLabel = lastOrderUnitLabels.get(unitId);
  if (previousLabel) {
    return previousLabel;
  }

  const unit = state.units.find((candidate) => candidate.id === unitId)
    ?? lastResult?.dislodgedUnits.find((dislodgement) => dislodgement.unit.id === unitId)?.unit
    ?? classic1901.initialState.units.find((candidate) => candidate.id === unitId);

  return unit ? unitLabel(unit) : String(unitId);
}

function ownerName(ownerId) {
  return ownerId ? powerById.get(ownerId).name : "Neutral";
}

function formatPhase(phase) {
  return `${capitalize(phase.season)} ${phase.year} ${capitalize(phase.type)}`;
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function cloneState(value) {
  return {
    ...value,
    units: value.units.map((unit) => ({ ...unit })),
    supplyCenterOwners: { ...value.supplyCenterOwners },
    retreats: value.retreats?.map((retreat) => ({
      ...retreat,
      unit: { ...retreat.unit },
      options: [...retreat.options],
    })),
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function cssPixelValue(value, fallback) {
  const pixels = Number.parseFloat(value);
  return Number.isFinite(pixels) ? pixels : fallback;
}

function unitShape(type, x, y, fill) {
  if (type === "army") {
    return svg("rect", { class: "unit-body", x: x - 8, y: y - 7, width: 16, height: 14, rx: 2, fill });
  }

  const group = svg("g", {
    class: "unit-body",
    transform: `translate(${x} ${y}) rotate(-90) scale(0.92) translate(${-fleetPathCenter.x} ${-fleetPathCenter.y})`,
  });
  group.append(svg("path", { d: fleetPath, fill }));
  return group;
}

function svg(tagName, attributes = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  for (const [name, value] of Object.entries(attributes)) {
    node.setAttribute(name, value);
  }
  return node;
}

function text(value, attributes = {}) {
  const node = svg("text", attributes);
  node.textContent = value;
  return node;
}

function option(value, label, selected) {
  const node = element("option", { value, textContent: label });
  node.selected = selected;
  return node;
}

function element(tagName, properties = {}) {
  const node = document.createElement(tagName);
  for (const [name, value] of Object.entries(properties)) {
    if (name === "style") {
      node.setAttribute("style", value);
    } else {
      node[name] = value;
    }
  }
  return node;
}
