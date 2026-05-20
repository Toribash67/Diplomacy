import {
  locationId,
  powerId,
  provinceId,
  unitId,
  type GameState,
  type LocationId,
  type PowerId,
  type ProvinceId,
  type VariantDefinition,
} from "../types.js";
import { buildSymmetricAdjacency } from "../variantBuilder.js";

const red = powerId("red");
const blue = powerId("blue");
const green = powerId("green");

const alpha = provinceId("alpha");
const bravo = provinceId("bravo");
const charlie = provinceId("charlie");
const delta = provinceId("delta");
const echo = provinceId("echo");

const alphaLocation = locationId("alpha");
const bravoLocation = locationId("bravo");
const charlieLocation = locationId("charlie");
const deltaLocation = locationId("delta");
const echoLocation = locationId("echo");
const locations = [alphaLocation, bravoLocation, charlieLocation, deltaLocation, echoLocation];

const supplyCenterOwners: Record<ProvinceId, PowerId | undefined> = {
  [alpha]: red,
  [bravo]: blue,
  [charlie]: green,
  [delta]: undefined,
  [echo]: undefined,
};

export const testVariantInitialState: GameState = {
  phase: { year: 1901, season: "spring", type: "movement" },
  supplyCenterOwners,
  units: [
    { id: unitId("red-1"), power: red, type: "army", location: alphaLocation },
    { id: unitId("blue-1"), power: blue, type: "army", location: bravoLocation },
    { id: unitId("green-1"), power: green, type: "army", location: charlieLocation },
  ],
};

export const testVariant: VariantDefinition = {
  id: "test-crossroads",
  name: "Test Crossroads",
  powers: [
    { id: red, name: "Red" },
    { id: blue, name: "Blue" },
    { id: green, name: "Green" },
  ],
  provinces: [
    { id: alpha, name: "Alpha", type: "land", supplyCenter: { owner: red, homePower: red } },
    { id: bravo, name: "Bravo", type: "land", supplyCenter: { owner: blue, homePower: blue } },
    { id: charlie, name: "Charlie", type: "land", supplyCenter: { owner: green, homePower: green } },
    { id: delta, name: "Delta", type: "land" },
    { id: echo, name: "Echo", type: "land" },
  ],
  locations: [
    { id: alphaLocation, province: alpha, name: "Alpha", type: "land", unitTypes: ["army"] },
    { id: bravoLocation, province: bravo, name: "Bravo", type: "land", unitTypes: ["army"] },
    { id: charlieLocation, province: charlie, name: "Charlie", type: "land", unitTypes: ["army"] },
    { id: deltaLocation, province: delta, name: "Delta", type: "land", unitTypes: ["army"] },
    { id: echoLocation, province: echo, name: "Echo", type: "land", unitTypes: ["army"] },
  ],
  adjacency: {
    ...buildSymmetricAdjacency(locations, [
      [alphaLocation, bravoLocation],
      [alphaLocation, deltaLocation],
      [bravoLocation, charlieLocation],
      [bravoLocation, deltaLocation],
      [charlieLocation, deltaLocation],
      [charlieLocation, echoLocation],
      [deltaLocation, echoLocation],
    ]),
  },
  initialState: testVariantInitialState,
};

export const testPowers = { red, blue, green };
export const testProvinces = { alpha, bravo, charlie, delta, echo };
export const testLocations: Record<keyof typeof testProvinces, LocationId> = {
  alpha: alphaLocation,
  bravo: bravoLocation,
  charlie: charlieLocation,
  delta: deltaLocation,
  echo: echoLocation,
};
export const testUnits = {
  redArmy: unitId("red-1"),
  blueArmy: unitId("blue-1"),
  greenArmy: unitId("green-1"),
};
