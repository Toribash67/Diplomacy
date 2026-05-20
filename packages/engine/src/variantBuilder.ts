import type { Adjacency, LocationId, UnitType } from "./types.js";

export type AdjacencyMap = Readonly<Record<LocationId, readonly Adjacency[]>>;

export interface Edge {
  readonly from: LocationId;
  readonly to: LocationId;
  readonly unitTypes: readonly UnitType[];
}

export function edge(from: LocationId, to: LocationId, unitTypes: readonly UnitType[] = ["army", "fleet"]): Edge {
  return { from, to, unitTypes };
}

export function twoWayEdge(left: LocationId, right: LocationId, unitTypes: readonly UnitType[] = ["army", "fleet"]): readonly Edge[] {
  return [
    edge(left, right, unitTypes),
    edge(right, left, unitTypes),
  ];
}

export function buildAdjacency(
  locations: readonly LocationId[],
  edges: readonly Edge[],
): AdjacencyMap {
  const adjacency = new Map<LocationId, Adjacency[]>();

  for (const location of locations) {
    adjacency.set(location, []);
  }

  for (const { from, to, unitTypes } of edges) {
    const destinations = adjacency.get(from) ?? [];
    const existingDestination = destinations.find((destination) => destination.to === to);
    if (existingDestination) {
      const mergedUnitTypes = [...new Set([...existingDestination.unitTypes, ...unitTypes])];
      destinations.splice(destinations.indexOf(existingDestination), 1, { to, unitTypes: mergedUnitTypes });
    } else {
      destinations.push({ to, unitTypes });
    }
    adjacency.set(from, destinations);
  }

  return Object.fromEntries(adjacency) as Record<LocationId, readonly Adjacency[]>;
}

export function buildSymmetricAdjacency(
  locations: readonly LocationId[],
  pairs: readonly (readonly [LocationId, LocationId] | readonly [LocationId, LocationId, readonly UnitType[]])[],
): AdjacencyMap {
  return buildAdjacency(
    locations,
    pairs.flatMap(([left, right, unitTypes]) => twoWayEdge(left, right, unitTypes)),
  );
}
