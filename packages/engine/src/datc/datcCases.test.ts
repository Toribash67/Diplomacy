import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adjudicate } from "../adjudicate.js";
import { locationId, orderId, provinceId, unitId, type GameState, type Order, type Unit, type UnitId } from "../types.js";
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
  "6.C.4",
  "6.C.5",
  "6.C.6",
  "6.C.7",
  "6.C.8",
  "6.C.9",
  "6.D.1",
  "6.D.2",
  "6.D.3",
  "6.D.4",
  "6.D.5",
  "6.D.6",
  "6.D.7",
  "6.D.8",
  "6.D.9",
  "6.D.10",
  "6.D.11",
  "6.D.12",
  "6.D.13",
  "6.D.14",
  "6.D.15",
  "6.D.16",
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
  "6.D.31",
  "6.D.32",
  "6.D.33",
  "6.D.34",
  "6.E.2",
  "6.E.3",
  "6.E.4",
  "6.E.5",
  "6.E.6",
  "6.E.7",
  "6.E.8",
  "6.E.9",
  "6.E.10",
  "6.E.11",
  "6.E.12",
  "6.E.13",
  "6.E.14",
  "6.E.15",
  "6.F.1",
  "6.F.2",
  "6.F.3",
  "6.F.4",
  "6.F.5",
  "6.F.6",
  "6.F.7",
  "6.F.8",
  "6.F.9",
  "6.F.10",
  "6.F.11",
  "6.F.12",
  "6.F.13",
  "6.F.14",
  "6.F.15",
  "6.F.16",
  "6.F.17",
  "6.F.18",
  "6.F.19",
  "6.F.20",
  "6.F.21",
  "6.F.22",
  "6.F.23",
  "6.F.24",
  "6.F.25",
  "6.G.1",
  "6.G.2",
  "6.G.3",
  "6.G.4",
  "6.G.5",
  "6.G.6",
  "6.G.7",
  "6.G.8",
  "6.G.9",
  "6.G.10",
  "6.G.11",
  "6.G.12",
  "6.G.13",
  "6.G.14",
  "6.G.15",
  "6.G.16",
  "6.G.17",
  "6.G.18",
  "6.G.19",
  "6.G.20",
  "6.H.1",
  "6.H.2",
  "6.H.3",
  "6.H.4",
  "6.H.5",
  "6.H.6",
  "6.H.7",
  "6.H.8",
  "6.H.9",
  "6.H.10",
  "6.H.11",
  "6.H.12",
  "6.H.13",
  "6.H.14",
  "6.H.15",
  "6.H.16",
  "6.I.1",
  "6.I.2",
  "6.I.3",
  "6.I.4",
  "6.I.5",
  "6.I.6",
  "6.I.7",
  "6.J.1",
  "6.J.2",
  "6.J.3",
  "6.J.4",
  "6.J.5",
  "6.J.6",
  "6.J.7",
  "6.J.8",
  "6.J.9",
  "6.J.10",
  "6.J.11",
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

    assert.equal(result.invalidOrders.length, 3);
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

    assert.equal(result.invalidOrders.length, 2);
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

  it("6.C.4 allows circular movement with an attacked convoy", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.C.4"));
    const result = runDatcMovement(caseOrders("6.C.4"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:tri"]), parseLocation("Serbia"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ser"]), parseLocation("Bulgaria"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:bul"]), parseLocation("Trieste"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:ion"]), parseLocation("Ionian Sea"));
  });

  it("6.C.5 disrupts circular movement when a convoying fleet is dislodged", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.C.5"));
    const result = runDatcMovement(caseOrders("6.C.5"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:tri"]), parseLocation("Trieste"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ser"]), parseLocation("Serbia"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:bul"]), parseLocation("Bulgaria"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:ion"]), false);
  });

  it("6.C.6 allows two armies to swap by convoy", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.C.6"));
    const result = runDatcMovement(caseOrders("6.C.6"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("Belgium"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:bel"]), parseLocation("London"));
  });

  it("6.C.7 disrupts a convoy swap when one destination bounces", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.C.7"));
    const result = runDatcMovement(caseOrders("6.C.7"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("London"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:bel"]), parseLocation("Belgium"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:bur"]), parseLocation("Burgundy"));
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

  it("6.D.6 support to hold on a convoying unit is allowed", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.6"));
    const result = runDatcMovement(caseOrders("6.D.6"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:ber"]), parseLocation("Sweden"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:bal"]), parseLocation("Baltic Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:lvn"]), parseLocation("Livonia"));
  });

  it("6.D.7 support to hold on a moving unit is not allowed", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.7"));
    const result = runDatcMovement(caseOrders("6.D.7"));

    assert.equal(hasUnit(result.nextState, scenario.units["fleet:bal"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:lvn"]), parseLocation("Baltic Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:fin"]), parseLocation("Finland"));
  });

  it("6.D.8 failed convoy cannot receive hold support", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.8"));
    const result = runDatcMovement(caseOrders("6.D.8"));

    assert.equal(hasUnit(result.nextState, scenario.units["army:gre"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["army:alb"]), parseLocation("Greece"));
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

  it("6.D.16 allows convoying a foreign unit that dislodges an own unit", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.16"));
    const result = runDatcMovement(caseOrders("6.D.16"));

    assert.equal(hasUnit(result.nextState, scenario.units["army:lon"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["army:bel"]), parseLocation("London"));
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

  it("6.D.31 rejects a support that would require the same fleet to convoy", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.D.31"));
    const result = runDatcMovement(caseOrders("6.D.31"));

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, scenario.units["army:rum"]), parseLocation("Rumania"));
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

  it("6.D.34 support targeting own area is not allowed", () => {
    const result = adjudicateDatc(
      [
        unit("germany-a-ber", classic1901Powers.germany, "army", "ber"),
        unit("germany-a-sil", classic1901Powers.germany, "army", "sil"),
        unit("germany-f-bal", classic1901Powers.germany, "fleet", "bal"),
        unit("italy-a-pru", classic1901Powers.italy, "army", "pru"),
        unit("russia-a-war", classic1901Powers.russia, "army", "war"),
        unit("russia-a-lvn", classic1901Powers.russia, "army", "lvn"),
      ],
      [
        { id: orderId("germany-a-ber-move"), type: "move", unitId: unitId("germany-a-ber"), to: locationId("pru") },
        { id: orderId("germany-a-sil-support"), type: "support", unitId: unitId("germany-a-sil"), supportedUnitId: unitId("germany-a-ber"), to: locationId("pru") },
        { id: orderId("germany-f-bal-support"), type: "support", unitId: unitId("germany-f-bal"), supportedUnitId: unitId("germany-a-ber"), to: locationId("pru") },
        { id: orderId("italy-a-pru-support"), type: "support", unitId: unitId("italy-a-pru"), supportedUnitId: unitId("russia-a-lvn"), to: locationId("pru") },
        { id: orderId("russia-a-war-support"), type: "support", unitId: unitId("russia-a-war"), supportedUnitId: unitId("russia-a-lvn"), to: locationId("pru") },
        { id: orderId("russia-a-lvn-move"), type: "move", unitId: unitId("russia-a-lvn"), to: locationId("pru") },
      ],
    );

    assert.equal(result.orderResults[orderId("italy-a-pru-support")].status, "invalid");
    assert.equal(unitLocation(result.nextState, unitId("germany-a-ber")), parseLocation("Prussia"));
    assert.equal(hasUnit(result.nextState, unitId("italy-a-pru")), false);
    assert.equal(unitLocation(result.nextState, unitId("russia-a-lvn")), parseLocation("Livonia"));
  });
});

describe("DATC 6.E head-to-head battles and beleaguered garrisons", () => {
  it("6.E.2 prohibits self-dislodgement in a head-to-head battle", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.E.2"));
    const result = runDatcMovement(caseOrders("6.E.2"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:ber"]), parseLocation("Berlin"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:kie"]), parseLocation("Kiel"));
  });

  it("6.E.3 prohibits helping another power dislodge an own unit", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.E.3"));
    const result = runDatcMovement(caseOrders("6.E.3"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:ber"]), parseLocation("Berlin"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:kie"]), parseLocation("Kiel"));
  });

  it("6.E.4 non-dislodged head-to-head loser still affects the attacker's area", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.E.4"));
    const result = runDatcMovement(caseOrders("6.E.4"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:hol"]), parseLocation("Holland"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("North Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nwg"]), parseLocation("Norwegian Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ruh"]), parseLocation("Ruhr"));
  });

  it("6.E.5 loser dislodged by another unit still affects the head-to-head winner's area", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.E.5"));
    const result = runDatcMovement(caseOrders("6.E.5"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:hol"]), parseLocation("Holland"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:nth"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nwg"]), parseLocation("North Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ruh"]), parseLocation("Ruhr"));
  });

  it("6.E.6 loser not dislodged because of own support still affects the attacker's area", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.E.6"));
    const result = runDatcMovement(caseOrders("6.E.6"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:hol"]), parseLocation("Holland"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("North Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ruh"]), parseLocation("Ruhr"));
  });

  it("6.E.7 prevents self-dislodgement with a beleaguered garrison", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.E.7"));
    const result = runDatcMovement(caseOrders("6.E.7"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("North Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:hel"]), parseLocation("Helgoland Bight"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nwy"]), parseLocation("Norway"));
  });

  it("6.E.8 prevents self-dislodgement with a beleaguered garrison and head-to-head battle", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.E.8"));
    const result = runDatcMovement(caseOrders("6.E.8"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("North Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:hel"]), parseLocation("Helgoland Bight"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nwy"]), parseLocation("Norway"));
  });

  it("6.E.9 allows the garrison to leave when self-dislodgement is no longer possible", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.E.9"));
    const result = runDatcMovement(caseOrders("6.E.9"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("Norwegian Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nwy"]), parseLocation("North Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:hel"]), parseLocation("Helgoland Bight"));
  });

  it("6.E.10 disrupts almost-circular movement with a beleaguered garrison", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.E.10"));
    const result = runDatcMovement(caseOrders("6.E.10"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("North Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nwy"]), parseLocation("Norway"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:hel"]), parseLocation("Helgoland Bight"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:den"]), parseLocation("Denmark"));
  });

  it("6.E.11 allows the adjacent convoy swap with two coasts", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.E.11"));
    const result = runDatcMovement(caseOrders("6.E.11"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:spa"]), parseLocation("Portugal"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:por"]), parseLocation("Spain(nc)"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:gas"]), parseLocation("Gascony"));
  });

  it("6.E.12 support on an attack against an own unit can still stop another dislodgement", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.E.12"));
    const result = runDatcMovement(caseOrders("6.E.12"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:bud"]), parseLocation("Budapest"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:vie"]), parseLocation("Vienna"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:gal"]), parseLocation("Galicia"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:rum"]), parseLocation("Rumania"));
  });

  it("6.E.13 resolves a three-way beleaguered garrison with no movement", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.E.13"));
    const result = runDatcMovement(caseOrders("6.E.13"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:yor"]), parseLocation("Yorkshire"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:bel"]), parseLocation("Belgium"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("North Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nwg"]), parseLocation("Norwegian Sea"));
  });

  it("6.E.14 illegal head-to-head move can still defend", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.E.14"));
    const result = runDatcMovement(caseOrders("6.E.14"));

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, scenario.units["army:lvp"]), parseLocation("Liverpool"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:edi"]), parseLocation("Edinburgh"));
  });

  it("6.E.15 friendly head-to-head battle prevents all related moves", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.E.15"));
    const result = runDatcMovement(caseOrders("6.E.15"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:ruh"]), parseLocation("Ruhr"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:kie"]), parseLocation("Kiel"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ber"]), parseLocation("Berlin"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:pru"]), parseLocation("Prussia"));
  });
});

describe("DATC 6.F convoy basics", () => {
  it("6.F.1 rejects convoying from a coastal province", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.1"));
    const result = runDatcMovement(caseOrders("6.F.1"));

    assert.equal(result.invalidOrders.length, 1);
    assert.equal(unitLocation(result.nextState, scenario.units["army:gre"]), parseLocation("Greece"));
  });

  it("6.F.2 convoyed armies bounce normally", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.2"));
    const result = runDatcMovement(caseOrders("6.F.2"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("London"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:par"]), parseLocation("Paris"));
  });

  it("6.F.3 convoyed armies can receive support", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.3"));
    const result = runDatcMovement(caseOrders("6.F.3"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("Brest"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:par"]), parseLocation("Paris"));
  });

  it("6.F.4 attacking a convoying fleet does not disrupt the convoy", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.4"));
    const result = runDatcMovement(caseOrders("6.F.4"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("Holland"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("North Sea"));
  });

  it("6.F.5 a beleaguered convoying fleet is not disrupted", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.5"));
    const result = runDatcMovement(caseOrders("6.F.5"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("Holland"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("North Sea"));
  });

  it("6.F.6 a disrupted convoy does not cut support", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.6"));
    const result = runDatcMovement(caseOrders("6.F.6"));

    assert.equal(hasUnit(result.nextState, scenario.units["fleet:nth"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["army:hol"]), parseLocation("Holland"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:bel"]), parseLocation("Belgium"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:pic"]), parseLocation("Picardy"));
  });

  it("6.F.7 a disrupted convoy does not contest the landing area", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.7"));
    const result = runDatcMovement(caseOrders("6.F.7"));

    assert.equal(hasUnit(result.nextState, scenario.units["fleet:nth"]), false);
    assert.equal(pendingRetreat(result.nextState, scenario.units["fleet:nth"]).options.includes(parseLocation("Holland")), true);
    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("London"));
  });

  it("6.F.8 a disrupted convoy does not bounce a land move into the landing area", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.8"));
    const result = runDatcMovement(caseOrders("6.F.8"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:bel"]), parseLocation("Holland"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("London"));
  });

  it("6.F.9 allows multi-route convoys when one route is disrupted", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.9"));
    const result = runDatcMovement(caseOrders("6.F.9"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("Belgium"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:eng"]), false);
  });

  it("6.F.10 allows multi-route convoys through a surviving own route", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.10"));
    const result = runDatcMovement(caseOrders("6.F.10"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("Belgium"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:eng"]), false);
  });

  it("6.F.11 allows multi-route convoys with only foreign fleets", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.11"));
    const result = runDatcMovement(caseOrders("6.F.11"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("Belgium"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:eng"]), false);
  });

  it("6.F.12 ignores a dislodged convoying fleet that is not on the route", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.12"));
    const result = runDatcMovement(caseOrders("6.F.12"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("Belgium"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:iri"]), false);
  });

  it("6.F.13 allows unwanted alternative convoy routes", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.13"));
    const result = runDatcMovement(caseOrders("6.F.13"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("Belgium"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:nth"]), false);
  });

  it("6.F.14 resolves the simple convoy paradox by not cutting the support", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.14"));
    const result = runDatcMovement(caseOrders("6.F.14"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:wal"]), parseLocation("English Channel"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:eng"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["army:bre"]), parseLocation("Brest"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:lon"]), parseLocation("London"));
  });

  it("6.F.15 keeps the paradox core separate from an additional convoy", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.15"));
    const result = runDatcMovement(caseOrders("6.F.15"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:wal"]), parseLocation("English Channel"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:naf"]), parseLocation("Wales"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:eng"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["army:bre"]), parseLocation("Brest"));
  });

  it("6.F.16 resolves Pandin's paradox with no movement", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.16"));
    const result = runDatcMovement(caseOrders("6.F.16"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:lon"]), parseLocation("London"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:wal"]), parseLocation("Wales"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:bre"]), parseLocation("Brest"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:eng"]), parseLocation("English Channel"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:bel"]), parseLocation("Belgium"));
  });

  it("6.F.17 resolves Pandin's extended paradox by failing the convoy", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.17"));
    const result = runDatcMovement(caseOrders("6.F.17"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:lon"]), parseLocation("London"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:eng"]), parseLocation("English Channel"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:bre"]), parseLocation("Brest"));
  });

  it("6.F.18 resolves betrayal paradox by failing the convoy", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.18"));
    const result = runDatcMovement(caseOrders("6.F.18"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("London"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("North Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:bel"]), parseLocation("Belgium"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:ska"]), parseLocation("Skagerrak"));
  });

  it("6.F.19 cuts support when a convoy has another surviving route", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.19"));
    const result = runDatcMovement(caseOrders("6.F.19"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:tun"]), parseLocation("Tunis"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nap"]), parseLocation("Naples"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:rom"]), parseLocation("Rome"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:tys"]), parseLocation("Tyrrhenian Sea"));
  });

  it("6.F.20 cuts support in an unwanted multi-route convoy paradox", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.20"));
    const result = runDatcMovement(caseOrders("6.F.20"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:tun"]), parseLocation("Tunis"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nap"]), parseLocation("Naples"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:eas"]), parseLocation("Ionian Sea"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:ion"]), false);
  });

  it("6.F.21 resolves Dad's Army convoy by failing the paradox convoy", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.21"));
    const result = runDatcMovement(caseOrders("6.F.21"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:mao"]), parseLocation("North Atlantic Ocean"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:nao"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["army:lvp"]), parseLocation("Liverpool"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:nwy"]), parseLocation("Clyde"));
  });

  it("6.F.22 fails second-order paradox convoys and dislodges both convoying fleets", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.22"));
    const result = runDatcMovement(caseOrders("6.F.22"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:edi"]), parseLocation("North Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:pic"]), parseLocation("English Channel"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:nth"]), false);
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:eng"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["army:bre"]), parseLocation("Brest"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:nwy"]), parseLocation("Norway"));
  });

  it("6.F.23 fails second-order exclusive convoys with no movement", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.23"));
    const result = runDatcMovement(caseOrders("6.F.23"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:edi"]), parseLocation("Edinburgh"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:mao"]), parseLocation("Mid-Atlantic Ocean"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:bre"]), parseLocation("Brest"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:nwy"]), parseLocation("Norway"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:eng"]), parseLocation("English Channel"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("North Sea"));
  });

  it("6.F.24 fails second-order no-resolution convoys and dislodges North Sea", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.24"));
    const result = runDatcMovement(caseOrders("6.F.24"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:edi"]), parseLocation("North Sea"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:nth"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:eng"]), parseLocation("English Channel"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:bre"]), parseLocation("Brest"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:nwy"]), parseLocation("Norway"));
  });

  it("6.F.25 cuts support last around two convoy attempts", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.F.25"));
    const result = runDatcMovement(caseOrders("6.F.25"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:den"]), parseLocation("Norway"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:yor"]), parseLocation("Holland"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ruh"]), parseLocation("Ruh"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:bel"]), parseLocation("Belgium"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nwg"]), parseLocation("Norwegian Sea"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:swe"]), parseLocation("Sweden"));
  });
});

describe("DATC 6.G convoying to adjacent provinces", () => {
  it("6.G.1 swaps two adjacent armies by convoy intent", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.1"));
    const result = runDatcMovement(caseOrders("6.G.1"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:nwy"]), parseLocation("Sweden"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:swe"]), parseLocation("Norway"));
  });

  it("6.G.2 prevents kidnapping by a foreign convoy", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.2"));
    const result = runDatcMovement(caseOrders("6.G.2"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:nwy"]), parseLocation("Norway"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:swe"]), parseLocation("Sweden"));
  });

  it("6.G.3 ignores an unwanted disrupted adjacent convoy", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.3"));
    const result = runDatcMovement(caseOrders("6.G.3"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:pic"]), parseLocation("Belgium"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:eng"]), false);
  });

  it("6.G.4 still uses land movement when an unwanted adjacent convoy is disrupted", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.4"));
    const result = runDatcMovement(caseOrders("6.G.4"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:pic"]), parseLocation("Belgium"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:eng"]), false);
  });

  it("6.G.5 swaps with multiple fleets when one own fleet shows convoy intent", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.5"));
    const result = runDatcMovement(caseOrders("6.G.5"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:rom"]), parseLocation("Apulia"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:apu"]), parseLocation("Rome"));
  });

  it("6.G.6 swaps when own convoy intent exists but the actual route uses foreign fleets", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.6"));
    const result = runDatcMovement(caseOrders("6.G.6"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lvp"]), parseLocation("Edinburgh"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:edi"]), parseLocation("Liverpool"));
  });

  it("6.G.7 ignores illegal adjacent convoy intent", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.7"));
    const result = runDatcMovement(caseOrders("6.G.7"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nwy"]), parseLocation("Norway"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:swe"]), parseLocation("Sweden"));
  });

  it("6.G.8 does not fall back to land when explicit convoy is absent", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.8"));
    const result = runDatcMovement(caseOrders("6.G.8"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:bel"]), parseLocation("Belgium"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:hol"]), parseLocation("Kiel"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("Helgoland Bight"));
  });

  it("6.G.9 swaps instead of dislodging when convoy intent exists", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.9"));
    const result = runDatcMovement(caseOrders("6.G.9"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:nwy"]), parseLocation("Sweden"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:swe"]), parseLocation("Norway"));
  });

  it("6.G.10 lets a convoyed adjacent attack dislodge without becoming head-to-head", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.10"));
    const result = runDatcMovement(caseOrders("6.G.10"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:nwy"]), parseLocation("Sweden"));
    assert.equal(hasUnit(result.nextState, scenario.units["army:swe"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nwg"]), parseLocation("Norwegian Sea"));
  });

  it("6.G.11 does not fall back from a paradoxical adjacent convoy", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.11"));
    const result = runDatcMovement(caseOrders("6.G.11"));

    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("Skagerrak"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:swe"]), parseLocation("Sweden"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:ska"]), false);
  });

  it("6.G.12 swaps two units with two adjacent convoys", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.12"));
    const result = runDatcMovement(caseOrders("6.G.12"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lvp"]), parseLocation("Edinburgh"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:edi"]), parseLocation("Liverpool"));
  });

  it("6.G.13 does not cut support by attacking itself via convoy", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.13"));
    const result = runDatcMovement(caseOrders("6.G.13"));

    assert.equal(hasUnit(result.nextState, scenario.units["army:tri"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:alb"]), parseLocation("Trieste"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:ven"]), parseLocation("Venice"));
  });

  it("6.G.14 bounces the third-party attack while dislodging by adjacent convoy", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.14"));
    const result = runDatcMovement(caseOrders("6.G.14"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:nwy"]), parseLocation("Sweden"));
    assert.equal(hasUnit(result.nextState, scenario.units["army:swe"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nwg"]), parseLocation("Norwegian Sea"));
  });

  it("6.G.15 bounces and dislodges with double adjacent convoys", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.15"));
    const result = runDatcMovement(caseOrders("6.G.15"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("Belgium"));
    assert.equal(hasUnit(result.nextState, scenario.units["army:bel"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["army:yor"]), parseLocation("Yorkshire"));
  });

  it("6.G.16 avoids two units ending in Norway when one adjacent move is convoyed", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.16"));
    const result = runDatcMovement(caseOrders("6.G.16"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:nwy"]), parseLocation("Sweden"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:swe"]), parseLocation("Norway"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("North Sea"));
  });

  it("6.G.17 avoids two units ending in Norway when the other adjacent move is convoyed", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.17"));
    const result = runDatcMovement(caseOrders("6.G.17"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:nwy"]), parseLocation("Sweden"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:swe"]), parseLocation("Norway"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("North Sea"));
  });

  it("6.G.18 avoids two units ending in London with double adjacent convoys", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.18"));
    const result = runDatcMovement(caseOrders("6.G.18"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:lon"]), parseLocation("Belgium"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:bel"]), parseLocation("London"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:yor"]), parseLocation("Yorkshire"));
  });

  it("6.G.19 ignores unnecessary illegal convoy intent", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.19"));
    const result = runDatcMovement(caseOrders("6.G.19"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:mar"]), parseLocation("Marseilles"));
    assert.equal(unitLocation(result.nextState, scenario.units["army:spa"]), parseLocation("Spain"));
  });

  it("6.G.20 does not fall back when an explicit adjacent convoy is disrupted", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.G.20"));
    const result = runDatcMovement(caseOrders("6.G.20"));

    assert.equal(unitLocation(result.nextState, scenario.units["army:pic"]), parseLocation("Picardy"));
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:eng"]), false);
  });
});

describe("DATC 6.H retreats", () => {
  it("6.H.1 rejects support during retreat and disbands contested retreats", () => {
    const scenario = parseDatcMovementScenario(caseOrderBlock("6.H.1", 0));
    const retreatState = runDatcMovement(caseOrderBlock("6.H.1", 0)).nextState;
    const result = adjudicate(
      retreatState,
      [
        { id: orderId("austria-f-tri-retreat"), type: "retreat", unitId: scenario.units["fleet:tri"], to: parseLocation("Albania") },
        { id: orderId("austria-a-ser-support"), type: "support", unitId: scenario.units["army:ser"], supportedUnitId: scenario.units["fleet:tri"], to: parseLocation("Albania") },
        { id: orderId("turkey-f-gre-retreat"), type: "retreat", unitId: scenario.units["fleet:gre"], to: parseLocation("Albania") },
      ],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("austria-a-ser-support")].status, "invalid");
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:tri"]), false);
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:gre"]), false);
  });

  it("6.H.2 rejects support from a retreating unit", () => {
    const scenario = parseDatcMovementScenario(caseOrderBlock("6.H.2", 0));
    const retreatState = runDatcMovement(caseOrderBlock("6.H.2", 0)).nextState;
    const result = adjudicate(
      retreatState,
      [
        { id: orderId("england-f-nwy-retreat"), type: "retreat", unitId: scenario.units["fleet:nwy"], to: parseLocation("North Sea") },
        { id: orderId("russia-f-edi-retreat"), type: "retreat", unitId: scenario.units["fleet:edi"], to: parseLocation("North Sea") },
        { id: orderId("russia-f-hol-support"), type: "support", unitId: scenario.units["fleet:hol"], supportedUnitId: scenario.units["fleet:edi"], to: parseLocation("North Sea") },
      ],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("russia-f-hol-support")].status, "invalid");
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:nwy"]), false);
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:edi"]), false);
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:hol"]), false);
  });

  it("6.H.3 rejects convoy orders during retreat", () => {
    const scenario = parseDatcMovementScenario(caseOrderBlock("6.H.3", 0));
    const retreatState = runDatcMovement(caseOrderBlock("6.H.3", 0)).nextState;
    const result = adjudicate(
      retreatState,
      [
        { id: orderId("england-a-hol-retreat"), type: "retreat", unitId: scenario.units["army:hol"], to: parseLocation("Yorkshire") },
        { id: orderId("england-f-nth-convoy"), type: "convoy", unitId: scenario.units["fleet:nth"], convoyedUnitId: scenario.units["army:hol"], to: parseLocation("Yorkshire") },
      ],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("england-f-nth-convoy")].status, "invalid");
    assert.equal(hasUnit(result.nextState, scenario.units["army:hol"]), false);
  });

  it("6.H.4 rejects orders for non-retreating units during retreat", () => {
    const scenario = parseDatcMovementScenario(caseOrderBlock("6.H.4", 0));
    const retreatState = runDatcMovement(caseOrderBlock("6.H.4", 0)).nextState;
    const result = adjudicate(
      retreatState,
      [
        { id: orderId("england-a-hol-retreat"), type: "retreat", unitId: scenario.units["army:hol"], to: parseLocation("Belgium") },
        { id: orderId("england-f-nth-move"), type: "move", unitId: scenario.units["fleet:nth"], to: parseLocation("Norwegian Sea") },
      ],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("england-f-nth-move")].status, "invalid");
    assert.equal(unitLocation(result.nextState, scenario.units["army:hol"]), parseLocation("Belgium"));
    assert.equal(unitLocation(result.nextState, scenario.units["fleet:nth"]), parseLocation("North Sea"));
  });

  it("6.H.5 excludes the attack origin from retreat options", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.H.5"));
    const result = runDatcMovement(caseOrders("6.H.5"));
    const retreat = pendingRetreat(result.nextState, scenario.units["fleet:ank"]);

    assert.equal(retreat.options.includes(parseLocation("Black Sea")), false);
  });

  it("6.H.6 excludes standoff provinces from retreat options", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.H.6"));
    const result = runDatcMovement(caseOrders("6.H.6"));
    const retreat = pendingRetreat(result.nextState, scenario.units["army:vie"]);

    assert.equal(retreat.options.includes(parseLocation("Bohemia")), false);
  });

  it("6.H.7 disbands multiple retreats to the same province", () => {
    const scenario = parseDatcMovementScenario(caseOrderBlock("6.H.7", 0));
    const retreatState = runDatcMovement(caseOrderBlock("6.H.7", 0)).nextState;
    const result = adjudicate(
      retreatState,
      [
        { id: orderId("italy-a-boh-retreat"), type: "retreat", unitId: scenario.units["army:boh"], to: parseLocation("Tyrolia") },
        { id: orderId("italy-a-vie-retreat"), type: "retreat", unitId: scenario.units["army:vie"], to: parseLocation("Tyrolia") },
      ],
      classic1901,
    );

    assert.equal(hasUnit(result.nextState, scenario.units["army:boh"]), false);
    assert.equal(hasUnit(result.nextState, scenario.units["army:vie"]), false);
  });

  it("6.H.8 disbands three retreats to the same province", () => {
    const scenario = parseDatcMovementScenario(caseOrderBlock("6.H.8", 0));
    const retreatState = runDatcMovement(caseOrderBlock("6.H.8", 0)).nextState;
    const result = adjudicate(
      retreatState,
      [
        { id: orderId("england-f-nwy-retreat"), type: "retreat", unitId: scenario.units["fleet:nwy"], to: parseLocation("North Sea") },
        { id: orderId("russia-f-edi-retreat"), type: "retreat", unitId: scenario.units["fleet:edi"], to: parseLocation("North Sea") },
        { id: orderId("russia-f-hol-retreat"), type: "retreat", unitId: scenario.units["fleet:hol"], to: parseLocation("North Sea") },
      ],
      classic1901,
    );

    assert.equal(hasUnit(result.nextState, scenario.units["fleet:nwy"]), false);
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:edi"]), false);
    assert.equal(hasUnit(result.nextState, scenario.units["fleet:hol"]), false);
  });

  it("6.H.9 allows retreat to a province vacated by the attacker", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.H.9"));
    const result = runDatcMovement(caseOrders("6.H.9"));
    const retreat = pendingRetreat(result.nextState, scenario.units["fleet:kie"]);

    assert.equal(retreat.options.includes(parseLocation("Berlin")), true);
  });

  it("6.H.10 does not globally contest the attack origin for other retreats", () => {
    const scenario = parseDatcMovementScenario(caseOrderBlock("6.H.10", 0));
    const retreatState = runDatcMovement(caseOrderBlock("6.H.10", 0)).nextState;
    const result = adjudicate(
      retreatState,
      [
        { id: orderId("england-a-kie-retreat"), type: "retreat", unitId: scenario.units["army:kie"], to: parseLocation("Berlin") },
        { id: orderId("germany-a-pru-retreat"), type: "retreat", unitId: scenario.units["army:pru"], to: parseLocation("Berlin") },
      ],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("england-a-kie-retreat")].status, "invalid");
    assert.equal(hasUnit(result.nextState, scenario.units["army:kie"]), false);
    assert.equal(unitLocation(result.nextState, scenario.units["army:pru"]), parseLocation("Berlin"));
  });

  it("6.H.11 allows retreat to the origin province of an adjacent convoyed attacker", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.H.11"));
    const result = runDatcMovement(caseOrders("6.H.11"));
    const retreat = pendingRetreat(result.nextState, scenario.units["army:mar"]);

    assert.equal(retreat.options.includes(parseLocation("Gascony")), true);
  });

  it("6.H.12 allows retreat to the origin province when both adjacent moves used convoys", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.H.12"));
    const result = runDatcMovement(caseOrders("6.H.12"));
    const retreat = pendingRetreat(result.nextState, scenario.units["army:lvp"]);

    assert.equal(retreat.options.includes(parseLocation("Edinburgh")), true);
  });

  it("6.H.13 does not use movement-phase convoy orders for retreat options", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.H.13"));
    const result = runDatcMovement(caseOrders("6.H.13"));
    const retreat = pendingRetreat(result.nextState, scenario.units["army:pic"]);

    assert.equal(retreat.options.includes(parseLocation("London")), false);
  });

  it("6.H.14 does not use movement-phase support orders during retreats", () => {
    const scenario = parseDatcMovementScenario(caseOrderBlock("6.H.14", 0));
    const retreatState = runDatcMovement(caseOrderBlock("6.H.14", 0)).nextState;
    const result = adjudicate(
      retreatState,
      [
        { id: orderId("england-a-pic-retreat"), type: "retreat", unitId: scenario.units["army:pic"], to: parseLocation("Belgium") },
        { id: orderId("france-a-bur-retreat"), type: "retreat", unitId: scenario.units["army:bur"], to: parseLocation("Belgium") },
      ],
      classic1901,
    );

    assert.equal(hasUnit(result.nextState, scenario.units["army:pic"]), false);
    assert.equal(hasUnit(result.nextState, scenario.units["army:bur"]), false);
  });

  it("6.H.15 prevents coastal crawl in retreat", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.H.15"));
    const result = runDatcMovement(caseOrders("6.H.15"));
    const retreat = pendingRetreat(result.nextState, scenario.units["fleet:por"]);

    assert.equal(retreat.options.includes(parseLocation("Spain(nc)")), false);
  });

  it("6.H.16 treats a contested province as unavailable on both coasts", () => {
    const scenario = parseDatcMovementScenario(caseOrders("6.H.16"));
    const result = runDatcMovement(caseOrders("6.H.16"));
    const retreat = pendingRetreat(result.nextState, scenario.units["fleet:wes"]);

    assert.equal(retreat.options.includes(parseLocation("Spain(sc)")), false);
  });
});

describe("DATC 6.I builds", () => {
  it("6.I.1 handles too many build orders one by one", () => {
    const state = buildState(
      {
        ...classic1901.initialState.supplyCenterOwners,
        [locationId("war")]: classic1901Powers.germany,
      },
      [
        unit("germany-a-hol", classic1901Powers.germany, "army", "hol"),
        unit("germany-a-ruh", classic1901Powers.germany, "army", "ruh"),
        unit("germany-f-den", classic1901Powers.germany, "fleet", "den"),
      ],
    );

    const result = adjudicate(
      state,
      [
        { id: orderId("germany-build-war"), type: "build", power: classic1901Powers.germany, unitId: unitId("germany-a-war"), unitType: "army", location: locationId("war") },
        { id: orderId("germany-build-kie"), type: "build", power: classic1901Powers.germany, unitId: unitId("germany-a-kie"), unitType: "army", location: locationId("kie") },
        { id: orderId("germany-build-mun"), type: "build", power: classic1901Powers.germany, unitId: unitId("germany-a-mun-build"), unitType: "army", location: locationId("mun") },
      ],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("germany-build-war")].status, "invalid");
    assert.equal(result.orderResults[orderId("germany-build-kie")].status, "succeeds");
    assert.equal(result.orderResults[orderId("germany-build-mun")].status, "fails");
    assert.equal(unitLocation(result.nextState, unitId("germany-a-kie")), parseLocation("Kiel"));
    assert.equal(hasUnit(result.nextState, unitId("germany-a-mun-build")), false);
  });

  it("6.I.2 rejects fleet builds in land provinces", () => {
    const state = buildState(
      classic1901.initialState.supplyCenterOwners,
      classic1901.initialState.units.filter((candidate) => candidate.id !== unitId("russia-a-mos")),
    );

    const result = adjudicate(
      state,
      [{ id: orderId("russia-build-f-mos"), type: "build", power: classic1901Powers.russia, unitId: unitId("russia-f-mos"), unitType: "fleet", location: locationId("mos") }],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("russia-build-f-mos")].status, "invalid");
    assert.equal(hasUnit(result.nextState, unitId("russia-f-mos")), false);
  });

  it("6.I.3 rejects builds in occupied supply centers", () => {
    const state = buildState(
      {
        ...classic1901.initialState.supplyCenterOwners,
        [locationId("hol")]: classic1901Powers.germany,
      },
      classic1901.initialState.units,
    );

    const result = adjudicate(
      state,
      [{ id: orderId("germany-build-ber"), type: "build", power: classic1901Powers.germany, unitId: unitId("germany-a-ber-build"), unitType: "army", location: locationId("ber") }],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("germany-build-ber")].status, "invalid");
    assert.equal(hasUnit(result.nextState, unitId("germany-a-ber-build")), false);
  });

  it("6.I.4 requires both coasts of a build province to be empty", () => {
    const state = buildState(
      {
        ...classic1901.initialState.supplyCenterOwners,
        [locationId("swe")]: classic1901Powers.russia,
      },
      classic1901.initialState.units,
    );

    const result = adjudicate(
      state,
      [{ id: orderId("russia-build-a-stp"), type: "build", power: classic1901Powers.russia, unitId: unitId("russia-a-stp-build"), unitType: "army", location: locationId("stp") }],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("russia-build-a-stp")].status, "invalid");
    assert.equal(result.orderResults[orderId("russia-build-a-stp")].reason, "Build location is occupied.");
  });

  it("6.I.5 rejects builds in home centers that are not owned", () => {
    const state = buildState(
      {
        ...classic1901.initialState.supplyCenterOwners,
        [locationId("ber")]: classic1901Powers.russia,
        [locationId("hol")]: classic1901Powers.germany,
      },
      [
        unit("germany-a-ruh", classic1901Powers.germany, "army", "ruh"),
        unit("germany-f-den", classic1901Powers.germany, "fleet", "den"),
        unit("germany-a-kie", classic1901Powers.germany, "army", "kie"),
      ],
    );

    const result = adjudicate(
      state,
      [{ id: orderId("germany-build-ber"), type: "build", power: classic1901Powers.germany, unitId: unitId("germany-a-ber-build"), unitType: "army", location: locationId("ber") }],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("germany-build-ber")].status, "invalid");
    assert.equal(result.orderResults[orderId("germany-build-ber")].reason, "Build location is not owned by that power.");
  });

  it("6.I.6 rejects builds in owned non-home supply centers", () => {
    const state = buildState(
      {
        ...classic1901.initialState.supplyCenterOwners,
        [locationId("war")]: classic1901Powers.germany,
      },
      [
        unit("germany-a-ruh", classic1901Powers.germany, "army", "ruh"),
        unit("germany-f-den", classic1901Powers.germany, "fleet", "den"),
        unit("germany-a-kie", classic1901Powers.germany, "army", "kie"),
      ],
    );

    const result = adjudicate(
      state,
      [{ id: orderId("germany-build-war"), type: "build", power: classic1901Powers.germany, unitId: unitId("germany-a-war"), unitType: "army", location: locationId("war") }],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("germany-build-war")].status, "invalid");
    assert.equal(result.orderResults[orderId("germany-build-war")].reason, "Build location is not a home supply center for that power.");
  });

  it("6.I.7 allows only one build in a home supply center", () => {
    const state = buildState(
      {
        ...classic1901.initialState.supplyCenterOwners,
        [locationId("swe")]: classic1901Powers.russia,
        [locationId("nwy")]: classic1901Powers.russia,
      },
      classic1901.initialState.units.filter((candidate) => candidate.id !== unitId("russia-a-mos")),
    );

    const result = adjudicate(
      state,
      [
        { id: orderId("russia-build-mos-1"), type: "build", power: classic1901Powers.russia, unitId: unitId("russia-a-mos-1"), unitType: "army", location: locationId("mos") },
        { id: orderId("russia-build-mos-2"), type: "build", power: classic1901Powers.russia, unitId: unitId("russia-a-mos-2"), unitType: "army", location: locationId("mos") },
      ],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("russia-build-mos-1")].status, "succeeds");
    assert.equal(result.orderResults[orderId("russia-build-mos-2")].status, "invalid");
    assert.equal(unitLocation(result.nextState, unitId("russia-a-mos-1")), parseLocation("Moscow"));
    assert.equal(hasUnit(result.nextState, unitId("russia-a-mos-2")), false);
  });
});

describe("DATC 6.J civil disorder and disbands", () => {
  it("6.J.1 handles too many disband orders one by one", () => {
    const state = adjustmentState(classic1901Powers.france, ["par"], [
      unit("france-a-par", classic1901Powers.france, "army", "par"),
      unit("france-a-pic", classic1901Powers.france, "army", "pic"),
    ]);

    const result = adjudicate(
      state,
      [
        { id: orderId("france-remove-lyo"), type: "disband", unitId: unitId("france-f-lyo") },
        { id: orderId("france-remove-pic"), type: "disband", unitId: unitId("france-a-pic") },
        { id: orderId("france-remove-par"), type: "disband", unitId: unitId("france-a-par") },
      ],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("france-remove-lyo")].status, "invalid");
    assert.equal(result.orderResults[orderId("france-remove-pic")].status, "succeeds");
    assert.equal(result.orderResults[orderId("france-remove-par")].status, "fails");
    assert.equal(hasUnit(result.nextState, unitId("france-a-pic")), false);
    assert.equal(hasUnit(result.nextState, unitId("france-a-par")), true);
  });

  it("6.J.2 removes another unit when the same unit is ordered twice", () => {
    const state = adjustmentState(classic1901Powers.france, [], [
      unit("france-a-par", classic1901Powers.france, "army", "par"),
      unit("france-a-pic", classic1901Powers.france, "army", "pic"),
    ]);

    const result = adjudicate(
      state,
      [
        { id: orderId("france-remove-par-1"), type: "disband", unitId: unitId("france-a-par") },
        { id: orderId("france-remove-par-2"), type: "disband", unitId: unitId("france-a-par") },
      ],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("france-remove-par-1")].status, "succeeds");
    assert.equal(result.orderResults[orderId("france-remove-par-2")].status, "invalid");
    assert.equal(hasUnit(result.nextState, unitId("france-a-par")), false);
    assert.equal(hasUnit(result.nextState, unitId("france-a-pic")), false);
  });

  it("6.J.3 removes the army farther from owned supply centers", () => {
    const result = adjudicate(
      adjustmentState(classic1901Powers.russia, ["stp"], [
        unit("russia-a-lvn", classic1901Powers.russia, "army", "lvn"),
        unit("russia-a-swe", classic1901Powers.russia, "army", "swe"),
      ]),
      [],
      classic1901,
    );

    assert.equal(hasUnit(result.nextState, unitId("russia-a-lvn")), true);
    assert.equal(hasUnit(result.nextState, unitId("russia-a-swe")), false);
  });

  it("6.J.4 removes alphabetically first armies at equal distance", () => {
    const result = adjudicate(
      adjustmentState(classic1901Powers.russia, ["mos"], [
        unit("russia-a-lvn", classic1901Powers.russia, "army", "lvn"),
        unit("russia-a-ukr", classic1901Powers.russia, "army", "ukr"),
      ]),
      [],
      classic1901,
    );

    assert.equal(hasUnit(result.nextState, unitId("russia-a-lvn")), false);
    assert.equal(hasUnit(result.nextState, unitId("russia-a-ukr")), true);
  });

  it("6.J.5 removes the fleet farther from owned supply centers", () => {
    const result = adjudicate(
      adjustmentState(classic1901Powers.russia, ["stp"], [
        unit("russia-f-ska", classic1901Powers.russia, "fleet", "ska"),
        unit("russia-f-ber", classic1901Powers.russia, "fleet", "ber"),
      ]),
      [],
      classic1901,
    );

    assert.equal(hasUnit(result.nextState, unitId("russia-f-ska")), true);
    assert.equal(hasUnit(result.nextState, unitId("russia-f-ber")), false);
  });

  it("6.J.6 removes alphabetically first fleets at equal distance", () => {
    const result = adjudicate(
      adjustmentState(classic1901Powers.russia, ["mun"], [
        unit("russia-f-bot", classic1901Powers.russia, "fleet", "bot"),
        unit("russia-f-nth", classic1901Powers.russia, "fleet", "nth"),
      ]),
      [],
      classic1901,
    );

    assert.equal(hasUnit(result.nextState, unitId("russia-f-bot")), false);
    assert.equal(hasUnit(result.nextState, unitId("russia-f-nth")), true);
  });

  it("6.J.7 removes fleets before armies when distance is equal", () => {
    const result = adjudicate(
      adjustmentState(classic1901Powers.russia, ["stp", "war"], [
        unit("russia-a-boh", classic1901Powers.russia, "army", "boh"),
        unit("russia-f-ska", classic1901Powers.russia, "fleet", "ska"),
        unit("russia-f-nth", classic1901Powers.russia, "fleet", "nth"),
      ]),
      [],
      classic1901,
    );

    assert.equal(hasUnit(result.nextState, unitId("russia-a-boh")), true);
    assert.equal(hasUnit(result.nextState, unitId("russia-f-nth")), false);
    assert.equal(hasUnit(result.nextState, unitId("russia-f-ska")), true);
  });

  it("6.J.8 removes a farther army before a closer fleet", () => {
    const result = adjudicate(
      adjustmentState(classic1901Powers.russia, ["war"], [
        unit("russia-a-tyr", classic1901Powers.russia, "army", "tyr"),
        unit("russia-f-bal", classic1901Powers.russia, "fleet", "bal"),
      ]),
      [],
      classic1901,
    );

    assert.equal(hasUnit(result.nextState, unitId("russia-a-tyr")), false);
    assert.equal(hasUnit(result.nextState, unitId("russia-f-bal")), true);
  });

  it("6.J.9 counts distance from both coasts of an owned supply center", () => {
    const balticResult = adjudicate(
      adjustmentState(classic1901Powers.russia, ["stp", "sev"], [
        unit("russia-a-gre", classic1901Powers.russia, "army", "gre"),
        unit("russia-a-sev", classic1901Powers.russia, "army", "sev"),
        unit("russia-f-bal", classic1901Powers.russia, "fleet", "bal"),
      ]),
      [],
      classic1901,
    );
    const skagerrakResult = adjudicate(
      adjustmentState(classic1901Powers.russia, ["stp", "sev"], [
        unit("russia-a-gre", classic1901Powers.russia, "army", "gre"),
        unit("russia-a-sev", classic1901Powers.russia, "army", "sev"),
        unit("russia-f-ska", classic1901Powers.russia, "fleet", "ska"),
      ]),
      [],
      classic1901,
    );

    assert.equal(hasUnit(balticResult.nextState, unitId("russia-a-gre")), false);
    assert.equal(hasUnit(balticResult.nextState, unitId("russia-f-bal")), true);
    assert.equal(hasUnit(skagerrakResult.nextState, unitId("russia-a-gre")), false);
    assert.equal(hasUnit(skagerrakResult.nextState, unitId("russia-f-ska")), true);
  });

  it("6.J.10 counts army distance across water for civil disorder", () => {
    const result = adjudicate(
      adjustmentState(classic1901Powers.italy, ["nap"], [
        unit("italy-a-gre", classic1901Powers.italy, "army", "gre"),
        unit("italy-a-pie", classic1901Powers.italy, "army", "pie"),
      ]),
      [],
      classic1901,
    );

    assert.equal(hasUnit(result.nextState, unitId("italy-a-gre")), true);
    assert.equal(hasUnit(result.nextState, unitId("italy-a-pie")), false);
  });

  it("6.J.11 counts distance to owned supply centers", () => {
    const result = adjudicate(
      adjustmentState(classic1901Powers.italy, ["war"], [
        unit("italy-a-war", classic1901Powers.italy, "army", "war"),
        unit("italy-a-tus", classic1901Powers.italy, "army", "tus"),
      ]),
      [],
      classic1901,
    );

    assert.equal(hasUnit(result.nextState, unitId("italy-a-war")), true);
    assert.equal(hasUnit(result.nextState, unitId("italy-a-tus")), false);
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
  return caseOrderBlock(id, 0);
}

function caseOrderBlock(id: string, index: number): string {
  const datcCase = datcCases.find((candidate) => candidate.id === id);
  if (!datcCase) {
    throw new Error(`Unknown DATC case ${id}.`);
  }

  const orderBlock = datcCase.orderBlocks[index];
  if (!orderBlock) {
    throw new Error(`Unknown DATC case ${id} order block ${index}.`);
  }

  return orderBlock;
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

function pendingRetreat(state: GameState, id: UnitId) {
  const retreat = state.retreats?.find((candidate) => candidate.unit.id === id);
  if (!retreat) {
    throw new Error(`Missing pending retreat for ${id}`);
  }

  return retreat;
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

function buildState(supplyCenterOwners: GameState["supplyCenterOwners"], units: readonly Unit[]): GameState {
  return {
    ...classic1901.initialState,
    phase: { year: 1901, season: "winter", type: "build" },
    supplyCenterOwners,
    units,
    retreats: [],
  };
}

function adjustmentState(power: Unit["power"], ownedSupplyCenters: readonly string[], units: readonly Unit[]): GameState {
  const supplyCenterOwners = { ...classic1901.initialState.supplyCenterOwners };
  for (const [province, owner] of Object.entries(supplyCenterOwners)) {
    if (owner === power) {
      supplyCenterOwners[provinceId(province)] = undefined;
    }
  }
  for (const province of ownedSupplyCenters) {
    supplyCenterOwners[provinceId(province)] = power;
  }

  return buildState(supplyCenterOwners, units);
}

function unit(id: string, power: Unit["power"], type: Unit["type"], location: string): Unit {
  return {
    id: unitId(id),
    power,
    type,
    location: locationId(location),
  };
}
