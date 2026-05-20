import type {
  AdjudicationResult,
  BuildOrder,
  DisbandOrder,
  Dislodgement,
  GameState,
  LocationId,
  MoveOrder,
  Order,
  OrderId,
  OrderResult,
  PendingRetreat,
  Phase,
  PowerId,
  ProvinceId,
  RetreatOrder,
  SupportOrder,
  Unit,
  VariantDefinition,
} from "./types.js";

interface NormalizedOrder {
  readonly order: Order;
  readonly unit: Unit;
}

interface Attack {
  readonly order: MoveOrder;
  readonly unit: Unit;
  readonly from: LocationId;
  readonly fromProvince: ProvinceId;
  readonly to: LocationId;
  readonly toProvince: ProvinceId;
  readonly strength: number;
}

interface MovementContext {
  readonly state: GameState;
  readonly attacksByDestination: ReadonlyMap<ProvinceId, readonly Attack[]>;
  readonly attacksByUnitId: ReadonlyMap<string, Attack>;
  readonly defenseStrengthByUnitId: ReadonlyMap<string, number>;
  readonly variant: VariantDefinition;
}

export function adjudicate(
  previousState: GameState,
  submittedOrders: readonly Order[],
  variant: VariantDefinition,
): AdjudicationResult {
  if (previousState.phase.type === "movement") {
    return adjudicateMovement(previousState, submittedOrders, variant);
  }

  if (previousState.phase.type === "retreat") {
    return adjudicateRetreats(previousState, submittedOrders, variant);
  }

  return adjudicateBuilds(previousState, submittedOrders, variant);
}

function adjudicateMovement(
  previousState: GameState,
  submittedOrders: readonly Order[],
  variant: VariantDefinition,
): AdjudicationResult {
  const unitsById = new Map(previousState.units.map((unit) => [unit.id, unit]));
  const ordersByUnit = new Map<string, Order>();
  const orderResults: Record<OrderId, OrderResult> = {};
  const normalizedOrders: NormalizedOrder[] = [];

  for (const submittedOrder of submittedOrders) {
    if (submittedOrder.type === "build") {
      orderResults[submittedOrder.id] = invalid(submittedOrder, "Build orders are only valid during build phases.");
      continue;
    }

    const unit = unitsById.get(submittedOrder.unitId);
    if (!unit) {
      orderResults[submittedOrder.id] = invalid(submittedOrder, "Order references a unit that is not in the current state.");
      continue;
    }

    if (ordersByUnit.has(submittedOrder.unitId)) {
      orderResults[submittedOrder.id] = invalid(submittedOrder, "Only one order may be submitted for a unit.");
      continue;
    }

    const validationError = validateOrder(submittedOrder, unit, previousState, variant);
    if (validationError) {
      orderResults[submittedOrder.id] = invalid(submittedOrder, validationError);
      continue;
    }

    ordersByUnit.set(submittedOrder.unitId, submittedOrder);
    normalizedOrders.push({ order: submittedOrder, unit });
  }

  for (const unit of previousState.units) {
    if (!ordersByUnit.has(unit.id)) {
      normalizedOrders.push({
        order: { id: `hold:${unit.id}` as OrderId, type: "hold", unitId: unit.id },
        unit,
      });
    }
  }

  const moveOrders = normalizedOrders.filter((item): item is NormalizedOrder & { order: MoveOrder } => item.order.type === "move");
  const supportOrders = normalizedOrders.filter((item): item is NormalizedOrder & { order: SupportOrder } => item.order.type === "support");
  const invalidSupportOrderIds = findInvalidSupportOrderIds(supportOrders, moveOrders);
  const validSupportOrders = supportOrders.filter((item) => !invalidSupportOrderIds.has(item.order.id));
  let cutSupportOrderIds = findCutSupports(validSupportOrders, moveOrders, variant);
  let attacks = buildAttacks(moveOrders, validSupportOrders, cutSupportOrderIds, previousState, variant);
  let defenseStrengthByUnitId = calculateDefenseStrengths(previousState, moveOrders, validSupportOrders, cutSupportOrderIds);
  let resolvedMoves = resolveMoves(attacks, previousState, defenseStrengthByUnitId, variant);
  const dislodgedSupportOrderIds = findDislodgedSupportOrderIds(validSupportOrders, resolvedMoves.dislodgements);

  if ([...dislodgedSupportOrderIds].some((orderId) => !cutSupportOrderIds.has(orderId))) {
    cutSupportOrderIds = new Set([...cutSupportOrderIds, ...dislodgedSupportOrderIds]);
    attacks = buildAttacks(moveOrders, validSupportOrders, cutSupportOrderIds, previousState, variant);
    defenseStrengthByUnitId = calculateDefenseStrengths(previousState, moveOrders, validSupportOrders, cutSupportOrderIds);
    resolvedMoves = resolveMoves(attacks, previousState, defenseStrengthByUnitId, variant);
  }
  const dislodgedUnitIds = new Set(resolvedMoves.dislodgements.map((dislodgement) => dislodgement.unit.id));
  const nextUnits = previousState.units.filter((unit) => !dislodgedUnitIds.has(unit.id)).map((unit) => {
    const successfulAttack = resolvedMoves.successfulAttacks.find((attack) => attack.unit.id === unit.id);
    return successfulAttack ? { ...unit, location: successfulAttack.to } : unit;
  });
  const standoffProvinces = findStandoffProvinces(attacks, resolvedMoves.successfulAttacks);
  const retreats = buildPendingRetreats(resolvedMoves.dislodgements, nextUnits, standoffProvinces, variant);
  const nextSupplyCenterOwners =
    retreats.length > 0 ? previousState.supplyCenterOwners : updateSupplyCenterOwnersAfterPhase(previousState, nextUnits, variant);

  for (const item of normalizedOrders) {
    if (orderResults[item.order.id]) {
      continue;
    }

    if (item.order.type === "move") {
      const succeeded = resolvedMoves.successfulAttacks.some((attack) => attack.order.id === item.order.id);
      orderResults[item.order.id] = {
        order: item.order,
        status: succeeded ? "succeeds" : "fails",
        reason: succeeded ? "Move has the highest unresolved attack strength." : "Move did not beat the destination defense.",
      };
    } else if (item.order.type === "support") {
      if (invalidSupportOrderIds.has(item.order.id)) {
        orderResults[item.order.id] = {
          order: item.order,
          status: "invalid",
          reason: "Support to move does not match a valid move order from the supported unit.",
        };
        continue;
      }

      orderResults[item.order.id] = {
        order: item.order,
        status: cutSupportOrderIds.has(item.order.id) ? "fails" : "succeeds",
        reason: cutSupportOrderIds.has(item.order.id) ? "Support was cut by an attack from another province." : "Support was not cut.",
      };
    } else {
      orderResults[item.order.id] = {
        order: item.order,
        status: "succeeds",
        reason: "Unit held its province.",
      };
    }
  }

  return {
    nextState: {
      ...previousState,
      phase: retreats.length > 0 ? { ...previousState.phase, type: "retreat" } : nextPhaseAfterMovement(previousState.phase),
      units: nextUnits,
      supplyCenterOwners: nextSupplyCenterOwners,
      retreats,
    },
    orderResults,
    dislodgedUnits: resolvedMoves.dislodgements,
    retreats,
    invalidOrders: Object.values(orderResults).filter((result) => result.status === "invalid"),
  };
}

function validateOrder(order: Order, unit: Unit, state: GameState, variant: VariantDefinition): string | undefined {
  if (order.type === "hold") {
    return undefined;
  }

  if (order.type === "move") {
    if (!canUnitOccupy(unit.type, order.to, variant)) {
      return "Move destination cannot be occupied by that unit type.";
    }

    return areAdjacent(unit.type, unit.location, order.to, variant) ? undefined : "Move destination is not adjacent to the unit location.";
  }

  if (order.type === "retreat" || order.type === "disband") {
    return "Retreat and disband orders are only valid during retreat phases.";
  }

  if (order.type === "build") {
    return "Build orders are only valid during build phases.";
  }

  const supportedUnit = state.units.find((candidate) => candidate.id === order.supportedUnitId);
  if (!supportedUnit) {
    return "Support references a unit that is not in the current state.";
  }

  const supportTarget = order.to ?? supportedUnit.location;
  if (!canUnitOccupy(supportedUnit.type, supportTarget, variant)) {
    return "Supported target cannot be occupied by the supported unit type.";
  }

  if (!canSupportProvince(unit.type, unit.location, supportTarget, variant)) {
    return "Supporting unit is not adjacent to the supported target.";
  }

  if (order.to && locationProvince(supportedUnit.location, variant) === locationProvince(order.to, variant)) {
    return "A unit cannot support movement to the province it already occupies.";
  }

  return undefined;
}

function findInvalidSupportOrderIds(
  supports: readonly (NormalizedOrder & { order: SupportOrder })[],
  moves: readonly (NormalizedOrder & { order: MoveOrder })[],
): ReadonlySet<OrderId> {
  const invalidSupportOrderIds = new Set<OrderId>();

  for (const support of supports) {
    if (!support.order.to) {
      continue;
    }

    if (!moves.some((move) => move.unit.id === support.order.supportedUnitId && move.order.to === support.order.to)) {
      invalidSupportOrderIds.add(support.order.id);
    }
  }

  return invalidSupportOrderIds;
}

function buildAttacks(
  moveOrders: readonly (NormalizedOrder & { order: MoveOrder })[],
  supportOrders: readonly (NormalizedOrder & { order: SupportOrder })[],
  cutSupportOrderIds: ReadonlySet<OrderId>,
  state: GameState,
  variant: VariantDefinition,
): readonly Attack[] {
  return moveOrders.map((item) => ({
    order: item.order,
    unit: item.unit,
    from: item.unit.location,
    fromProvince: locationProvince(item.unit.location, variant),
    to: item.order.to,
    toProvince: locationProvince(item.order.to, variant),
    strength: 1 + countValidSupports(item.order, item.unit, supportOrders, cutSupportOrderIds, state, variant),
  }));
}

function findDislodgedSupportOrderIds(
  supports: readonly (NormalizedOrder & { order: SupportOrder })[],
  dislodgements: readonly Dislodgement[],
): ReadonlySet<OrderId> {
  const dislodgedUnitIds = new Set(dislodgements.map((dislodgement) => dislodgement.unit.id));
  return new Set(
    supports
      .filter((support) => dislodgedUnitIds.has(support.unit.id))
      .map((support) => support.order.id),
  );
}

function adjudicateRetreats(
  previousState: GameState,
  submittedOrders: readonly Order[],
  variant: VariantDefinition,
): AdjudicationResult {
  const pendingRetreats = previousState.retreats ?? [];
  const retreatsByUnitId = new Map(pendingRetreats.map((retreat) => [retreat.unit.id, retreat]));
  const ordersByUnit = new Map<string, RetreatOrder | DisbandOrder>();
  const orderResults: Record<OrderId, OrderResult> = {};

  for (const submittedOrder of submittedOrders) {
    if (submittedOrder.type !== "retreat" && submittedOrder.type !== "disband") {
      orderResults[submittedOrder.id] = invalid(submittedOrder, "Only retreat and disband orders are valid during retreat phases.");
      continue;
    }

    const pendingRetreat = retreatsByUnitId.get(submittedOrder.unitId);
    if (!pendingRetreat) {
      orderResults[submittedOrder.id] = invalid(submittedOrder, "Order references a unit that does not have a pending retreat.");
      continue;
    }

    if (ordersByUnit.has(submittedOrder.unitId)) {
      orderResults[submittedOrder.id] = invalid(submittedOrder, "Only one retreat order may be submitted for a unit.");
      continue;
    }

    if (submittedOrder.type === "retreat" && !pendingRetreat.options.includes(submittedOrder.to)) {
      orderResults[submittedOrder.id] = invalid(submittedOrder, "Retreat destination is not a legal retreat option.");
      ordersByUnit.set(submittedOrder.unitId, submittedOrder);
      continue;
    }

    ordersByUnit.set(submittedOrder.unitId, submittedOrder);
  }

  for (const pendingRetreat of pendingRetreats) {
    if (!ordersByUnit.has(pendingRetreat.unit.id)) {
      ordersByUnit.set(pendingRetreat.unit.id, {
        id: `disband:${pendingRetreat.unit.id}` as OrderId,
        type: "disband",
        unitId: pendingRetreat.unit.id,
      });
    }
  }

  const retreatOrders = [...ordersByUnit.values()].filter((order): order is RetreatOrder => {
    return order.type === "retreat" && !orderResults[order.id];
  });
  const contestedRetreatProvinces = findContestedRetreatProvinces(retreatOrders, variant);
  const retreatedUnits: Unit[] = [];

  for (const order of ordersByUnit.values()) {
    if (orderResults[order.id]) {
      continue;
    }

    const pendingRetreat = retreatsByUnitId.get(order.unitId);
    if (!pendingRetreat) {
      continue;
    }

    if (order.type === "disband") {
      orderResults[order.id] = {
        order,
        status: "succeeds",
        reason: "Unit disbanded during retreat phase.",
      };
      continue;
    }

    const destinationProvince = locationProvince(order.to, variant);
    if (contestedRetreatProvinces.has(destinationProvince)) {
      orderResults[order.id] = {
        order,
        status: "fails",
        reason: "Multiple units attempted to retreat to the same province.",
      };
      continue;
    }

    retreatedUnits.push({ ...pendingRetreat.unit, location: order.to });
    orderResults[order.id] = {
      order,
      status: "succeeds",
      reason: "Unit retreated to a legal destination.",
    };
  }

  return {
    nextState: {
      ...previousState,
      phase: nextPhaseAfterMovement(previousState.phase),
      units: [...previousState.units, ...retreatedUnits],
      supplyCenterOwners: updateSupplyCenterOwnersAfterPhase(previousState, [...previousState.units, ...retreatedUnits], variant),
      retreats: [],
    },
    orderResults,
    dislodgedUnits: [],
    retreats: [],
    invalidOrders: Object.values(orderResults).filter((result) => result.status === "invalid"),
  };
}

function adjudicateBuilds(
  previousState: GameState,
  submittedOrders: readonly Order[],
  variant: VariantDefinition,
): AdjudicationResult {
  const orderResults: Record<OrderId, OrderResult> = {};
  const nextUnits: Unit[] = [...previousState.units];
  const unitsById = new Map(previousState.units.map((unit) => [unit.id, unit]));
  const buildOrdersByPower = new Map<PowerId, BuildOrder[]>();
  const disbandOrdersByPower = new Map<PowerId, DisbandOrder[]>();
  const seenBuildUnitIds = new Set<Unit["id"]>(previousState.units.map((unit) => unit.id));
  const seenBuildProvinces = new Set<ProvinceId>();

  for (const submittedOrder of submittedOrders) {
    if (submittedOrder.type !== "build" && submittedOrder.type !== "disband") {
      orderResults[submittedOrder.id] = invalid(submittedOrder, "Only build and disband orders are valid during build phases.");
      continue;
    }

    if (submittedOrder.type === "build") {
      const validationError = validateBuildOrder(submittedOrder, previousState, variant, seenBuildUnitIds, seenBuildProvinces);
      if (validationError) {
        orderResults[submittedOrder.id] = invalid(submittedOrder, validationError);
        continue;
      }

      seenBuildUnitIds.add(submittedOrder.unitId);
      seenBuildProvinces.add(locationProvince(submittedOrder.location, variant));
      const orders = buildOrdersByPower.get(submittedOrder.power) ?? [];
      orders.push(submittedOrder);
      buildOrdersByPower.set(submittedOrder.power, orders);
      continue;
    }

    const unit = unitsById.get(submittedOrder.unitId);
    if (!unit) {
      orderResults[submittedOrder.id] = invalid(submittedOrder, "Disband order references a unit that is not in the current state.");
      continue;
    }

    const orders = disbandOrdersByPower.get(unit.power) ?? [];
    if (orders.some((order) => order.unitId === submittedOrder.unitId)) {
      orderResults[submittedOrder.id] = invalid(submittedOrder, "Only one disband order may be submitted for a unit.");
      continue;
    }

    orders.push(submittedOrder);
    disbandOrdersByPower.set(unit.power, orders);
  }

  for (const power of variant.powers) {
    const adjustment = countOwnedSupplyCenters(previousState, power.id) - countUnits(previousState.units, power.id);

    if (adjustment > 0) {
      const buildOrders = buildOrdersByPower.get(power.id) ?? [];
      for (const [index, order] of buildOrders.entries()) {
        if (index >= adjustment) {
          orderResults[order.id] = {
            order,
            status: "fails",
            reason: "Power does not have enough open build allowance for this order.",
          };
          continue;
        }

        nextUnits.push({
          id: order.unitId,
          power: order.power,
          type: order.unitType,
          location: order.location,
        });
        orderResults[order.id] = {
          order,
          status: "succeeds",
          reason: "Unit built in an open owned home supply center.",
        };
      }

      for (const order of disbandOrdersByPower.get(power.id) ?? []) {
        orderResults[order.id] = {
          order,
          status: "fails",
          reason: "Power is not required to disband units.",
        };
      }

      continue;
    }

    if (adjustment < 0) {
      const requiredDisbands = -adjustment;
      const disbandOrders = disbandOrdersByPower.get(power.id) ?? [];
      const disbandedUnitIds = new Set<Unit["id"]>();

      for (const [index, order] of disbandOrders.entries()) {
        if (index >= requiredDisbands) {
          orderResults[order.id] = {
            order,
            status: "fails",
            reason: "Power does not need another disband.",
          };
          continue;
        }

        disbandedUnitIds.add(order.unitId);
        orderResults[order.id] = {
          order,
          status: "succeeds",
          reason: "Unit disbanded during build phase.",
        };
      }

      const missingDisbands = requiredDisbands - disbandedUnitIds.size;
      if (missingDisbands > 0) {
        const forcedDisbands = nextUnits
          .filter((unit) => unit.power === power.id && !disbandedUnitIds.has(unit.id))
          .sort((left, right) => left.id.localeCompare(right.id))
          .slice(0, missingDisbands);

        for (const unit of forcedDisbands) {
          const order: DisbandOrder = {
            id: `forced-disband:${unit.id}` as OrderId,
            type: "disband",
            unitId: unit.id,
          };
          disbandedUnitIds.add(unit.id);
          orderResults[order.id] = {
            order,
            status: "succeeds",
            reason: "Unit was automatically disbanded because the power has too few supply centers.",
          };
        }
      }

      removeUnits(nextUnits, disbandedUnitIds);

      for (const order of buildOrdersByPower.get(power.id) ?? []) {
        orderResults[order.id] = {
          order,
          status: "fails",
          reason: "Power is required to disband units, not build units.",
        };
      }

      continue;
    }

    for (const order of buildOrdersByPower.get(power.id) ?? []) {
      orderResults[order.id] = {
        order,
        status: "fails",
        reason: "Power does not have a build allowance.",
      };
    }

    for (const order of disbandOrdersByPower.get(power.id) ?? []) {
      orderResults[order.id] = {
        order,
        status: "fails",
        reason: "Power is not required to disband units.",
      };
    }
  }

  return {
    nextState: {
      ...previousState,
      phase: nextPhaseAfterBuild(previousState.phase),
      units: nextUnits,
      retreats: [],
    },
    orderResults,
    dislodgedUnits: [],
    retreats: [],
    invalidOrders: Object.values(orderResults).filter((result) => result.status === "invalid"),
  };
}

function validateBuildOrder(
  order: BuildOrder,
  state: GameState,
  variant: VariantDefinition,
  seenBuildUnitIds: ReadonlySet<Unit["id"]>,
  seenBuildProvinces: ReadonlySet<ProvinceId>,
): string | undefined {
  if (!variant.powers.some((power) => power.id === order.power)) {
    return "Build order references an unknown power.";
  }

  if (seenBuildUnitIds.has(order.unitId)) {
    return "Build order unit id is already in use.";
  }

  if (!canUnitOccupy(order.unitType, order.location, variant)) {
    return "Build location cannot be occupied by that unit type.";
  }

  const province = locationProvince(order.location, variant);
  const provinceDefinition = variant.provinces.find((candidate) => candidate.id === province);
  if (!provinceDefinition?.supplyCenter) {
    return "Build location is not a supply center.";
  }

  if (provinceDefinition.supplyCenter.homePower !== order.power) {
    return "Build location is not a home supply center for that power.";
  }

  if (state.supplyCenterOwners[province] !== order.power) {
    return "Build location is not owned by that power.";
  }

  if (state.units.some((unit) => locationProvince(unit.location, variant) === province)) {
    return "Build location is occupied.";
  }

  if (seenBuildProvinces.has(province)) {
    return "Only one build may be ordered in a province.";
  }

  return undefined;
}

function countOwnedSupplyCenters(state: GameState, power: PowerId): number {
  return Object.values(state.supplyCenterOwners).filter((owner) => owner === power).length;
}

function countUnits(units: readonly Unit[], power: PowerId): number {
  return units.filter((unit) => unit.power === power).length;
}

function removeUnits(units: Unit[], unitIds: ReadonlySet<Unit["id"]>) {
  for (let index = units.length - 1; index >= 0; index -= 1) {
    if (unitIds.has(units[index].id)) {
      units.splice(index, 1);
    }
  }
}

function updateSupplyCenterOwnersAfterPhase(
  state: GameState,
  units: readonly Unit[],
  variant: VariantDefinition,
): Readonly<Record<ProvinceId, PowerId | undefined>> {
  if (state.phase.season !== "fall") {
    return state.supplyCenterOwners;
  }

  const nextOwners: Record<ProvinceId, PowerId | undefined> = { ...state.supplyCenterOwners };
  const unitsByProvince = new Map(units.map((unit) => [locationProvince(unit.location, variant), unit]));

  for (const province of variant.provinces) {
    if (!province.supplyCenter) {
      continue;
    }

    const occupyingUnit = unitsByProvince.get(province.id);
    if (occupyingUnit) {
      nextOwners[province.id] = occupyingUnit.power;
    }
  }

  return nextOwners;
}

function findContestedRetreatProvinces(
  retreatOrders: readonly RetreatOrder[],
  variant: VariantDefinition,
): ReadonlySet<ProvinceId> {
  const retreatCountsByProvince = new Map<ProvinceId, number>();

  for (const order of retreatOrders) {
    const province = locationProvince(order.to, variant);
    retreatCountsByProvince.set(province, (retreatCountsByProvince.get(province) ?? 0) + 1);
  }

  return new Set(
    [...retreatCountsByProvince.entries()]
      .filter(([, count]) => count > 1)
      .map(([province]) => province),
  );
}

function findCutSupports(
  supports: readonly (NormalizedOrder & { order: SupportOrder })[],
  moves: readonly (NormalizedOrder & { order: MoveOrder })[],
  variant: VariantDefinition,
): Set<OrderId> {
  const cutSupportOrderIds = new Set<OrderId>();

  for (const support of supports) {
    for (const move of moves) {
      if (move.unit.power === support.unit.power) {
        continue;
      }

      if (locationProvince(move.order.to, variant) !== locationProvince(support.unit.location, variant)) {
        continue;
      }

      const supportTarget = support.order.to ?? support.unit.location;
      if (locationProvince(move.unit.location, variant) === locationProvince(supportTarget, variant)) {
        continue;
      }

      cutSupportOrderIds.add(support.order.id);
    }
  }

  return cutSupportOrderIds;
}

function countValidSupports(
  moveOrder: MoveOrder,
  movingUnit: Unit,
  supports: readonly (NormalizedOrder & { order: SupportOrder })[],
  cutSupportOrderIds: ReadonlySet<OrderId>,
  state: GameState,
  variant: VariantDefinition,
): number {
  return supports.filter((support) => {
    if (cutSupportOrderIds.has(support.order.id)) {
      return false;
    }

    if (support.order.supportedUnitId !== movingUnit.id || support.order.to !== moveOrder.to) {
      return false;
    }

    const targetProvince = locationProvince(moveOrder.to, variant);
    const targetOccupant = state.units.find((unit) => locationProvince(unit.location, variant) === targetProvince);
    if (!targetOccupant) {
      return true;
    }

    return targetOccupant.power !== movingUnit.power && targetOccupant.power !== support.unit.power;
  }).length;
}

function calculateDefenseStrengths(
  state: GameState,
  moves: readonly (NormalizedOrder & { order: MoveOrder })[],
  supports: readonly (NormalizedOrder & { order: SupportOrder })[],
  cutSupportOrderIds: ReadonlySet<OrderId>,
): Map<string, number> {
  const defenseStrengths = new Map<string, number>();
  const movingUnitIds = new Set(moves.map((move) => move.unit.id));

  for (const unit of state.units) {
    const supportCount = supports.filter((support) => {
      if (cutSupportOrderIds.has(support.order.id)) {
        return false;
      }

      return support.order.supportedUnitId === unit.id && !support.order.to && !movingUnitIds.has(unit.id);
    }).length;

    defenseStrengths.set(unit.id, 1 + supportCount);
  }

  return defenseStrengths;
}

function resolveMoves(
  attacks: readonly Attack[],
  state: GameState,
  defenseStrengthByUnitId: ReadonlyMap<string, number>,
  variant: VariantDefinition,
): {
  readonly successfulAttacks: readonly Attack[];
  readonly dislodgements: readonly Dislodgement[];
} {
  const attacksByDestination = groupAttacksByDestination(attacks);
  const attacksByUnitId = new Map(attacks.map((attack) => [attack.unit.id, attack]));
  const context: MovementContext = {
    state,
    attacksByDestination,
    attacksByUnitId,
    defenseStrengthByUnitId,
    variant,
  };
  const successfulAttacks: Attack[] = [];
  const dislodgements: Dislodgement[] = [];

  for (const attack of attacks) {
    if (doesAttackSucceed(attack, context, new Set())) {
      successfulAttacks.push(attack);
    }
  }

  for (const attack of successfulAttacks) {
    const occupant = state.units.find((unit) => locationProvince(unit.location, variant) === attack.toProvince);
    if (occupant && !successfulAttacks.some((successfulAttack) => successfulAttack.unit.id === occupant.id)) {
      dislodgements.push({
        unit: occupant,
        attacker: attack.unit,
        from: attack.from,
      });
    }
  }

  return { successfulAttacks, dislodgements };
}

function doesAttackSucceed(
  attack: Attack,
  context: MovementContext,
  resolvingUnitIds: Set<string>,
): boolean {
  const destinationAttacks = context.attacksByDestination.get(attack.toProvince) ?? [];
  if (uniqueStrongest(destinationAttacks) !== attack) {
    return false;
  }

  const occupant = context.state.units.find((unit) => locationProvince(unit.location, context.variant) === attack.toProvince);
  if (!occupant) {
    return true;
  }

  const occupantAttack = context.attacksByUnitId.get(occupant.id);
  if (occupantAttack?.to === attack.from) {
    return attack.strength > occupantAttack.strength;
  }

  if (occupant.power === attack.unit.power) {
    return occupantAttack ? doesAttackVacate(occupantAttack, context, resolvingUnitIds) : false;
  }

  if (occupantAttack && doesAttackVacate(occupantAttack, context, resolvingUnitIds)) {
    return true;
  }

  return attack.strength > (context.defenseStrengthByUnitId.get(occupant.id) ?? 1);
}

function doesAttackVacate(
  attack: Attack,
  context: MovementContext,
  resolvingUnitIds: Set<string>,
): boolean {
  if (resolvingUnitIds.has(attack.unit.id)) {
    return true;
  }

  const nextResolvingUnitIds = new Set(resolvingUnitIds);
  nextResolvingUnitIds.add(attack.unit.id);
  return doesAttackSucceed(attack, context, nextResolvingUnitIds);
}

function groupAttacksByDestination(attacks: readonly Attack[]): Map<ProvinceId, Attack[]> {
  const grouped = new Map<ProvinceId, Attack[]>();

  for (const attack of attacks) {
    const destinationAttacks = grouped.get(attack.toProvince) ?? [];
    destinationAttacks.push(attack);
    grouped.set(attack.toProvince, destinationAttacks);
  }

  return grouped;
}

function findStandoffProvinces(
  attacks: readonly Attack[],
  successfulAttacks: readonly Attack[],
): ReadonlySet<ProvinceId> {
  const successfulDestinationProvinces = new Set(successfulAttacks.map((attack) => attack.toProvince));
  const attacksByDestination = groupAttacksByDestination(attacks);
  const standoffProvinces = new Set<ProvinceId>();

  for (const [province, provinceAttacks] of attacksByDestination) {
    if (provinceAttacks.length > 1 && !successfulDestinationProvinces.has(province)) {
      standoffProvinces.add(province);
    }
  }

  return standoffProvinces;
}

function buildPendingRetreats(
  dislodgements: readonly Dislodgement[],
  unitsAfterMovement: readonly Unit[],
  standoffProvinces: ReadonlySet<ProvinceId>,
  variant: VariantDefinition,
): readonly PendingRetreat[] {
  const occupiedProvinces = new Set(unitsAfterMovement.map((unit) => locationProvince(unit.location, variant)));

  return dislodgements.map((dislodgement) => {
    const attackOriginProvince = locationProvince(dislodgement.from, variant);
    const options = adjacentLocations(dislodgement.unit.type, dislodgement.unit.location, variant).filter((location) => {
      const province = locationProvince(location, variant);
      return !occupiedProvinces.has(province) && province !== attackOriginProvince && !standoffProvinces.has(province);
    });

    return {
      unit: dislodgement.unit,
      from: dislodgement.unit.location,
      attackOrigin: dislodgement.from,
      options,
    };
  });
}

function nextPhaseAfterMovement(phase: Phase): Phase {
  if (phase.season === "spring") {
    return { ...phase, season: "fall", type: "movement" };
  }

  if (phase.season === "fall") {
    return { ...phase, season: "winter", type: "build" };
  }

  return phase;
}

function nextPhaseAfterBuild(phase: Phase): Phase {
  return { year: phase.year + 1, season: "spring", type: "movement" };
}

function uniqueStrongest(attacks: readonly Attack[]): Attack | undefined {
  const [strongest, secondStrongest] = [...attacks].sort((left, right) => right.strength - left.strength);
  if (!strongest) {
    return undefined;
  }

  return secondStrongest && secondStrongest.strength === strongest.strength ? undefined : strongest;
}

function areAdjacent(unitType: Unit["type"], from: LocationId, to: LocationId, variant: VariantDefinition): boolean {
  return variant.adjacency[from]?.some((adjacency) => adjacency.to === to && adjacency.unitTypes.includes(unitType)) ?? false;
}

function canSupportProvince(unitType: Unit["type"], from: LocationId, target: LocationId, variant: VariantDefinition): boolean {
  const targetProvince = locationProvince(target, variant);
  return adjacentLocations(unitType, from, variant).some((location) => locationProvince(location, variant) === targetProvince);
}

function adjacentLocations(unitType: Unit["type"], from: LocationId, variant: VariantDefinition): readonly LocationId[] {
  return variant.adjacency[from]?.filter((adjacency) => adjacency.unitTypes.includes(unitType)).map((adjacency) => adjacency.to) ?? [];
}

function canUnitOccupy(unitType: Unit["type"], locationId: LocationId, variant: VariantDefinition): boolean {
  const location = variant.locations.find((candidate) => candidate.id === locationId);
  return location?.unitTypes.includes(unitType) ?? false;
}

function locationProvince(locationId: LocationId, variant: VariantDefinition): ProvinceId {
  const location = variant.locations.find((candidate) => candidate.id === locationId);
  if (!location) {
    throw new Error(`Unknown location ${locationId}.`);
  }

  return location.province;
}

function invalid(order: Order, reason: string): OrderResult {
  return { order, status: "invalid", reason };
}
