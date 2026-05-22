import { adjudicate, classic1901 } from "/packages/engine/dist/index.js";
import { mapSize, positionForLocation, positionForProvince, provinceLabelIds, unitPositions } from "./mapData.js";

const mapImageUrl = "./assets/diplomacy.svg";

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

const provinceById = new Map(classic1901.provinces.map((province) => [province.id, province]));
const locationById = new Map(classic1901.locations.map((location) => [location.id, location]));
const powerById = new Map(classic1901.powers.map((power) => [power.id, power]));
const initialLocationByUnitId = new Map(classic1901.initialState.units.map((unit) => [unit.id, unit.location]));

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

loadProvinceGeometry();
render();

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
  group.append(svg(unit.type === "army" ? "rect" : "path", unitShapeAttributes(unit.type, x, y, powerColors[unit.power])));
  group.append(text(unit.type === "army" ? "A" : "F", { class: "unit-label", x, y: y + 3 }));
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

function unitShapeAttributes(type, x, y, fill) {
  if (type === "army") {
    return { class: "unit-body", x: x - 8, y: y - 7, width: 16, height: 14, rx: 2, fill };
  }

  return {
    class: "unit-body",
    d: `M ${x - 10} ${y + 6} L ${x + 9} ${y + 6} L ${x + 12} ${y - 1} L ${x - 5} ${y - 6} Z`,
    fill,
  };
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
