import { adjudicate } from "../adjudicate.js";
import {
  classic1901,
  classic1901PowerList,
} from "../variants/classic1901.js";
import {
  locationId,
  orderId,
  unitId,
  type GameState,
  type LocationId,
  type Order,
  type PowerId,
  type Unit,
  type UnitId,
  type UnitType,
} from "../types.js";

export interface DatcMovementScenario {
  readonly state: GameState;
  readonly orders: readonly Order[];
  readonly units: Readonly<Record<string, UnitId>>;
}

const locationAliases: Readonly<Record<string, LocationId>> = Object.fromEntries(
  classic1901.locations.flatMap((location) => {
    const aliases = [normalizeName(location.name)];
    aliases.push(normalizeName(String(location.id)));

    const provinceName = classic1901.provinces.find((province) => province.id === location.province)?.name;
    if (provinceName) {
      aliases.push(normalizeName(provinceName));
    }

    return aliases.map((alias) => [alias, location.id]);
  }),
) as Readonly<Record<string, LocationId>>;

const explicitLocationAliases: Readonly<Record<string, LocationId>> = {
  [normalizeName("Adriatic Sea")]: locationId("adr"),
  [normalizeName("Aegean Sea")]: locationId("aeg"),
  [normalizeName("Baltic Sea")]: locationId("bal"),
  [normalizeName("Barents Sea")]: locationId("bar"),
  [normalizeName("Black Sea")]: locationId("bla"),
  [normalizeName("Eastern Mediterranean")]: locationId("eas"),
  [normalizeName("English Channel")]: locationId("eng"),
  [normalizeName("Gulf of Bothnia")]: locationId("bot"),
  [normalizeName("Gulf of Lyon")]: locationId("lyo"),
  [normalizeName("Helgoland Bight")]: locationId("hel"),
  [normalizeName("Ionian Sea")]: locationId("ion"),
  [normalizeName("Irish Sea")]: locationId("iri"),
  [normalizeName("Mid-Atlantic Ocean")]: locationId("mao"),
  [normalizeName("North Africa")]: locationId("naf"),
  [normalizeName("North Atlantic Ocean")]: locationId("nao"),
  [normalizeName("North Sea")]: locationId("nth"),
  [normalizeName("Norwegian Sea")]: locationId("nwg"),
  [normalizeName("Tyrrhenian Sea")]: locationId("tys"),
  [normalizeName("Western Mediterranean")]: locationId("wes"),
  [normalizeName("Bulgaria(ec)")]: locationId("bul-ec"),
  [normalizeName("Bulgaria(sc)")]: locationId("bul-sc"),
  [normalizeName("Spain(nc)")]: locationId("spa-nc"),
  [normalizeName("Spain(sc)")]: locationId("spa-sc"),
  [normalizeName("St Petersburg(nc)")]: locationId("stp-nc"),
  [normalizeName("St Petersburg(sc)")]: locationId("stp-sc"),
};

const provinceLandLocations: Readonly<Record<string, LocationId>> = {
  [normalizeName("Bulgaria")]: locationId("bul"),
  [normalizeName("Spain")]: locationId("spa"),
  [normalizeName("St Petersburg")]: locationId("stp"),
};

export function runDatcMovement(orderBlock: string) {
  const scenario = parseDatcMovementScenario(orderBlock);
  return adjudicate(scenario.state, scenario.orders, classic1901);
}

export function parseDatcMovementScenario(orderBlock: string): DatcMovementScenario {
  const units = new Map<string, Unit>();
  const orders: Order[] = [];
  const parsedLines = parseOrderLines(orderBlock);

  for (const { line, power } of parsedLines) {
    if (line.includes(" Convoys ")) {
      continue;
    }

    const parsed = parseUnitPrefix(line);
    ensureUnit(units, power, parsed.type, parsed.location, true);
  }

  for (const { line, power } of parsedLines) {
    if (line.includes(" Convoys ")) {
      continue;
    }

    const parsed = parseUnitPrefix(line);
    const orderingUnit = ensureUnit(units, power, parsed.type, parsed.location, true);
    const orderingUnitId = orderingUnit.id;
    const orderBase = `${orderingUnit.id}:${orders.length}`;

    if (parsed.remainder === "Hold") {
      orders.push({ id: orderId(orderBase), type: "hold", unitId: orderingUnitId });
      continue;
    }

    if (parsed.remainder.startsWith("Supports ")) {
      const supported = parseUnitPrefix(parsed.remainder.slice("Supports ".length));
      const supportedPower = findPowerAtLocation(units, supported.type, supported.location) ?? power;
      const supportedUnit = ensureUnit(units, supportedPower, supported.type, supported.location);

      if (supported.remainder.startsWith("- ")) {
        orders.push({
          id: orderId(orderBase),
          type: "support",
          unitId: orderingUnitId,
          supportedUnitId: supportedUnit.id,
          to: parseMoveDestination(supported.type, supported.location, supported.remainder.slice(2)),
        });
        continue;
      }

      orders.push({
        id: orderId(orderBase),
        type: "support",
        unitId: orderingUnitId,
        supportedUnitId: supportedUnit.id,
      });
      continue;
    }

    if (parsed.remainder.startsWith("- ")) {
      orders.push({
        id: orderId(orderBase),
        type: "move",
        unitId: orderingUnitId,
        to: parseMoveDestination(parsed.type, parsed.location, parsed.remainder.slice(2)),
      });
      continue;
    }

    throw new Error(`Unsupported DATC order line: ${line}`);
  }

  return {
    state: {
      ...classic1901.initialState,
      phase: { year: 1901, season: "spring", type: "movement" },
      units: [...units.values()],
      retreats: [],
    },
    orders,
    units: Object.fromEntries([...units.values()].map((unit) => [unitKey(unit.type, unit.location), unit.id])),
  };
}

function parseOrderLines(orderBlock: string): readonly { readonly line: string; readonly power: PowerId }[] {
  const parsedLines: { line: string; power: PowerId }[] = [];
  let currentPower: PowerId | undefined;

  for (const rawLine of orderBlock.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const power = parsePowerHeader(line);
    if (power) {
      currentPower = power;
      continue;
    }

    if (!currentPower) {
      throw new Error(`DATC order line appears before a power header: ${line}`);
    }

    parsedLines.push({ line, power: currentPower });
  }

  return parsedLines;
}

export function parseLocation(name: string): LocationId {
  const normalized = normalizeName(name);
  const location = provinceLandLocations[normalized] ?? explicitLocationAliases[normalized] ?? locationAliases[normalized];
  if (!location) {
    throw new Error(`Unknown DATC location: ${name}`);
  }

  return location;
}

function parseMoveDestination(unitType: UnitType, from: LocationId, name: string): LocationId {
  const normalized = normalizeName(name);
  const explicitLocation = explicitLocationAliases[normalized];
  if (explicitLocation) {
    if (unitType === "army") {
      return provinceLandLocations[normalized.replace(/\(.+\)$/, "").trim()] ?? explicitLocation;
    }

    return explicitLocation;
  }

  const landLocation = provinceLandLocations[normalized];
  if (!landLocation || unitType === "army") {
    return parseLocation(name);
  }

  const province = classic1901.locations.find((location) => location.id === landLocation)?.province;
  const reachableCoasts = classic1901.adjacency[from]
    ?.filter((adjacency) => adjacency.unitTypes.includes("fleet"))
    .map((adjacency) => classic1901.locations.find((location) => location.id === adjacency.to))
    .filter((location): location is typeof classic1901.locations[number] => {
      return location !== undefined && location.province === province && location.unitTypes.includes("fleet");
    }) ?? [];

  return reachableCoasts.length === 1 ? reachableCoasts[0].id : landLocation;
}

function parsePowerHeader(line: string): PowerId | undefined {
  const powerName = line.endsWith(":") ? line.slice(0, -1).toLowerCase() : line.toLowerCase();
  const power = classic1901PowerList.find((candidate) => candidate.name.toLowerCase() === powerName);
  if (!power && line.endsWith(":")) {
    throw new Error(`Unknown DATC power: ${line}`);
  }

  return power?.id;
}

function parseUnitPrefix(line: string): { readonly type: UnitType; readonly location: LocationId; readonly remainder: string } {
  const match = /^(A|F) (.+?)(?: (Hold|Supports .+|- .+))?$/.exec(line);
  if (!match) {
    throw new Error(`Could not parse DATC unit order: ${line}`);
  }

  return {
    type: match[1] === "A" ? "army" : "fleet",
    location: parseLocation(match[2]),
    remainder: match[3] ?? "Hold",
  };
}

function ensureUnit(
  units: Map<string, Unit>,
  power: PowerId,
  type: UnitType,
  location: LocationId,
  authoritative = false,
): Unit {
  const key = unitKey(type, location);
  const existing = units.get(key);
  if (existing) {
    if (authoritative && existing.power !== power) {
      const unit = {
        id: datcUnitId(power, type, location),
        power,
        type,
        location,
      };
      units.set(key, unit);
      return unit;
    }

    return existing;
  }

  const unit: Unit = {
    id: datcUnitId(power, type, location),
    power,
    type,
    location,
  };
  units.set(key, unit);
  return unit;
}

function findPowerAtLocation(
  units: ReadonlyMap<string, Unit>,
  type: UnitType,
  location: LocationId,
): PowerId | undefined {
  return units.get(unitKey(type, location))?.power;
}

function datcUnitId(power: PowerId, type: UnitType, location: LocationId): UnitId {
  const prefix = type === "army" ? "a" : "f";
  return unitId(`datc-${power}-${prefix}-${location}`);
}

function unitKey(type: UnitType, location: LocationId) {
  return `${type}:${location}`;
}

function normalizeName(name: string) {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}
