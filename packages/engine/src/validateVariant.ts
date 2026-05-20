import type {
  GameState,
  LocationId,
  PowerId,
  ProvinceId,
  UnitId,
  UnitType,
  VariantDefinition,
  VariantValidationIssue,
  VariantValidationResult,
} from "./types.js";

export function validateVariant(variant: VariantDefinition): VariantValidationResult {
  const issues: VariantValidationIssue[] = [];
  const powerIds = new Set<PowerId>();
  const provinceIds = new Set<ProvinceId>();
  const locationIds = new Set<LocationId>();
  const locationsById = new Map<LocationId, { province: ProvinceId; unitTypes: readonly UnitType[] }>();

  for (const power of variant.powers) {
    addUnique(powerIds, power.id, issues, `powers.${power.id}`, "Duplicate power id.");
  }

  for (const province of variant.provinces) {
    addUnique(provinceIds, province.id, issues, `provinces.${province.id}`, "Duplicate province id.");

    if (province.supplyCenter?.owner && !powerIds.has(province.supplyCenter.owner)) {
      issues.push({
        path: `provinces.${province.id}.supplyCenter.owner`,
        message: "Supply center owner does not reference a known power.",
      });
    }

    if (province.supplyCenter?.homePower && !powerIds.has(province.supplyCenter.homePower)) {
      issues.push({
        path: `provinces.${province.id}.supplyCenter.homePower`,
        message: "Supply center home power does not reference a known power.",
      });
    }
  }

  for (const location of variant.locations) {
    addUnique(locationIds, location.id, issues, `locations.${location.id}`, "Duplicate location id.");
    locationsById.set(location.id, { province: location.province, unitTypes: location.unitTypes });

    if (!provinceIds.has(location.province)) {
      issues.push({
        path: `locations.${location.id}.province`,
        message: "Location province does not reference a known province.",
      });
    }

    if (new Set(location.unitTypes).size !== location.unitTypes.length) {
      issues.push({
        path: `locations.${location.id}.unitTypes`,
        message: "Location contains duplicate unit types.",
      });
    }
  }

  validateAdjacency(variant, locationIds, issues);
  validateState(variant.initialState, powerIds, provinceIds, locationIds, locationsById, issues, "initialState");

  return {
    valid: issues.length === 0,
    issues,
  };
}

function validateAdjacency(
  variant: VariantDefinition,
  locationIds: ReadonlySet<LocationId>,
  issues: VariantValidationIssue[],
) {
  for (const locationId of locationIds) {
    if (!variant.adjacency[locationId]) {
      issues.push({
        path: `adjacency.${locationId}`,
        message: "Location is missing an adjacency list.",
      });
    }
  }

  for (const [from, destinations] of Object.entries(variant.adjacency) as [LocationId, readonly { to: LocationId; unitTypes: readonly UnitType[] }[]][]) {
    if (!locationIds.has(from)) {
      issues.push({
        path: `adjacency.${from}`,
        message: "Adjacency list is defined for an unknown location.",
      });
      continue;
    }

    const seenDestinations = new Set<LocationId>();
    for (const { to, unitTypes } of destinations) {
      addUnique(seenDestinations, to, issues, `adjacency.${from}`, "Adjacency list contains a duplicate destination.");

      if (!locationIds.has(to)) {
        issues.push({
          path: `adjacency.${from}`,
          message: `Adjacency references unknown location ${to}.`,
        });
        continue;
      }

      if (unitTypes.length === 0) {
        issues.push({
          path: `adjacency.${from}`,
          message: `Adjacency to ${to} does not allow any unit type.`,
        });
      }

      if (new Set(unitTypes).size !== unitTypes.length) {
        issues.push({
          path: `adjacency.${from}`,
          message: `Adjacency to ${to} contains duplicate unit types.`,
        });
      }

      const reciprocal = variant.adjacency[to]?.find((adjacency) => adjacency.to === from);
      const reciprocalUnitTypes = reciprocal?.unitTypes ?? [];
      if (!unitTypes.every((unitType) => reciprocalUnitTypes.includes(unitType))) {
        issues.push({
          path: `adjacency.${from}`,
          message: `Adjacency to ${to} is not reciprocal.`,
        });
      }
    }
  }
}

function validateState(
  state: GameState,
  powerIds: ReadonlySet<PowerId>,
  provinceIds: ReadonlySet<ProvinceId>,
  locationIds: ReadonlySet<LocationId>,
  locationsById: ReadonlyMap<LocationId, { province: ProvinceId; unitTypes: readonly UnitType[] }>,
  issues: VariantValidationIssue[],
  path: string,
) {
  const unitIds = new Set<UnitId>();
  const occupiedProvinces = new Set<ProvinceId>();

  for (const unit of state.units) {
    addUnique(unitIds, unit.id, issues, `${path}.units.${unit.id}`, "Duplicate unit id.");
    const location = locationsById.get(unit.location);
    if (location) {
      addUnique(occupiedProvinces, location.province, issues, `${path}.units.${unit.id}.location`, "Multiple units occupy the same province.");

      if (!location.unitTypes.includes(unit.type)) {
        issues.push({
          path: `${path}.units.${unit.id}.location`,
          message: "Unit type cannot occupy its starting location.",
        });
      }
    }

    if (!powerIds.has(unit.power)) {
      issues.push({
        path: `${path}.units.${unit.id}.power`,
        message: "Unit power does not reference a known power.",
      });
    }

    if (!locationIds.has(unit.location)) {
      issues.push({
        path: `${path}.units.${unit.id}.location`,
        message: "Unit location does not reference a known location.",
      });
    }
  }

  for (const [province, owner] of Object.entries(state.supplyCenterOwners) as [ProvinceId, PowerId | undefined][]) {
    if (!provinceIds.has(province)) {
      issues.push({
        path: `${path}.supplyCenterOwners.${province}`,
        message: "Supply center owner is defined for an unknown province.",
      });
    }

    if (owner && !powerIds.has(owner)) {
      issues.push({
        path: `${path}.supplyCenterOwners.${province}`,
        message: "Supply center owner does not reference a known power.",
      });
    }
  }
}

function addUnique<T>(
  set: Set<T>,
  value: T,
  issues: VariantValidationIssue[],
  path: string,
  message: string,
) {
  if (set.has(value)) {
    issues.push({ path, message });
    return;
  }

  set.add(value);
}
