export function createOrderOptions(context) {
  function legalDestinations(unit) {
    return (context.variant.adjacency[unit.location] ?? [])
      .filter((adjacency) => adjacency.unitTypes.includes(unit.type))
      .map((adjacency) => context.locationById.get(adjacency.to))
      .filter(Boolean)
      .sort((left, right) => context.destinationLabel(left).localeCompare(context.destinationLabel(right)));
  }

  function normalizedDraftForUnit(unit, draft) {
    if (!draft) {
      return { type: "hold" };
    }

    if (draft.type === "move") {
      const destinations = legalDestinations(unit);
      const to = destinations.some((location) => location.id === draft.to) ? draft.to : destinations[0]?.id;
      return to ? { type: "move", to } : { type: "hold" };
    }

    if (draft.type === "move-via-convoy") {
      const destinations = convoyDestinationsForArmy(unit);
      const to = destinations.some((location) => location.id === draft.to) ? draft.to : destinations[0]?.id;
      return to ? { type: "move-via-convoy", to } : { type: "hold" };
    }

    if (draft.type === "convoy") {
      const convoyOptions = convoyOptionsForFleet(unit);
      const selectedOption = convoyOptions.find((candidate) => candidate.army.id === draft.convoyedUnitId) ?? convoyOptions[0];
      const destinations = selectedOption?.destinations ?? [];
      const to = destinations.some((location) => location.id === draft.to) ? draft.to : destinations[0]?.id;
      if (selectedOption && to) {
        return { type: "convoy", convoyedUnitId: selectedOption.army.id, to };
      }
    }

    if (draft.type === "support") {
      const supportOptions = supportOptionsForUnit(unit);
      const selectedOption = supportOptions.find((candidate) => candidate.unit.id === draft.supportedUnitId) ?? supportOptions[0];
      const supportTargets = selectedOption?.targets ?? [];
      const target = supportTargets.find((candidate) => targetValue(candidate) === targetValue(draft))
        ?? defaultSupportTarget(selectedOption?.unit, supportTargets);
      if (selectedOption && target) {
        return supportDraft(selectedOption.unit, target);
      }
    }

    return { type: "hold" };
  }

  function defaultDraftForAction(unit, action) {
    if (action === "move") {
      const destination = legalDestinations(unit)[0];
      return destination ? { type: "move", to: destination.id } : { type: "hold" };
    }

    if (action === "move-via-convoy") {
      const destination = convoyDestinationsForArmy(unit)[0];
      return destination ? { type: "move-via-convoy", to: destination.id } : { type: "hold" };
    }

    if (action === "convoy") {
      const convoyOption = convoyOptionsForFleet(unit)[0];
      const destination = convoyOption?.destinations[0];
      if (convoyOption && destination) {
        context.draftOrders.set(convoyOption.army.id, { type: "move-via-convoy", to: destination.id });
        return { type: "convoy", convoyedUnitId: convoyOption.army.id, to: destination.id };
      }
    }

    if (action === "support") {
      const supportOption = supportOptionsForUnit(unit)[0];
      const target = defaultSupportTarget(supportOption?.unit, supportOption?.targets ?? []);
      alignSupportedUnitDraft(supportOption?.unit, target);
      return supportDraft(supportOption?.unit, target);
    }

    return { type: "hold" };
  }

  function supportOptionsForUnit(unit) {
    return context.sortedUnits(context.state.units)
      .filter((candidate) => candidate.id !== unit.id)
      .map((candidate) => ({
        unit: candidate,
        targets: supportTargetsForUnit(unit, candidate),
      }))
      .filter((candidate) => candidate.targets.length > 0);
  }

  function supportTargetsForUnit(supportingUnit, supportedUnit) {
    const targets = [];

    if (canSupportProvince(supportingUnit.type, supportingUnit.location, supportedUnit.location)) {
      targets.push({ label: "Hold" });
    }

    for (const location of supportMoveDestinations(supportedUnit)) {
      if (canSupportProvince(supportingUnit.type, supportingUnit.location, location.id)) {
        targets.push({ label: context.destinationLabel(location), to: location.id });
      }
    }

    return targets;
  }

  function supportMoveDestinations(unit) {
    const destinations = new Map();
    for (const location of [...legalDestinations(unit), ...convoyDestinationsForArmy(unit)]) {
      destinations.set(location.id, location);
    }

    return [...destinations.values()].sort((left, right) => context.destinationLabel(left).localeCompare(context.destinationLabel(right)));
  }

  function defaultSupportTarget(supportedUnit, targets) {
    const plannedDestination = supportedUnit ? plannedMoveDestination(supportedUnit) : undefined;
    return targets.find((target) => target.to === plannedDestination)
      ?? targets.find((target) => !target.to)
      ?? targets[0];
  }

  function plannedMoveDestination(unit) {
    const draft = context.draftOrders.get(unit.id);
    if (draft?.type === "move" && legalDestinations(unit).some((location) => location.id === draft.to)) {
      return draft.to;
    }

    if (draft?.type === "move-via-convoy" && convoyDestinationsForArmy(unit).some((location) => location.id === draft.to)) {
      return draft.to;
    }

    return undefined;
  }

  function supportDraft(supportedUnit, target) {
    if (!supportedUnit || !target) {
      return { type: "hold" };
    }

    return target.to
      ? { type: "support", supportedUnitId: supportedUnit.id, to: target.to }
      : { type: "support", supportedUnitId: supportedUnit.id };
  }

  function alignSupportedUnitDraft(supportedUnit, target) {
    if (!supportedUnit || !target) {
      return;
    }

    context.draftOrders.set(supportedUnit.id, target.to ? movementDraftForDestination(supportedUnit, target.to) : { type: "hold" });
  }

  function movementDraftForDestination(unit, to) {
    const canMoveDirectly = legalDestinations(unit).some((location) => location.id === to);
    const canMoveViaConvoy = convoyDestinationsForArmy(unit).some((location) => location.id === to);
    const currentDraft = context.draftOrders.get(unit.id);

    if (currentDraft?.type === "move-via-convoy" && canMoveViaConvoy) {
      return { type: "move-via-convoy", to };
    }

    if (canMoveDirectly) {
      return { type: "move", to };
    }

    if (canMoveViaConvoy) {
      return { type: "move-via-convoy", to };
    }

    return { type: "hold" };
  }

  function targetValue(target) {
    return target?.to ? `move:${target.to}` : "hold";
  }

  function convoyOptionsForFleet(unit) {
    if (!isSeaFleet(unit)) {
      return [];
    }

    return context.sortedUnits(context.state.units)
      .filter((candidate) => candidate.type === "army")
      .map((army) => ({
        army,
        destinations: convoyDestinationsForArmy(army, { requiredFleetLocation: unit.location }),
      }))
      .filter((option) => option.destinations.length > 0);
  }

  function convoyDestinationsForArmy(unit, options = {}) {
    if (unit.type !== "army") {
      return [];
    }

    return context.variant.locations
      .filter((location) => location.unitTypes.includes("army"))
      .filter((location) => isConvoyableMove(unit, location.id))
      .filter((location) => hasPotentialSeaConvoyRoute(unit, location.id, options))
      .sort((left, right) => context.destinationLabel(left).localeCompare(context.destinationLabel(right)));
  }

  function hasPotentialSeaConvoyRoute(unit, to, options = {}) {
    if (!isConvoyableMove(unit, to)) {
      return false;
    }

    const fleetLocations = new Set(
      context.state.units
        .filter(isSeaFleet)
        .map((fleet) => fleet.location)
        .filter((location) => location !== options.excludedFleetLocation),
    );

    if (options.requiredFleetLocation) {
      if (!fleetLocations.has(options.requiredFleetLocation)) {
        return false;
      }

      const component = connectedSeaFleetLocations(options.requiredFleetLocation, fleetLocations);
      return hasFleetReach(component, context.locationProvince(unit.location)) && hasFleetReach(component, context.locationProvince(to));
    }

    const startProvince = context.locationProvince(unit.location);
    const destinationProvince = context.locationProvince(to);
    const queue = [...fleetLocations].filter((location) => canFleetReachProvince(location, startProvince));
    const visited = new Set(queue);

    for (let index = 0; index < queue.length; index += 1) {
      const fleetLocation = queue[index];
      if (canFleetReachProvince(fleetLocation, destinationProvince)) {
        return true;
      }

      for (const next of adjacentLocations("fleet", fleetLocation)) {
        if (!fleetLocations.has(next) || visited.has(next)) {
          continue;
        }

        visited.add(next);
        queue.push(next);
      }
    }

    return false;
  }

  function connectedSeaFleetLocations(start, fleetLocations) {
    const queue = [start];
    const visited = new Set(queue);

    for (let index = 0; index < queue.length; index += 1) {
      for (const next of adjacentLocations("fleet", queue[index])) {
        if (!fleetLocations.has(next) || visited.has(next)) {
          continue;
        }

        visited.add(next);
        queue.push(next);
      }
    }

    return visited;
  }

  function hasFleetReach(fleetLocations, provinceId) {
    return [...fleetLocations].some((location) => canFleetReachProvince(location, provinceId));
  }

  function isSeaFleet(unit) {
    return unit.type === "fleet" && context.locationById.get(unit.location)?.type === "sea";
  }

  function isConvoyableMove(unit, to) {
    if (unit.type !== "army") {
      return false;
    }

    const fromProvince = context.provinceById.get(context.locationProvince(unit.location));
    const toProvince = context.provinceById.get(context.locationProvince(to));
    return fromProvince?.id !== toProvince?.id && fromProvince?.type === "coastal" && toProvince?.type === "coastal";
  }

  function canFleetReachProvince(from, provinceId) {
    return adjacentLocations("fleet", from).some((location) => context.locationProvince(location) === provinceId);
  }

  function canSupportProvince(unitType, from, target) {
    const targetProvince = context.locationProvince(target);
    return adjacentLocations(unitType, from).some((location) => context.locationProvince(location) === targetProvince);
  }

  function adjacentLocations(unitType, from) {
    return (context.variant.adjacency[from] ?? [])
      .filter((adjacency) => adjacency.unitTypes.includes(unitType))
      .map((adjacency) => adjacency.to);
  }

  return {
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
  };
}
