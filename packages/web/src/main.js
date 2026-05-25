import { adjudicate, classic1901 } from "/packages/engine/dist/index.js";
import { mapSize, positionForLocation, positionForProvince, provinceLabelIds, unitPositions } from "./mapData.js";
import { arrowGeometry } from "./arrows.js";
import { element, emptyOrderField, option, svg, text } from "./dom.js";
import { loadMapGeometry } from "./mapGeometry.js";
import { initializeMapViewport } from "./mapViewport.js";
import { createOrderOptions } from "./orderOptions.js";
import { initializePaneResizer } from "./paneResizer.js";
import { unitShape } from "./unitShape.js";

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

const orderArrowStrokeWidth = 2.25;
const orderArrowHeadScale = 5.6;
const orderArrowHeadLength = orderArrowStrokeWidth * orderArrowHeadScale;
const orderArrowShaftShortening = orderArrowHeadLength * 0.42;

const board = document.querySelector("#board");
const selection = document.querySelector("#selection");
const powerList = document.querySelector("#powerList");
const phaseLabel = document.querySelector("#phaseLabel");
const orderList = document.querySelector("#orderList");
const mapOrderControls = document.querySelector("#mapOrderControls");
const resultList = document.querySelector("#resultList");
const submitOrdersButton = document.querySelector("#submitOrders");
const resetGameButton = document.querySelector("#resetGame");
const labelsToggle = document.querySelector("#labelsToggle");
const zoomMapInButton = document.querySelector("#zoomMapIn");
const zoomMapOutButton = document.querySelector("#zoomMapOut");
const resetMapViewButton = document.querySelector("#resetMapView");

const provinceById = new Map(classic1901.provinces.map((province) => [province.id, province]));
const locationById = new Map(classic1901.locations.map((location) => [location.id, location]));
const powerById = new Map(classic1901.powers.map((power) => [power.id, power]));
const initialLocationByUnitId = new Map(classic1901.initialState.units.map((unit) => [unit.id, unit.location]));

let state = cloneState(classic1901.initialState);
let lastResult = undefined;
let lastOrderUnitLabels = new Map();
let selectedProvinceId = "par";
let draftOrders = new Map();
let mapOrderUnitId = undefined;
let mapOrderIntent = undefined;
let retreatDrafts = new Map();
let buildDrafts = new Map();
let landProvinceOwners = landProvinceOwnersFromUnits(state.units);
let provinceGeometry = new Map();
let provinceLabelPositions = new Map();
let supplyCenterPositions = new Map();
let sanitizedMapImageUrl = mapImageUrl;

const {
  alignSupportedUnitDraft,
  convoyDestinationsForArmy,
  convoyOptionsForFleet,
  defaultDraftForAction,
  defaultSupportTarget,
  legalDestinations,
  normalizedDraftForUnit,
  supportDraft,
  supportOptionsForUnit,
  supportTargetsForUnit,
  targetValue,
} = createOrderOptions({
  variant: classic1901,
  provinceById,
  locationById,
  get state() {
    return state;
  },
  get draftOrders() {
    return draftOrders;
  },
  destinationLabel,
  locationProvince,
  sortedUnits,
});

labelsToggle.addEventListener("change", render);
submitOrdersButton.addEventListener("click", submitOrders);
resetGameButton.addEventListener("click", resetGame);

initializePaneResizer({
  appShell: document.querySelector(".app-shell"),
  sidePane: document.querySelector("#orderPanel"),
  paneResizer: document.querySelector("#paneResizer"),
});

const mapViewport = initializeMapViewport({
  board,
  zoomInButton: zoomMapInButton,
  zoomOutButton: zoomMapOutButton,
  resetButton: resetMapViewButton,
  mapSize,
});

loadProvinceGeometry();
render();

async function loadProvinceGeometry() {
  const geometry = await loadMapGeometry({ mapImageUrl, provinceLabelIds });
  sanitizedMapImageUrl = geometry.sanitizedMapImageUrl;
  provinceGeometry = geometry.provinceGeometry;
  provinceLabelPositions = geometry.provinceLabelPositions;
  supplyCenterPositions = geometry.supplyCenterPositions;
  renderBoard();
}

function render() {
  phaseLabel.textContent = formatPhase(state.phase);
  renderBoard();
  renderMapOrderControls();
  renderSelection();
  renderOrders();
  renderResults();
  renderPowerList();
}

function renderBoard() {
  mapViewport.applyViewBox();
  board.replaceChildren();
  board.classList.toggle("hide-labels", !labelsToggle.checked);

  board.append(renderArrowDefs());
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

  board.append(renderOrderArrows());

  const units = svg("g", { class: "units" });
  for (const unit of state.units) {
    units.append(renderUnit(unit));
  }
  board.append(units);
}

function renderArrowDefs() {
  const defs = svg("defs");
  defs.append(renderArrowMarker("order-arrowhead-black", "#111820", orderArrowHeadScale));
  defs.append(renderArrowMarker("order-arrowhead-convoy", "#1f6f9c", orderArrowHeadScale));
  return defs;
}

function renderArrowMarker(id, fill, size) {
  const marker = svg("marker", {
    id,
    viewBox: "0 0 10 10",
    refX: 10,
    refY: 5,
    markerWidth: size,
    markerHeight: size,
    markerUnits: "strokeWidth",
    orient: "auto-start-reverse",
  });
  marker.append(svg("path", { d: "M 0 0 L 10 5 L 0 10 z", fill }));
  return marker;
}

function renderOrderArrows() {
  const group = svg("g", { class: "order-arrows", "aria-hidden": "true" });
  if (state.phase.type !== "movement") {
    return group;
  }

  for (const unit of sortedUnits(state.units)) {
    const draft = normalizedDraftForUnit(unit, draftOrders.get(unit.id));

    if ((draft.type === "move" || draft.type === "move-via-convoy") && draft.to) {
      group.append(renderMoveArrow(unit, draft));
    }

    if (draft.type === "support" && draft.supportedUnitId) {
      const supportArrow = renderSupportArrow(unit, draft);
      if (supportArrow) {
        group.append(supportArrow);
      }
    }

    if (draft.type === "convoy" && draft.convoyedUnitId && draft.to) {
      const convoyArrow = renderConvoyArrow(unit, draft);
      if (convoyArrow) {
        group.append(convoyArrow);
      }
    }
  }

  return group;
}

function renderMoveArrow(unit, draft) {
  const group = svg("g", { class: "order-arrow-group move-order" });
  appendOrderArrow(group, [unitAnchor(unit), locationAnchor(draft.to)], "move", "order-arrowhead-black");
  return group;
}

function renderSupportArrow(unit, draft) {
  const supportedUnit = state.units.find((candidate) => candidate.id === draft.supportedUnitId);
  if (!supportedUnit) {
    return undefined;
  }

  const supportedAnchor = unitAnchor(supportedUnit);
  const points = draft.to
    ? [unitAnchor(unit), supportedAnchor, locationAnchor(draft.to)]
    : [unitAnchor(unit), supportedAnchor];
  const group = svg("g", { class: "order-arrow-group support-order" });
  appendOrderArrow(group, points, "support", "order-arrowhead-black");
  group.append(svg("circle", { class: "order-arrow-node support", cx: supportedAnchor[0], cy: supportedAnchor[1], r: 4.2 }));
  return group;
}

function renderConvoyArrow(unit, draft) {
  const convoyedUnit = state.units.find((candidate) => candidate.id === draft.convoyedUnitId);
  if (!convoyedUnit) {
    return undefined;
  }

  const fleetAnchor = unitAnchor(unit);
  const group = svg("g", { class: "order-arrow-group convoy-order" });
  appendOrderArrow(group, [unitAnchor(convoyedUnit), fleetAnchor, locationAnchor(draft.to)], "convoy", "order-arrowhead-convoy");
  group.append(svg("circle", { class: "order-arrow-node convoy", cx: fleetAnchor[0], cy: fleetAnchor[1], r: 4.4 }));
  return group;
}

function appendOrderArrow(group, points, className, markerId) {
  const geometry = arrowGeometry(points, orderArrowShaftShortening);
  if (!geometry) {
    return;
  }

  group.append(svg("path", { class: `order-arrow ${className}`, d: geometry.shaftPath }));
  group.append(svg("path", {
    class: `order-arrow-marker ${className}`,
    d: geometry.markerPath,
    "marker-end": `url(#${markerId})`,
  }));
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
    class: `province ${province.type} ${mapOrderProvinceClass(province.id)} ${province.id === selectedProvinceId ? "selected" : ""}`,
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
  const [x, y] = unitAnchor(unit);
  const group = svg("g", {
    class: `unit ${unit.power}`,
    "aria-label": `${powerById.get(unit.power).name} ${unit.type} in ${province.name}`,
  });
  group.append(unitShape(unit.type, x, y, powerColors[unit.power]));
  const labelX = unit.type === "fleet" ? x + 1.4 : x;
  group.append(text(unit.type === "army" ? "A" : "F", { class: "unit-label", x: labelX, y: y + 3 }));
  return group;
}

function unitAnchor(unit) {
  const location = locationById.get(unit.location);
  return initialLocationByUnitId.get(unit.id) === unit.location
    ? unitPositions[unit.id] ?? positionForLocation(unit.location, location.province)
    : positionForLocation(unit.location, location.province);
}

function locationAnchor(locationId) {
  const location = locationById.get(locationId);
  return positionForLocation(locationId, location?.province);
}

function mapOrderProvinceClass(provinceId) {
  if (state.phase.type !== "movement") {
    return "";
  }

  const unit = currentMapOrderUnit();
  if (!unit) {
    return "";
  }

  const draft = normalizedDraftForUnit(unit, draftOrders.get(unit.id));
  const classes = [];

  if (locationProvince(unit.location) === provinceId) {
    classes.push("order-source");
    if (mapOrderIntent?.unitId === unit.id) {
      classes.push("order-drafting");
    }
  }

  for (const targetProvince of [...mapOrderTargetProvinces(draft), ...mapOrderIntentProvinces()]) {
    if (targetProvince === provinceId) {
      classes.push("order-target");
    }
  }

  return classes.join(" ");
}

function mapOrderTargetProvinces(draft) {
  if ((draft.type === "move" || draft.type === "move-via-convoy") && draft.to) {
    return [locationProvince(draft.to)];
  }

  if (draft.type === "support" && draft.supportedUnitId) {
    const supportedUnit = state.units.find((candidate) => candidate.id === draft.supportedUnitId);
    return [
      supportedUnit ? locationProvince(supportedUnit.location) : undefined,
      draft.to ? locationProvince(draft.to) : undefined,
    ].filter(Boolean);
  }

  if (draft.type === "convoy" && draft.convoyedUnitId) {
    const convoyedUnit = state.units.find((candidate) => candidate.id === draft.convoyedUnitId);
    return [
      convoyedUnit ? locationProvince(convoyedUnit.location) : undefined,
      draft.to ? locationProvince(draft.to) : undefined,
    ].filter(Boolean);
  }

  return [];
}

function mapOrderIntentProvinces() {
  if (!mapOrderIntent) {
    return [];
  }

  const targetUnitId = mapOrderIntent.supportedUnitId ?? mapOrderIntent.convoyedUnitId;
  const targetUnit = state.units.find((unit) => unit.id === targetUnitId);
  return targetUnit ? [locationProvince(targetUnit.location)] : [];
}

function renderSelection() {
  const province = provinceById.get(selectedProvinceId);
  const units = unitsInProvince(selectedProvinceId);
  const retreatingUnits = retreatsFromProvince(selectedProvinceId);
  const ownerId = state.supplyCenterOwners[selectedProvinceId];
  const locations = classic1901.locations.filter((location) => location.province === selectedProvinceId);
  const locationNames = locations.map((location) => location.id.toUpperCase()).join(", ");

  selection.replaceChildren();
  selection.append(element("div", { className: "selected-title", textContent: province.name }));
  selection.append(element("div", { className: "meta-row", textContent: `Province: ${province.type}` }));
  selection.append(element("div", { className: "meta-row", textContent: `Locations: ${locationNames}` }));
  selection.append(element("div", { className: "meta-row", textContent: `Supply: ${province.supplyCenter ? ownerName(ownerId) : "No"}` }));

  if (units.length === 0 && retreatingUnits.length === 0) {
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

  for (const retreat of retreatingUnits) {
    const power = powerById.get(retreat.unit.power);
    const row = element("div", { className: "unit-row retreating" });
    row.append(element("span", { className: "swatch", style: `background:${powerColors[retreat.unit.power]}` }));
    row.append(element("span", { textContent: `${power.name} ${retreat.unit.type} dislodged from ${String(retreat.from).toUpperCase()}` }));
    selection.append(row);
  }
}

function renderOrders() {
  orderList.replaceChildren();
  submitOrdersButton.disabled = false;

  if (state.phase.type === "retreat") {
    renderRetreatOrders();
    return;
  }

  if (state.phase.type === "build") {
    renderBuildOrders();
    return;
  }

  for (const unit of sortedUnits(state.units)) {
    const currentDraft = normalizedDraftForUnit(unit, draftOrders.get(unit.id));
    const row = element("div", { className: "order-row" });
    const unitButton = element("button", { className: "order-unit", type: "button", textContent: unitLabel(unit) });
    unitButton.addEventListener("click", () => selectMapOrderUnit(unit.id));

    const action = element("select", { className: "order-select" });
    action.append(option("hold", "Hold", currentDraft.type === "hold"));
    action.append(option("move", "Move", currentDraft.type === "move"));
    if (convoyDestinationsForArmy(unit).length > 0) {
      action.append(option("move-via-convoy", "Via convoy", currentDraft.type === "move-via-convoy"));
    }
    if (convoyOptionsForFleet(unit).length > 0) {
      action.append(option("convoy", "Convoy", currentDraft.type === "convoy"));
    }
    if (supportOptionsForUnit(unit).length > 0) {
      action.append(option("support", "Support", currentDraft.type === "support"));
    }
    action.addEventListener("change", () => {
      draftOrders.set(unit.id, defaultDraftForAction(unit, action.value));
      render();
    });

    let firstField = emptyOrderField();
    let secondField = emptyOrderField();

    if (currentDraft.type === "move" || currentDraft.type === "move-via-convoy") {
      const destinations = currentDraft.type === "move" ? legalDestinations(unit) : convoyDestinationsForArmy(unit);
      const destination = element("select", { className: "order-select" });
      for (const location of destinations) {
        destination.append(option(location.id, destinationLabel(location), currentDraft.to === location.id));
      }
      destination.addEventListener("change", () => {
        draftOrders.set(unit.id, { ...currentDraft, to: destination.value });
        renderBoard();
      });

      firstField = destination;
    }

    if (currentDraft.type === "convoy") {
      const convoyOptions = convoyOptionsForFleet(unit);
      const selectedOption = convoyOptions.find((candidate) => candidate.army.id === currentDraft.convoyedUnitId)
        ?? convoyOptions[0];
      const destinations = selectedOption?.destinations ?? [];
      const convoyedUnit = element("select", { className: "order-select" });
      for (const candidate of convoyOptions) {
        convoyedUnit.append(option(candidate.army.id, unitLabel(candidate.army), selectedOption?.army.id === candidate.army.id));
      }
      convoyedUnit.addEventListener("change", () => {
        const nextOption = convoyOptions.find((candidate) => candidate.army.id === convoyedUnit.value);
        const nextDestination = nextOption?.destinations[0]?.id;
        draftOrders.set(unit.id, {
          type: "convoy",
          convoyedUnitId: convoyedUnit.value,
          to: nextDestination,
        });
        if (nextOption && nextDestination) {
          draftOrders.set(nextOption.army.id, { type: "move-via-convoy", to: nextDestination });
        }
        render();
      });

      const destination = element("select", { className: "order-select" });
      for (const location of destinations) {
        destination.append(option(location.id, destinationLabel(location), currentDraft.to === location.id));
      }
      destination.addEventListener("change", () => {
        draftOrders.set(unit.id, { ...currentDraft, to: destination.value });
        if (selectedOption) {
          draftOrders.set(selectedOption.army.id, { type: "move-via-convoy", to: destination.value });
        }
        render();
      });

      firstField = convoyedUnit;
      secondField = destination;
    }

    if (currentDraft.type === "support") {
      const supportOptions = supportOptionsForUnit(unit);
      const selectedOption = supportOptions.find((candidate) => candidate.unit.id === currentDraft.supportedUnitId)
        ?? supportOptions[0];
      const supportTargets = selectedOption?.targets ?? [];
      const selectedTarget = supportTargets.find((target) => targetValue(target) === targetValue(currentDraft))
        ?? defaultSupportTarget(selectedOption?.unit, supportTargets);
      const supportedUnit = element("select", { className: "order-select" });
      for (const candidate of supportOptions) {
        supportedUnit.append(option(candidate.unit.id, unitLabel(candidate.unit), selectedOption?.unit.id === candidate.unit.id));
      }
      supportedUnit.addEventListener("change", () => {
        const nextOption = supportOptions.find((candidate) => candidate.unit.id === supportedUnit.value);
        const nextTarget = defaultSupportTarget(nextOption?.unit, nextOption?.targets ?? []);
        draftOrders.set(unit.id, supportDraft(nextOption?.unit, nextTarget));
        alignSupportedUnitDraft(nextOption?.unit, nextTarget);
        render();
      });

      const target = element("select", { className: "order-select" });
      for (const candidate of supportTargets) {
        target.append(option(targetValue(candidate), candidate.label, targetValue(candidate) === targetValue(selectedTarget)));
      }
      target.addEventListener("change", () => {
        const nextTarget = supportTargets.find((candidate) => targetValue(candidate) === target.value);
        draftOrders.set(unit.id, supportDraft(selectedOption?.unit, nextTarget));
        alignSupportedUnitDraft(selectedOption?.unit, nextTarget);
        render();
      });

      firstField = supportedUnit;
      secondField = target;
    }

    row.append(unitButton, action, firstField, secondField);
    orderList.append(row);
  }
}

function renderMapOrderControls() {
  mapOrderControls.replaceChildren();

  const unit = mapOrderControlUnit();
  for (const action of ["hold", "move", "support", "convoy"]) {
    const active = activeMapOrderAction(unit) === action;
    const button = element("button", {
      className: `map-order-button ${active ? "active" : ""}`,
      disabled: !unit || !mapOrderActionAvailable(unit, action),
      type: "button",
      textContent: mapOrderActionLabel(action),
    });
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.addEventListener("click", () => startMapOrderAction(action));
    mapOrderControls.append(button);
  }
}

function mapOrderControlUnit() {
  if (state.phase.type !== "movement") {
    return undefined;
  }

  if (mapOrderIntent) {
    return state.units.find((unit) => unit.id === mapOrderIntent.unitId);
  }

  return unitsInProvince(selectedProvinceId)[0];
}

function activeMapOrderAction(unit) {
  if (!unit || mapOrderIntent?.unitId !== unit.id) {
    return undefined;
  }

  return mapOrderIntent.action;
}

function mapOrderActionAvailable(unit, action) {
  if (action === "hold") {
    return true;
  }

  if (action === "move") {
    return legalDestinations(unit).length > 0 || convoyDestinationsForArmy(unit).length > 0;
  }

  if (action === "support") {
    return supportOptionsForUnit(unit).length > 0;
  }

  if (action === "convoy") {
    return convoyOptionsForFleet(unit).length > 0;
  }

  return false;
}

function mapOrderActionLabel(action) {
  return action === "hold" ? "Hold" : capitalize(action);
}

function startMapOrderAction(action) {
  const unit = mapOrderControlUnit();
  if (!unit || !mapOrderActionAvailable(unit, action)) {
    return;
  }

  mapOrderUnitId = unit.id;

  if (action === "hold") {
    draftOrders.set(unit.id, { type: "hold" });
    mapOrderIntent = undefined;
  } else {
    mapOrderIntent = { action, unitId: unit.id };
  }

  render();
}

function renderRetreatOrders() {
  const retreats = sortedRetreats(state.retreats ?? []);

  if (retreats.length === 0) {
    orderList.append(element("p", {
      className: "hint",
      textContent: "No retreats are pending. Submit to advance.",
    }));
    return;
  }

  for (const retreat of retreats) {
    const currentDraft = normalizedRetreatDraft(retreat, retreatDrafts.get(retreat.unit.id));
    const row = element("div", { className: "order-row" });
    const unitButton = element("button", { className: "order-unit", type: "button", textContent: unitLabel(retreat.unit) });
    unitButton.addEventListener("click", () => selectProvince(locationProvince(retreat.from)));

    const action = element("select", { className: "order-select" });
    if (retreat.options.length > 0) {
      action.append(option("retreat", "Retreat", currentDraft.type === "retreat"));
    }
    action.append(option("disband", "Disband", currentDraft.type === "disband"));
    action.addEventListener("change", () => {
      retreatDrafts.set(retreat.unit.id, defaultRetreatDraftForAction(retreat, action.value));
      renderOrders();
    });

    let destinationField = emptyOrderField();
    if (currentDraft.type === "retreat") {
      const destination = element("select", { className: "order-select" });
      for (const location of retreatDestinations(retreat)) {
        destination.append(option(location.id, destinationLabel(location), currentDraft.to === location.id));
      }
      destination.addEventListener("change", () => {
        retreatDrafts.set(retreat.unit.id, { type: "retreat", to: destination.value });
        renderOrders();
      });
      destinationField = destination;
    }

    row.append(unitButton, action, destinationField, emptyOrderField());
    orderList.append(row);
  }
}

function renderBuildOrders() {
  const normalizedDrafts = normalizedBuildDrafts();
  const adjustments = powerAdjustments();
  const activeAdjustments = adjustments.filter((adjustment) => adjustment.adjustment !== 0);

  if (activeAdjustments.length === 0) {
    orderList.append(element("p", {
      className: "hint",
      textContent: "No builds or disbands are required. Submit to advance.",
    }));
    return;
  }

  for (const adjustment of activeAdjustments) {
    const requiredRows = Math.abs(adjustment.adjustment);
    for (let index = 0; index < requiredRows; index += 1) {
      if (adjustment.adjustment > 0) {
        orderList.append(renderBuildRow(adjustment.power, index, normalizedDrafts));
      } else {
        orderList.append(renderDisbandRow(adjustment.power, index, normalizedDrafts));
      }
    }
  }
}

function renderBuildRow(power, index, normalizedDrafts) {
  const key = buildRowKey(power.id, index);
  const currentDraft = normalizedDrafts.get(key);
  const rowOptions = availableBuildOptionsForRow(power.id, normalizedDrafts, key);
  const row = element("div", { className: "order-row" });
  row.append(element("div", { className: "order-unit order-static", textContent: `${power.name} build ${index + 1}` }));

  const action = element("select", { className: "order-select" });
  if (rowOptions.length > 0) {
    action.append(option("build", "Build", currentDraft.type === "build"));
  }
  action.append(option("waive", "Waive", currentDraft.type === "waive"));
  action.addEventListener("change", () => {
    buildDrafts.set(key, defaultBuildDraftForAction(power.id, action.value, normalizedDrafts, key));
    renderOrders();
  });

  let buildField = emptyOrderField();
  if (currentDraft.type === "build") {
    const buildOption = element("select", { className: "order-select" });
    for (const candidate of rowOptions) {
      buildOption.append(option(buildOptionKey(candidate), buildOptionLabel(candidate), buildOptionMatchesDraft(candidate, currentDraft)));
    }
    buildOption.addEventListener("change", () => {
      const nextOption = rowOptions.find((candidate) => buildOptionKey(candidate) === buildOption.value);
      buildDrafts.set(key, nextOption ? buildDraftFromOption(nextOption) : { type: "waive" });
      renderOrders();
    });
    buildField = buildOption;
  }

  row.append(action, buildField, emptyOrderField());
  return row;
}

function renderDisbandRow(power, index, normalizedDrafts) {
  const key = buildRowKey(power.id, index);
  const currentDraft = normalizedDrafts.get(key);
  const row = element("div", { className: "order-row" });
  row.append(element("div", { className: "order-unit order-static", textContent: `${power.name} disband ${index + 1}` }));
  const action = element("select", { className: "order-select", disabled: true });
  action.append(option("disband", "Disband", true));
  row.append(action);

  const units = availableDisbandUnitsForRow(power.id, normalizedDrafts, key);
  const unitField = element("select", { className: "order-select" });
  for (const unit of units) {
    unitField.append(option(unit.id, unitLabel(unit), currentDraft?.unitId === unit.id));
  }
  unitField.addEventListener("change", () => {
    buildDrafts.set(key, { type: "disband", unitId: unitField.value });
    renderOrders();
  });

  row.append(unitField, emptyOrderField());
  return row;
}

function renderResults() {
  resultList.replaceChildren();

  if (!lastResult) {
    resultList.append(element("div", { className: "empty-row", textContent: "No adjudication yet." }));
    return;
  }

  const summary = element("div", {
    className: "result-summary",
    textContent: `${Object.values(lastResult.orderResults).length} orders resolved. Next: ${formatPhase(lastResult.nextState.phase)}${lastResult.retreats.length > 0 ? ` with ${lastResult.retreats.length} retreats pending` : ""}.`,
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

function submitOrders() {
  lastOrderUnitLabels = new Map([
    ...state.units,
    ...(state.retreats ?? []).map((retreat) => retreat.unit),
  ].map((unit) => [unit.id, unitLabel(unit)]));
  const orders = state.phase.type === "movement"
    ? buildMovementOrders()
    : state.phase.type === "retreat"
      ? buildRetreatOrders()
      : buildBuildOrders();

  lastResult = adjudicate(state, orders, classic1901);
  state = cloneState(lastResult.nextState);
  landProvinceOwners = {
    ...landProvinceOwners,
    ...landProvinceOwnersFromUnits(state.units),
  };
  draftOrders = new Map();
  mapOrderUnitId = undefined;
  mapOrderIntent = undefined;
  retreatDrafts = new Map();
  buildDrafts = new Map();

  if (!provinceById.has(selectedProvinceId) || (unitsInProvince(selectedProvinceId).length === 0 && retreatsFromProvince(selectedProvinceId).length === 0)) {
    selectedProvinceId = defaultSelectedProvinceId();
  }

  render();
}

function buildMovementOrders() {
  return sortedUnits(state.units).map((unit, index) => {
    const draft = normalizedDraftForUnit(unit, draftOrders.get(unit.id));
    const id = `order:${state.phase.year}:${state.phase.season}:${index}:${unit.id}`;

    if (draft.type === "move" && draft.to) {
      return { id, type: "move", unitId: unit.id, to: draft.to };
    }

    if (draft.type === "move-via-convoy" && draft.to) {
      return { id, type: "move", unitId: unit.id, to: draft.to, viaConvoy: true };
    }

    if (draft.type === "convoy" && draft.convoyedUnitId && draft.to) {
      return { id, type: "convoy", unitId: unit.id, convoyedUnitId: draft.convoyedUnitId, to: draft.to };
    }

    if (draft.type === "support" && draft.supportedUnitId) {
      return draft.to
        ? { id, type: "support", unitId: unit.id, supportedUnitId: draft.supportedUnitId, to: draft.to }
        : { id, type: "support", unitId: unit.id, supportedUnitId: draft.supportedUnitId };
    }

    return { id, type: "hold", unitId: unit.id };
  });
}

function buildRetreatOrders() {
  return sortedRetreats(state.retreats ?? []).map((retreat, index) => {
    const draft = normalizedRetreatDraft(retreat, retreatDrafts.get(retreat.unit.id));
    const id = `retreat:${state.phase.year}:${state.phase.season}:${index}:${retreat.unit.id}`;
    return draft.type === "retreat"
      ? { id, type: "retreat", unitId: retreat.unit.id, to: draft.to }
      : { id, type: "disband", unitId: retreat.unit.id };
  });
}

function buildBuildOrders() {
  const normalizedDrafts = normalizedBuildDrafts();
  const orders = [];

  for (const adjustment of powerAdjustments()) {
    const requiredRows = Math.abs(adjustment.adjustment);
    for (let index = 0; index < requiredRows; index += 1) {
      const key = buildRowKey(adjustment.power.id, index);
      const draft = normalizedDrafts.get(key);

      if (draft?.type === "build") {
        orders.push({
          id: `build:${state.phase.year}:${index}:${adjustment.power.id}:${draft.unitType}:${draft.location}`,
          type: "build",
          power: adjustment.power.id,
          unitId: `${adjustment.power.id}-build-${state.phase.year}-${index}-${draft.unitType[0]}-${draft.location}`,
          unitType: draft.unitType,
          location: draft.location,
        });
      }

      if (draft?.type === "disband") {
        orders.push({
          id: `disband:${state.phase.year}:${index}:${draft.unitId}`,
          type: "disband",
          unitId: draft.unitId,
        });
      }
    }
  }

  return orders;
}

function sortedRetreats(retreats) {
  return [...retreats].sort((left, right) => unitLabel(left.unit).localeCompare(unitLabel(right.unit)));
}

function retreatDestinations(retreat) {
  return retreat.options
    .map((locationId) => locationById.get(locationId))
    .filter(Boolean)
    .sort((left, right) => destinationLabel(left).localeCompare(destinationLabel(right)));
}

function normalizedRetreatDraft(retreat, draft) {
  if (draft?.type === "disband" || retreat.options.length === 0) {
    return { type: "disband" };
  }

  if (draft?.type === "retreat" && retreat.options.includes(draft.to)) {
    return draft;
  }

  const destination = retreatDestinations(retreat)[0];
  return destination ? { type: "retreat", to: destination.id } : { type: "disband" };
}

function defaultRetreatDraftForAction(retreat, action) {
  if (action === "retreat" && retreat.options.length > 0) {
    const destination = retreatDestinations(retreat)[0];
    return destination ? { type: "retreat", to: destination.id } : { type: "disband" };
  }

  return { type: "disband" };
}

function normalizedBuildDrafts() {
  const normalizedDrafts = new Map();
  const selectedBuildProvinces = new Set();
  const selectedDisbandUnitIds = new Set();

  for (const adjustment of powerAdjustments()) {
    const requiredRows = Math.abs(adjustment.adjustment);

    if (adjustment.adjustment > 0) {
      const options = buildOptionsForPower(adjustment.power.id);
      for (let index = 0; index < requiredRows; index += 1) {
        const key = buildRowKey(adjustment.power.id, index);
        const draft = buildDrafts.get(key);
        let normalizedDraft = { type: "waive" };

        if (draft?.type === "build") {
          const selectedOption = options.find((candidate) => {
            return buildOptionMatchesDraft(candidate, draft) && !selectedBuildProvinces.has(candidate.province);
          });
          if (selectedOption) {
            normalizedDraft = buildDraftFromOption(selectedOption);
          }
        }

        if (normalizedDraft.type !== "build" && draft?.type !== "waive") {
          const fallbackOption = options.find((candidate) => !selectedBuildProvinces.has(candidate.province));
          if (fallbackOption) {
            normalizedDraft = buildDraftFromOption(fallbackOption);
          }
        }

        if (normalizedDraft.type === "build") {
          selectedBuildProvinces.add(normalizedDraft.province);
        }
        normalizedDrafts.set(key, normalizedDraft);
      }
    } else if (adjustment.adjustment < 0) {
      const units = sortedUnits(state.units.filter((unit) => unit.power === adjustment.power.id));
      for (let index = 0; index < requiredRows; index += 1) {
        const key = buildRowKey(adjustment.power.id, index);
        const draft = buildDrafts.get(key);
        let selectedUnit = draft?.type === "disband"
          ? units.find((unit) => unit.id === draft.unitId && !selectedDisbandUnitIds.has(unit.id))
          : undefined;

        if (!selectedUnit) {
          selectedUnit = units.find((unit) => !selectedDisbandUnitIds.has(unit.id));
        }

        if (selectedUnit) {
          selectedDisbandUnitIds.add(selectedUnit.id);
          normalizedDrafts.set(key, { type: "disband", unitId: selectedUnit.id });
        }
      }
    }
  }

  return normalizedDrafts;
}

function buildRowKey(powerId, index) {
  return `${powerId}:${index}`;
}

function powerAdjustments() {
  return classic1901.powers.map((power) => ({
    power,
    supplyCenters: countSupplyCenters(power.id),
    units: countPowerUnits(power.id),
    adjustment: countSupplyCenters(power.id) - countPowerUnits(power.id),
  }));
}

function countSupplyCenters(powerId) {
  return Object.values(state.supplyCenterOwners).filter((owner) => owner === powerId).length;
}

function countPowerUnits(powerId) {
  return state.units.filter((unit) => unit.power === powerId).length;
}

function buildOptionsForPower(powerId) {
  const occupied = occupiedProvinces();
  return classic1901.locations
    .flatMap((location) => {
      const province = provinceById.get(location.province);
      if (
        !province?.supplyCenter ||
        province.supplyCenter.homePower !== powerId ||
        state.supplyCenterOwners[province.id] !== powerId ||
        occupied.has(province.id)
      ) {
        return [];
      }

      return location.unitTypes.map((unitType) => ({
        power: powerId,
        unitType,
        location: location.id,
        province: province.id,
      }));
    })
    .sort((left, right) => buildOptionLabel(left).localeCompare(buildOptionLabel(right)));
}

function occupiedProvinces() {
  return new Set(state.units.map((unit) => locationProvince(unit.location)));
}

function availableBuildOptionsForRow(powerId, normalizedDrafts, key) {
  const usedProvinces = new Set();
  for (const [rowKey, draft] of normalizedDrafts) {
    if (rowKey !== key && draft.type === "build") {
      usedProvinces.add(draft.province);
    }
  }

  return buildOptionsForPower(powerId).filter((candidate) => !usedProvinces.has(candidate.province));
}

function defaultBuildDraftForAction(powerId, action, normalizedDrafts, key) {
  if (action !== "build") {
    return { type: "waive" };
  }

  const option = availableBuildOptionsForRow(powerId, normalizedDrafts, key)[0];
  return option ? buildDraftFromOption(option) : { type: "waive" };
}

function buildDraftFromOption(option) {
  return {
    type: "build",
    unitType: option.unitType,
    location: option.location,
    province: option.province,
  };
}

function buildOptionMatchesDraft(option, draft) {
  return option.unitType === draft.unitType && option.location === draft.location;
}

function buildOptionKey(option) {
  return `${option.unitType}:${option.location}`;
}

function buildOptionLabel(option) {
  return `${unitTypeAbbreviation(option.unitType)} ${String(option.location).toUpperCase()}`;
}

function availableDisbandUnitsForRow(powerId, normalizedDrafts, key) {
  const selectedUnitIds = new Set();
  for (const [rowKey, draft] of normalizedDrafts) {
    if (rowKey !== key && draft.type === "disband") {
      selectedUnitIds.add(draft.unitId);
    }
  }

  return sortedUnits(state.units.filter((unit) => unit.power === powerId && !selectedUnitIds.has(unit.id)));
}

function currentMapOrderUnit() {
  if (mapOrderIntent) {
    return state.units.find((unit) => unit.id === mapOrderIntent.unitId);
  }

  return unitsInProvince(selectedProvinceId)[0]
    ?? state.units.find((unit) => unit.id === mapOrderUnitId);
}

function selectMapOrderUnit(unitId) {
  const unit = state.units.find((candidate) => candidate.id === unitId);
  if (!unit) {
    return;
  }

  mapOrderUnitId = unit.id;
  mapOrderIntent = undefined;
  selectedProvinceId = locationProvince(unit.location);
  render();
}

function handleMapOrderProvinceSelection(provinceId) {
  if (state.phase.type !== "movement" || !mapOrderIntent) {
    return false;
  }

  const unit = state.units.find((candidate) => candidate.id === mapOrderIntent.unitId);
  if (!unit) {
    mapOrderIntent = undefined;
    return false;
  }

  mapOrderUnitId = unit.id;

  if (mapOrderIntent.action === "move") {
    return completeMapMoveOrder(unit, provinceId);
  }

  if (mapOrderIntent.action === "support") {
    return mapOrderIntent.supportedUnitId
      ? completeMapSupportOrder(unit, provinceId)
      : setMapSupportUnit(unit, provinceId);
  }

  if (mapOrderIntent.action === "convoy") {
    return mapOrderIntent.convoyedUnitId
      ? completeMapConvoyOrder(unit, provinceId)
      : setMapConvoyedUnit(unit, provinceId);
  }

  return false;
}

function completeMapMoveOrder(unit, provinceId) {
  const directDestination = locationFromProvince(legalDestinations(unit), provinceId);
  const convoyDestination = locationFromProvince(convoyDestinationsForArmy(unit), provinceId);
  const destination = directDestination ?? convoyDestination;
  if (!destination) {
    return false;
  }

  draftOrders.set(unit.id, directDestination
    ? { type: "move", to: destination.id }
    : { type: "move-via-convoy", to: destination.id });
  mapOrderIntent = undefined;
  return true;
}

function setMapSupportUnit(unit, provinceId) {
  const provinceUnits = unitsInProvince(provinceId);
  const selectedOption = supportOptionsForUnit(unit)
    .find((option) => provinceUnits.some((candidate) => candidate.id === option.unit.id));
  if (!selectedOption) {
    return false;
  }

  mapOrderIntent = {
    action: "support",
    unitId: unit.id,
    supportedUnitId: selectedOption.unit.id,
  };
  return true;
}

function completeMapSupportOrder(unit, provinceId) {
  const supportedUnit = state.units.find((candidate) => candidate.id === mapOrderIntent?.supportedUnitId);
  if (!supportedUnit) {
    return false;
  }

  const targets = supportTargetsForUnit(unit, supportedUnit);
  const target = targets.find((candidate) => candidate.to && locationProvince(candidate.to) === provinceId)
    ?? targets.find((candidate) => !candidate.to && locationProvince(supportedUnit.location) === provinceId);
  if (!target) {
    return false;
  }

  draftOrders.set(unit.id, supportDraft(supportedUnit, target));
  alignSupportedUnitDraft(supportedUnit, target);
  mapOrderIntent = undefined;
  return true;
}

function setMapConvoyedUnit(unit, provinceId) {
  const provinceUnits = unitsInProvince(provinceId);
  const selectedOption = convoyOptionsForFleet(unit)
    .find((option) => provinceUnits.some((candidate) => candidate.id === option.army.id));
  if (!selectedOption) {
    return false;
  }

  mapOrderIntent = {
    action: "convoy",
    unitId: unit.id,
    convoyedUnitId: selectedOption.army.id,
  };
  return true;
}

function completeMapConvoyOrder(unit, provinceId) {
  const convoyOptions = convoyOptionsForFleet(unit);
  const selectedOption = convoyOptions.find((option) => option.army.id === mapOrderIntent?.convoyedUnitId);
  const destination = locationFromProvince(selectedOption?.destinations ?? [], provinceId);
  if (!selectedOption || !destination) {
    return false;
  }

  setConvoyDraftForOption(unit, selectedOption, destination.id);
  mapOrderIntent = undefined;
  return true;
}

function setConvoyDraftForOption(unit, convoyOption, destinationId) {
  if (!convoyOption || !destinationId) {
    draftOrders.set(unit.id, { type: "hold" });
    return;
  }

  draftOrders.set(unit.id, {
    type: "convoy",
    convoyedUnitId: convoyOption.army.id,
    to: destinationId,
  });
  draftOrders.set(convoyOption.army.id, { type: "move-via-convoy", to: destinationId });
}

function locationFromProvince(locations, provinceId) {
  return locations.find((location) => location.province === provinceId);
}

function locationProvince(locationId) {
  const location = locationById.get(locationId);
  if (!location) {
    throw new Error(`Unknown location ${locationId}.`);
  }

  return location.province;
}

function selectProvince(provinceId) {
  handleMapOrderProvinceSelection(provinceId);
  selectedProvinceId = provinceId;
  if (state.phase.type === "movement" && !mapOrderIntent) {
    const unit = unitsInProvince(provinceId)[0];
    if (unit) {
      mapOrderUnitId = unit.id;
    }
  }
  render();
}

function resetGame() {
  state = cloneState(classic1901.initialState);
  lastResult = undefined;
  lastOrderUnitLabels = new Map();
  draftOrders = new Map();
  mapOrderUnitId = undefined;
  mapOrderIntent = undefined;
  retreatDrafts = new Map();
  buildDrafts = new Map();
  landProvinceOwners = landProvinceOwnersFromUnits(state.units);
  selectedProvinceId = "par";
  render();
}

function unitsInProvince(provinceId) {
  return state.units.filter((unit) => locationById.get(unit.location)?.province === provinceId);
}

function retreatsFromProvince(provinceId) {
  return (state.retreats ?? []).filter((retreat) => locationProvince(retreat.from) === provinceId);
}

function defaultSelectedProvinceId() {
  const retreat = state.retreats?.[0];
  if (retreat) {
    return locationProvince(retreat.from);
  }

  return state.units[0] ? locationById.get(state.units[0].location).province : "par";
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

function unitTypeAbbreviation(unitType) {
  return unitType === "army" ? "A" : "F";
}

function orderResultText(result) {
  if (result.order.type === "move") {
    const convoyText = result.order.viaConvoy ? " via convoy" : "";
    return `${unitName(result.order.unitId)} -> ${String(result.order.to).toUpperCase()}${convoyText}`;
  }

  if (result.order.type === "convoy") {
    return `${unitName(result.order.unitId)} convoy ${unitName(result.order.convoyedUnitId)} -> ${String(result.order.to).toUpperCase()}`;
  }

  if (result.order.type === "support") {
    const targetText = result.order.to ? ` -> ${String(result.order.to).toUpperCase()}` : " hold";
    return `${unitName(result.order.unitId)} support ${unitName(result.order.supportedUnitId)}${targetText}`;
  }

  if (result.order.type === "disband") {
    return `${unitName(result.order.unitId)} disband`;
  }

  if (result.order.type === "retreat") {
    return `${unitName(result.order.unitId)} retreat -> ${String(result.order.to).toUpperCase()}`;
  }

  if (result.order.type === "build") {
    return `${ownerName(result.order.power)} build ${unitTypeAbbreviation(result.order.unitType)} ${String(result.order.location).toUpperCase()}`;
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
