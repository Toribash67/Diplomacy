import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adjudicate } from "./adjudicate.js";
import { locationId, orderId, provinceId, unitId, type GameState, type PendingRetreat, type Unit, type VariantDefinition } from "./types.js";
import { testLocations, testPowers, testProvinces, testUnits, testVariant } from "./variants/testVariant.js";

describe("adjudicate", () => {
  it("bounces equally strong attacks into the same province", () => {
    const result = adjudicate(
      testVariant.initialState,
      [
        { id: orderId("red-move"), type: "move", unitId: testUnits.redArmy, to: testLocations.delta },
        { id: orderId("blue-move"), type: "move", unitId: testUnits.blueArmy, to: testLocations.delta },
      ],
      testVariant,
    );

    assert.equal(unitLocation(result.nextState, testUnits.redArmy), testLocations.alpha);
    assert.equal(unitLocation(result.nextState, testUnits.blueArmy), testLocations.bravo);
    assert.equal(result.orderResults[orderId("red-move")].status, "fails");
    assert.equal(result.orderResults[orderId("blue-move")].status, "fails");
  });

  it("uses support to dislodge an opposing defender", () => {
    const result = adjudicate(
      testVariant.initialState,
      [
        { id: orderId("red-move"), type: "move", unitId: testUnits.redArmy, to: testLocations.bravo },
        {
          id: orderId("green-support"),
          type: "support",
          unitId: testUnits.greenArmy,
          supportedUnitId: testUnits.redArmy,
          to: testLocations.bravo,
        },
      ],
      testVariant,
    );

    assert.equal(unitLocation(result.nextState, testUnits.redArmy), testLocations.bravo);
    assert.equal(hasUnit(result.nextState, testUnits.blueArmy), false);
    assert.equal(result.dislodgedUnits.length, 1);
    assert.equal(result.dislodgedUnits[0].unit.id, testUnits.blueArmy);
    assert.equal(result.nextState.phase.type, "retreat");
    assert.deepEqual(result.retreats.map((retreat) => retreat.options), [[testLocations.delta]]);
    assert.equal(result.orderResults[orderId("red-move")].status, "succeeds");
    assert.equal(result.orderResults[orderId("green-support")].status, "succeeds");
  });

  it("advances to fall movement when spring movement has no retreats", () => {
    const result = adjudicate(
      testVariant.initialState,
      [{ id: orderId("red-move"), type: "move", unitId: testUnits.redArmy, to: testLocations.delta }],
      testVariant,
    );

    assert.deepEqual(result.nextState.phase, { year: 1901, season: "fall", type: "movement" });
    assert.deepEqual(result.retreats, []);
  });

  it("does not update supply center ownership after spring movement", () => {
    const result = adjudicate(
      testVariant.initialState,
      [
        { id: orderId("red-move"), type: "move", unitId: testUnits.redArmy, to: testLocations.bravo },
        { id: orderId("blue-move"), type: "move", unitId: testUnits.blueArmy, to: testLocations.delta },
      ],
      testVariant,
    );

    assert.equal(unitLocation(result.nextState, testUnits.redArmy), testLocations.bravo);
    assert.equal(result.nextState.supplyCenterOwners[testProvinces.bravo], testPowers.blue);
  });

  it("updates occupied supply center ownership after fall movement", () => {
    const fallState: GameState = {
      ...testVariant.initialState,
      phase: { year: 1901, season: "fall", type: "movement" },
      units: [
        { id: testUnits.redArmy, power: testPowers.red, type: "army", location: testLocations.alpha },
        { id: testUnits.blueArmy, power: testPowers.blue, type: "army", location: testLocations.delta },
        { id: testUnits.greenArmy, power: testPowers.green, type: "army", location: testLocations.charlie },
      ],
    };

    const result = adjudicate(
      fallState,
      [{ id: orderId("red-move"), type: "move", unitId: testUnits.redArmy, to: testLocations.bravo }],
      testVariant,
    );

    assert.deepEqual(result.nextState.phase, { year: 1901, season: "winter", type: "build" });
    assert.equal(result.nextState.supplyCenterOwners[testProvinces.bravo], testPowers.red);
    assert.equal(result.nextState.supplyCenterOwners[testProvinces.alpha], testPowers.red);
    assert.equal(result.nextState.supplyCenterOwners[testProvinces.delta], undefined);
  });

  it("updates supply center ownership after fall retreats resolve", () => {
    const fallRetreatState = createRetreatState(
      [retreat(testVariant.initialState.units[1], testLocations.alpha, [testLocations.charlie])],
      { year: 1901, season: "fall", type: "retreat" },
      [{ id: testUnits.redArmy, power: testPowers.red, type: "army", location: testLocations.bravo }],
    );

    const result = adjudicate(
      fallRetreatState,
      [{ id: orderId("blue-retreat"), type: "retreat", unitId: testUnits.blueArmy, to: testLocations.charlie }],
      testVariant,
    );

    assert.deepEqual(result.nextState.phase, { year: 1901, season: "winter", type: "build" });
    assert.equal(result.nextState.supplyCenterOwners[testProvinces.bravo], testPowers.red);
    assert.equal(result.nextState.supplyCenterOwners[testProvinces.charlie], testPowers.blue);
  });

  it("builds units in open owned home supply centers", () => {
    const buildState = createBuildState({
      supplyCenterOwners: {
        ...testVariant.initialState.supplyCenterOwners,
        [testProvinces.bravo]: testPowers.red,
      },
      units: [
        { id: testUnits.redArmy, power: testPowers.red, type: "army", location: testLocations.delta },
        { id: testUnits.greenArmy, power: testPowers.green, type: "army", location: testLocations.charlie },
      ],
    });

    const result = adjudicate(
      buildState,
      [
        {
          id: orderId("red-build"),
          type: "build",
          power: testPowers.red,
          unitId: unitId("red-2"),
          unitType: "army",
          location: testLocations.alpha,
        },
      ],
      testVariant,
    );

    assert.deepEqual(result.nextState.phase, { year: 1902, season: "spring", type: "movement" });
    assert.equal(unitLocation(result.nextState, unitId("red-2")), testLocations.alpha);
    assert.equal(result.orderResults[orderId("red-build")].status, "succeeds");
  });

  it("rejects builds outside open owned home supply centers", () => {
    const buildState = createBuildState({
      supplyCenterOwners: {
        ...testVariant.initialState.supplyCenterOwners,
        [testProvinces.bravo]: testPowers.red,
      },
      units: [{ id: testUnits.redArmy, power: testPowers.red, type: "army", location: testLocations.delta }],
    });

    const result = adjudicate(
      buildState,
      [
        {
          id: orderId("red-build-bravo"),
          type: "build",
          power: testPowers.red,
          unitId: unitId("red-2"),
          unitType: "army",
          location: testLocations.bravo,
        },
        {
          id: orderId("red-build-alpha"),
          type: "build",
          power: testPowers.red,
          unitId: unitId("red-3"),
          unitType: "army",
          location: testLocations.alpha,
        },
      ],
      testVariant,
    );

    assert.equal(result.orderResults[orderId("red-build-bravo")].status, "invalid");
    assert.equal(result.orderResults[orderId("red-build-bravo")].reason, "Build location is not a home supply center for that power.");
    assert.equal(result.orderResults[orderId("red-build-alpha")].status, "succeeds");
    assert.equal(hasUnit(result.nextState, unitId("red-2")), false);
    assert.equal(hasUnit(result.nextState, unitId("red-3")), true);
  });

  it("disbands ordered units when a power has too few supply centers", () => {
    const buildState = createBuildState({
      supplyCenterOwners: {
        [testProvinces.alpha]: testPowers.red,
        [testProvinces.bravo]: testPowers.blue,
        [testProvinces.charlie]: testPowers.green,
        [testProvinces.delta]: undefined,
        [testProvinces.echo]: undefined,
      },
      units: [
        { id: testUnits.redArmy, power: testPowers.red, type: "army", location: testLocations.alpha },
        { id: unitId("red-2"), power: testPowers.red, type: "army", location: testLocations.delta },
        { id: testUnits.blueArmy, power: testPowers.blue, type: "army", location: testLocations.bravo },
        { id: testUnits.greenArmy, power: testPowers.green, type: "army", location: testLocations.charlie },
      ],
    });

    const result = adjudicate(
      buildState,
      [{ id: orderId("red-disband"), type: "disband", unitId: unitId("red-2") }],
      testVariant,
    );

    assert.equal(hasUnit(result.nextState, unitId("red-2")), false);
    assert.equal(hasUnit(result.nextState, testUnits.redArmy), true);
    assert.equal(result.orderResults[orderId("red-disband")].status, "succeeds");
  });

  it("automatically disbands missing required disbands", () => {
    const buildState = createBuildState({
      units: [
        { id: testUnits.redArmy, power: testPowers.red, type: "army", location: testLocations.alpha },
        { id: unitId("red-2"), power: testPowers.red, type: "army", location: testLocations.delta },
        { id: testUnits.blueArmy, power: testPowers.blue, type: "army", location: testLocations.bravo },
        { id: testUnits.greenArmy, power: testPowers.green, type: "army", location: testLocations.charlie },
      ],
    });

    const result = adjudicate(buildState, [], testVariant);

    assert.equal(hasUnit(result.nextState, testUnits.redArmy), false);
    assert.equal(hasUnit(result.nextState, unitId("red-2")), true);
    assert.equal(result.orderResults[orderId(`forced-disband:${testUnits.redArmy}`)].status, "succeeds");
  });

  it("cuts support when the supporter is attacked from another province", () => {
    const state: GameState = {
      ...testVariant.initialState,
      units: [
        { ...testVariant.initialState.units[0], location: testLocations.alpha },
        { ...testVariant.initialState.units[1], location: testLocations.bravo },
        { ...testVariant.initialState.units[2], location: testLocations.charlie },
        {
          id: unitId("blue-2"),
          power: testVariant.initialState.units[1].power,
          type: "army",
          location: testLocations.echo,
        },
      ],
    };

    const result = adjudicate(
      state,
      [
        { id: orderId("red-move"), type: "move", unitId: testUnits.redArmy, to: testLocations.bravo },
        {
          id: orderId("green-support"),
          type: "support",
          unitId: testUnits.greenArmy,
          supportedUnitId: testUnits.redArmy,
          to: testLocations.bravo,
        },
        { id: orderId("blue-move"), type: "move", unitId: unitId("blue-2"), to: testLocations.charlie },
      ],
      testVariant,
    );

    assert.equal(unitLocation(result.nextState, testUnits.redArmy), testLocations.alpha);
    assert.equal(result.orderResults[orderId("green-support")].status, "fails");
    assert.equal(result.orderResults[orderId("blue-move")].status, "fails");
  });

  it("allows movement into a province vacated by a successful move", () => {
    const result = adjudicate(
      testVariant.initialState,
      [
        { id: orderId("red-move"), type: "move", unitId: testUnits.redArmy, to: testLocations.bravo },
        { id: orderId("blue-move"), type: "move", unitId: testUnits.blueArmy, to: testLocations.charlie },
        { id: orderId("green-move"), type: "move", unitId: testUnits.greenArmy, to: testLocations.echo },
      ],
      testVariant,
    );

    assert.equal(unitLocation(result.nextState, testUnits.redArmy), testLocations.bravo);
    assert.equal(unitLocation(result.nextState, testUnits.blueArmy), testLocations.charlie);
    assert.equal(unitLocation(result.nextState, testUnits.greenArmy), testLocations.echo);
  });

  it("bounces equal head-to-head moves", () => {
    const result = adjudicate(
      testVariant.initialState,
      [
        { id: orderId("red-move"), type: "move", unitId: testUnits.redArmy, to: testLocations.bravo },
        { id: orderId("blue-move"), type: "move", unitId: testUnits.blueArmy, to: testLocations.alpha },
      ],
      testVariant,
    );

    assert.equal(unitLocation(result.nextState, testUnits.redArmy), testLocations.alpha);
    assert.equal(unitLocation(result.nextState, testUnits.blueArmy), testLocations.bravo);
    assert.equal(result.dislodgedUnits.length, 0);
  });

  it("resolves stronger head-to-head moves by dislodging the weaker unit", () => {
    const result = adjudicate(
      testVariant.initialState,
      [
        { id: orderId("red-move"), type: "move", unitId: testUnits.redArmy, to: testLocations.bravo },
        { id: orderId("blue-move"), type: "move", unitId: testUnits.blueArmy, to: testLocations.alpha },
        {
          id: orderId("green-support"),
          type: "support",
          unitId: testUnits.greenArmy,
          supportedUnitId: testUnits.redArmy,
          to: testLocations.bravo,
        },
      ],
      testVariant,
    );

    assert.equal(unitLocation(result.nextState, testUnits.redArmy), testLocations.bravo);
    assert.equal(hasUnit(result.nextState, testUnits.blueArmy), false);
    assert.equal(result.dislodgedUnits[0].unit.id, testUnits.blueArmy);
  });

  it("uses support to hold when defending a province", () => {
    const result = adjudicate(
      testVariant.initialState,
      [
        { id: orderId("red-move"), type: "move", unitId: testUnits.redArmy, to: testLocations.bravo },
        {
          id: orderId("green-support"),
          type: "support",
          unitId: testUnits.greenArmy,
          supportedUnitId: testUnits.blueArmy,
        },
      ],
      testVariant,
    );

    assert.equal(unitLocation(result.nextState, testUnits.redArmy), testLocations.alpha);
    assert.equal(unitLocation(result.nextState, testUnits.blueArmy), testLocations.bravo);
    assert.equal(result.orderResults[orderId("green-support")].status, "succeeds");
  });

  it("prevents a power from dislodging its own unit", () => {
    const state: GameState = {
      ...testVariant.initialState,
      units: [
        testVariant.initialState.units[0],
        { ...testVariant.initialState.units[1], power: testVariant.initialState.units[0].power },
        testVariant.initialState.units[2],
      ],
    };

    const result = adjudicate(
      state,
      [
        { id: orderId("red-move"), type: "move", unitId: testUnits.redArmy, to: testLocations.bravo },
        {
          id: orderId("green-support"),
          type: "support",
          unitId: testUnits.greenArmy,
          supportedUnitId: testUnits.redArmy,
          to: testLocations.bravo,
        },
      ],
      testVariant,
    );

    assert.equal(unitLocation(result.nextState, testUnits.redArmy), testLocations.alpha);
    assert.equal(unitLocation(result.nextState, testUnits.blueArmy), testLocations.bravo);
    assert.equal(result.dislodgedUnits.length, 0);
  });

  it("excludes occupied provinces and attack origin from retreats", () => {
    const state: GameState = {
      ...testVariant.initialState,
      units: [
        { id: testUnits.redArmy, power: testVariant.powers[0].id, type: "army", location: testLocations.alpha },
        { id: testUnits.blueArmy, power: testVariant.powers[1].id, type: "army", location: testLocations.bravo },
        { id: testUnits.greenArmy, power: testVariant.powers[2].id, type: "army", location: testLocations.charlie },
        { id: unitId("red-2"), power: testVariant.powers[0].id, type: "army", location: testLocations.delta },
      ],
    };

    const result = adjudicate(
      state,
      [
        { id: orderId("red-move"), type: "move", unitId: testUnits.redArmy, to: testLocations.bravo },
        {
          id: orderId("green-support"),
          type: "support",
          unitId: testUnits.greenArmy,
          supportedUnitId: testUnits.redArmy,
          to: testLocations.bravo,
        },
      ],
      testVariant,
    );

    assert.equal(result.dislodgedUnits[0].unit.id, testUnits.blueArmy);
    assert.deepEqual(result.retreats[0].options, []);
  });

  it("resolves a legal retreat and advances the phase", () => {
    const retreatState = createRetreatState([
      retreat(testVariant.initialState.units[1], testLocations.alpha, [testLocations.delta]),
    ]);

    const result = adjudicate(
      retreatState,
      [{ id: orderId("blue-retreat"), type: "retreat", unitId: testUnits.blueArmy, to: testLocations.delta }],
      testVariant,
    );

    assert.equal(unitLocation(result.nextState, testUnits.blueArmy), testLocations.delta);
    assert.deepEqual(result.nextState.phase, { year: 1901, season: "fall", type: "movement" });
    assert.deepEqual(result.nextState.retreats, []);
    assert.equal(result.orderResults[orderId("blue-retreat")].status, "succeeds");
  });

  it("resolves an explicit disband", () => {
    const retreatState = createRetreatState([
      retreat(testVariant.initialState.units[1], testLocations.alpha, [testLocations.delta]),
    ]);

    const result = adjudicate(
      retreatState,
      [{ id: orderId("blue-disband"), type: "disband", unitId: testUnits.blueArmy }],
      testVariant,
    );

    assert.equal(hasUnit(result.nextState, testUnits.blueArmy), false);
    assert.equal(result.orderResults[orderId("blue-disband")].status, "succeeds");
  });

  it("defaults missing retreat orders to disband", () => {
    const retreatState = createRetreatState([
      retreat(testVariant.initialState.units[1], testLocations.alpha, [testLocations.delta]),
    ]);

    const result = adjudicate(retreatState, [], testVariant);

    assert.equal(hasUnit(result.nextState, testUnits.blueArmy), false);
    assert.equal(result.orderResults[orderId(`disband:${testUnits.blueArmy}`)].status, "succeeds");
  });

  it("invalid retreat orders disband the unit", () => {
    const retreatState = createRetreatState([
      retreat(testVariant.initialState.units[1], testLocations.alpha, [testLocations.delta]),
    ]);

    const result = adjudicate(
      retreatState,
      [{ id: orderId("blue-invalid-retreat"), type: "retreat", unitId: testUnits.blueArmy, to: testLocations.echo }],
      testVariant,
    );

    assert.equal(hasUnit(result.nextState, testUnits.blueArmy), false);
    assert.equal(result.orderResults[orderId("blue-invalid-retreat")].status, "invalid");
  });

  it("disbands units with contested retreats to the same province", () => {
    const retreatState = createRetreatState([
      retreat(testVariant.initialState.units[0], testLocations.bravo, [testLocations.delta]),
      retreat(testVariant.initialState.units[1], testLocations.alpha, [testLocations.delta]),
    ]);

    const result = adjudicate(
      retreatState,
      [
        { id: orderId("red-retreat"), type: "retreat", unitId: testUnits.redArmy, to: testLocations.delta },
        { id: orderId("blue-retreat"), type: "retreat", unitId: testUnits.blueArmy, to: testLocations.delta },
      ],
      testVariant,
    );

    assert.equal(hasUnit(result.nextState, testUnits.redArmy), false);
    assert.equal(hasUnit(result.nextState, testUnits.blueArmy), false);
    assert.equal(result.orderResults[orderId("red-retreat")].status, "fails");
    assert.equal(result.orderResults[orderId("blue-retreat")].status, "fails");
  });

  it("rejects non-adjacent movement as invalid", () => {
    const result = adjudicate(
      testVariant.initialState,
      [{ id: orderId("red-invalid"), type: "move", unitId: testUnits.redArmy, to: testLocations.echo }],
      testVariant,
    );

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(result.orderResults[orderId("red-invalid")].status, "invalid");
    assert.equal(unitLocation(result.nextState, testUnits.redArmy), testLocations.alpha);
  });

  it("rejects movement to a location the unit type cannot occupy", () => {
    const coastalVariant = createCoastalVariant();
    const result = adjudicate(
      coastalVariant.initialState,
      [{ id: orderId("army-to-sea"), type: "move", unitId: unitId("red-army"), to: locationId("sea") }],
      coastalVariant,
    );

    assert.equal(result.orderResults[orderId("army-to-sea")].status, "invalid");
    assert.equal(result.orderResults[orderId("army-to-sea")].reason, "Move destination cannot be occupied by that unit type.");
  });

  it("allows fleets to move through sea and coast locations", () => {
    const coastalVariant = createCoastalVariant();
    const result = adjudicate(
      coastalVariant.initialState,
      [{ id: orderId("fleet-to-coast"), type: "move", unitId: unitId("blue-fleet"), to: locationId("coast") }],
      coastalVariant,
    );

    assert.equal(unitLocation(result.nextState, unitId("blue-fleet")), locationId("coast"));
  });

  it("bounces attacks targeting different coasts of the same province", () => {
    const splitCoastVariant = createSplitCoastVariant();
    const result = adjudicate(
      splitCoastVariant.initialState,
      [
        { id: orderId("north-to-spain-nc"), type: "move", unitId: unitId("blue-north-fleet"), to: locationId("spain-nc") },
        { id: orderId("south-to-spain-sc"), type: "move", unitId: unitId("green-south-fleet"), to: locationId("spain-sc") },
      ],
      splitCoastVariant,
    );

    assert.equal(unitLocation(result.nextState, unitId("blue-north-fleet")), locationId("north-sea"));
    assert.equal(unitLocation(result.nextState, unitId("green-south-fleet")), locationId("south-sea"));
  });
});

function unitLocation(state: GameState, unitId: string) {
  const unit = state.units.find((candidate) => candidate.id === unitId);
  if (!unit) {
    throw new Error(`Missing unit ${unitId}`);
  }

  return unit.location;
}

function hasUnit(state: GameState, unitId: string) {
  return state.units.some((candidate) => candidate.id === unitId);
}

function createRetreatState(
  retreats: readonly PendingRetreat[],
  phase: GameState["phase"] = { year: 1901, season: "spring", type: "retreat" },
  units?: readonly Unit[],
): GameState {
  const retreatUnitIds = new Set(retreats.map((pendingRetreat) => pendingRetreat.unit.id));
  const defaultUnits = testVariant.initialState.units.filter((unit) => !retreatUnitIds.has(unit.id));

  return {
    ...testVariant.initialState,
    phase,
    units: units ?? defaultUnits,
    retreats,
  };
}

function retreat(unit: Unit, attackOrigin: Unit["location"], options: readonly Unit["location"][]): PendingRetreat {
  return {
    unit,
    from: unit.location,
    attackOrigin,
    options,
  };
}

function createBuildState(overrides: Partial<Pick<GameState, "supplyCenterOwners" | "units">> = {}): GameState {
  return {
    ...testVariant.initialState,
    phase: { year: 1901, season: "winter", type: "build" },
    supplyCenterOwners: overrides.supplyCenterOwners ?? testVariant.initialState.supplyCenterOwners,
    units: overrides.units ?? testVariant.initialState.units,
    retreats: [],
  };
}

function createCoastalVariant(): VariantDefinition {
  const red = testVariant.powers[0].id;
  const blue = testVariant.powers[1].id;
  const inland = provinceId("inland");
  const coast = provinceId("coast-province");
  const sea = provinceId("sea-province");

  return {
    id: "coastal-test",
    name: "Coastal Test",
    powers: testVariant.powers,
    provinces: [
      { id: inland, name: "Inland", type: "land" },
      { id: coast, name: "Coast", type: "coastal" },
      { id: sea, name: "Sea", type: "sea" },
    ],
    locations: [
      { id: locationId("inland"), province: inland, name: "Inland", type: "land", unitTypes: ["army"] },
      { id: locationId("coast"), province: coast, name: "Coast", type: "coast", unitTypes: ["army", "fleet"] },
      { id: locationId("sea"), province: sea, name: "Sea", type: "sea", unitTypes: ["fleet"] },
    ],
    adjacency: {
      [locationId("inland")]: [{ to: locationId("coast"), unitTypes: ["army"] }],
      [locationId("coast")]: [
        { to: locationId("inland"), unitTypes: ["army"] },
        { to: locationId("sea"), unitTypes: ["fleet"] },
      ],
      [locationId("sea")]: [{ to: locationId("coast"), unitTypes: ["fleet"] }],
    },
    initialState: {
      phase: { year: 1901, season: "spring", type: "movement" },
      supplyCenterOwners: {
        [inland]: red,
        [coast]: blue,
        [sea]: undefined,
      },
      units: [
        { id: unitId("red-army"), power: red, type: "army", location: locationId("inland") },
        { id: unitId("blue-fleet"), power: blue, type: "fleet", location: locationId("sea") },
      ],
    },
  };
}

function createSplitCoastVariant(): VariantDefinition {
  const blue = testVariant.powers[1].id;
  const green = testVariant.powers[2].id;
  const spain = provinceId("spain");
  const northSea = provinceId("north-sea-province");
  const southSea = provinceId("south-sea-province");

  return {
    id: "split-coast-test",
    name: "Split Coast Test",
    powers: testVariant.powers,
    provinces: [
      { id: spain, name: "Spain", type: "coastal" },
      { id: northSea, name: "North Sea", type: "sea" },
      { id: southSea, name: "South Sea", type: "sea" },
    ],
    locations: [
      { id: locationId("spain-nc"), province: spain, name: "Spain North Coast", type: "coast", unitTypes: ["fleet"] },
      { id: locationId("spain-sc"), province: spain, name: "Spain South Coast", type: "coast", unitTypes: ["fleet"] },
      { id: locationId("north-sea"), province: northSea, name: "North Sea", type: "sea", unitTypes: ["fleet"] },
      { id: locationId("south-sea"), province: southSea, name: "South Sea", type: "sea", unitTypes: ["fleet"] },
    ],
    adjacency: {
      [locationId("spain-nc")]: [{ to: locationId("north-sea"), unitTypes: ["fleet"] }],
      [locationId("spain-sc")]: [{ to: locationId("south-sea"), unitTypes: ["fleet"] }],
      [locationId("north-sea")]: [{ to: locationId("spain-nc"), unitTypes: ["fleet"] }],
      [locationId("south-sea")]: [{ to: locationId("spain-sc"), unitTypes: ["fleet"] }],
    },
    initialState: {
      phase: { year: 1901, season: "spring", type: "movement" },
      supplyCenterOwners: {
        [spain]: undefined,
        [northSea]: undefined,
        [southSea]: undefined,
      },
      units: [
        { id: unitId("blue-north-fleet"), power: blue, type: "fleet", location: locationId("north-sea") },
        { id: unitId("green-south-fleet"), power: green, type: "fleet", location: locationId("south-sea") },
      ],
    },
  };
}
