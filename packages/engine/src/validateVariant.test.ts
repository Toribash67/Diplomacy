import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { locationId, powerId, provinceId, unitId, type VariantDefinition } from "./types.js";
import { validateVariant } from "./validateVariant.js";
import { testVariant } from "./variants/testVariant.js";

describe("validateVariant", () => {
  it("accepts the test variant", () => {
    const result = validateVariant(testVariant);

    assert.equal(result.valid, true);
    assert.deepEqual(result.issues, []);
  });

  it("reports duplicate ids and broken references", () => {
    const unknownProvince = provinceId("unknown");
    const unknownLocation = locationId("unknown-location");
    const unknownPower = powerId("unknown-power");
    const invalidVariant: VariantDefinition = {
      ...testVariant,
      powers: [...testVariant.powers, testVariant.powers[0]],
      provinces: [...testVariant.provinces, testVariant.provinces[0]],
      locations: [...testVariant.locations, testVariant.locations[0]],
      adjacency: {
        ...testVariant.adjacency,
        [testVariant.locations[0].id]: [{ to: unknownLocation, unitTypes: ["army"] }],
      },
      initialState: {
        ...testVariant.initialState,
        units: [
          ...testVariant.initialState.units,
          {
            id: unitId("bad-unit"),
            power: unknownPower,
            type: "army",
            location: unknownLocation,
          },
        ],
        supplyCenterOwners: {
          ...testVariant.initialState.supplyCenterOwners,
          [unknownProvince]: unknownPower,
        },
      },
    };

    const result = validateVariant(invalidVariant);
    const messages = result.issues.map((issue) => issue.message);

    assert.equal(result.valid, false);
    assert.ok(messages.includes("Duplicate power id."));
    assert.ok(messages.includes("Duplicate province id."));
    assert.ok(messages.includes("Duplicate location id."));
    assert.ok(messages.includes("Adjacency references unknown location unknown-location."));
    assert.ok(messages.includes("Unit power does not reference a known power."));
    assert.ok(messages.includes("Unit location does not reference a known location."));
    assert.ok(messages.includes("Supply center owner is defined for an unknown province."));
  });

  it("reports one-way adjacency", () => {
    const result = validateVariant({
      ...testVariant,
      adjacency: {
        ...testVariant.adjacency,
        [testVariant.locations[0].id]: [],
      },
    });

    assert.equal(result.valid, false);
    assert.ok(result.issues.some((issue) => issue.message.includes("is not reciprocal")));
  });

  it("reports missing adjacency lists", () => {
    const [, ...locations] = testVariant.locations;
    const result = validateVariant({
      ...testVariant,
      locations,
    });

    assert.equal(result.valid, false);
    assert.ok(result.issues.some((issue) => issue.message === "Adjacency list is defined for an unknown location."));
    assert.ok(result.issues.some((issue) => issue.message === "Adjacency references unknown location alpha."));
  });

  it("reports invalid starting occupation", () => {
    const result = validateVariant({
      ...testVariant,
      initialState: {
        ...testVariant.initialState,
        units: [
          {
            ...testVariant.initialState.units[0],
            type: "fleet",
          },
        ],
      },
    });

    assert.equal(result.valid, false);
    assert.ok(result.issues.some((issue) => issue.message === "Unit type cannot occupy its starting location."));
  });
});
