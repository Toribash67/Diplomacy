import { classic1901 } from "/packages/engine/dist/index.js";
import { provincePositions } from "./mapData.js";

const powerColors = {
  austria: "#d35d52",
  england: "#6f55a5",
  france: "#3d75c4",
  germany: "#4f555f",
  italy: "#4b9f69",
  russia: "#8c6a4a",
  turkey: "#d2963b",
};

const neutralColor = "#d7d0bd";
const board = document.querySelector("#board");
const selection = document.querySelector("#selection");
const powerList = document.querySelector("#powerList");
const phaseLabel = document.querySelector("#phaseLabel");
const adjacencyToggle = document.querySelector("#adjacencyToggle");
const labelsToggle = document.querySelector("#labelsToggle");

const provinceById = new Map(classic1901.provinces.map((province) => [province.id, province]));
const locationById = new Map(classic1901.locations.map((location) => [location.id, location]));
const powerById = new Map(classic1901.powers.map((power) => [power.id, power]));
const state = classic1901.initialState;
const selected = { provinceId: "par" };

phaseLabel.textContent = formatPhase(state.phase);

adjacencyToggle.addEventListener("change", render);
labelsToggle.addEventListener("change", render);

renderPowerList();
render();

function render() {
  board.replaceChildren();
  board.classList.toggle("hide-labels", !labelsToggle.checked);

  const background = svg("rect", { class: "map-water", x: 0, y: 0, width: 1000, height: 720 });
  board.append(background);

  if (adjacencyToggle.checked) {
    board.append(renderAdjacency());
  }

  const provinces = svg("g", { class: "provinces" });
  for (const province of classic1901.provinces) {
    provinces.append(renderProvince(province));
  }
  board.append(provinces);

  const units = svg("g", { class: "units" });
  for (const unit of state.units) {
    units.append(renderUnit(unit));
  }
  board.append(units);

  renderSelection(selected.provinceId);
}

function renderProvince(province) {
  const [x, y] = positionForProvince(province.id);
  const group = svg("g", {
    class: `province ${province.type} ${province.id === selected.provinceId ? "selected" : ""}`,
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

  const owner = state.supplyCenterOwners[province.id];
  const fill = province.type === "sea" ? "#9fc4d0" : owner ? powerColors[owner] : neutralColor;
  const radius = province.type === "sea" ? 23 : 20;
  group.append(svg("circle", { class: "province-body", cx: x, cy: y, r: radius, fill }));

  if (province.supplyCenter) {
    group.append(svg("circle", { class: "supply-center", cx: x + 14, cy: y - 14, r: 5 }));
  }

  group.append(text(province.id.toUpperCase(), { class: "province-label", x, y: y + radius + 15 }));
  return group;
}

function renderUnit(unit) {
  const location = locationById.get(unit.location);
  const province = provinceById.get(location.province);
  const [x, y] = positionForProvince(location.province);
  const group = svg("g", { class: "unit", "aria-label": `${powerById.get(unit.power).name} ${unit.type} in ${province.name}` });
  group.append(svg(unit.type === "army" ? "rect" : "path", unitShapeAttributes(unit.type, x, y, powerColors[unit.power])));
  group.append(text(unit.type === "army" ? "A" : "F", { class: "unit-label", x, y: y + 4 }));
  return group;
}

function renderAdjacency() {
  const group = svg("g", { class: "adjacency" });
  const seen = new Set();
  for (const [fromLocationId, destinations] of Object.entries(classic1901.adjacency)) {
    const fromLocation = locationById.get(fromLocationId);
    if (!fromLocation) continue;
    const fromProvince = fromLocation.province;
    const [x1, y1] = positionForProvince(fromProvince);
    for (const destination of destinations) {
      const toLocation = locationById.get(destination.to);
      if (!toLocation || toLocation.province === fromProvince) continue;
      const key = [fromProvince, toLocation.province].sort().join(":");
      if (seen.has(key)) continue;
      seen.add(key);
      const [x2, y2] = positionForProvince(toLocation.province);
      group.append(svg("line", { x1, y1, x2, y2 }));
    }
  }
  return group;
}

function renderSelection(provinceId) {
  const province = provinceById.get(provinceId);
  const units = state.units.filter((unit) => locationById.get(unit.location)?.province === provinceId);
  const ownerId = state.supplyCenterOwners[provinceId];
  const locations = classic1901.locations.filter((location) => location.province === provinceId);
  const locationNames = locations.map((location) => location.id.toUpperCase()).join(", ");

  selection.innerHTML = "";
  selection.append(element("div", { className: "selected-title", textContent: province.name }));
  selection.append(element("div", { className: "meta-row", textContent: `Province: ${province.type}` }));
  selection.append(element("div", { className: "meta-row", textContent: `Locations: ${locationNames}` }));
  selection.append(element("div", { className: "meta-row", textContent: `Supply: ${province.supplyCenter ? ownerName(ownerId) : "No"}` }));

  for (const unit of units) {
    const power = powerById.get(unit.power);
    const row = element("div", { className: "unit-row" });
    row.append(element("span", { className: "swatch", style: `background:${powerColors[unit.power]}` }));
    row.append(element("span", { textContent: `${power.name} ${unit.type}` }));
    selection.append(row);
  }
}

function renderPowerList() {
  for (const power of classic1901.powers) {
    const supplyCenters = Object.values(state.supplyCenterOwners).filter((owner) => owner === power.id).length;
    const units = state.units.filter((unit) => unit.power === power.id).length;
    const row = element("button", { className: "power-row" });
    row.append(element("span", { className: "swatch", style: `background:${powerColors[power.id]}` }));
    row.append(element("span", { className: "power-name", textContent: power.name }));
    row.append(element("span", { className: "power-count", textContent: `${units}/${supplyCenters}` }));
    powerList.append(row);
  }
}

function selectProvince(provinceId) {
  selected.provinceId = provinceId;
  render();
}

function positionForProvince(provinceId) {
  return provincePositions[provinceId] ?? [500, 360];
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

function unitShapeAttributes(type, x, y, fill) {
  if (type === "army") {
    return { class: "unit-body", x: x - 12, y: y - 10, width: 24, height: 20, rx: 3, fill };
  }

  return {
    class: "unit-body",
    d: `M ${x - 15} ${y + 8} L ${x + 13} ${y + 8} L ${x + 18} ${y - 2} L ${x - 8} ${y - 8} Z`,
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
