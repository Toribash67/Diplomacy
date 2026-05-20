import {
  locationId,
  powerId,
  provinceId,
  unitId,
  type GameState,
  type Location,
  type LocationId,
  type Power,
  type PowerId,
  type Province,
  type ProvinceId,
  type Unit,
  type UnitType,
  type VariantDefinition,
} from "../types.js";
import { buildAdjacency, edge } from "../variantBuilder.js";

export const classic1901Powers = {
  austria: powerId("austria"),
  england: powerId("england"),
  france: powerId("france"),
  germany: powerId("germany"),
  italy: powerId("italy"),
  russia: powerId("russia"),
  turkey: powerId("turkey"),
};

export const classic1901PowerList: readonly Power[] = [
  { id: classic1901Powers.austria, name: "Austria" },
  { id: classic1901Powers.england, name: "England" },
  { id: classic1901Powers.france, name: "France" },
  { id: classic1901Powers.germany, name: "Germany" },
  { id: classic1901Powers.italy, name: "Italy" },
  { id: classic1901Powers.russia, name: "Russia" },
  { id: classic1901Powers.turkey, name: "Turkey" },
];

const seaProvinceIds = [
  "adr",
  "aeg",
  "bal",
  "bar",
  "bla",
  "bot",
  "eas",
  "eng",
  "hel",
  "ion",
  "iri",
  "lyo",
  "mao",
  "nao",
  "nth",
  "nwg",
  "ska",
  "tys",
  "wes",
] as const;

const landProvinceIds = [
  "boh",
  "bud",
  "bur",
  "gal",
  "mos",
  "mun",
  "par",
  "ruh",
  "ser",
  "sil",
  "tyr",
  "ukr",
  "vie",
  "war",
] as const;

const coastalProvinceIds = [
  "alb",
  "ank",
  "apu",
  "arm",
  "bel",
  "ber",
  "bre",
  "bul",
  "cly",
  "con",
  "den",
  "edi",
  "fin",
  "gas",
  "gre",
  "hol",
  "kie",
  "lon",
  "lvn",
  "lvp",
  "mar",
  "naf",
  "nap",
  "nwy",
  "pic",
  "pie",
  "por",
  "pru",
  "rom",
  "rum",
  "sev",
  "smy",
  "spa",
  "stp",
  "swe",
  "syr",
  "tri",
  "tun",
  "tus",
  "ven",
  "wal",
  "yor",
] as const;

const provinceNames: Record<string, string> = {
  adr: "Adriatic Sea",
  aeg: "Aegean Sea",
  alb: "Albania",
  ank: "Ankara",
  apu: "Apulia",
  arm: "Armenia",
  bal: "Baltic Sea",
  bar: "Barents Sea",
  bel: "Belgium",
  ber: "Berlin",
  bla: "Black Sea",
  boh: "Bohemia",
  bot: "Gulf of Bothnia",
  bre: "Brest",
  bud: "Budapest",
  bul: "Bulgaria",
  bur: "Burgundy",
  cly: "Clyde",
  con: "Constantinople",
  den: "Denmark",
  eas: "Eastern Mediterranean",
  edi: "Edinburgh",
  eng: "English Channel",
  fin: "Finland",
  gal: "Galicia",
  gas: "Gascony",
  gre: "Greece",
  hel: "Helgoland Bight",
  hol: "Holland",
  ion: "Ionian Sea",
  iri: "Irish Sea",
  kie: "Kiel",
  lon: "London",
  lvn: "Livonia",
  lvp: "Liverpool",
  lyo: "Gulf of Lyon",
  mao: "Mid-Atlantic Ocean",
  mar: "Marseilles",
  mos: "Moscow",
  mun: "Munich",
  naf: "North Africa",
  nao: "North Atlantic Ocean",
  nap: "Naples",
  nth: "North Sea",
  nwg: "Norwegian Sea",
  nwy: "Norway",
  par: "Paris",
  pic: "Picardy",
  pie: "Piedmont",
  por: "Portugal",
  pru: "Prussia",
  rom: "Rome",
  ruh: "Ruhr",
  rum: "Rumania",
  ser: "Serbia",
  sev: "Sevastopol",
  sil: "Silesia",
  ska: "Skagerrak",
  smy: "Smyrna",
  spa: "Spain",
  stp: "St Petersburg",
  swe: "Sweden",
  syr: "Syria",
  tri: "Trieste",
  tun: "Tunis",
  tus: "Tuscany",
  tyr: "Tyrolia",
  tys: "Tyrrhenian Sea",
  ukr: "Ukraine",
  ven: "Venice",
  vie: "Vienna",
  wal: "Wales",
  war: "Warsaw",
  wes: "Western Mediterranean",
  yor: "Yorkshire",
};

const supplyCenterOwners: Record<string, PowerId | undefined> = {
  ank: classic1901Powers.turkey,
  bel: undefined,
  ber: classic1901Powers.germany,
  bre: classic1901Powers.france,
  bud: classic1901Powers.austria,
  bul: undefined,
  con: classic1901Powers.turkey,
  den: undefined,
  edi: classic1901Powers.england,
  gre: undefined,
  hol: undefined,
  kie: classic1901Powers.germany,
  lon: classic1901Powers.england,
  lvp: classic1901Powers.england,
  mar: classic1901Powers.france,
  mos: classic1901Powers.russia,
  mun: classic1901Powers.germany,
  nap: classic1901Powers.italy,
  nwy: undefined,
  par: classic1901Powers.france,
  por: undefined,
  rom: classic1901Powers.italy,
  rum: undefined,
  ser: undefined,
  sev: classic1901Powers.russia,
  smy: classic1901Powers.turkey,
  spa: undefined,
  stp: classic1901Powers.russia,
  swe: undefined,
  tri: classic1901Powers.austria,
  tun: undefined,
  ven: classic1901Powers.italy,
  vie: classic1901Powers.austria,
  war: classic1901Powers.russia,
};

const homePowers: Record<string, PowerId | undefined> = Object.fromEntries(
  Object.entries(supplyCenterOwners).filter(([, owner]) => owner),
) as Record<string, PowerId | undefined>;

export const classic1901Provinces: readonly Province[] = [
  ...seaProvinceIds.map((id) => province(id, "sea")),
  ...landProvinceIds.map((id) => province(id, "land")),
  ...coastalProvinceIds.map((id) => province(id, "coastal")),
].sort((left, right) => left.id.localeCompare(right.id));

export const classic1901Locations: readonly Location[] = [
  ...seaProvinceIds.map((id) => location(id, id, "sea", "sea", ["fleet"])),
  ...landProvinceIds.map((id) => location(id, id, "land", "land", ["army"])),
  ...coastalProvinceIds
    .filter((id) => id !== "bul" && id !== "spa" && id !== "stp")
    .map((id) => location(id, id, "coast", "coastal", ["army", "fleet"])),
  location("bul", "bul", "land", "coastal", ["army"]),
  location("bul-ec", "bul", "coast", "coastal", ["fleet"], "Bulgaria East Coast"),
  location("bul-sc", "bul", "coast", "coastal", ["fleet"], "Bulgaria South Coast"),
  location("spa", "spa", "land", "coastal", ["army"]),
  location("spa-nc", "spa", "coast", "coastal", ["fleet"], "Spain North Coast"),
  location("spa-sc", "spa", "coast", "coastal", ["fleet"], "Spain South Coast"),
  location("stp", "stp", "land", "coastal", ["army"]),
  location("stp-nc", "stp", "coast", "coastal", ["fleet"], "St Petersburg North Coast"),
  location("stp-sc", "stp", "coast", "coastal", ["fleet"], "St Petersburg South Coast"),
].sort((left, right) => left.id.localeCompare(right.id));

const classic1901AdjacencyRows: Record<string, string> = {
  adr: "F:alb,apu,ion,tri,ven",
  aeg: "F:bul-sc,con,eas,gre,ion,smy",
  alb: "A:gre,ser,tri F:adr,gre,ion,tri",
  ank: "A:arm,con,smy F:arm,bla,con",
  apu: "A:nap,rom,ven F:adr,ion,nap,ven",
  arm: "A:ank,sev,smy,syr F:ank,bla,sev",
  bal: "F:ber,bot,den,kie,lvn,pru,swe",
  bar: "F:nwg,nwy,stp-nc",
  bel: "A:bur,hol,pic,ruh F:eng,hol,nth,pic",
  ber: "A:kie,mun,pru,sil F:bal,kie,pru",
  bla: "F:ank,arm,bul-ec,con,rum,sev",
  boh: "A:gal,mun,sil,tyr,vie",
  bot: "F:bal,fin,lvn,stp-sc,swe",
  bre: "A:gas,par,pic F:eng,gas,mao,pic",
  bud: "A:gal,rum,ser,tri,vie",
  bul: "A:con,gre,rum,ser",
  "bul-ec": "F:bla,con,rum",
  "bul-sc": "F:aeg,con,gre",
  bur: "A:bel,gas,mar,mun,par,pic,ruh",
  cly: "A:edi,lvp F:edi,lvp,nao,nwg",
  con: "A:ank,bul,smy F:aeg,ank,bla,bul-ec,bul-sc,smy",
  den: "A:kie,swe F:bal,hel,kie,nth,ska,swe",
  eas: "F:aeg,ion,smy,syr",
  edi: "A:cly,lvp,yor F:cly,nth,nwg,yor",
  eng: "F:bel,bre,iri,lon,mao,nth,pic,wal",
  fin: "A:nwy,stp,swe F:bot,stp-sc,swe",
  gal: "A:boh,bud,rum,sil,ukr,vie,war",
  gas: "A:bre,bur,mar,par,spa F:bre,mao,spa-nc",
  gre: "A:alb,bul,ser F:aeg,alb,bul-sc,ion",
  hel: "F:den,hol,kie,nth",
  hol: "A:bel,kie,ruh F:bel,hel,kie,nth",
  ion: "F:adr,aeg,alb,apu,eas,gre,nap,tun,tys",
  iri: "F:eng,lvp,mao,nao,wal",
  kie: "A:ber,den,hol,mun,ruh F:bal,ber,den,hel,hol",
  lon: "A:wal,yor F:eng,nth,wal,yor",
  lvn: "A:mos,pru,stp,war F:bal,bot,pru,stp-sc",
  lvp: "A:cly,edi,wal,yor F:cly,iri,nao,wal",
  lyo: "F:mar,pie,spa-sc,tus,tys,wes",
  mao: "F:bre,eng,gas,iri,naf,nao,por,spa-nc,spa-sc,wes",
  mar: "A:bur,gas,pie,spa F:lyo,pie,spa-sc",
  mos: "A:lvn,sev,stp,ukr,war",
  mun: "A:ber,boh,bur,kie,ruh,sil,tyr",
  naf: "A:tun F:mao,tun,wes",
  nao: "F:cly,iri,lvp,mao,nwg",
  nap: "A:apu,rom F:apu,ion,rom,tys",
  nth: "F:bel,den,edi,eng,hel,hol,lon,nwg,nwy,ska,yor",
  nwg: "F:bar,cly,edi,nao,nth,nwy",
  nwy: "A:fin,stp,swe F:bar,nth,nwg,ska,stp-nc,swe",
  par: "A:bre,bur,gas,pic",
  pic: "A:bel,bre,bur,par F:bel,bre,eng",
  pie: "A:mar,tus,tyr,ven F:lyo,mar,tus",
  por: "A:spa F:mao,spa-nc,spa-sc",
  pru: "A:ber,lvn,sil,war F:bal,ber,lvn",
  rom: "A:apu,nap,tus,ven F:nap,tus,tys",
  ruh: "A:bel,bur,hol,kie,mun",
  rum: "A:bud,bul,gal,ser,sev,ukr F:bla,bul-ec,sev",
  ser: "A:alb,bud,bul,gre,rum,tri",
  sev: "A:arm,mos,rum,ukr F:arm,bla,rum",
  sil: "A:ber,boh,gal,mun,pru,war",
  ska: "F:den,nth,nwy,swe",
  smy: "A:ank,arm,con,syr F:aeg,con,eas,syr",
  spa: "A:gas,mar,por",
  "spa-nc": "F:gas,mao,por",
  "spa-sc": "F:lyo,mao,mar,por,wes",
  stp: "A:fin,lvn,mos,nwy",
  "stp-nc": "F:bar,nwy",
  "stp-sc": "F:bot,fin,lvn",
  swe: "A:den,fin,nwy F:bal,bot,den,fin,nwy,ska",
  syr: "A:arm,smy F:eas,smy",
  tri: "A:alb,bud,ser,tyr,ven,vie F:adr,alb,ven",
  tun: "A:naf F:ion,naf,tys,wes",
  tus: "A:pie,rom,ven F:lyo,pie,rom,tys",
  tyr: "A:boh,mun,pie,tri,ven,vie",
  tys: "F:ion,lyo,nap,rom,tun,tus,wes",
  ukr: "A:gal,mos,rum,sev,war",
  ven: "A:apu,pie,rom,tri,tus,tyr F:adr,apu,tri",
  vie: "A:boh,bud,gal,tri,tyr",
  wal: "A:lon,lvp,yor F:eng,iri,lon,lvp",
  war: "A:gal,lvn,mos,pru,sil,ukr",
  wes: "F:lyo,mao,naf,spa-sc,tun,tys",
  yor: "A:edi,lon,lvp,wal F:edi,lon,nth",
};

export const classic1901Adjacency = buildAdjacency(
  classic1901Locations.map((location) => location.id),
  Object.entries(classic1901AdjacencyRows).flatMap(([from, row]) => parseAdjacencyRow(locationId(from), row)),
);

export const classic1901InitialUnits: readonly Unit[] = [
  unit("austria-a-bud", classic1901Powers.austria, "army", "bud"),
  unit("austria-a-vie", classic1901Powers.austria, "army", "vie"),
  unit("austria-f-tri", classic1901Powers.austria, "fleet", "tri"),
  unit("england-f-edi", classic1901Powers.england, "fleet", "edi"),
  unit("england-f-lon", classic1901Powers.england, "fleet", "lon"),
  unit("england-a-lvp", classic1901Powers.england, "army", "lvp"),
  unit("france-f-bre", classic1901Powers.france, "fleet", "bre"),
  unit("france-a-mar", classic1901Powers.france, "army", "mar"),
  unit("france-a-par", classic1901Powers.france, "army", "par"),
  unit("germany-f-kie", classic1901Powers.germany, "fleet", "kie"),
  unit("germany-a-ber", classic1901Powers.germany, "army", "ber"),
  unit("germany-a-mun", classic1901Powers.germany, "army", "mun"),
  unit("italy-f-nap", classic1901Powers.italy, "fleet", "nap"),
  unit("italy-a-rom", classic1901Powers.italy, "army", "rom"),
  unit("italy-a-ven", classic1901Powers.italy, "army", "ven"),
  unit("russia-a-war", classic1901Powers.russia, "army", "war"),
  unit("russia-a-mos", classic1901Powers.russia, "army", "mos"),
  unit("russia-f-sev", classic1901Powers.russia, "fleet", "sev"),
  unit("russia-f-stp-sc", classic1901Powers.russia, "fleet", "stp-sc"),
  unit("turkey-f-ank", classic1901Powers.turkey, "fleet", "ank"),
  unit("turkey-a-con", classic1901Powers.turkey, "army", "con"),
  unit("turkey-a-smy", classic1901Powers.turkey, "army", "smy"),
];

export const classic1901InitialState: GameState = {
  phase: { year: 1901, season: "spring", type: "movement" },
  supplyCenterOwners: Object.fromEntries(
    Object.entries(supplyCenterOwners).map(([id, owner]) => [provinceId(id), owner]),
  ) as Record<ProvinceId, PowerId | undefined>,
  units: classic1901InitialUnits,
};

export const classic1901: VariantDefinition = {
  id: "classic-1901",
  name: "Classic 1901",
  powers: classic1901PowerList,
  provinces: classic1901Provinces,
  locations: classic1901Locations,
  adjacency: classic1901Adjacency,
  initialState: classic1901InitialState,
};

function province(id: string, type: Province["type"]): Province {
  const owner = supplyCenterOwners[id];
  const homePower = homePowers[id];

  return {
    id: provinceId(id),
    name: provinceNames[id],
    type,
    ...(id in supplyCenterOwners ? { supplyCenter: { owner, homePower } } : {}),
  };
}

function location(
  id: string,
  provinceName: string,
  type: Location["type"],
  provinceType: Province["type"],
  unitTypes: Location["unitTypes"],
  name = provinceNames[provinceName],
): Location {
  return {
    id: locationId(id),
    province: provinceId(provinceName),
    name,
    type: provinceType === "sea" ? "sea" : type,
    unitTypes,
  };
}

function unit(id: string, power: PowerId, type: Unit["type"], locationName: string): Unit {
  return {
    id: unitId(id),
    power,
    type,
    location: locationId(locationName),
  };
}

function parseAdjacencyRow(from: LocationId, row: string) {
  return row.split(" ").flatMap((section) => {
    const [unitTypeToken, destinations] = section.split(":");
    const unitType = parseUnitType(unitTypeToken);
    return destinations.split(",").map((destination) => edge(from, locationId(destination), [unitType]));
  });
}

function parseUnitType(value: string): UnitType {
  if (value === "A") {
    return "army";
  }

  if (value === "F") {
    return "fleet";
  }

  throw new Error(`Unknown adjacency unit type ${value}.`);
}
