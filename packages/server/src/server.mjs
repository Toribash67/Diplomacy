import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { adjudicate, classic1901 } from "../../engine/dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const webRoot = path.join(repoRoot, "packages/web");
const engineDistRoot = path.join(repoRoot, "packages/engine/dist");
const port = Number.parseInt(process.env.PORT ?? "5173", 10);
const host = process.env.HOST ?? "0.0.0.0";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
]);

const provinceById = new Map(classic1901.provinces.map((province) => [province.id, province]));
const locationById = new Map(classic1901.locations.map((location) => [location.id, location]));

let game = initialGame();

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApiRequest(request, response, url);
      return;
    }

    await serveStatic(response, url.pathname);
  } catch (error) {
    console.error(error);
    sendJson(response, error.statusCode ?? 500, { error: error.statusCode ? error.message : "Internal server error." });
  }
});

server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Diplomacy server listening on http://${host}:${port}/packages/web/`);
});

async function handleApiRequest(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/game") {
    sendJson(response, 200, gamePayload());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/game/reset") {
    game = initialGame();
    sendJson(response, 200, gamePayload());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/game/settings") {
    const body = await readJsonBody(request);
    game = {
      ...game,
      settings: normalizeSettings(body?.settings ?? body, game.settings),
    };
    sendJson(response, 200, gamePayload());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/game/orders") {
    const body = await readJsonBody(request);
    const orders = normalizeOrders(body?.orders);
    const settings = normalizeSettings(body?.settings, game.settings);
    const previousState = cloneState(game.state);
    const orderUnitLabels = orderUnitLabelsForState(previousState);
    const conversionOrders = orders.filter((order) => order.type === "convert");
    const adjudicationOrders = orders.filter((order) => order.type !== "convert");
    const variant = variantForSettings(previousState, settings);
    let result = adjudicate(previousState, adjudicationOrders, variant);

    if (conversionOrders.length > 0) {
      result = applyConversionOrders(result, conversionOrders, previousState, settings);
    }

    game = {
      state: cloneState(result.nextState),
      lastResult: result,
      landProvinceOwners: {
        ...game.landProvinceOwners,
        ...landProvinceOwnersFromUnits(result.nextState.units),
      },
      orderUnitLabels,
      settings,
    };

    sendJson(response, 200, gamePayload());
    return;
  }

  sendJson(response, 404, { error: "API route not found." });
}

function initialGame() {
  const state = cloneState(classic1901.initialState);
  return {
    state,
    lastResult: undefined,
    landProvinceOwners: landProvinceOwnersFromUnits(state.units),
    orderUnitLabels: {},
    settings: {
      allowConqueredBuilds: false,
      allowScConversions: false,
    },
  };
}

function gamePayload() {
  return {
    state: game.state,
    lastResult: game.lastResult ?? null,
    landProvinceOwners: game.landProvinceOwners,
    orderUnitLabels: game.orderUnitLabels,
    settings: game.settings,
  };
}

function normalizeSettings(value, fallback) {
  return {
    allowConqueredBuilds: typeof value?.allowConqueredBuilds === "boolean"
      ? value.allowConqueredBuilds
      : fallback.allowConqueredBuilds,
    allowScConversions: typeof value?.allowScConversions === "boolean"
      ? value.allowScConversions
      : fallback.allowScConversions,
  };
}

function normalizeOrders(value) {
  if (!Array.isArray(value)) {
    throw httpError(400, "Request body must include an orders array.");
  }

  return value.map(normalizeOrder);
}

function normalizeOrder(order) {
  if (!order || typeof order !== "object") {
    throw httpError(400, "Each order must be an object.");
  }

  const id = requiredString(order.id, "Order id");
  const type = requiredString(order.type, "Order type");

  if (type === "hold") {
    return { id, type, unitId: requiredString(order.unitId, "Hold order unit id") };
  }

  if (type === "move") {
    return {
      id,
      type,
      unitId: requiredString(order.unitId, "Move order unit id"),
      to: requiredString(order.to, "Move order destination"),
      ...(typeof order.viaConvoy === "boolean" ? { viaConvoy: order.viaConvoy } : {}),
    };
  }

  if (type === "support") {
    return {
      id,
      type,
      unitId: requiredString(order.unitId, "Support order unit id"),
      supportedUnitId: requiredString(order.supportedUnitId, "Support order supported unit id"),
      ...(typeof order.to === "string" ? { to: order.to } : {}),
    };
  }

  if (type === "convoy") {
    return {
      id,
      type,
      unitId: requiredString(order.unitId, "Convoy order unit id"),
      convoyedUnitId: requiredString(order.convoyedUnitId, "Convoy order convoyed unit id"),
      to: requiredString(order.to, "Convoy order destination"),
    };
  }

  if (type === "retreat") {
    return {
      id,
      type,
      unitId: requiredString(order.unitId, "Retreat order unit id"),
      to: requiredString(order.to, "Retreat order destination"),
    };
  }

  if (type === "disband") {
    return { id, type, unitId: requiredString(order.unitId, "Disband order unit id") };
  }

  if (type === "build") {
    return {
      id,
      type,
      power: requiredString(order.power, "Build order power"),
      unitId: requiredString(order.unitId, "Build order unit id"),
      unitType: requiredUnitType(order.unitType, "Build order unit type"),
      location: requiredString(order.location, "Build order location"),
    };
  }

  if (type === "convert") {
    return {
      id,
      type,
      power: requiredString(order.power, "Conversion order power"),
      unitId: requiredString(order.unitId, "Conversion order unit id"),
      unitType: requiredUnitType(order.unitType, "Conversion order unit type"),
      location: requiredString(order.location, "Conversion order location"),
    };
  }

  throw httpError(400, `Unknown order type: ${type}.`);
}

function requiredString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw httpError(400, `${label} must be a non-empty string.`);
  }

  return value;
}

function requiredUnitType(value, label) {
  if (value !== "army" && value !== "fleet") {
    throw httpError(400, `${label} must be army or fleet.`);
  }

  return value;
}

function variantForSettings(state, settings) {
  if (state.phase.type !== "build" || !settings.allowConqueredBuilds) {
    return classic1901;
  }

  return {
    ...classic1901,
    provinces: classic1901.provinces.map((province) => {
      if (!province.supplyCenter) {
        return province;
      }

      const owner = state.supplyCenterOwners[province.id];
      return {
        ...province,
        supplyCenter: {
          ...province.supplyCenter,
          homePower: owner ?? province.supplyCenter.homePower,
        },
      };
    }),
  };
}

function applyConversionOrders(result, conversionOrders, previousState, settings) {
  const orderResults = { ...result.orderResults };
  const nextUnits = [...result.nextState.units];
  const convertedUnitIds = new Set();

  for (const order of conversionOrders) {
    const unitIndex = nextUnits.findIndex((unit) => unit.id === order.unitId);
    const unit = nextUnits[unitIndex];
    const previousUnit = previousState.units.find((candidate) => candidate.id === order.unitId);
    const destination = locationById.get(order.location);
    const provinceId = destination?.province;
    const province = provinceId ? provinceById.get(provinceId) : undefined;

    let error = undefined;
    if (previousState.phase.type !== "build") {
      error = "Conversion orders are only valid during build phases.";
    } else if (!settings.allowScConversions) {
      error = "Unit conversion is not enabled.";
    } else if (!unit || !previousUnit) {
      error = "Conversion order references a unit that is not in the current state.";
    } else if (convertedUnitIds.has(order.unitId)) {
      error = "Only one conversion may be ordered for a unit.";
    } else if (order.power !== previousUnit.power) {
      error = "Conversion order power does not match the unit power.";
    } else if (!destination || !province) {
      error = "Conversion destination is unknown.";
    } else if (locationProvince(previousUnit.location) !== provinceId) {
      error = "Conversion must stay in the unit's current supply center.";
    } else if (!province.supplyCenter || previousState.supplyCenterOwners[provinceId] !== previousUnit.power) {
      error = "Conversion location is not an owned supply center.";
    } else if (!destination.unitTypes.includes(order.unitType)) {
      error = "Converted unit type cannot occupy that location.";
    } else if (previousUnit.type === order.unitType) {
      error = "Conversion must change the unit type.";
    }

    if (error) {
      orderResults[order.id] = {
        order,
        status: "invalid",
        reason: error,
      };
      continue;
    }

    convertedUnitIds.add(order.unitId);
    nextUnits[unitIndex] = {
      ...unit,
      type: order.unitType,
      location: order.location,
    };
    orderResults[order.id] = {
      order,
      status: "succeeds",
      reason: "Unit converted in an owned supply center.",
    };
  }

  return {
    ...result,
    nextState: {
      ...result.nextState,
      units: nextUnits,
    },
    orderResults,
    invalidOrders: Object.values(orderResults).filter((orderResult) => orderResult.status === "invalid"),
  };
}

function orderUnitLabelsForState(state) {
  const labels = new Map();
  for (const unit of state.units) {
    labels.set(unit.id, unitLabel(unit));
  }

  for (const retreat of state.retreats ?? []) {
    labels.set(retreat.unit.id, unitLabel(retreat.unit));
  }

  return Object.fromEntries(labels);
}

function unitLabel(unit) {
  const power = classic1901.powers.find((candidate) => candidate.id === unit.power);
  const location = locationById.get(unit.location);
  return `${power?.name ?? unit.power} ${unit.type === "army" ? "A" : "F"} ${String(location?.id ?? unit.location).toUpperCase()}`;
}

function landProvinceOwnersFromUnits(units) {
  return Object.fromEntries(units
    .map((unit) => [locationById.get(unit.location)?.province, unit.power])
    .filter(([provinceId]) => provinceById.get(provinceId)?.type !== "sea"));
}

function locationProvince(locationId) {
  const location = locationById.get(locationId);
  if (!location) {
    throw new Error(`Unknown location ${locationId}.`);
  }

  return location.province;
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

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1024 * 1024) {
      throw httpError(413, "Request body is too large.");
    }

    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw httpError(400, "Request body must be valid JSON.");
  }
}

async function serveStatic(response, pathname) {
  if (pathname === "/packages/web") {
    response.writeHead(308, { Location: "/packages/web/" });
    response.end();
    return;
  }

  const filePath = staticFilePath(pathname);
  if (!filePath) {
    sendText(response, 404, "Not found.");
    return;
  }

  try {
    const data = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes.get(path.extname(filePath)) ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  } catch {
    sendText(response, 404, "Not found.");
  }
}

function staticFilePath(pathname) {
  const decodedPath = decodeURIComponent(pathname);

  if (decodedPath === "/") {
    return path.join(webRoot, "index.html");
  }

  if (decodedPath === "/index.html") {
    return path.join(webRoot, "index.html");
  }

  if (decodedPath.startsWith("/src/")) {
    return confinedPath(path.join(webRoot, "src"), decodedPath.slice("/src/".length));
  }

  if (decodedPath.startsWith("/assets/")) {
    return confinedPath(path.join(webRoot, "assets"), decodedPath.slice("/assets/".length));
  }

  if (decodedPath === "/packages/web/") {
    return path.join(webRoot, "index.html");
  }

  if (decodedPath.startsWith("/packages/web/")) {
    return confinedPath(webRoot, decodedPath.slice("/packages/web/".length));
  }

  if (decodedPath.startsWith("/packages/engine/dist/")) {
    return confinedPath(engineDistRoot, decodedPath.slice("/packages/engine/dist/".length));
  }

  return undefined;
}

function confinedPath(root, relativePath) {
  const normalized = path.normalize(relativePath);
  const filePath = path.join(root, normalized);
  return filePath.startsWith(`${root}${path.sep}`) || filePath === root ? filePath : undefined;
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

process.on("unhandledRejection", (error) => {
  console.error(error);
});
