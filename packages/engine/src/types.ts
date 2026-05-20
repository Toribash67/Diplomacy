export type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type ProvinceId = Brand<string, "ProvinceId">;
export type LocationId = Brand<string, "LocationId">;
export type PowerId = Brand<string, "PowerId">;
export type UnitId = Brand<string, "UnitId">;
export type OrderId = Brand<string, "OrderId">;

export type UnitType = "army" | "fleet";
export type ProvinceType = "land" | "sea" | "coastal";
export type LocationType = "land" | "sea" | "coast";
export type Season = "spring" | "fall" | "winter";
export type PhaseType = "movement" | "retreat" | "build";

export interface Phase {
  readonly year: number;
  readonly season: Season;
  readonly type: PhaseType;
}

export interface Province {
  readonly id: ProvinceId;
  readonly name: string;
  readonly type: ProvinceType;
  readonly supplyCenter?: {
    readonly owner?: PowerId;
    readonly homePower?: PowerId;
  };
}

export interface Location {
  readonly id: LocationId;
  readonly province: ProvinceId;
  readonly name: string;
  readonly type: LocationType;
  readonly unitTypes: readonly UnitType[];
}

export interface Power {
  readonly id: PowerId;
  readonly name: string;
}

export interface Adjacency {
  readonly to: LocationId;
  readonly unitTypes: readonly UnitType[];
}

export interface VariantDefinition {
  readonly id: string;
  readonly name: string;
  readonly powers: readonly Power[];
  readonly provinces: readonly Province[];
  readonly locations: readonly Location[];
  readonly adjacency: Readonly<Record<LocationId, readonly Adjacency[]>>;
  readonly initialState: GameState;
}

export interface Unit {
  readonly id: UnitId;
  readonly power: PowerId;
  readonly type: UnitType;
  readonly location: LocationId;
}

export interface GameState {
  readonly phase: Phase;
  readonly units: readonly Unit[];
  readonly supplyCenterOwners: Readonly<Record<ProvinceId, PowerId | undefined>>;
  readonly retreats?: readonly PendingRetreat[];
}

export type HoldOrder = {
  readonly id: OrderId;
  readonly type: "hold";
  readonly unitId: UnitId;
};

export type MoveOrder = {
  readonly id: OrderId;
  readonly type: "move";
  readonly unitId: UnitId;
  readonly to: LocationId;
};

export type SupportOrder = {
  readonly id: OrderId;
  readonly type: "support";
  readonly unitId: UnitId;
  readonly supportedUnitId: UnitId;
  readonly to?: LocationId;
};

export type RetreatOrder = {
  readonly id: OrderId;
  readonly type: "retreat";
  readonly unitId: UnitId;
  readonly to: LocationId;
};

export type DisbandOrder = {
  readonly id: OrderId;
  readonly type: "disband";
  readonly unitId: UnitId;
};

export type Order = HoldOrder | MoveOrder | SupportOrder | RetreatOrder | DisbandOrder;

export type OrderStatus = "succeeds" | "fails" | "invalid";

export interface OrderResult {
  readonly order: Order;
  readonly status: OrderStatus;
  readonly reason: string;
}

export interface Dislodgement {
  readonly unit: Unit;
  readonly attacker: Unit;
  readonly from: LocationId;
}

export interface PendingRetreat {
  readonly unit: Unit;
  readonly from: LocationId;
  readonly attackOrigin: LocationId;
  readonly options: readonly LocationId[];
}

export interface AdjudicationResult {
  readonly nextState: GameState;
  readonly orderResults: Readonly<Record<OrderId, OrderResult>>;
  readonly dislodgedUnits: readonly Dislodgement[];
  readonly retreats: readonly PendingRetreat[];
  readonly invalidOrders: readonly OrderResult[];
}

export interface VariantValidationIssue {
  readonly path: string;
  readonly message: string;
}

export interface VariantValidationResult {
  readonly valid: boolean;
  readonly issues: readonly VariantValidationIssue[];
}

export const provinceId = (value: string): ProvinceId => value as ProvinceId;
export const locationId = (value: string): LocationId => value as LocationId;
export const powerId = (value: string): PowerId => value as PowerId;
export const unitId = (value: string): UnitId => value as UnitId;
export const orderId = (value: string): OrderId => value as OrderId;
