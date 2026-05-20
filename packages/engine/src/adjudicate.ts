import type {
  AdjudicationResult,
  BuildOrder,
  ConvoyOrder,
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
  UnitId,
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
  readonly supportPowerCounts: ReadonlyMap<PowerId, number>;
  readonly viaConvoy: boolean;
}

interface MovementContext {
  readonly state: GameState;
  readonly attacksByDestination: ReadonlyMap<ProvinceId, readonly Attack[]>;
  readonly attacksByUnitId: ReadonlyMap<string, Attack>;
  readonly defenseStrengthByUnitId: ReadonlyMap<string, number>;
  readonly variant: VariantDefinition;
}

interface ConvoyContext {
  readonly convoyOrders: readonly (NormalizedOrder & { order: ConvoyOrder })[];
  readonly disruptedFleetIds: ReadonlySet<string>;
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

    const validationError = validateOrder(submittedOrder, unit, previousState, submittedOrders, variant);
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
  const convoyOrders = normalizedOrders.filter((item): item is NormalizedOrder & { order: ConvoyOrder } => item.order.type === "convoy");
  const invalidSupportOrderIds = findInvalidSupportOrderIds(supportOrders, moveOrders);
  const validSupportOrders = supportOrders.filter((item) => !invalidSupportOrderIds.has(item.order.id));
  const baseConvoyContext: ConvoyContext = { convoyOrders, disruptedFleetIds: new Set() };
  const ownConvoySupportCutOrderIds = findOwnConvoySupportCutOrderIds(moveOrders, validSupportOrders, previousState, baseConvoyContext, variant);
  let convoyContext = baseConvoyContext;
  let paradoxicalConvoyMoveIds = findParadoxicalConvoyMoveIds(moveOrders, validSupportOrders, previousState, baseConvoyContext, variant);
  let activeMoveOrders = findActiveMoveOrders(moveOrders, previousState, convoyContext, variant).filter((move) => !paradoxicalConvoyMoveIds.has(move.unit.id));
  let cutSupportOrderIds = findCutSupports(validSupportOrders, activeMoveOrders, previousState, convoyContext, variant);
  cutSupportOrderIds = new Set([...cutSupportOrderIds, ...ownConvoySupportCutOrderIds]);
  let attacks = buildAttacks(activeMoveOrders, validSupportOrders, cutSupportOrderIds, previousState, convoyContext, variant);
  let defenseStrengthByUnitId = calculateDefenseStrengths(previousState, moveOrders, validSupportOrders, cutSupportOrderIds);
  let resolvedMoves = resolveMoves(attacks, previousState, defenseStrengthByUnitId, variant);
  const disruptedFleetIds = new Set(resolvedMoves.dislodgements.map((dislodgement) => dislodgement.unit.id));

  if (disruptedFleetIds.size > 0) {
    convoyContext = { convoyOrders, disruptedFleetIds };
    paradoxicalConvoyMoveIds = findParadoxicalConvoyMoveIds(moveOrders, validSupportOrders, previousState, baseConvoyContext, variant);
    activeMoveOrders = findActiveMoveOrders(moveOrders, previousState, convoyContext, variant).filter((move) => !paradoxicalConvoyMoveIds.has(move.unit.id));
    cutSupportOrderIds = findCutSupports(validSupportOrders, activeMoveOrders, previousState, convoyContext, variant);
    cutSupportOrderIds = new Set([...cutSupportOrderIds, ...ownConvoySupportCutOrderIds]);
    attacks = buildAttacks(activeMoveOrders, validSupportOrders, cutSupportOrderIds, previousState, convoyContext, variant);
    defenseStrengthByUnitId = calculateDefenseStrengths(previousState, moveOrders, validSupportOrders, cutSupportOrderIds);
    resolvedMoves = resolveMoves(attacks, previousState, defenseStrengthByUnitId, variant);
  }
  const dislodgedSupportOrderIds = findDislodgedSupportOrderIds(validSupportOrders, resolvedMoves.dislodgements);

  if ([...dislodgedSupportOrderIds].some((orderId) => !cutSupportOrderIds.has(orderId))) {
    cutSupportOrderIds = new Set([...cutSupportOrderIds, ...dislodgedSupportOrderIds]);
    paradoxicalConvoyMoveIds = findParadoxicalConvoyMoveIds(moveOrders, validSupportOrders, previousState, baseConvoyContext, variant);
    activeMoveOrders = findActiveMoveOrders(moveOrders, previousState, convoyContext, variant).filter((move) => !paradoxicalConvoyMoveIds.has(move.unit.id));
    attacks = buildAttacks(activeMoveOrders, validSupportOrders, cutSupportOrderIds, previousState, convoyContext, variant);
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
    } else if (item.order.type === "convoy") {
      orderResults[item.order.id] = {
        order: item.order,
        status: convoyContext.disruptedFleetIds.has(item.unit.id) ? "fails" : "succeeds",
        reason: convoyContext.disruptedFleetIds.has(item.unit.id) ? "Convoying fleet was dislodged." : "Convoy order was not disrupted.",
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

function validateOrder(
  order: Order,
  unit: Unit,
  state: GameState,
  submittedOrders: readonly Order[],
  variant: VariantDefinition,
): string | undefined {
  if (order.type === "hold") {
    return undefined;
  }

  if (order.type === "move") {
    if (!canUnitOccupy(unit.type, order.to, variant)) {
      return "Move destination cannot be occupied by that unit type.";
    }

    if (areAdjacent(unit.type, unit.location, order.to, variant) && !order.viaConvoy) {
      return undefined;
    }

    if (isConvoyableMove(unit, order.to, variant) && hasPotentialConvoyRoute(unit, order.to, state, variant)) {
      return undefined;
    }

    return "Move destination is not adjacent to the unit location.";
  }

  if (order.type === "retreat" || order.type === "disband") {
    return "Retreat and disband orders are only valid during retreat phases.";
  }

  if (order.type === "build") {
    return "Build orders are only valid during build phases.";
  }

  if (order.type === "convoy") {
    if (unit.type !== "fleet") {
      return "Only fleets may convoy.";
    }

    if (locationDefinition(unit.location, variant)?.type !== "sea") {
      return "Only fleets in sea locations may convoy.";
    }

    const convoyedUnit = state.units.find((candidate) => candidate.id === order.convoyedUnitId);
    if (!convoyedUnit) {
      return "Convoy references a unit that is not in the current state.";
    }

    if (!isConvoyableMove(convoyedUnit, order.to, variant)) {
      return "Convoyed move is not a valid army convoy move.";
    }

    if (
      !submittedOrders.some((submittedOrder) => {
        return submittedOrder.type === "move" && submittedOrder.unitId === order.convoyedUnitId && submittedOrder.to === order.to;
      })
    ) {
      return "Convoy does not match a submitted move order.";
    }

    return undefined;
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

  if (
    order.to &&
    supportedUnit.type === "army" &&
    !areAdjacent("army", supportedUnit.location, order.to, variant) &&
    unit.type === "fleet" &&
    locationDefinition(unit.location, variant)?.type === "sea" &&
    canFleetReachProvince(unit.location, locationProvince(supportedUnit.location, variant), variant) &&
    canFleetReachProvince(unit.location, locationProvince(order.to, variant), variant) &&
    !hasPotentialConvoyRoute(supportedUnit, order.to, state, variant, unit.location)
  ) {
    return "A fleet cannot both convoy and support the same army move.";
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
  convoyContext: ConvoyContext,
  variant: VariantDefinition,
): readonly Attack[] {
  return moveOrders.map((item) => {
    const supportPowerCounts = countSupportPowers(item.order, item.unit, supportOrders, cutSupportOrderIds, state, variant);
    return {
      order: item.order,
      unit: item.unit,
      from: item.unit.location,
      fromProvince: locationProvince(item.unit.location, variant),
      to: item.order.to,
      toProvince: locationProvince(item.order.to, variant),
      strength: 1 + [...supportPowerCounts.values()].reduce((total, count) => total + count, 0),
      supportPowerCounts,
      viaConvoy: isMoveViaConvoy(item, state, convoyContext, variant),
    };
  });
}

function findActiveMoveOrders(
  moveOrders: readonly (NormalizedOrder & { order: MoveOrder })[],
  state: GameState,
  convoyContext: ConvoyContext,
  variant: VariantDefinition,
): readonly (NormalizedOrder & { order: MoveOrder })[] {
  return moveOrders.filter((move) => {
    if (!isMoveIntendedViaConvoy(move, convoyContext, variant)) {
      return true;
    }

    return hasConvoyRoute(move.unit, move.order.to, state, convoyContext, variant);
  });
}

function isMoveViaConvoy(
  move: NormalizedOrder & { order: MoveOrder },
  state: GameState,
  convoyContext: ConvoyContext,
  variant: VariantDefinition,
): boolean {
  return isMoveIntendedViaConvoy(move, convoyContext, variant) && hasConvoyRoute(move.unit, move.order.to, state, convoyContext, variant);
}

function isMoveIntendedViaConvoy(
  move: NormalizedOrder & { order: MoveOrder },
  convoyContext: ConvoyContext,
  variant: VariantDefinition,
): boolean {
  return (
    isConvoyableMove(move.unit, move.order.to, variant) &&
    (move.order.viaConvoy ||
      !areAdjacent(move.unit.type, move.unit.location, move.order.to, variant) ||
      hasOwnConvoyIntent(move, convoyContext, variant))
  );
}

function hasOwnConvoyIntent(
  move: NormalizedOrder & { order: MoveOrder },
  convoyContext: ConvoyContext,
  variant: VariantDefinition,
): boolean {
  const hasSingleForeignFleetRoute = convoyContext.convoyOrders.some((convoy) => {
    return (
      convoy.unit.power !== move.unit.power &&
      convoy.order.convoyedUnitId === move.unit.id &&
      convoy.order.to === move.order.to &&
      canSingleFleetConvoy(move.unit, move.order.to, convoy.unit.location, variant)
    );
  });

  return convoyContext.convoyOrders.some((convoy) => {
    if (convoy.unit.power !== move.unit.power || convoy.order.convoyedUnitId !== move.unit.id || convoy.order.to !== move.order.to) {
      return false;
    }

    return canSingleFleetConvoy(move.unit, move.order.to, convoy.unit.location, variant) || !hasSingleForeignFleetRoute;
  });
}

function canSingleFleetConvoy(unit: Unit, to: LocationId, fleetLocation: LocationId, variant: VariantDefinition): boolean {
  return canFleetReachProvince(fleetLocation, locationProvince(unit.location, variant), variant) && canFleetReachProvince(fleetLocation, locationProvince(to, variant), variant);
}

function hasConvoyRoute(
  unit: Unit,
  to: LocationId,
  state: GameState,
  convoyContext: ConvoyContext,
  variant: VariantDefinition,
): boolean {
  if (!isConvoyableMove(unit, to, variant)) {
    return false;
  }

  const convoyFleetLocations = new Set<LocationId>();
  for (const convoy of convoyContext.convoyOrders) {
    if (convoy.order.convoyedUnitId !== unit.id || convoy.order.to !== to || convoyContext.disruptedFleetIds.has(convoy.unit.id)) {
      continue;
    }

    convoyFleetLocations.add(convoy.unit.location);
  }

  if (convoyFleetLocations.size === 0) {
    return false;
  }

  const startProvince = locationProvince(unit.location, variant);
  const destinationProvince = locationProvince(to, variant);
  const queue = [...convoyFleetLocations].filter((location) => canFleetReachProvince(location, startProvince, variant));
  const visited = new Set<LocationId>(queue);

  for (let index = 0; index < queue.length; index += 1) {
    const fleetLocation = queue[index];
    if (canFleetReachProvince(fleetLocation, destinationProvince, variant)) {
      return true;
    }

    for (const next of adjacentLocations("fleet", fleetLocation, variant)) {
      if (!convoyFleetLocations.has(next) || visited.has(next)) {
        continue;
      }

      visited.add(next);
      queue.push(next);
    }
  }

  return false;
}

function isNecessaryConvoyFleet(
  unit: Unit,
  to: LocationId,
  fleetId: UnitId,
  state: GameState,
  convoyContext: ConvoyContext,
  variant: VariantDefinition,
): boolean {
  return (
    hasConvoyRoute(unit, to, state, convoyContext, variant) &&
    !hasConvoyRoute(unit, to, state, { ...convoyContext, disruptedFleetIds: new Set([...convoyContext.disruptedFleetIds, fleetId]) }, variant)
  );
}

function hasPotentialConvoyRoute(
  unit: Unit,
  to: LocationId,
  state: GameState,
  variant: VariantDefinition,
  excludedFleetLocation?: LocationId,
): boolean {
  if (!isConvoyableMove(unit, to, variant)) {
    return false;
  }

  const fleetLocations = new Set(
    state.units
      .filter((candidate) => candidate.type === "fleet")
      .map((fleet) => fleet.location),
  );
  if (excludedFleetLocation) {
    fleetLocations.delete(excludedFleetLocation);
  }
  const startProvince = locationProvince(unit.location, variant);
  const destinationProvince = locationProvince(to, variant);
  const queue = [...fleetLocations].filter((location) => canFleetReachProvince(location, startProvince, variant));
  const visited = new Set<LocationId>(queue);

  for (let index = 0; index < queue.length; index += 1) {
    const fleetLocation = queue[index];
    if (canFleetReachProvince(fleetLocation, destinationProvince, variant)) {
      return true;
    }

    for (const next of adjacentLocations("fleet", fleetLocation, variant)) {
      if (!fleetLocations.has(next) || visited.has(next)) {
        continue;
      }

      visited.add(next);
      queue.push(next);
    }
  }

  return false;
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
        const forcedDisbands = chooseCivilDisorderDisbands(
          nextUnits.filter((unit) => unit.power === power.id && !disbandedUnitIds.has(unit.id)),
          previousState,
          power.id,
          missingDisbands,
          variant,
        );

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

function chooseCivilDisorderDisbands(
  units: readonly Unit[],
  state: GameState,
  power: PowerId,
  count: number,
  variant: VariantDefinition,
): readonly Unit[] {
  const ownedSupplyCenters = new Set(
    variant.provinces
      .filter((province) => province.supplyCenter && state.supplyCenterOwners[province.id] === power)
      .map((province) => province.id),
  );
  const provinceGraph = buildProvinceGraph(variant);

  return [...units]
    .sort((left, right) => {
      const distanceComparison =
        civilDisorderDistance(right, ownedSupplyCenters, provinceGraph, variant) -
        civilDisorderDistance(left, ownedSupplyCenters, provinceGraph, variant);
      if (distanceComparison !== 0) {
        return distanceComparison;
      }

      if (left.type !== right.type) {
        return left.type === "fleet" ? -1 : 1;
      }

      const provinceNameComparison = provinceName(left.location, variant).localeCompare(provinceName(right.location, variant));
      return provinceNameComparison !== 0 ? provinceNameComparison : left.id.localeCompare(right.id);
    })
    .slice(0, count);
}

function civilDisorderDistance(
  unit: Unit,
  ownedSupplyCenters: ReadonlySet<ProvinceId>,
  provinceGraph: ReadonlyMap<ProvinceId, ReadonlySet<ProvinceId>>,
  variant: VariantDefinition,
): number {
  const start = locationProvince(unit.location, variant);
  if (ownedSupplyCenters.has(start)) {
    return 0;
  }

  const queue: { readonly province: ProvinceId; readonly distance: number }[] = [{ province: start, distance: 0 }];
  const visited = new Set<ProvinceId>([start]);

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const next of provinceGraph.get(current.province) ?? []) {
      if (visited.has(next)) {
        continue;
      }

      const distance = current.distance + 1;
      if (ownedSupplyCenters.has(next)) {
        return distance;
      }

      visited.add(next);
      queue.push({ province: next, distance });
    }
  }

  return Number.POSITIVE_INFINITY;
}

function buildProvinceGraph(variant: VariantDefinition): ReadonlyMap<ProvinceId, ReadonlySet<ProvinceId>> {
  const graph = new Map<ProvinceId, Set<ProvinceId>>();

  for (const location of variant.locations) {
    const fromProvince = location.province;
    const neighbors = graph.get(fromProvince) ?? new Set<ProvinceId>();
    graph.set(fromProvince, neighbors);

    for (const adjacency of variant.adjacency[location.id] ?? []) {
      const toProvince = locationProvince(adjacency.to, variant);
      if (toProvince === fromProvince) {
        continue;
      }

      neighbors.add(toProvince);
      const reverseNeighbors = graph.get(toProvince) ?? new Set<ProvinceId>();
      reverseNeighbors.add(fromProvince);
      graph.set(toProvince, reverseNeighbors);
    }
  }

  return graph;
}

function provinceName(location: LocationId, variant: VariantDefinition): string {
  const province = locationProvince(location, variant);
  return variant.provinces.find((candidate) => candidate.id === province)?.name ?? province;
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
  state: GameState,
  convoyContext: ConvoyContext,
  variant: VariantDefinition,
): Set<OrderId> {
  const cutSupportOrderIds = new Set<OrderId>();

  for (const support of supports) {
    for (const move of moves) {
      if (move.unit.power === support.unit.power && !isMoveViaConvoy(move, state, convoyContext, variant)) {
        continue;
      }

      if (locationProvince(move.order.to, variant) !== locationProvince(support.unit.location, variant)) {
        continue;
      }

      const supportTarget = support.order.to ?? support.unit.location;
      if (locationProvince(move.unit.location, variant) === locationProvince(supportTarget, variant)) {
        continue;
      }

      if (isParadoxicalConvoySupportCut(move, support, supports, state, convoyContext, variant)) {
        continue;
      }

      cutSupportOrderIds.add(support.order.id);
    }
  }

  return cutSupportOrderIds;
}

function findOwnConvoySupportCutOrderIds(
  moves: readonly (NormalizedOrder & { order: MoveOrder })[],
  supports: readonly (NormalizedOrder & { order: SupportOrder })[],
  state: GameState,
  convoyContext: ConvoyContext,
  variant: VariantDefinition,
): ReadonlySet<OrderId> {
  const cutSupportOrderIds = new Set<OrderId>();

  for (const move of moves) {
    if (!isMoveIntendedViaConvoy(move, convoyContext, variant)) {
      continue;
    }

    for (const support of supports) {
      if (move.unit.power !== support.unit.power) {
        continue;
      }

      if (locationProvince(move.order.to, variant) !== locationProvince(support.unit.location, variant)) {
        continue;
      }

      const supportedUnit = state.units.find((candidate) => candidate.id === support.order.supportedUnitId);
      const supportTarget = support.order.to ?? supportedUnit?.location;
      if (supportTarget && locationProvince(move.unit.location, variant) === locationProvince(supportTarget, variant)) {
        continue;
      }

      cutSupportOrderIds.add(support.order.id);
    }
  }

  return cutSupportOrderIds;
}

function isParadoxicalConvoySupportCut(
  move: NormalizedOrder & { order: MoveOrder },
  support: NormalizedOrder & { order: SupportOrder },
  supports: readonly (NormalizedOrder & { order: SupportOrder })[],
  state: GameState,
  convoyContext: ConvoyContext,
  variant: VariantDefinition,
): boolean {
  if (!isMoveViaConvoy(move, state, convoyContext, variant)) {
    return false;
  }

  if (move.unit.power === support.unit.power) {
    return false;
  }

  const supportedUnit = state.units.find((candidate) => candidate.id === support.order.supportedUnitId);
  if (!supportedUnit) {
    return false;
  }

  const supportTarget = support.order.to ?? supportedUnit.location;
  const supportTargetProvince = locationProvince(supportTarget, variant);
  const necessaryConvoyFleet = convoyContext.convoyOrders.find((convoy) => {
    const convoyedMove = state.units.find((unit) => unit.id === convoy.order.convoyedUnitId);
    if (
      !convoyedMove ||
      locationProvince(convoy.unit.location, variant) !== supportTargetProvince ||
      !isNecessaryConvoyFleet(convoyedMove, convoy.order.to, convoy.unit.id, state, convoyContext, variant)
    ) {
      return false;
    }

    if (convoyedMove.id === move.unit.id && convoy.order.to === move.order.to) {
      return true;
    }

    return hasReciprocalConvoyDependency(move, convoyedMove, convoy.order.to, supports, state, convoyContext, variant);
  });

  return Boolean(necessaryConvoyFleet);
}

function hasReciprocalConvoyDependency(
  move: NormalizedOrder & { order: MoveOrder },
  protectedConvoyedUnit: Unit,
  protectedConvoyDestination: LocationId,
  supports: readonly (NormalizedOrder & { order: SupportOrder })[],
  state: GameState,
  convoyContext: ConvoyContext,
  variant: VariantDefinition,
): boolean {
  const protectedMove = { unit: protectedConvoyedUnit, order: { id: "dependency" as OrderId, type: "move" as const, unitId: protectedConvoyedUnit.id, to: protectedConvoyDestination } };
  const moveConvoyFleetProvinces = new Set(
    convoyContext.convoyOrders
      .filter((convoy) => {
        return (
          convoy.order.convoyedUnitId === move.unit.id &&
          convoy.order.to === move.order.to &&
          isNecessaryConvoyFleet(move.unit, move.order.to, convoy.unit.id, state, convoyContext, variant)
        );
      })
      .map((convoy) => locationProvince(convoy.unit.location, variant)),
  );

  if (moveConvoyFleetProvinces.size === 0) {
    return false;
  }

  return supports.some((support) => {
    const supportedUnit = state.units.find((candidate) => candidate.id === support.order.supportedUnitId);
    const supportTarget = support.order.to ?? supportedUnit?.location;
    return (
      locationProvince(protectedMove.order.to, variant) === locationProvince(support.unit.location, variant) &&
      supportTarget !== undefined &&
      moveConvoyFleetProvinces.has(locationProvince(supportTarget, variant))
    );
  });
}

function findParadoxicalConvoyMoveIds(
  moves: readonly (NormalizedOrder & { order: MoveOrder })[],
  supports: readonly (NormalizedOrder & { order: SupportOrder })[],
  state: GameState,
  convoyContext: ConvoyContext,
  variant: VariantDefinition,
): ReadonlySet<UnitId> {
  const paradoxicalMoveIds = new Set<UnitId>();

  for (const move of moves) {
    if (!isMoveViaConvoy(move, state, convoyContext, variant)) {
      continue;
    }

    for (const support of supports) {
      if (locationProvince(move.order.to, variant) !== locationProvince(support.unit.location, variant)) {
        continue;
      }

      if (isParadoxicalConvoySupportCut(move, support, supports, state, convoyContext, variant)) {
        paradoxicalMoveIds.add(move.unit.id);
      }
    }
  }

  return paradoxicalMoveIds;
}

function countSupportPowers(
  moveOrder: MoveOrder,
  movingUnit: Unit,
  supports: readonly (NormalizedOrder & { order: SupportOrder })[],
  cutSupportOrderIds: ReadonlySet<OrderId>,
  state: GameState,
  variant: VariantDefinition,
): ReadonlyMap<PowerId, number> {
  const supportPowerCounts = new Map<PowerId, number>();

  for (const support of supports) {
    if (cutSupportOrderIds.has(support.order.id)) {
      continue;
    }

    if (support.order.supportedUnitId !== movingUnit.id || support.order.to !== moveOrder.to) {
      continue;
    }

    const targetProvince = locationProvince(moveOrder.to, variant);
    const targetOccupant = state.units.find((unit) => locationProvince(unit.location, variant) === targetProvince);
    if (targetOccupant?.power === movingUnit.power) {
      continue;
    }

    supportPowerCounts.set(support.unit.power, (supportPowerCounts.get(support.unit.power) ?? 0) + 1);
  }

  return supportPowerCounts;
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
        from: attack.viaConvoy ? attack.to : attack.from,
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
  if (occupantAttack?.to === attack.from && !attack.viaConvoy && !occupantAttack.viaConvoy) {
    return canDislodge(attack, occupant, destinationAttacks) && dislodgementStrength(attack, occupant) > occupantAttack.strength;
  }

  if (occupant.power === attack.unit.power) {
    return occupantAttack ? doesAttackVacate(occupantAttack, context, resolvingUnitIds) : false;
  }

  if (occupantAttack && doesAttackVacate(occupantAttack, context, resolvingUnitIds)) {
    return true;
  }

  return canDislodge(attack, occupant, destinationAttacks) && dislodgementStrength(attack, occupant) > (context.defenseStrengthByUnitId.get(occupant.id) ?? 1);
}

function dislodgementStrength(attack: Attack, defender: Unit): number {
  return attack.strength - (attack.supportPowerCounts.get(defender.power) ?? 0);
}

function canDislodge(attack: Attack, defender: Unit, destinationAttacks: readonly Attack[]): boolean {
  const strength = dislodgementStrength(attack, defender);
  return destinationAttacks.every((candidate) => candidate === attack || strength > candidate.strength);
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

function isConvoyableMove(unit: Unit, to: LocationId, variant: VariantDefinition): boolean {
  if (unit.type !== "army") {
    return false;
  }

  const fromProvinceId = locationProvince(unit.location, variant);
  const toProvinceId = locationProvince(to, variant);
  if (fromProvinceId === toProvinceId) {
    return false;
  }

  const fromProvince = variant.provinces.find((province) => province.id === fromProvinceId);
  const toProvince = variant.provinces.find((province) => province.id === toProvinceId);
  return fromProvince?.type === "coastal" && toProvince?.type === "coastal";
}

function canFleetReachProvince(from: LocationId, province: ProvinceId, variant: VariantDefinition): boolean {
  return adjacentLocations("fleet", from, variant).some((location) => locationProvince(location, variant) === province);
}

function canSupportProvince(unitType: Unit["type"], from: LocationId, target: LocationId, variant: VariantDefinition): boolean {
  const targetProvince = locationProvince(target, variant);
  return adjacentLocations(unitType, from, variant).some((location) => locationProvince(location, variant) === targetProvince);
}

function adjacentLocations(unitType: Unit["type"], from: LocationId, variant: VariantDefinition): readonly LocationId[] {
  return variant.adjacency[from]?.filter((adjacency) => adjacency.unitTypes.includes(unitType)).map((adjacency) => adjacency.to) ?? [];
}

function canUnitOccupy(unitType: Unit["type"], locationId: LocationId, variant: VariantDefinition): boolean {
  return locationDefinition(locationId, variant)?.unitTypes.includes(unitType) ?? false;
}

function locationDefinition(locationId: LocationId, variant: VariantDefinition) {
  return variant.locations.find((candidate) => candidate.id === locationId);
}

function locationProvince(locationId: LocationId, variant: VariantDefinition): ProvinceId {
  const location = locationDefinition(locationId, variant);
  if (!location) {
    throw new Error(`Unknown location ${locationId}.`);
  }

  return location.province;
}

function invalid(order: Order, reason: string): OrderResult {
  return { order, status: "invalid", reason };
}
