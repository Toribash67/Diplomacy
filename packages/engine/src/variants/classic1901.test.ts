import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adjudicate } from "../adjudicate.js";
import { locationId, orderId, unitId, type GameState, type Unit } from "../types.js";
import { validateVariant } from "../validateVariant.js";
import {
  classic1901,
  classic1901Adjacency,
  classic1901InitialState,
  classic1901Locations,
  classic1901PowerList,
  classic1901Powers,
  classic1901Provinces,
} from "./classic1901.js";

describe("classic1901 data", () => {
  it("defines the seven standard powers", () => {
    assert.deepEqual(
      classic1901PowerList.map((power) => power.id),
      [
        classic1901Powers.austria,
        classic1901Powers.england,
        classic1901Powers.france,
        classic1901Powers.germany,
        classic1901Powers.italy,
        classic1901Powers.russia,
        classic1901Powers.turkey,
      ],
    );
  });

  it("defines the standard province, supply center, and location counts", () => {
    assert.equal(classic1901Provinces.length, 75);
    assert.equal(classic1901Locations.length, 81);
    assert.equal(Object.keys(classic1901Adjacency).length, 81);
    assert.equal(classic1901Provinces.filter((province) => province.supplyCenter).length, 34);
    assert.equal(new Set(classic1901Provinces.map((province) => province.id)).size, classic1901Provinces.length);
    assert.equal(new Set(classic1901Locations.map((location) => location.id)).size, classic1901Locations.length);
    assert.ok(classic1901Provinces.every((province) => province.name));
    assert.ok(classic1901Locations.every((location) => location.name));
  });

  it("defines the standard Spring 1901 starting units", () => {
    const locationById = new Map(classic1901Locations.map((location) => [location.id, location]));
    const powerIds = new Set(classic1901PowerList.map((power) => power.id));

    assert.equal(classic1901InitialState.units.length, 22);
    assert.equal(classic1901InitialState.units.filter((unit) => unit.power === classic1901Powers.russia).length, 4);
    assert.equal(classic1901InitialState.units.filter((unit) => unit.type === "fleet").length, 9);
    assert.ok(classic1901InitialState.units.some((unit) => unit.id === "russia-f-stp-sc" && unit.location === "stp-sc"));
    assert.ok(classic1901InitialState.units.every((unit) => powerIds.has(unit.power)));
    assert.ok(classic1901InitialState.units.every((unit) => locationById.get(unit.location)?.unitTypes.includes(unit.type)));
    assert.equal(new Set(classic1901InitialState.units.map((unit) => locationById.get(unit.location)?.province)).size, 22);
  });

  it("validates as a complete variant", () => {
    const result = validateVariant(classic1901);

    assert.equal(result.valid, true);
    assert.deepEqual(result.issues, []);
  });

  it("allows known army and fleet movements", () => {
    const result = adjudicate(
      stateWith([
        unit("france-a-par", classic1901Powers.france, "army", "par"),
        unit("france-f-bre", classic1901Powers.france, "fleet", "bre"),
        unit("russia-f-stp-sc", classic1901Powers.russia, "fleet", "stp-sc"),
        unit("russia-f-stp-nc", classic1901Powers.russia, "fleet", "stp-nc"),
      ]),
      [
        { id: orderId("a-par-bur"), type: "move", unitId: unitId("france-a-par"), to: locationId("bur") },
        { id: orderId("f-bre-mao"), type: "move", unitId: unitId("france-f-bre"), to: locationId("mao") },
        { id: orderId("f-stp-sc-bot"), type: "move", unitId: unitId("russia-f-stp-sc"), to: locationId("bot") },
        { id: orderId("f-stp-nc-bar"), type: "move", unitId: unitId("russia-f-stp-nc"), to: locationId("bar") },
      ],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("a-par-bur")].status, "succeeds");
    assert.equal(result.orderResults[orderId("f-bre-mao")].status, "succeeds");
    assert.equal(result.orderResults[orderId("f-stp-sc-bot")].status, "succeeds");
    assert.equal(result.orderResults[orderId("f-stp-nc-bar")].status, "succeeds");
  });

  it("rejects known illegal army, fleet, and coast movements", () => {
    const result = adjudicate(
      stateWith([
        unit("france-a-par", classic1901Powers.france, "army", "par"),
        unit("russia-f-stp-sc", classic1901Powers.russia, "fleet", "stp-sc"),
        unit("italy-f-apu", classic1901Powers.italy, "fleet", "apu"),
      ]),
      [
        { id: orderId("a-par-eng"), type: "move", unitId: unitId("france-a-par"), to: locationId("eng") },
        { id: orderId("f-stp-sc-bar"), type: "move", unitId: unitId("russia-f-stp-sc"), to: locationId("bar") },
        { id: orderId("f-apu-rom"), type: "move", unitId: unitId("italy-f-apu"), to: locationId("rom") },
      ],
      classic1901,
    );

    assert.equal(result.orderResults[orderId("a-par-eng")].status, "invalid");
    assert.equal(result.orderResults[orderId("f-stp-sc-bar")].status, "invalid");
    assert.equal(result.orderResults[orderId("f-apu-rom")].status, "invalid");
  });
});

function stateWith(units: readonly Unit[]): GameState {
  return {
    ...classic1901InitialState,
    units,
  };
}

function unit(id: string, power: Unit["power"], type: Unit["type"], location: string): Unit {
  return {
    id: unitId(id),
    power,
    type,
    location: locationId(location),
  };
}
