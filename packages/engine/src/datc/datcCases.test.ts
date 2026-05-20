import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adjudicate } from "../adjudicate.js";
import { locationId, orderId, unitId, type GameState, type Order, type Unit, type UnitId } from "../types.js";
import { classic1901, classic1901Powers } from "../variants/classic1901.js";
import { datcCases, datcSource } from "./datcCases.js";
import { parseDatcMovementScenario, parseLocation, runDatcMovement } from "./datcHarness.js";

const executableDatcCaseIds = new Set([
  "6.A.1",
  "6.A.2",
  "6.A.3",
  "6.A.4",
  "6.A.5",
  "6.A.6",
  "6.A.7",
  "6.A.8",
  "6.A.9",
  "6.A.10",
  "6.A.11",
  "6.A.12",
  "6.B.1",
  "6.B.2",
  "6.B.3",
  "6.B.4",
  "6.B.5",
  "6.B.6",
  "6.B.7",
  "6.B.8",
  "6.B.9",
  "6.B.10",
  "6.B.11",
  "6.B.12",
  "6.B.13",
  "6.B.14",
  "6.B.15",
  "6.C.1",
  "6.C.2",
  "6.C.3",
  "6.C.8",
  "6.C.9",
  "6.D.1",
  "6.D.2",
  "6.D.3",
  "6.D.4",
  "6.D.5",
  "6.D.7",
  "6.D.9",
  "6.D.10",
  "6.D.11",
  "6.D.12",
  "6.D.13",
  "6.D.14",
  "6.D.15",
  "6.D.17",
  "6.D.18",
  "6.D.19",
  "6.D.20",
  "6.D.21",
  "6.D.22",
  "6.D.23",
  "6.D.24",
  "6.D.25",
  "6.D.26",
  "6.D.27",
  "6.D.28",
  "6.D.29",
  "6.D.30",
  "6.D.32",
  "6.D.33",
]);

describe("DATC fixture coverage", () => {
  it("contains every Chapter 6 case from DATC v3.0", () => {
    assert.equal(datcSource.version, "3.0");
    assert.equal(datcCases.length, 163);
    assert.deepEqual(countBySection(), {
      "6.A": 12,
      "6.B": 15,
      "6.C": 9,
      "6.D": 34,
      "6.E": 14,
      "6.F": 25,
      "6.G": 20,
      "6.H": 16,
      "6.I": 7,
      "6.J": 11,
    });
  });
});

describe("DATC conformance cases", () => {
  for (const datcCase of datcCases.filter((datcCase) => !executableDatcCaseIds.has(datcCase.id))) {
    it.todo(`${datcCase.id}: ${datcCase.title}`);
  }
});

describe("DATC 6.A basic checks", () => {
  it("6.A.1 rejects movement to a non-neighbor", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.A.1"));
    const result = runDatcMovement(caseOrders("6.A.1"));

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("North Sea"));
  });

  it("6.A.2 rejects army movement to sea", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.A.2"));
    const result = runDatcMovement(caseOrders("6.A.2"));

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, scenario.units["army:lvp"]), parseLocation("Liverpool"));
  });

  it("6.A.3 rejects fleet movement to inland province", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.A.3"));
    const result = runDatcMovement(caseOrders("6.A.3"));

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:kie"]), parseLocation("Kiel"));
  });

  it("6.A.4 rejects movement to the unit's own province", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.A.4"));
    const result = runDatcMovement(caseOrders("6.A.4"));

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:kie"]), parseLocation("Kiel"));
  });

  it("6.A.5 rejects self-movement by convoy and allows the supported attack", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.A.5"));
    const result = runDatcMovement(caseOrders("6.A.5"));

    assert.equal(result.invalidOrders.length, 2);
    assert.equal(hasUnit(result.nextState, scenario.units["army:yor"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:lon"]), parseLocation("Yorkshire"));
  });

  it("6.A.6 rejects an order submitted for another country's unit", () => {
    const state: GameState = {
      ...classic1901.initialState,
      phase: { year: 1901, season: "spring", type: "movement" },
      units: [
        {
          id: unitId("datc-england-f-lon"),
          power: classic1901Powers.england,
          type: "fleet",
          location: locationId("lon"),
        },
      ],
    };

    const result = adjudicate(
      state,
      [{ id: orderId("datc-germany-f-lon:0"), type: "move", unitId: unitId("datc-germany-f-lon"), to: locationId("nth") }],
      classic1901,
    );

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, unitId("datc-england-f-lon")), parseLocation("London"));
  });

  it("6.A.7 rejects convoying a fleet", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.A.7"));
    const result = runDatcMovement(caseOrders("6.A.7"));

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:lon"]), parseLocation("London"));
  });

  it("6.A.8 rejects self-support to hold", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.A.8"));
    const result = runDatcMovement(caseOrders("6.A.8"));

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:tri"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["army:ven"]), parseLocation("Trieste"));
  });

  it("6.A.9 rejects fleet movement along an army-only adjacency", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.A.9"));
    const result = runDatcMovement(caseOrders("6.A.9"));

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:rom"]), parseLocation("Rome"));
  });

  it("6.A.10 rejects support for an unreachable destination", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.A.10"));
    const result = runDatcMovement(caseOrders("6.A.10"));

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, scenario.units["army:ven"]), parseLocation("Venice"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:apu"]), parseLocation("Apulia"));
  });

  it("6.A.11 bounces two equally strong attacks", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.A.11"));
    const result = runDatcMovement(caseOrders("6.A.11"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:vie"]), parseLocation("Vienna"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ven"]), parseLocation("Venice"));
  });

  it("6.A.12 bounces three equally strong attacks", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.A.12"));
    const result = runDatcMovement(caseOrders("6.A.12"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:vie"]), parseLocation("Vienna"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:mun"]), parseLocation("Munich"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ven"]), parseLocation("Venice"));
  });
});

describe("DATC 6.B coastal issues", () => {
  it("6.B.1 rejects unspecified coast when multiple coasts are reachable", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.B.1"));
    const result = runDatcMovement(caseOrders("6.B.1"));

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:por"]), parseLocation("Portugal"));
  });

  it("6.B.2 resolves an unspecified coast when only one coast is reachable", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.B.2"));
    const result = runDatcMovement(caseOrders("6.B.2"));

    assert.equal(result.invalidOrders.length, 0);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:gas"]), parseLocation("Spain(nc)"));
  });

  it("6.B.3 rejects a wrong explicit coast", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.B.3"));
    const result = runDatcMovement(caseOrders("6.B.3"));

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:gas"]), parseLocation("Gascony"));
  });

  it("6.B.4 allows support to a province through another reachable coast", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.B.4"));
    const result = runDatcMovement(caseOrders("6.B.4"));

    assert.equal(result.invalidOrders.length, 0);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:gas"]), parseLocation("Spain(nc)"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:wes"]), parseLocation("Western Mediterranean"));
  });

  it("6.B.5 rejects support from a coast that cannot reach the target province", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.B.5"));
    const result = runDatcMovement(caseOrders("6.B.5"));

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:mar"]), parseLocation("Marseilles"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:lyo"]), parseLocation("Gulf of Lyon"));
  });

  it("6.B.6 cuts support from the other coast of the same province", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.B.6"));
    const result = runDatcMovement(caseOrders("6.B.6"));

    assert.equal(result.invalidOrders.length, 0);
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:mao"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nao"]), parseLocation("Mid-Atlantic Ocean"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:spa-nc"]), parseLocation("Spain(nc)"));
  });

  it("6.B.7 allows support with an unspecified coast for the power's own matching move", () => {
    const result = adjudicateDatc(
      [
        unit("france-f-por", classic1901Powers.france, "fleet", "por"),
        unit("france-f-mao", classic1901Powers.france, "fleet", "mao"),
        unit("italy-f-lyo", classic1901Powers.italy, "fleet", "lyo"),
        unit("italy-f-wes", classic1901Powers.italy, "fleet", "wes"),
      ],
      [
        { id: orderId("france-f-por-support"), type: "support", unitId: unitId("france-f-por"), supportedUnitId: unitId("france-f-mao"), to: locationId("spa-nc") },
        { id: orderId("france-f-mao-move"), type: "move", unitId: unitId("france-f-mao"), to: locationId("spa-nc") },
        { id: orderId("italy-f-lyo-support"), type: "support", unitId: unitId("italy-f-lyo"), supportedUnitId: unitId("italy-f-wes"), to: locationId("spa-sc") },
        { id: orderId("italy-f-wes-move"), type: "move", unitId: unitId("italy-f-wes"), to: locationId("spa-sc") },
      ],
    );

    assert.equal(result.invalidOrders.length, 0);
    assert.equal(unitLocation(result.nextState, unitId("france-f-mao")), parseLocation("Mid-Atlantic Ocean"));
    assert.equal(unitLocation(result.nextState, unitId("italy-f-wes")), parseLocation("Western Mediterranean"));
  });

  it("6.B.8 allows support with an unspecified coast when only one coast is possible", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.B.8"));
    const result = runDatcMovement(caseOrders("6.B.8"));

    assert.equal(result.invalidOrders.length, 0);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:gas"]), parseLocation("Gascony"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:wes"]), parseLocation("Western Mediterranean"));
  });

  it("6.B.9 rejects support naming the wrong coast", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.B.9"));
    const result = runDatcMovement(caseOrders("6.B.9"));

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:wes"]), parseLocation("Spain(sc)"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:mao"]), parseLocation("Mid-Atlantic Ocean"));
  });

  it("6.B.10 ignores the ordered unit's wrong coast when the actual coast can move", () => {
    const result = adjudicateDatc(
      [unit("france-f-spain", classic1901Powers.france, "fleet", "spa-sc")],
      [{ id: orderId("france-f-spain-move"), type: "move", unitId: unitId("france-f-spain"), to: locationId("lyo") }],
    );

    assert.equal(result.invalidOrders.length, 0);
    assert.equal(unitLocation(result.nextState, unitId("france-f-spain")), parseLocation("Gulf of Lyon"));
  });

  it("6.B.11 does not let a fleet change coasts by order text", () => {
    const result = adjudicateDatc(
      [unit("france-f-spain", classic1901Powers.france, "fleet", "spa-nc")],
      [{ id: orderId("france-f-spain-move"), type: "move", unitId: unitId("france-f-spain"), to: locationId("lyo") }],
    );

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, unitId("france-f-spain")), parseLocation("Spain(nc)"));
  });

  it("6.B.12 ignores coastal specification for army movement", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.B.12"));
    const result = runDatcMovement(caseOrders("6.B.12"));

    assert.equal(result.invalidOrders.length, 0);
    assert.equal(unitLocation(result.nextState, scenario.units["army:gas"]), parseLocation("Spain"));
  });

  it("6.B.13 treats opposite-coast movement as head-to-head", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.B.13"));
    const result = runDatcMovement(caseOrders("6.B.13"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:bul-sc"]), parseLocation("Bulgaria(sc)"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:con"]), parseLocation("Constantinople"));
  });

  it("6.B.14 rejects a fleet build in St Petersburg without specifying a coast", () => {
    const result = adjudicate(
      {
        ...classic1901.initialState,
        phase: { year: 1901, season: "winter", type: "build" },
        units: classic1901.initialState.units.filter((candidate) => candidate.id !== unitId("russia-f-stp-sc")),
        retreats: [],
      },
      [{ id: orderId("russia-build-stp"), type: "build", power: classic1901Powers.russia, unitId: unitId("russia-f-stp"), unitType: "fleet", location: locationId("stp") }],
      classic1901,
    );

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(hasUnit(result.nextState, unitId("russia-f-stp")), false);
  });

  it("6.B.15 allows support with an unspecified coast for a foreign matching move", () => {
    const result = adjudicateDatc(
      [
        unit("france-f-por", classic1901Powers.france, "fleet", "por"),
        unit("england-f-mao", classic1901Powers.england, "fleet", "mao"),
        unit("italy-f-lyo", classic1901Powers.italy, "fleet", "lyo"),
        unit("italy-f-wes", classic1901Powers.italy, "fleet", "wes"),
      ],
      [
        { id: orderId("france-f-por-support"), type: "support", unitId: unitId("france-f-por"), supportedUnitId: unitId("england-f-mao"), to: locationId("spa-nc") },
        { id: orderId("england-f-mao-move"), type: "move", unitId: unitId("england-f-mao"), to: locationId("spa-nc") },
        { id: orderId("italy-f-lyo-support"), type: "support", unitId: unitId("italy-f-lyo"), supportedUnitId: unitId("italy-f-wes"), to: locationId("spa-sc") },
        { id: orderId("italy-f-wes-move"), type: "move", unitId: unitId("italy-f-wes"), to: locationId("spa-sc") },
      ],
    );

    assert.equal(result.invalidOrders.length, 0);
    assert.equal(unitLocation(result.nextState, unitId("england-f-mao")), parseLocation("Mid-Atlantic Ocean"));
    assert.equal(unitLocation(result.nextState, unitId("italy-f-wes")), parseLocation("Western Mediterranean"));
  });
});

describe("DATC 6.C circular movement", () => {
  it("6.C.1 allows a three-unit circular movement", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.C.1"));
    const result = runDatcMovement(caseOrders("6.C.1"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:ank"]), parseLocation("Constantinople"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:con"]), parseLocation("Smyrna"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:smy"]), parseLocation("Ankara"));
  });

  it("6.C.2 allows a three-unit circular movement with support", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.C.2"));
    const result = runDatcMovement(caseOrders("6.C.2"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:ank"]), parseLocation("Constantinople"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:con"]), parseLocation("Smyrna"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:smy"]), parseLocation("Ankara"));
  });

  it("6.C.3 disrupts a circular movement when one destination bounces", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.C.3"));
    const result = runDatcMovement(caseOrders("6.C.3"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:ank"]), parseLocation("Ankara"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:con"]), parseLocation("Constantinople"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:smy"]), parseLocation("Smyrna"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:bul"]), parseLocation("Bulgaria"));
  });

  it("6.C.8 prevents self-dislodgement in a disrupted circular movement", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.C.8"));
    const result = runDatcMovement(caseOrders("6.C.8"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:con"]), parseLocation("Constantinople"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:bul"]), parseLocation("Bulgaria"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:bla"]), parseLocation("Black Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ser"]), parseLocation("Serbia"));
  });

  it("6.C.9 prevents a power from helping dislodge its own unit in a disrupted circular movement", () => {
    const result = adjudicateDatc(
      [
        unit("turkey-f-con", classic1901Powers.turkey, "fleet", "con"),
        unit("turkey-a-smy", classic1901Powers.turkey, "army", "smy"),
        unit("russia-f-bla", classic1901Powers.russia, "fleet", "bla"),
        unit("austria-a-ser", classic1901Powers.austria, "army", "ser"),
        unit("austria-a-bul", classic1901Powers.austria, "army", "bul"),
      ],
      [
        { id: orderId("turkey-f-con-move"), type: "move", unitId: unitId("turkey-f-con"), to: locationId("bla") },
        { id: orderId("turkey-a-smy-support"), type: "support", unitId: unitId("turkey-a-smy"), supportedUnitId: unitId("austria-a-bul"), to: locationId("con") },
        { id: orderId("russia-f-bla-move"), type: "move", unitId: unitId("russia-f-bla"), to: locationId("bul-ec") },
        { id: orderId("austria-a-ser-move"), type: "move", unitId: unitId("austria-a-ser"), to: locationId("bul") },
        { id: orderId("austria-a-bul-move"), type: "move", unitId: unitId("austria-a-bul"), to: locationId("con") },
      ],
    );

    assert.equal(unitLocation(result.nextState, unitId("turkey-f-con")), parseLocation("Constantinople"));
    assert.equal(unitLocation(result.nextState, unitId("austria-a-bul")), parseLocation("Bulgaria"));
    assert.equal(unitLocation(result.nextState, unitId("russia-f-bla")), parseLocation("Black Sea"));
    assert.equal(unitLocation(result.nextState, unitId("austria-a-ser")), parseLocation("Serbia"));
  });
});

describe("DATC 6.D supports and dislodges", () => {
  it("6.D.1 supported hold can prevent dislodgement", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.1"));
    const result = runDatcMovement(caseOrders("6.D.1"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:tri"]), parseLocation("Trieste"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ven"]), parseLocation("Venice"));
  });

  it("6.D.2 a move cuts support on hold", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.2"));
    const result = runDatcMovement(caseOrders("6.D.2"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:tri"]), parseLocation("Venice"));
    assert.equal(hasUnit(result.nextState, scenario.units["army:ven"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["army:vie"]), parseLocation("Vienna"));
  });

  it("6.D.3 a move cuts support on move", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.3"));
    const result = runDatcMovement(caseOrders("6.D.3"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:tri"]), parseLocation("Trieste"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ven"]), parseLocation("Venice"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:ion"]), parseLocation("Ionian Sea"));
  });

  it("6.D.4 support to hold on unit supporting a hold is allowed", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.4"));
    const result = runDatcMovement(caseOrders("6.D.4"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:ber"]), parseLocation("Berlin"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:pru"]), parseLocation("Prussia"));
  });

  it("6.D.5 support to hold on unit supporting a move is allowed", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.5"));
    const result = runDatcMovement(caseOrders("6.D.5"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:ber"]), parseLocation("Berlin"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:pru"]), parseLocation("Prussia"));
  });

  it("6.D.7 support to hold on a moving unit is not allowed", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.7"));
    const result = runDatcMovement(caseOrders("6.D.7"));

    assert.equal(hasUnit(result.nextState, scenario.units["fleet:bal"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:lvn"]), parseLocation("Baltic Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:fin"]), parseLocation("Finland"));
  });

  it("6.D.9 support to move on a holding unit is not allowed", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.9"));
    const result = runDatcMovement(caseOrders("6.D.9"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:ven"]), parseLocation("Trieste"));
    assert.equal(hasUnit(result.nextState, scenario.units["army:tri"]), false);
  });

  it("6.D.10 self-dislodgement is prohibited", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.10"));
    const result = runDatcMovement(caseOrders("6.D.10"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:ber"]), parseLocation("Berlin"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:kie"]), parseLocation("Kiel"));
  });

  it("6.D.11 self-dislodgement of a returning unit is prohibited", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.11"));
    const result = runDatcMovement(caseOrders("6.D.11"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:ber"]), parseLocation("Berlin"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:kie"]), parseLocation("Kiel"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:war"]), parseLocation("Warsaw"));
  });

  it("6.D.12 supporting a foreign unit to dislodge own unit is prohibited", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.12"));
    const result = runDatcMovement(caseOrders("6.D.12"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:tri"]), parseLocation("Trieste"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ven"]), parseLocation("Venice"));
  });

  it("6.D.13 supporting a foreign unit to dislodge a returning own unit is prohibited", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.13"));
    const result = runDatcMovement(caseOrders("6.D.13"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:tri"]), parseLocation("Trieste"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ven"]), parseLocation("Venice"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:apu"]), parseLocation("Apulia"));
  });

  it("6.D.14 foreign support is not enough to prevent dislodgement when other support suffices", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.14"));
    const result = runDatcMovement(caseOrders("6.D.14"));

    assert.equal(hasUnit(result.nextState, scenario.units["fleet:tri"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["army:ven"]), parseLocation("Trieste"));
  });

  it("6.D.15 defender cannot cut support for an attack on itself", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.15"));
    const result = runDatcMovement(caseOrders("6.D.15"));

    assert.equal(hasUnit(result.nextState, scenario.units["fleet:ank"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:bla"]), parseLocation("Ankara"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:con"]), parseLocation("Constantinople"));
  });

  it("6.D.17 dislodgement cuts support", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.17"));
    const result = runDatcMovement(caseOrders("6.D.17"));

    assert.equal(hasUnit(result.nextState, scenario.units["fleet:con"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:ank"]), parseLocation("Constantinople"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:bla"]), parseLocation("Black Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:arm"]), parseLocation("Armenia"));
  });

  it("6.D.18 a surviving unit sustains support", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.18"));
    const result = runDatcMovement(caseOrders("6.D.18"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:con"]), parseLocation("Constantinople"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:ank"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:bla"]), parseLocation("Ankara"));
  });

  it("6.D.19 surviving due to alternative own support sustains support", () => {
    const result = adjudicateDatc(
      [
        unit("russia-f-con", classic1901Powers.russia, "fleet", "con"),
        unit("russia-f-bla", classic1901Powers.russia, "fleet", "bla"),
        unit("russia-a-smy", classic1901Powers.russia, "army", "smy"),
        unit("turkey-f-ank", classic1901Powers.turkey, "fleet", "ank"),
      ],
      [
        { id: orderId("russia-f-con-support"), type: "support", unitId: unitId("russia-f-con"), supportedUnitId: unitId("russia-f-bla"), to: locationId("ank") },
        { id: orderId("russia-f-bla-move"), type: "move", unitId: unitId("russia-f-bla"), to: locationId("ank") },
        { id: orderId("russia-a-smy-support"), type: "support", unitId: unitId("russia-a-smy"), supportedUnitId: unitId("turkey-f-ank"), to: locationId("con") },
        { id: orderId("turkey-f-ank-move"), type: "move", unitId: unitId("turkey-f-ank"), to: locationId("con") },
      ],
    );

    assert.equal(unitLocation(result.nextState, unitId("russia-f-con")), parseLocation("Constantinople"));
    assert.equal(hasUnit(result.nextState, unitId("turkey-f-ank")), false);
    assert.equal(unitLocation(result.nextState, unitId("russia-f-bla")), parseLocation("Ankara"));
  });

  it("6.D.20 a unit cannot cut support of its own country", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.20"));
    const result = runDatcMovement(caseOrders("6.D.20"));

    assert.equal(hasUnit(result.nextState, scenario.units["fleet:eng"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("English Channel"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:yor"]), parseLocation("Yorkshire"));
  });

  it("6.D.21 dislodging a moving unit does not cancel its support cut", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.21"));
    const result = runDatcMovement(caseOrders("6.D.21"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:tri"]), parseLocation("Trieste"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ven"]), parseLocation("Venice"));
    assert.equal(hasUnit(result.nextState, scenario.units["army:mun"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["army:sil"]), parseLocation("Munich"));
  });

  it("6.D.22 impossible fleet move cannot be supported", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.22"));
    const result = runDatcMovement(caseOrders("6.D.22"));

    assert.equal(hasUnit(result.nextState, scenario.units["fleet:kie"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["army:mun"]), parseLocation("Kiel"));
  });

  it("6.D.23 impossible coast move cannot be supported", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.23"));
    const result = runDatcMovement(caseOrders("6.D.23"));

    assert.equal(hasUnit(result.nextState, scenario.units["fleet:spa-nc"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:lyo"]), parseLocation("Spain(sc)"));
  });

  it("6.D.24 impossible army move cannot be supported", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.24"));
    const result = runDatcMovement(caseOrders("6.D.24"));

    assert.equal(hasUnit(result.nextState, scenario.units["fleet:lyo"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:wes"]), parseLocation("Gulf of Lyon"));
  });

  it("6.D.25 failing hold support can itself receive hold support", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.25"));
    const result = runDatcMovement(caseOrders("6.D.25"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:ber"]), parseLocation("Berlin"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:pru"]), parseLocation("Prussia"));
  });

  it("6.D.26 failing move support can itself receive hold support", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.26"));
    const result = runDatcMovement(caseOrders("6.D.26"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:ber"]), parseLocation("Berlin"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:pru"]), parseLocation("Prussia"));
  });

  it("6.D.27 failing convoy can itself receive hold support", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.27"));
    const result = runDatcMovement(caseOrders("6.D.27"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:bal"]), parseLocation("Baltic Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:swe"]), parseLocation("Sweden"));
  });

  it("6.D.28 impossible move is ignored and the unit may receive support", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.28"));
    const result = runDatcMovement(caseOrders("6.D.28"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:rum"]), parseLocation("Rumania"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:bla"]), parseLocation("Black Sea"));
  });

  it("6.D.29 move to impossible coast is ignored and the unit may receive support", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.29"));
    const result = runDatcMovement(caseOrders("6.D.29"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:rum"]), parseLocation("Rumania"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:bla"]), parseLocation("Black Sea"));
  });

  it("6.D.30 move without required coast is ignored and the unit may receive support", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.30"));
    const result = runDatcMovement(caseOrders("6.D.30"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:con"]), parseLocation("Constantinople"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:bla"]), parseLocation("Black Sea"));
  });

  it("6.D.32 missing fleet means the convoy move is ignored and hold support succeeds", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.32"));
    const result = runDatcMovement(caseOrders("6.D.32"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:yor"]), parseLocation("Yorkshire"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:lvp"]), parseLocation("Liverpool"));
  });

  it("6.D.33 unwanted support is allowed", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.33"));
    const result = runDatcMovement(caseOrders("6.D.33"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:ser"]), parseLocation("Budapest"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:bul"]), parseLocation("Serbia"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:vie"]), parseLocation("Vienna"));
  });
});

function countBySection(): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const datcCase of datcCases) {
    counts[datcCase.section] = (counts[datcCase.section] ?? 0) + 1;
  }

  return counts;
}

function caseOrders(id: string): string {
  const datcCase = datcCases.find((candidate) => candidate.id === id);
  if (!datcCase) {
    throw new Error(`Unknown DATC case ${id}.`);
  }

  assert.equal(datcCase.orderBlocks.length, 1);
  return datcCase.orderBlocks[0];
}

function unitLocation(state: GameState, id: UnitId) {
  const unit = state.units.find((candidate) => candidate.id === id);
  if (!unit) {
    throw new Error(`Missing unit ${id}`);
  }

  return unit.location;
}

function hasUnit(state: GameState, id: UnitId) {
  return state.units.some((unit) => unit.id === id);
}

function adjudicateDatc(units: readonly Unit[], orders: readonly Order[]) {
  return adjudicate(
    {
      ...classic1901.initialState,
      phase: { year: 1901, season: "spring", type: "movement" },
      units,
      retreats: [],
    },
    orders,
    classic1901,
  );
}

function unit(id: string, power: Unit["power"], type: Unit["type"], location: string): Unit {
  return {
    id: unitId(id),
    power,
    type,
    location: locationId(location),
  };
}
