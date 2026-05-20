// Generated from https://webdiplomacy.net/doc/DATC_v3_0.html.
// DATC Chapter 6 test cases are explicitly allowed to be copied separately by the source document.

export interface DatcCase {
  readonly id: string;
  readonly section: string;
  readonly title: string;
  readonly orderBlocks: readonly string[];
  readonly expectation: string;
}

export const datcSource = {
  url: "https://webdiplomacy.net/doc/DATC_v3_0.html",
  version: "3.0",
  chapter: "6. TEST CASES",
} as const;

export const datcCases = [
  {
    "id": "6.A.1",
    "section": "6.A",
    "title": "TEST CASE, MOVING TO AN AREA THAT IS NOT A NEIGHBOUR",
    "orderBlocks": [
      "England:\nF North Sea - Picardy"
    ],
    "expectation": "Check if an illegal move (without convoy) will fail.\nOrder should fail."
  },
  {
    "id": "6.A.2",
    "section": "6.A",
    "title": "TEST CASE, MOVE ARMY TO SEA",
    "orderBlocks": [
      "England:\nA Liverpool - Irish Sea"
    ],
    "expectation": "Check if an army could not be moved to open sea.\nOrder should fail."
  },
  {
    "id": "6.A.3",
    "section": "6.A",
    "title": "TEST CASE, MOVE FLEET TO LAND",
    "orderBlocks": [
      "Germany:\nF Kiel - Munich"
    ],
    "expectation": "Check whether a fleet cannot move to land.\nOrder should fail."
  },
  {
    "id": "6.A.4",
    "section": "6.A",
    "title": "TEST CASE, MOVE TO OWN SECTOR",
    "orderBlocks": [
      "Germany:\nF Kiel - Kiel"
    ],
    "expectation": "Moving to the same sector is an illegal move\r\n(2023 rulebook, page 7, \"An Army can be ordered to move into\r\nan adjacent inland or coastal province.\").\nProgram should not crash."
  },
  {
    "id": "6.A.5",
    "section": "6.A",
    "title": "TEST CASE, MOVE TO OWN SECTOR WITH CONVOY",
    "orderBlocks": [
      "England:\nF North Sea Convoys A Yorkshire - Yorkshire\nA Yorkshire - Yorkshire\nA Liverpool Supports A Yorkshire - Yorkshire\n\nGermany:\nF London - Yorkshire\nA Wales Supports F London - Yorkshire"
    ],
    "expectation": "Moving to the same sector is still illegal with convoy\r\n(2023 rulebook, page 7, \"Note: An Army can move across water\r\nprovinces from one coastal province to another...\").\nThe move of the army in Yorkshire is illegal. This makes the\r\nsupport of Liverpool also illegal and without the support, the Germans have\r\na stronger force. The army in London dislodges the army in\r\nYorkshire."
  },
  {
    "id": "6.A.6",
    "section": "6.A",
    "title": "TEST CASE, ORDERING A UNIT OF ANOTHER COUNTRY",
    "orderBlocks": [
      "Germany:\nF London - North Sea"
    ],
    "expectation": "Check whether someone cannot order a unit that is not his own unit.\nEngland has a fleet in London.\nOrder should fail."
  },
  {
    "id": "6.A.7",
    "section": "6.A",
    "title": "TEST CASE, ONLY ARMIES CAN BE CONVOYED",
    "orderBlocks": [
      "England:\nF London - Belgium\nF North Sea Convoys A London - Belgium"
    ],
    "expectation": "A fleet cannot be convoyed.\nMove from London to Belgium should fail."
  },
  {
    "id": "6.A.8",
    "section": "6.A",
    "title": "TEST CASE, SUPPORT TO HOLD YOURSELF IS NOT POSSIBLE",
    "orderBlocks": [
      "Italy:\nA Venice - Trieste\nA Tyrolia Supports A Venice - Trieste\n\nAustria:\nF Trieste Supports F Trieste"
    ],
    "expectation": "An army cannot get an additional hold power by supporting itself.\nThe army in Trieste should be dislodged."
  },
  {
    "id": "6.A.9",
    "section": "6.A",
    "title": "TEST CASE, FLEETS MUST FOLLOW COAST IF NOT ON SEA",
    "orderBlocks": [
      "Italy:\nF Rome - Venice"
    ],
    "expectation": "If two provinces are adjacent, that does not mean that a fleet can move between\r\nthose two provinces. An implementation that only holds one list of adjacent provinces\r\nfor each province is incorrect.\nMove fails. An army can go from Rome to Venice, but a fleet cannot."
  },
  {
    "id": "6.A.10",
    "section": "6.A",
    "title": "TEST CASE, SUPPORT ON UNREACHABLE DESTINATION NOT POSSIBLE",
    "orderBlocks": [
      "Austria:\nA Venice Hold\n\nItaly:\nF Rome Supports A Apulia - Venice\nA Apulia - Venice"
    ],
    "expectation": "The destination of the move that is supported must be reachable by the supporting unit.\nThe support of Rome is illegal, because Venice cannot be reached from Rome by a fleet. Venice is not dislodged."
  },
  {
    "id": "6.A.11",
    "section": "6.A",
    "title": "TEST CASE, SIMPLE BOUNCE",
    "orderBlocks": [
      "Austria:\nA Vienna - Tyrolia\n\nItaly:\nA Venice - Tyrolia"
    ],
    "expectation": "Two armies bouncing on each other.\nThe two units bounce."
  },
  {
    "id": "6.A.12",
    "section": "6.A",
    "title": "TEST CASE, BOUNCE OF THREE UNITS",
    "orderBlocks": [
      "Austria:\nA Vienna - Tyrolia\n\nGermany:\nA Munich - Tyrolia\n\nItaly:\nA Venice - Tyrolia"
    ],
    "expectation": "If three units move to the same area, the adjudicator should\r\nnot bounce the first two units and then let the third unit go to\r\nthe now open area.\nThe three units bounce.\n6.B. TEST CASES, COASTAL ISSUES"
  },
  {
    "id": "6.B.1",
    "section": "6.B",
    "title": "TEST CASE, MOVING WITH UNSPECIFIED COAST WHEN COAST IS NECESSARY",
    "orderBlocks": [
      "France:\nF Portugal - Spain"
    ],
    "expectation": "Coast is significant in this case:\nMove should fail."
  },
  {
    "id": "6.B.2",
    "section": "6.B",
    "title": "TEST CASE, MOVING WITH UNSPECIFIED COAST WHEN COAST IS NOT NECESSARY",
    "orderBlocks": [
      "France:\nF Gascony - Spain"
    ],
    "expectation": "There is only one coast possible in this case:\nSince the North Coast is the only coast that can be reached, it seems logical that a move is attempted to the north coast of Spain. See issue 4.B.2.\nI prefer that an attempt is made to the only possible coast, the north coast of Spain."
  },
  {
    "id": "6.B.3",
    "section": "6.B",
    "title": "TEST CASE, MOVING WITH WRONG COAST WHEN COAST IS NOT NECESSARY",
    "orderBlocks": [
      "France:\nF Gascony - Spain(sc)"
    ],
    "expectation": "If only one coast is possible, but the wrong coast can be specified.\nIf the rules are given a lenient interpretation, a move will be attempted to the north coast of Spain. However, this order is very precisely wrong. The order should be declared illegal and fleet should hold. See issue 4.B.3."
  },
  {
    "id": "6.B.4",
    "section": "6.B",
    "title": "TEST CASE, SUPPORT TO UNREACHABLE COAST ALLOWED",
    "orderBlocks": [
      "France:\nF Gascony - Spain(nc)\nF Marseilles Supports F Gascony - Spain(nc)\n\nItaly:\nF Western Mediterranean - Spain(sc)"
    ],
    "expectation": "A fleet can give support to a coast where it cannot go.\nAlthough the fleet in Marseilles cannot go to the north coast\r\nit can still support targeting the north coast. So, the support\r\nis successful, the move of the fleet in Gascony succeeds and the\r\nmove of the Italian fleet fails."
  },
  {
    "id": "6.B.5",
    "section": "6.B",
    "title": "TEST CASE, SUPPORT FROM UNREACHABLE COAST NOT ALLOWED",
    "orderBlocks": [
      "France:\nF Marseilles - Gulf of Lyon\nF Spain(nc) Supports F Marseilles - Gulf of Lyon\n\nItaly:\nF Gulf of Lyon Hold"
    ],
    "expectation": "A fleet cannot give support to an area that cannot be reached\r\nfrom the current coast of the fleet.\nThe Gulf of Lyon cannot be reached from the North Coast of Spain.\r\nTherefore, the support of Spain is illegal and the fleet in the Gulf\r\nof Lyon is not dislodged."
  },
  {
    "id": "6.B.6",
    "section": "6.B",
    "title": "TEST CASE, SUPPORT CAN BE CUT WITH OTHER COAST",
    "orderBlocks": [
      "England:\nF Irish Sea Supports F North Atlantic Ocean - Mid-Atlantic Ocean\nF North Atlantic Ocean - Mid-Atlantic Ocean\n\nFrance:\nF Spain(nc) Supports F Mid-Atlantic Ocean\nF Mid-Atlantic Ocean Hold\n\nItaly:\nF Gulf of Lyon - Spain(sc)"
    ],
    "expectation": "Support can be cut from the other coast.\nThe Italian fleet in the Gulf of Lyon will cut the support in Spain. That means that the French fleet in the Mid Atlantic Ocean will be dislodged by the English fleet in the North Atlantic Ocean."
  },
  {
    "id": "6.B.7",
    "section": "6.B",
    "title": "TEST CASE, SUPPORTING OWN UNIT WITH UNSPECIFIED COAST",
    "orderBlocks": [
      "France:\nF Portugal Supports F Mid-Atlantic Ocean - Spain\nF Mid-Atlantic Ocean - Spain(nc)\n\nItaly:\nF Gulf of Lyon Supports F Western Mediterranean - Spain(sc)\nF Western Mediterranean - Spain(sc)"
    ],
    "expectation": "It is a little bit harsh to reject this.\nSee issue 4.B.4.\nI prefer that the support succeeds and the Italian fleet in the Western Mediterranean bounces. However, if orders are checked on submission (such as in webbased play), support without coast should not be given as an option."
  },
  {
    "id": "6.B.8",
    "section": "6.B",
    "title": "TEST CASE, SUPPORTING WITH UNSPECIFIED COAST WHEN ONLY ONE COAST IS POSSIBLE",
    "orderBlocks": [
      "France:\nF Portugal Supports F Gascony - Spain\nF Gascony - Spain(nc)\n\nItaly:\nF Gulf of Lyon Supports F Western Mediterranean - Spain(sc)\nF Western Mediterranean - Spain(sc)"
    ],
    "expectation": "If coast is omitted while only coast is possible, it should be considered a poorly written order, that should be followed.\nSupport of Portugal is successful and the Italian fleet in the Western Mediterranean bounces with the French fleet from Gascony."
  },
  {
    "id": "6.B.9",
    "section": "6.B",
    "title": "TEST CASE, SUPPORTING WITH WRONG COAST",
    "orderBlocks": [
      "France:\nF Portugal Supports F Mid-Atlantic Ocean - Spain(nc)\nF Mid-Atlantic Ocean - Spain(sc)\n\nItaly:\nF Gulf of Lyon Supports F Western Mediterranean - Spain(sc)\nF Western Mediterranean - Spain(sc)"
    ],
    "expectation": "It should be possible to specify a coast and that coast should match.\nSee issue 4.B.4. Support of Portugal is invalid and the Italian fleet in the \r\nWestern Mediterranean moves successfully."
  },
  {
    "id": "6.B.10",
    "section": "6.B",
    "title": "TEST CASE, UNIT ORDERED WITH WRONG COAST",
    "orderBlocks": [
      "France:\nF Spain(nc) - Gulf of Lyon"
    ],
    "expectation": "A player might specify the wrong coast for the ordered unit.\nFrance has a fleet on the south coast of Spain and orders:\nIf only perfect orders are accepted, then the move will fail, but since\r\nthe coast for the ordered unit has no purpose, it might also be ignored\r\n(see issue 4.B.5).\nI prefer that a move will be attempted."
  },
  {
    "id": "6.B.11",
    "section": "6.B",
    "title": "TEST CASE, COAST CANNOT BE ORDERED TO CHANGE",
    "orderBlocks": [
      "France:\nF Spain(sc) - Gulf of Lyon"
    ],
    "expectation": "The coast cannot change by just ordering the other coast.\nFrance has a fleet on the north coast of Spain and orders:\nThe move fails."
  },
  {
    "id": "6.B.12",
    "section": "6.B",
    "title": "TEST CASE, ARMY MOVEMENT WITH COASTAL SPECIFICATION",
    "orderBlocks": [
      "France:\nA Gascony - Spain(nc)"
    ],
    "expectation": "For armies the coasts are irrelevant:\nIf only perfect orders are accepted, then the move will fail. But it is also possible that coasts are ignored in this case and a move will be attempted (see issue 4.B.6).\nI prefer that a move will be attempted."
  },
  {
    "id": "6.B.13",
    "section": "6.B",
    "title": "TEST CASE, COASTAL CRAWL NOT ALLOWED",
    "orderBlocks": [
      "Turkey:\nF Bulgaria(sc) - Constantinople\nF Constantinople - Bulgaria(ec)"
    ],
    "expectation": "If a fleet is leaving a sector from a certain coast while in the\r\nopposite direction another fleet is moving to another coast of the\r\nsector, it is still a head-to-head battle. This has been decided\r\nin the great revision of the 1961 rules that resulted in the 1971\r\nrules.\nBoth moves fail."
  },
  {
    "id": "6.B.14",
    "section": "6.B",
    "title": "TEST CASE, BUILDING WITH UNSPECIFIED COAST",
    "orderBlocks": [
      "Russia:\nBuild F St Petersburg"
    ],
    "expectation": "Coast must be specified in certain build cases:\nSee issue 4.B.7. Build fails."
  },
  {
    "id": "6.B.15",
    "section": "6.B",
    "title": "TEST CASE, SUPPORTING FOREIGN UNIT WITH UNSPECIFIED COAST",
    "orderBlocks": [
      "France:\nF Portugal Supports F Mid-Atlantic Ocean - Spain\n\nEngland:\nF Mid-Atlantic Ocean - Spain(nc)\n\nItaly:\nF Gulf of Lyon Supports F Western Mediterranean - Spain(sc)\nF Western Mediterranean - Spain(sc)"
    ],
    "expectation": "Opinions differ on this.\nSee issue 4.B.4.\nAlthough the move to the north coast of Spain might be a surprise for France, it is hard to believe that England somehow tricked France. Therefore, I prefer that the support succeeds and the Italian fleet in the Western Mediterranean bounces. However, if orders are checked on submission (such as in webbased play), support without coast should not be given as an option.\n6.C. TEST CASES, CIRCULAR MOVEMENT"
  },
  {
    "id": "6.C.1",
    "section": "6.C",
    "title": "TEST CASE, THREE ARMY CIRCULAR MOVEMENT",
    "orderBlocks": [
      "Turkey:\nF Ankara - Constantinople\nA Constantinople - Smyrna\nA Smyrna - Ankara"
    ],
    "expectation": "Three units can change place, even in spring 1901.\nAll three units will move."
  },
  {
    "id": "6.C.2",
    "section": "6.C",
    "title": "TEST CASE, THREE ARMY CIRCULAR MOVEMENT WITH SUPPORT",
    "orderBlocks": [
      "Turkey:\nF Ankara - Constantinople\nA Constantinople - Smyrna\nA Smyrna - Ankara\nA Bulgaria Supports F Ankara - Constantinople"
    ],
    "expectation": "Three units can change place, even when one gets support.\nOf course, the three units will move, but knowing how\r\nprograms are written, this can confuse the adjudicator."
  },
  {
    "id": "6.C.3",
    "section": "6.C",
    "title": "TEST CASE, A DISRUPTED THREE ARMY CIRCULAR MOVEMENT",
    "orderBlocks": [
      "Turkey:\nF Ankara - Constantinople\nA Constantinople - Smyrna\nA Smyrna - Ankara\nA Bulgaria - Constantinople"
    ],
    "expectation": "When one of the units bounces, the whole circular movement will hold.\nEvery unit will keep its place."
  },
  {
    "id": "6.C.4",
    "section": "6.C",
    "title": "TEST CASE, A CIRCULAR MOVEMENT WITH ATTACKED CONVOY",
    "orderBlocks": [
      "Austria:\nA Trieste - Serbia\nA Serbia - Bulgaria\n\nTurkey:\nA Bulgaria - Trieste\nF Aegean Sea Convoys A Bulgaria - Trieste\nF Ionian Sea Convoys A Bulgaria - Trieste\nF Adriatic Sea Convoys A Bulgaria - Trieste\n\nItaly:\nF Naples - Ionian Sea"
    ],
    "expectation": "When the circular movement contains an attacked convoy, the circular\r\nmovement succeeds. The adjudication algorithm should handle attack of\r\nconvoys before calculating circular movement.\nThe fleet in the Ionian Sea is attacked but not dislodged. The circular\r\nmovement succeeds. The Austrian and Turkish armies will advance."
  },
  {
    "id": "6.C.5",
    "section": "6.C",
    "title": "TEST CASE, A DISRUPTED CIRCULAR MOVEMENT DUE TO DISLODGED CONVOY",
    "orderBlocks": [
      "Austria:\nA Trieste - Serbia\nA Serbia - Bulgaria\n\nTurkey:\nA Bulgaria - Trieste\nF Aegean Sea Convoys A Bulgaria - Trieste\nF Ionian Sea Convoys A Bulgaria - Trieste\nF Adriatic Sea Convoys A Bulgaria - Trieste\n\nItaly:\nF Naples - Ionian Sea\nF Tunis Supports F Naples - Ionian Sea"
    ],
    "expectation": "When the circular movement contains a convoy, the circular\r\nmovement is disrupted when the convoying fleet is dislodged.\r\nThe adjudication algorithm should disrupt convoys before calculating\r\ncircular movement.\nDue to the dislodged convoying fleet, all Austrian and Turkish armies will not move."
  },
  {
    "id": "6.C.6",
    "section": "6.C",
    "title": "TEST CASE, TWO ARMIES WITH TWO CONVOYS",
    "orderBlocks": [
      "England:\nF North Sea Convoys A London - Belgium\nA London - Belgium\n\nFrance:\nF English Channel Convoys A Belgium - London\nA Belgium - London"
    ],
    "expectation": "Two armies can swap places even when they are not adjacent.\nBoth convoys should succeed."
  },
  {
    "id": "6.C.7",
    "section": "6.C",
    "title": "TEST CASE, DISRUPTED UNIT SWAP",
    "orderBlocks": [
      "England:\nF North Sea Convoys A London - Belgium\nA London - Belgium\n\nFrance:\nF English Channel Convoys A Belgium - London\nA Belgium - London\nA Burgundy - Belgium"
    ],
    "expectation": "If in a swap one of the unit bounces, then the swap fails.\nNone of the units will succeed to move."
  },
  {
    "id": "6.C.8",
    "section": "6.C",
    "title": "TEST CASE, NO SELF DISLODGEMENT IN DISRUPTED CIRCULAR MOVEMENT",
    "orderBlocks": [
      "Turkey:\nF Constantinople - Black Sea\nA Bulgaria - Constantinople\nA Smyrna Supports A Bulgaria - Constantinople\n\nRussia:\nF Black Sea - Bulgaria(ec)\n\nAustria\nA Serbia - Bulgaria"
    ],
    "expectation": "Self dislodgement is prohibited as usual in circular movement.\nNone of the units will succeed to move."
  },
  {
    "id": "6.C.9",
    "section": "6.C",
    "title": "TEST CASE, NO HELP IN DISLODGEMENT OF OWN UNIT IN DISRUPTED CIRCULAR MOVEMENT",
    "orderBlocks": [
      "Turkey:\nF Constantinople - Black Sea\nA Smyrna Supports A Bulgaria - Constantinople\n\nRussia:\nF Black Sea - Bulgaria(ec)\n\nAustria\nA Serbia - Bulgaria\nA Bulgaria - Constantinople"
    ],
    "expectation": "Helping to dislodge your own unit is prohibited as usual in circular movement.\nNone of the units will succeed to move.\n6.D. TEST CASES, SUPPORTS AND DISLODGES"
  },
  {
    "id": "6.D.1",
    "section": "6.D",
    "title": "TEST CASE, SUPPORTED HOLD CAN PREVENT DISLODGEMENT",
    "orderBlocks": [
      "Austria:\nF Adriatic Sea Supports A Trieste - Venice\nA Trieste - Venice\n\nItaly:\nA Venice Hold\nA Tyrolia Supports A Venice"
    ],
    "expectation": "The simplest support to hold order.\nThe support of Tyrolia prevents the army in Venice from being dislodged. The army in Trieste will not move."
  },
  {
    "id": "6.D.2",
    "section": "6.D",
    "title": "TEST CASE, A MOVE CUTS SUPPORT ON HOLD",
    "orderBlocks": [
      "Austria:\nF Adriatic Sea Supports A Trieste - Venice\nA Trieste - Venice\nA Vienna - Tyrolia\n\nItaly:\nA Venice Hold\nA Tyrolia Supports A Venice"
    ],
    "expectation": "The simplest support on hold cut.\nThe support of Tyrolia is cut by the army in Vienna. That means that the\r\narmy in Venice is dislodged by the army from Trieste."
  },
  {
    "id": "6.D.3",
    "section": "6.D",
    "title": "TEST CASE, A MOVE CUTS SUPPORT ON MOVE",
    "orderBlocks": [
      "Austria:\nF Adriatic Sea Supports A Trieste - Venice\nA Trieste - Venice\n\nItaly:\nA Venice Hold\nF Ionian Sea - Adriatic Sea"
    ],
    "expectation": "The simplest support on move cut.\nThe support of the fleet in the Adriatic Sea is cut. That means that the\r\narmy in Venice will not be dislodged and the army in Trieste stays in Trieste."
  },
  {
    "id": "6.D.4",
    "section": "6.D",
    "title": "TEST CASE, SUPPORT TO HOLD ON UNIT SUPPORTING A HOLD ALLOWED",
    "orderBlocks": [
      "Germany:\nA Berlin Supports F Kiel\nF Kiel Supports A Berlin\n\nRussia:\nF Baltic Sea Supports A Prussia - Berlin\nA Prussia - Berlin"
    ],
    "expectation": "A unit that is supporting a hold, can receive a hold support.\nThe Russian move from Prussia to Berlin fails."
  },
  {
    "id": "6.D.5",
    "section": "6.D",
    "title": "TEST CASE, SUPPORT TO HOLD ON UNIT SUPPORTING A MOVE ALLOWED",
    "orderBlocks": [
      "Germany:\nA Berlin Supports A Munich - Silesia\nF Kiel Supports A Berlin\nA Munich - Silesia\n\nRussia:\nF Baltic Sea Supports A Prussia - Berlin\nA Prussia - Berlin"
    ],
    "expectation": "A unit that is supporting a move, can receive a hold support.\nThe Russian move from Prussia to Berlin fails."
  },
  {
    "id": "6.D.6",
    "section": "6.D",
    "title": "TEST CASE, SUPPORT TO HOLD ON CONVOYING UNIT ALLOWED",
    "orderBlocks": [
      "Germany:\nA Berlin - Sweden\nF Baltic Sea Convoys A Berlin - Sweden\nF Prussia Supports F Baltic Sea\n\nRussia:\nF Livonia - Baltic Sea\nF Gulf of Bothnia Supports F Livonia - Baltic Sea"
    ],
    "expectation": "A unit that is convoying, can receive a hold support.\nThe Russian move from Livonia to the Baltic Sea fails. The convoy from Berlin to Sweden succeeds."
  },
  {
    "id": "6.D.7",
    "section": "6.D",
    "title": "TEST CASE, SUPPORT TO HOLD ON MOVING UNIT NOT ALLOWED",
    "orderBlocks": [
      "Germany:\nF Baltic Sea - Sweden\nF Prussia Supports F Baltic Sea\n\nRussia:\nF Livonia - Baltic Sea\nF Gulf of Bothnia Supports F Livonia - Baltic Sea\nA Finland - Sweden"
    ],
    "expectation": "A unit that is moving, cannot receive a hold support for the situation that the move fails.\nThe support of the fleet in Prussia fails. The fleet in Baltic Sea will bounce\r\non the Russian army in Finland and will be dislodged by the Russian fleet from Livonia when it returns to the Baltic Sea."
  },
  {
    "id": "6.D.8",
    "section": "6.D",
    "title": "TEST CASE, FAILED CONVOY CANNOT RECEIVE HOLD SUPPORT",
    "orderBlocks": [
      "Austria:\nF Ionian Sea Hold\nA Serbia Supports A Albania - Greece\nA Albania - Greece\n\nTurkey:\nA Greece - Naples\nA Bulgaria Supports A Greece"
    ],
    "expectation": "If a convoy fails because of disruption of the convoy or when the right convoy\r\norders are not given, then the army to be convoyed cannot receive support in hold, since it still tried to move.\nThere was a possible convoy from Greece to Naples, before the orders were\r\nmade public (via the Ionian Sea). This means that the order of Greece to Naples\r\nshould never be treated as illegal order and be changed in a hold order able to\r\nreceive hold support (see also issue 4.E.1). Therefore,\r\nthe support in Bulgaria fails and the army in Greece is dislodged by the army in Albania."
  },
  {
    "id": "6.D.9",
    "section": "6.D",
    "title": "TEST CASE, SUPPORT TO MOVE ON HOLDING UNIT NOT ALLOWED",
    "orderBlocks": [
      "Italy:\nA Venice - Trieste\nA Tyrolia Supports A Venice - Trieste\n\nAustria:\nA Albania Supports A Trieste - Serbia\nA Trieste Hold"
    ],
    "expectation": "A unit that is holding cannot receive a support in moving.\nThe support of the army in Albania fails and the army in Trieste is dislodged by the army from Venice."
  },
  {
    "id": "6.D.10",
    "section": "6.D",
    "title": "TEST CASE, SELF DISLODGMENT PROHIBITED",
    "orderBlocks": [
      "Germany:\nA Berlin Hold\nF Kiel - Berlin\nA Munich Supports F Kiel - Berlin"
    ],
    "expectation": "A unit may not dislodge a unit of the same great power.\nMove to Berlin fails."
  },
  {
    "id": "6.D.11",
    "section": "6.D",
    "title": "TEST CASE, NO SELF DISLODGMENT OF RETURNING UNIT",
    "orderBlocks": [
      "Germany:\nA Berlin - Prussia\nF Kiel - Berlin\nA Munich Supports F Kiel - Berlin\n\nRussia:\nA Warsaw - Prussia"
    ],
    "expectation": "Idem.\nArmy in Berlin bounces, but is not dislodged by own unit."
  },
  {
    "id": "6.D.12",
    "section": "6.D",
    "title": "TEST CASE, SUPPORTING A FOREIGN UNIT TO DISLODGE OWN UNIT PROHIBITED",
    "orderBlocks": [
      "Austria:\nF Trieste Hold\nA Vienna Supports A Venice - Trieste\n\nItaly:\nA Venice - Trieste"
    ],
    "expectation": "You may not help another power in dislodging your own unit.\nNo dislodgment of fleet in Trieste."
  },
  {
    "id": "6.D.13",
    "section": "6.D",
    "title": "TEST CASE, SUPPORTING A FOREIGN UNIT TO DISLODGE A RETURNING OWN UNIT PROHIBITED",
    "orderBlocks": [
      "Austria:\nF Trieste - Adriatic Sea\nA Vienna Supports A Venice - Trieste\n\nItaly:\nA Venice - Trieste\nF Apulia - Adriatic Sea"
    ],
    "expectation": "Idem.\nNo dislodgment of fleet in Trieste."
  },
  {
    "id": "6.D.14",
    "section": "6.D",
    "title": "TEST CASE, SUPPORTING A FOREIGN UNIT IS NOT ENOUGH TO PREVENT DISLODGEMENT",
    "orderBlocks": [
      "Austria:\nF Trieste Hold\nA Vienna Supports A Venice - Trieste\n\nItaly:\nA Venice - Trieste\nA Tyrolia Supports A Venice - Trieste\nF Adriatic Sea Supports A Venice - Trieste"
    ],
    "expectation": "If a foreign unit has enough support to dislodge your unit, you may not prevent that dislodgement by supporting the attack.\nThe fleet in Trieste is dislodged."
  },
  {
    "id": "6.D.15",
    "section": "6.D",
    "title": "TEST CASE, DEFENDER CANNOT CUT SUPPORT FOR ATTACK ON ITSELF",
    "orderBlocks": [
      "Russia:\nF Constantinople Supports F Black Sea - Ankara\nF Black Sea - Ankara\n\nTurkey:\nF Ankara - Constantinople"
    ],
    "expectation": "A unit that is attacked by a supported unit cannot prevent dislodgement by guessing which of the units will do the support.\nThe support of Constantinople is not cut and the fleet in Ankara is dislodged by the fleet in the Black Sea."
  },
  {
    "id": "6.D.16",
    "section": "6.D",
    "title": "TEST CASE, CONVOYING A UNIT DISLODGING A UNIT OF SAME POWER IS ALLOWED",
    "orderBlocks": [
      "England:\nA London Hold\nF North Sea Convoys A Belgium - London\n\nFrance:\nF English Channel Supports A Belgium - London\nA Belgium - London"
    ],
    "expectation": "It is allowed to convoy a foreign unit that dislodges your own unit is allowed.\nThe English army in London is dislodged by the French army\r\ncoming from Belgium."
  },
  {
    "id": "6.D.17",
    "section": "6.D",
    "title": "TEST CASE, DISLODGEMENT CUTS SUPPORTS",
    "orderBlocks": [
      "Russia:\nF Constantinople Supports F Black Sea - Ankara\nF Black Sea - Ankara\n\nTurkey:\nF Ankara - Constantinople\nA Smyrna Supports F Ankara - Constantinople\nA Armenia - Ankara"
    ],
    "expectation": "The famous dislodge rule.\nThe Russian fleet in Constantinople is dislodged. This cuts the support to from Black Sea to Ankara. Black Sea will bounce with the army from Armenia."
  },
  {
    "id": "6.D.18",
    "section": "6.D",
    "title": "TEST CASE, A SURVIVING UNIT WILL SUSTAIN SUPPORT",
    "orderBlocks": [
      "Russia:\nF Constantinople Supports F Black Sea - Ankara\nF Black Sea - Ankara\nA Bulgaria Supports F Constantinople\n\nTurkey:\nF Ankara - Constantinople\nA Smyrna Supports F Ankara - Constantinople\nA Armenia - Ankara"
    ],
    "expectation": "Idem. But now with an additional hold that prevents dislodgement.\nThe Russian fleet in the Black Sea will dislodge the Turkish fleet in Ankara."
  },
  {
    "id": "6.D.19",
    "section": "6.D",
    "title": "TEST CASE, EVEN WHEN SURVIVING IS IN ALTERNATIVE WAY",
    "orderBlocks": [
      "Russia:\nF Constantinople Supports F Black Sea - Ankara\nF Black Sea - Ankara\nA Smyrna Supports F Ankara - Constantinople\n\nTurkey:\nF Ankara - Constantinople"
    ],
    "expectation": "Now, the dislodgement is prevented because the support comes from a Russian army:\nThe Russian fleet in Constantinople is not dislodged, because\r\none of the supports is of Russian origin. The support from\r\nBlack Sea to Ankara will sustain and the fleet in Ankara will\r\nbe dislodged."
  },
  {
    "id": "6.D.20",
    "section": "6.D",
    "title": "TEST CASE, UNIT CANNOT CUT SUPPORT OF ITS OWN COUNTRY",
    "orderBlocks": [
      "England:\nF London Supports F North Sea - English Channel\nF North Sea - English Channel\nA Yorkshire - London\n\nFrance:\nF English Channel Hold"
    ],
    "expectation": "Although this is not mentioned in all rulebooks, it is generally accepted that when a unit attacks another unit of the same Great Power, it will not cut support.\nThe army in York does not cut support. This means that the fleet\r\nin the English Channel is dislodged by the fleet in the North Sea."
  },
  {
    "id": "6.D.21",
    "section": "6.D",
    "title": "TEST CASE, DISLODGING DOES NOT CANCEL A SUPPORT CUT",
    "orderBlocks": [
      "Austria:\nF Trieste Hold\n\nItaly:\nA Venice - Trieste\nA Tyrolia Supports A Venice - Trieste\n\nGermany:\nA Munich - Tyrolia\n\nRussia:\nA Silesia - Munich\nA Berlin Supports A Silesia - Munich"
    ],
    "expectation": "Sometimes there is the question whether a dislodged moving unit\r\ndoes not cut support (similar to the dislodge rule). This is not\r\nthe case.\r\nAlthough the German army is dislodged, it still cuts the Italian support.\r\nThat means that the Austrian Fleet is not dislodged."
  },
  {
    "id": "6.D.22",
    "section": "6.D",
    "title": "TEST CASE, IMPOSSIBLE FLEET MOVE CANNOT BE SUPPORTED",
    "orderBlocks": [
      "Germany:\nF Kiel - Munich\nA Burgundy Supports F Kiel - Munich\n\nRussia:\nA Munich - Kiel\nA Berlin Supports A Munich - Kiel"
    ],
    "expectation": "If a fleet tries moves to a land area it seems pointless to support the fleet,\r\nsince the move will fail anyway. However, in such case, the support is also invalid\r\nfor defense purposes.\nThe German move from Kiel to Munich is illegal (fleets cannot go to Munich). Illegal orders are fully ignored which makes the support from Burgundy also illegal. The Russian army in Munich will dislodge the fleet in Kiel."
  },
  {
    "id": "6.D.23",
    "section": "6.D",
    "title": "TEST CASE, IMPOSSIBLE COAST MOVE CANNOT BE SUPPORTED",
    "orderBlocks": [
      "Italy:\nF Gulf of Lyon - Spain(sc)\nF Western Mediterranean Supports F Gulf of Lyon - Spain(sc)\n\nFrance:\nF Spain(nc) - Gulf of Lyon\nF Marseilles Supports F Spain(nc) - Gulf of Lyon"
    ],
    "expectation": "Comparable with the previous test case, but now the fleet move is impossible for coastal reasons.\nThe French move from Spain North Coast to Gulf of Lyon is illegal (wrong\r\ncoast). Therefore, the support from Marseilles fails and the fleet in Spain is\r\ndislodged."
  },
  {
    "id": "6.D.24",
    "section": "6.D",
    "title": "TEST CASE, IMPOSSIBLE ARMY MOVE CANNOT BE SUPPORTED",
    "orderBlocks": [
      "France:\nA Marseilles - Gulf of Lyon\nF Spain(sc) Supports A Marseilles - Gulf of Lyon\n\nItaly:\nF Gulf of Lyon Hold\n\nTurkey:\nF Tyrrhenian Sea Supports F Western Mediterranean - Gulf of Lyon\nF Western Mediterranean - Gulf of Lyon"
    ],
    "expectation": "Comparable with the previous test case, but now an army tries to move into sea and the support is used in a beleaguered garrison.\nThe French move from Marseilles to Gulf of Lyon is illegal (an army cannot\r\ngo to sea). Therefore, the support from Spain fails and there is no beleaguered\r\ngarrison. The fleet in the Gulf of Lyon is dislodged by the Turkish fleet in\r\nthe Western Mediterranean."
  },
  {
    "id": "6.D.25",
    "section": "6.D",
    "title": "TEST CASE, FAILING HOLD SUPPORT CAN BE SUPPORTED",
    "orderBlocks": [
      "Germany:\nA Berlin Supports A Prussia\nF Kiel Supports A Berlin\n\nRussia:\nF Baltic Sea Supports A Prussia - Berlin\nA Prussia - Berlin"
    ],
    "expectation": "If an adjudicator fails on one of the previous three test cases, then the\r\nbug should be removed with care. A failing move cannot be supported, but\r\na failing hold support, because of some preconditions (unmatching order) can still be supported.\nAlthough the support of Berlin on Prussia fails (because of unmatching orders),\r\nthe support of Kiel on Berlin is still valid. So, Berlin will not be dislodged."
  },
  {
    "id": "6.D.26",
    "section": "6.D",
    "title": "TEST CASE, FAILING MOVE SUPPORT CAN BE SUPPORTED",
    "orderBlocks": [
      "Germany:\nA Berlin Supports A Prussia - Silesia\nF Kiel Supports A Berlin\n\nRussia:\nF Baltic Sea Supports A Prussia - Berlin\nA Prussia - Berlin"
    ],
    "expectation": "Similar as the previous test case, but now with an unmatched support to move.\nAgain, Berlin will not be dislodged."
  },
  {
    "id": "6.D.27",
    "section": "6.D",
    "title": "TEST CASE, FAILING CONVOY CAN BE SUPPORTED",
    "orderBlocks": [
      "England:\nF Sweden - Baltic Sea\nF Denmark Supports F Sweden - Baltic Sea\n\nGermany:\nA Berlin Hold\n\nRussia:\nF Baltic Sea Convoys A Berlin - Livonia\nF Prussia Supports F Baltic Sea"
    ],
    "expectation": "Similar as the previous test case, but now with an unmatched convoy.\nThe convoy order in the Baltic Sea is unmatched and fails. However, the\r\nsupport of Prussia on the Baltic Sea is still valid and the fleet in the Baltic Sea is not dislodged."
  },
  {
    "id": "6.D.28",
    "section": "6.D",
    "title": "TEST CASE, IMPOSSIBLE MOVE AND SUPPORT",
    "orderBlocks": [
      "Austria:\nA Budapest Supports F Rumania\n\nRussia:\nF Rumania - Holland\n\nTurkey:\nF Black Sea - Rumania\nA Bulgaria Supports F Black Sea - Rumania"
    ],
    "expectation": "An impossible move is \"illegal\" and should be ignored.\nSee issue 4.E.1. Illegal orders are ignored. Without an order, Rumania holds and receives support. The fleet in Rumania is not dislodged."
  },
  {
    "id": "6.D.29",
    "section": "6.D",
    "title": "TEST CASE, MOVE TO IMPOSSIBLE COAST AND SUPPORT",
    "orderBlocks": [
      "Austria:\nA Budapest Supports F Rumania\n\nRussia:\nF Rumania - Bulgaria(sc)\n\nTurkey:\nF Black Sea - Rumania\nA Bulgaria Supports F Black Sea - Rumania"
    ],
    "expectation": "Similar to the previous test case, but now the move \"illegal\" due the wrong coast.\nSee issue 4.E.1. Illegal orders are ignored. Without an order, Rumania holds and receives support. The fleet in Rumania is not dislodged."
  },
  {
    "id": "6.D.30",
    "section": "6.D",
    "title": "TEST CASE, MOVE WITHOUT COAST AND SUPPORT",
    "orderBlocks": [
      "Italy:\nF Aegean Sea Supports F Constantinople\n\nRussia:\nF Constantinople - Bulgaria\n\nTurkey:\nF Black Sea - Constantinople\nA Bulgaria Supports F Black Sea - Constantinople"
    ],
    "expectation": "Similar to the previous test case, but now the move is \"illegal\" due to missing coast.\nSee issue 4.E.1. Illegal orders are ignored. Without an order, Constantinople holds and receives support. The fleet in Constantinople is not dislodged."
  },
  {
    "id": "6.D.31",
    "section": "6.D",
    "title": "TEST CASE, A TRICKY IMPOSSIBLE SUPPORT",
    "orderBlocks": [
      "Austria:\nA Rumania - Armenia\n\nTurkey:\nF Black Sea Supports A Rumania - Armenia"
    ],
    "expectation": "A support order can be impossible for complex reasons.\r\nAlthough the army in Rumania can move to Armenia and\r\nthe fleet in the Black Sea can also go to Armenia, the\r\nsupport is still not possible. The reason is that the\r\nonly possible convoy is through the Black Sea and a fleet\r\ncannot convoy and support at the same time.\nThis is relevant for computer programs that show only the\r\npossible orders. In the list of possible orders, the support\r\nas given to the fleet in the Black Sea, should not be listed.\nFurthermore, the support order should be judged to be illegal, meaning that it is completely ignored. If there is a second order for the Black Sea, that order should be executed (see issue 4.E.1)."
  },
  {
    "id": "6.D.32",
    "section": "6.D",
    "title": "TEST CASE, A MISSING FLEET",
    "orderBlocks": [
      "England:\nF Edinburgh Supports A Liverpool - Yorkshire\nA Liverpool - Yorkshire\n\nFrance:\nF London Supports A Yorkshire\n\nGermany:\nA Yorkshire - Holland"
    ],
    "expectation": "The previous test cases contained an order that was impossible\r\neven when some other pieces on the board where changed. In this \r\ntest case, the order is impossible, but only for that situation.\r\nThe German order to Yorkshire cannot be executed, because\r\nthere is no fleet in the North Sea. In other situations (where\r\nthere is a fleet in the North Sea), the exact same order would\r\nbe possible. This is considered \"illegal\" (see issue 4.E.1). The order should be ignored and the support of the French fleet\r\nin London succeeds. This means that the army in Yorkshire is\r\nnot dislodged."
  },
  {
    "id": "6.D.33",
    "section": "6.D",
    "title": "TEST CASE, UNWANTED SUPPORT ALLOWED",
    "orderBlocks": [
      "Austria:\nA Serbia - Budapest\nA Vienna - Budapest\n\nRussia:\nA Galicia Supports A Serbia - Budapest\n\nTurkey:\nA Bulgaria - Serbia"
    ],
    "expectation": "A self standoff can be broken by an unwanted support.\nDue to the Russian support, the army in Serbia advances to\r\nBudapest. This enables Turkey to capture Serbia with the army\r\nin Bulgaria."
  },
  {
    "id": "6.D.34",
    "section": "6.D",
    "title": "TEST CASE, SUPPORT TARGETING OWN AREA NOT ALLOWED",
    "orderBlocks": [
      "Germany:\nA Berlin - Prussia\nA Silesia Supports A Berlin - Prussia\nF Baltic Sea Supports A Berlin - Prussia\n\nItaly:\nA Prussia Supports Livonia - Prussia\n\nRussia:\nA Warsaw Supports A Livonia - Prussia\nA Livonia - Prussia",
      "Germany:\nA Berlin - Prussia\nF Kiel - Berlin\nA Silesia Supports A Berlin - Prussia\n\nRussia:\nA Prussia - Berlin"
    ],
    "expectation": "Support targeting the area where the supporting unit is standing, is illegal.\nRussia and Italy wanted to get rid of the Italian army in\r\nPrussia (to build an Italian fleet somewhere else). However,\r\nthey didn't want a possible German attack on Prussia to succeed.\r\nThey invented this odd order of Italy. It was intended that the\r\nattack of the army in Livonia would have strength three, so it\r\nwould be capable to prevent the possible German attack to succeed. However,\r\nthe order of Italy is illegal, because a unit may only support to\r\nan area where the unit can go by itself. A unit can't go to the area\r\nit is already standing, so the Italian order is illegal and the\r\nGerman move from Berlin succeeds. Even if it would be legal,\r\nthe German move from Berlin would still succeed,\r\nbecause the support of Prussia is cut by Livonia and Berlin.\n6.E. TEST CASES, HEAD-TO-HEAD BATTLES AND BELEAGUERED GARRISON\r\n6.E.1. TEST CASE, DISLODGED UNIT HAS NO EFFECT ON ATTACKER'S AREA\r\nAn army can follow.\nThe army in Kiel will move to Berlin."
  },
  {
    "id": "6.E.2",
    "section": "6.E",
    "title": "TEST CASE, NO SELF DISLODGEMENT IN HEAD-TO-HEAD BATTLE",
    "orderBlocks": [
      "Germany:\nA Berlin - Kiel\nF Kiel - Berlin\nA Munich Supports A Berlin - Kiel"
    ],
    "expectation": "Self dislodgement is not allowed. This also counts for head-to-head battles.\nNo unit will move."
  },
  {
    "id": "6.E.3",
    "section": "6.E",
    "title": "TEST CASE, NO HELP IN DISLODGING OWN UNIT",
    "orderBlocks": [
      "Germany:\nA Berlin - Kiel\nA Munich Supports F Kiel - Berlin\n\nEngland:\nF Kiel - Berlin"
    ],
    "expectation": "It is not possible to help a foreign power dislodge own unit in a head-to-head battle.\nNo unit will move."
  },
  {
    "id": "6.E.4",
    "section": "6.E",
    "title": "TEST CASE, NON-DISLODGED LOSER STILL HAS EFFECT",
    "orderBlocks": [
      "Germany:\nF Holland - North Sea\nF Helgoland Bight Supports F Holland - North Sea\nF Skagerrak Supports F Holland - North Sea\n\nFrance:\nF North Sea - Holland\nF Belgium Supports F North Sea - Holland\n\nEngland:\nF Edinburgh Supports F Norwegian Sea - North Sea\nF Yorkshire Supports F Norwegian Sea - North Sea\nF Norwegian Sea - North Sea\n\nAustria:\nA Kiel Supports A Ruhr - Holland\nA Ruhr - Holland"
    ],
    "expectation": "If in an unbalanced head-to-head battle the loser is not\r\ndislodged, it still has an effect on the area of the attacker.\nThe French fleet in the North Sea is not dislodged due to the beleaguered garrison.\r\nTherefore, the Austrian army in Ruhr will not move to Holland."
  },
  {
    "id": "6.E.5",
    "section": "6.E",
    "title": "TEST CASE, LOSER DISLODGED BY ANOTHER ARMY STILL HAS EFFECT",
    "orderBlocks": [
      "Germany:\nF Holland - North Sea\nF Helgoland Bight Supports F Holland - North Sea\nF Skagerrak Supports F Holland - North Sea\n\nFrance:\nF North Sea - Holland\nF Belgium Supports F North Sea - Holland\n\nEngland:\nF Edinburgh Supports F Norwegian Sea - North Sea\nF Yorkshire Supports F Norwegian Sea - North Sea\nF Norwegian Sea - North Sea\nF London Supports F Norwegian Sea - North Sea\n\nAustria:\nA Kiel Supports A Ruhr - Holland\nA Ruhr - Holland"
    ],
    "expectation": "If in an unbalanced head-to-head battle the loser is dislodged\r\nby a unit not part of the head-to-head battle, the loser still has an effect on the area of the winner of the head-to-head battle.\nThe French fleet in the North Sea is dislodged but not by the German\r\nfleet in Holland. Therefore, the French fleet can still prevent that the\r\nAustrian army in Ruhr will move to Holland. So, the Austrian move in\r\nRuhr fails and the German fleet in Holland is not dislodged."
  },
  {
    "id": "6.E.6",
    "section": "6.E",
    "title": "TEST CASE, NOT DISLODGE BECAUSE OF OWN SUPPORT STILL HAS EFFECT",
    "orderBlocks": [
      "Germany:\nF Holland - North Sea\nF Helgoland Bight Supports F Holland - North Sea\n\nFrance:\nF North Sea - Holland\nF Belgium Supports F North Sea - Holland\nF English Channel Supports F Holland - North Sea\n\nAustria:\nA Kiel Supports A Ruhr - Holland\nA Ruhr - Holland"
    ],
    "expectation": "If in an unbalanced head-to-head battle the loser is not dislodged\r\nbecause the winner had help of a unit of the loser, the loser still has an effect on the area of the winner.\nAlthough the German force from Holland to North Sea is one larger than the\r\nFrench force from North Sea to Holland, the French fleet in the North Sea is not\r\ndislodged, because one of the supports on the German movement is French.\r\nTherefore, the Austrian army in Ruhr will not move to Holland."
  },
  {
    "id": "6.E.7",
    "section": "6.E",
    "title": "TEST CASE, NO SELF DISLODGEMENT WITH BELEAGUERED GARRISON",
    "orderBlocks": [
      "England:\nF North Sea Hold\nF Yorkshire Supports F Norway - North Sea\n\nGermany:\nF Holland Supports F Helgoland Bight - North Sea\nF Helgoland Bight - North Sea\n\nRussia:\nF Skagerrak Supports F Norway - North Sea\nF Norway - North Sea"
    ],
    "expectation": "An attempt at self dislodgement can be combined with a beleaguered\r\ngarrison. Such self dislodgment is still not possible.\nAlthough the Russians beat the German attack (with the support\r\nof Yorkshire) and the two Russian fleets are enough to dislodge\r\nthe fleet in the North Sea, the fleet in the North Sea is not dislodged,\r\nsince it would not be dislodged if the English fleet in Yorkshire\r\nwould not give support. This is a typical bug that can happen if a grand winner is calculated of a contested area (instead of calculating every move separately). Of the contested area the North Sea, the Russians are the grand winner with a strength of three, but this doesn't mean that they can advance."
  },
  {
    "id": "6.E.8",
    "section": "6.E",
    "title": "TEST CASE, NO SELF DISLODGEMENT WITH BELEAGUERED GARRISON AND HEAD-TO-HEAD BATTLE",
    "orderBlocks": [
      "England:\nF North Sea - Norway\nF Yorkshire Supports F Norway - North Sea\n\nGermany:\nF Holland Supports F Helgoland Bight - North Sea\nF Helgoland Bight - North Sea\n\nRussia:\nF Skagerrak Supports F Norway - North Sea\nF Norway - North Sea"
    ],
    "expectation": "Similar to the previous test case, but now the beleaguered fleet is also engaged in a head-to-head battle.\nAgain, none of the fleets move."
  },
  {
    "id": "6.E.9",
    "section": "6.E",
    "title": "TEST CASE, ALMOST SELF DISLODGEMENT WITH BELEAGUERED GARRISON",
    "orderBlocks": [
      "England:\nF North Sea - Norwegian Sea\nF Yorkshire Supports F Norway - North Sea\n\nGermany:\nF Holland Supports F Helgoland Bight - North Sea\nF Helgoland Bight - North Sea\n\nRussia:\nF Skagerrak Supports F Norway - North Sea\nF Norway - North Sea"
    ],
    "expectation": "Similar to the previous test case, but now the beleaguered fleet is moving away.\nBoth the fleet in the North Sea and the fleet in Norway move."
  },
  {
    "id": "6.E.10",
    "section": "6.E",
    "title": "TEST CASE, ALMOST CIRCULAR MOVEMENT WITH NO SELF DISLODGEMENT WITH BELEAGUERED GARRISON",
    "orderBlocks": [
      "England:\nF North Sea - Denmark\nF Yorkshire Supports F Norway - North Sea\n\nGermany:\nF Holland Supports F Helgoland Bight - North Sea\nF Helgoland Bight - North Sea\nF Denmark - Helgoland Bight\n\nRussia:\nF Skagerrak Supports F Norway - North Sea\nF Norway - North Sea"
    ],
    "expectation": "Similar to the previous test case, but now the beleaguered fleet is in circular movement\r\nwith the weaker attacker. So, the circular movement fails.\nThere is no movement of fleets."
  },
  {
    "id": "6.E.11",
    "section": "6.E",
    "title": "TEST CASE, NO SELF DISLODGEMENT WITH BELEAGUERED GARRISON, UNIT SWAP WITH ADJACENT CONVOYING AND TWO COASTS",
    "orderBlocks": [
      "France:\nA Spain - Portugal via convoy\nF Mid-Atlantic Ocean Convoys A Spain - Portugal\nF Gulf of Lyon Supports F Portugal - Spain(nc)\n\nGermany:\nA Marseilles Supports A Gascony - Spain\nA Gascony - Spain\n\nItaly:\nF Portugal - Spain(nc)\nF Western Mediterranean Supports F Portugal - Spain(nc)"
    ],
    "expectation": "Similar to the previous test case, but now the beleaguered fleet is in a unit swap\r\nwith the stronger attacker. So, the unit swap succeeds. To make the situation more complex,\r\nthe swap is on an area with two coasts.\nThe unit swap succeeds. Note that due to the success of the swap, there is no beleaguered garrison anymore."
  },
  {
    "id": "6.E.12",
    "section": "6.E",
    "title": "TEST CASE, SUPPORT ON ATTACK ON OWN UNIT CAN BE USED FOR OTHER MEANS",
    "orderBlocks": [
      "Austria:\nA Budapest - Rumania\nA Serbia Supports A Vienna - Budapest\n\nItaly:\nA Vienna - Budapest\n\nRussia:\nA Galicia - Budapest\nA Rumania Supports A Galicia - Budapest"
    ],
    "expectation": "A support on an attack on your own unit still has an effect. It\r\ncan prevent that another army will dislodge the unit.\nThe support of Serbia on the Italian army prevents that the\r\nRussian army in Galicia will advance. No army will move."
  },
  {
    "id": "6.E.13",
    "section": "6.E",
    "title": "TEST CASE, THREE WAY BELEAGUERED GARRISON",
    "orderBlocks": [
      "England:\nF Edinburgh Supports F Yorkshire - North Sea\nF Yorkshire - North Sea\n\nFrance:\nF Belgium - North Sea\nF English Channel Supports F Belgium - North Sea\n\nGermany:\nF North Sea Hold\n\nRussia:\nF Norwegian Sea - North Sea\nF Norway Supports F Norwegian Sea - North Sea"
    ],
    "expectation": "In a beleaguered garrison from three sides, the adjudicator may not \r\nlet two attacks fail and then let the third succeed.\nNone of the fleets move. The German fleet in the North Sea is not dislodged."
  },
  {
    "id": "6.E.14",
    "section": "6.E",
    "title": "TEST CASE, ILLEGAL HEAD-TO-HEAD BATTLE CAN STILL DEFEND",
    "orderBlocks": [
      "England:\nA Liverpool - Edinburgh\n\nRussia:\nF Edinburgh - Liverpool"
    ],
    "expectation": "If in a head-to-head battle, one of the units makes an illegal\r\nmove, then that unit still has the possibility to defend against attacks with strength of one.\nThe move of the Russian fleet is illegal, but can still prevent the English army from entering Edinburgh. So, none of the units move."
  },
  {
    "id": "6.E.15",
    "section": "6.E",
    "title": "TEST CASE, THE FRIENDLY HEAD-TO-HEAD BATTLE",
    "orderBlocks": [
      "England:\nF Holland Supports A Ruhr - Kiel\nA Ruhr - Kiel\n\nFrance:\nA Kiel - Berlin\nA Munich Supports A Kiel - Berlin\nA Silesia Supports A Kiel - Berlin\n\nGermany:\nA Berlin - Kiel\nF Denmark Supports A Berlin - Kiel\nF Helgoland Bight Supports A Berlin - Kiel\n\nRussia:\nF Baltic Sea Supports A Prussia - Berlin\nA Prussia - Berlin"
    ],
    "expectation": "In this case each unit in the head-to-head battle prevents that the other unit from being dislodged.\nNone of the moves succeeds. This case is especially difficult for sequence based adjudicators. They will start adjudicating the head-to-head battle and continue to adjudicate the attack on one of the units which is part of the head-to-head battle. In this process, one of the sides of the head-to-head battle might be cancelled out.\n6.F. TEST CASES, CONVOYS"
  },
  {
    "id": "6.F.1",
    "section": "6.F",
    "title": "TEST CASE, NO CONVOY IN COASTAL AREAS",
    "orderBlocks": [
      "Turkey:\nA Greece - Sevastopol\nF Aegean Sea Convoys A Greece - Sevastopol\nF Constantinople Convoys A Greece - Sevastopol\nF Black Sea Convoys A Greece - Sevastopol"
    ],
    "expectation": "A fleet in a coastal area may not convoy.\nThe convoy in Constantinople is not possible. So, the army in Greece will not move to Sevastopol."
  },
  {
    "id": "6.F.2",
    "section": "6.F",
    "title": "TEST CASE, AN ARMY BEING CONVOYED CAN BOUNCE AS NORMAL",
    "orderBlocks": [
      "England:\nF English Channel Convoys A London - Brest\nA London - Brest\n\nFrance:\nA Paris - Brest"
    ],
    "expectation": "Armies being convoyed bounce on other units just as armies that are not being convoyed.\nThe English army in London bounces on the French army in Paris. Both units do not move."
  },
  {
    "id": "6.F.3",
    "section": "6.F",
    "title": "TEST CASE, AN ARMY BEING CONVOYED CAN RECEIVE SUPPORT",
    "orderBlocks": [
      "England:\nF English Channel Convoys A London - Brest\nA London - Brest\nF Mid-Atlantic Ocean Supports A London - Brest\n\nFrance:\nA Paris - Brest"
    ],
    "expectation": "Armies being convoyed can receive support as in any other move.\nThe army in London receives support and beats the army in Paris. This means\r\nthat the army London will end in Brest and the French army in Paris stays in Paris."
  },
  {
    "id": "6.F.4",
    "section": "6.F",
    "title": "TEST CASE, AN ATTACKED CONVOY IS NOT DISRUPTED",
    "orderBlocks": [
      "England:\nF North Sea Convoys A London - Holland\nA London - Holland\n\nGermany:\nF Skagerrak - North Sea"
    ],
    "expectation": "A convoy can only be disrupted by dislodging the fleets. Attacking is not sufficient.\nThe army in London will successfully convoy and end in Holland."
  },
  {
    "id": "6.F.5",
    "section": "6.F",
    "title": "TEST CASE, A BELEAGUERED CONVOY IS NOT DISRUPTED",
    "orderBlocks": [
      "England:\nF North Sea Convoys A London - Holland\nA London - Holland\n\nFrance:\nF English Channel - North Sea\nF Belgium Supports F English Channel - North Sea\n\nGermany:\nF Skagerrak - North Sea\nF Denmark Supports F Skagerrak - North Sea"
    ],
    "expectation": "Even when a convoy is in a beleaguered garrison it is not disrupted.\nThe army in London will successfully convoy and end in Holland."
  },
  {
    "id": "6.F.6",
    "section": "6.F",
    "title": "TEST CASE, DISLODGED CONVOY DOES NOT CUT SUPPORT",
    "orderBlocks": [
      "England:\nF North Sea Convoys A London - Holland\nA London - Holland\n\nGermany:\nA Holland Supports A Belgium\nA Belgium Supports A Holland\nF Helgoland Bight Supports F Skagerrak - North Sea\nF Skagerrak - North Sea\n\nFrance:\nA Picardy - Belgium\nA Burgundy Supports A Picardy - Belgium"
    ],
    "expectation": "When a fleet of a convoy is dislodged, the convoy is completely cancelled. So, no support is cut.\nThe hold order of Holland on Belgium will sustain and Belgium\r\nwill not be dislodged by the French in Picardy."
  },
  {
    "id": "6.F.7",
    "section": "6.F",
    "title": "TEST CASE, DISLODGED CONVOY DOES NOT CAUSE CONTESTED AREA",
    "orderBlocks": [
      "England:\nF North Sea Convoys A London - Holland\nA London - Holland\n\nGermany:\nF Helgoland Bight Supports F Skagerrak - North Sea\nF Skagerrak - North Sea"
    ],
    "expectation": "When a fleet of a convoy is dislodged, the landing area is\r\nnot contested, so other units can retreat to that area.\nThe dislodged English fleet can retreat to Holland."
  },
  {
    "id": "6.F.8",
    "section": "6.F",
    "title": "TEST CASE, DISLODGED CONVOY DOES NOT CAUSE A BOUNCE",
    "orderBlocks": [
      "England:\nF North Sea Convoys A London - Holland\nA London - Holland\n\nGermany:\nF Helgoland Bight Supports F Skagerrak - North Sea\nF Skagerrak - North Sea\nA Belgium - Holland"
    ],
    "expectation": "When a fleet of a convoy is dislodged, then there will be\r\nno bounce in the landing area.\nThe army in Belgium will not bounce and move to Holland."
  },
  {
    "id": "6.F.9",
    "section": "6.F",
    "title": "TEST CASE, DISLODGE OF MULTI-ROUTE CONVOY",
    "orderBlocks": [
      "England:\nF English Channel Convoys A London - Belgium\nF North Sea Convoys A London - Belgium\nA London - Belgium\n\nFrance:\nF Brest Supports F Mid-Atlantic Ocean - English Channel\nF Mid-Atlantic Ocean - English Channel"
    ],
    "expectation": "When a fleet of a convoy with multiple routes is dislodged,\r\nthe result depends on the rulebook that is used.\nThe French fleet in Mid Atlantic Ocean will dislodge the convoying fleet in the English Channel.\nIf the 1971 rules are used (see issue\r\n4.A.1), this will disrupt the convoy and the army will stay in London.\nWhen later rulebooks are used (which I prefer)\r\nthe army can still go via the North Sea and the convoy succeeds and the London army will end in Belgium."
  },
  {
    "id": "6.F.10",
    "section": "6.F",
    "title": "TEST CASE, DISLODGE OF MULTI-ROUTE CONVOY WITH FOREIGN FLEET",
    "orderBlocks": [
      "England:\nF North Sea Convoys A London - Belgium\nA London - Belgium\n\nGermany:\nF English Channel Convoys A London - Belgium\n\nFrance:\nF Brest Supports F Mid-Atlantic Ocean - English Channel\nF Mid-Atlantic Ocean - English Channel"
    ],
    "expectation": "When the 1971 rulebook is used \"unwanted\" multi-route convoys are possible.\nThe same as in the previous test case, the French fleet in Mid Atlantic Ocean will dislodge the convoying fleet in the English Channel.\nIf the 1971 rules are used (see issue\r\n4.A.1), this will disrupt the convoy and the army will stay in London. Without the \"help\" of the Germans the convoy would have succeeded!\nWhen later rulebooks are used (which I prefer)\r\nthe army can still go via the North Sea and the convoy succeeds and the London army will end in Belgium."
  },
  {
    "id": "6.F.11",
    "section": "6.F",
    "title": "TEST CASE, DISLODGE OF MULTI-ROUTE CONVOY WITH ONLY FOREIGN FLEETS",
    "orderBlocks": [
      "England:\nA London - Belgium\n\nGermany:\nF English Channel Convoys A London - Belgium\n\nRussia:\nF North Sea Convoys A London - Belgium\n\nFrance:\nF Brest Supports F Mid-Atlantic Ocean - English Channel\nF Mid-Atlantic Ocean - English Channel"
    ],
    "expectation": "With the 1971 rulebook one could adopt a rule (DPTG) that foreign fleets are not used when not necessary, but this doesn't prevent an \"unwanted\" convoy when all convoying fleets are foreign.\nAgain, the French fleet in Mid Atlantic Ocean will dislodge the convoying fleet in the English Channel.\nIf the 1971 rules are used (see issue\r\n4.A.1), this will disrupt the convoy and the army will stay in London.\nWhen later rulebooks are used (which I prefer)\r\nthe army can still go via the North Sea and the convoy succeeds and the London army will end in Belgium."
  },
  {
    "id": "6.F.12",
    "section": "6.F",
    "title": "TEST CASE, DISLODGED CONVOYING FLEET NOT ON ROUTE",
    "orderBlocks": [
      "England:\nF English Channel Convoys A London - Belgium\nA London - Belgium\nF Irish Sea Convoys A London - Belgium\n\nFrance:\nF North Atlantic Ocean Supports F Mid-Atlantic Ocean - Irish Sea\nF Mid-Atlantic Ocean - Irish Sea"
    ],
    "expectation": "When the rule is used that convoys are disrupted when one of the routes is disrupted (see issue 4.A.1), the convoy is not necessarily disrupted when one of the fleets ordered to convoy is dislodged.\nEven when convoys are disrupted when one of the routes is disrupted\r\n(see issue 4.A.1), the convoy from London to Belgium\r\nwill still succeed, since the dislodged fleet in the Irish Sea is not\r\npart of any route, although it can be reached from the starting point London."
  },
  {
    "id": "6.F.13",
    "section": "6.F",
    "title": "TEST CASE, THE UNWANTED ALTERNATIVE",
    "orderBlocks": [
      "England:\nA London - Belgium\nF North Sea Convoys A London - Belgium\n\nFrance:\nF English Channel Convoys A London - Belgium\n\nGermany:\nF Holland Supports F Denmark - North Sea\nF Denmark - North Sea"
    ],
    "expectation": "This situation is not difficult to adjudicate, but it shows that even if someone wants to convoy, the player might not want an alternative route for the convoy.\nIf France and German are allies, England want to keep its army\r\nin London, to defend the island. An army in Belgium could easily\r\nbe destroyed by an alliance of France and Germany. England tries\r\nto be friends with Germany, however France and Germany trick England.\nThe convoy of the army in London succeeds and the fleet in Denmark dislodges the fleet in the North Sea."
  },
  {
    "id": "6.F.14",
    "section": "6.F",
    "title": "TEST CASE, SIMPLE CONVOY PARADOX",
    "orderBlocks": [
      "England:\nF London Supports F Wales - English Channel\nF Wales - English Channel\n\nFrance:\nA Brest - London\nF English Channel Convoys A Brest - London"
    ],
    "expectation": "The most common paradox is when the attacked unit\r\nsupports an attack on one of the convoying fleets.\nSee issue 4.A.2\nAccording to all rulebooks (including the Szykman rule which I prefer), the support of London is not cut. That means that the fleet in the English Channel is dislodged."
  },
  {
    "id": "6.F.15",
    "section": "6.F",
    "title": "TEST CASE, SIMPLE CONVOY PARADOX WITH ADDITIONAL CONVOY",
    "orderBlocks": [
      "England:\nF London Supports F Wales - English Channel\nF Wales - English Channel\n\nFrance:\nA Brest - London\nF English Channel Convoys A Brest - London\n\nItaly:\nF Irish Sea Convoys A North Africa - Wales\nF Mid-Atlantic Ocean Convoys A North Africa - Wales\nA North Africa - Wales"
    ],
    "expectation": "Paradox rules only apply on the paradox core.\nThe adjudication of the paradox in the English Channel should not interfere with the adjudication of the Italian convoy. Both the fleet in Wales as the army in North Africa succeed in moving."
  },
  {
    "id": "6.F.16",
    "section": "6.F",
    "title": "TEST CASE, PANDIN'S PARADOX",
    "orderBlocks": [
      "England:\nF London Supports F Wales - English Channel\nF Wales - English Channel\n\nFrance:\nA Brest - London\nF English Channel Convoys A Brest - London\n\nGermany:\nF North Sea Supports F Belgium - English Channel\nF Belgium - English Channel"
    ],
    "expectation": "In Pandin's paradox, the attacked unit protects the convoying\r\nfleet by a beleaguered garrison.\nSee issue 4.A.2\nAccording to all rulebooks (including the Szykman rule which I prefer), the support of London is not cut. That means that the fleet in the English Channel is not dislodged and none of the units succeed to move."
  },
  {
    "id": "6.F.17",
    "section": "6.F",
    "title": "TEST CASE, PANDIN'S EXTENDED PARADOX",
    "orderBlocks": [
      "England:\nF London Supports F Wales - English Channel\nF Wales - English Channel\n\nFrance:\nA Brest - London\nF English Channel Convoys A Brest - London\nF Yorkshire Supports A Brest - London\n\nGermany:\nF North Sea Supports F Belgium - English Channel\nF Belgium - English Channel"
    ],
    "expectation": "In Pandin's extended paradox, the attacked unit protects the convoying\r\nfleet by a beleaguered garrison and the attacked unit can dislodge the unit that gives the protection.\nWhen the 1971/1982/2000/2023 rules are used (see issue 4.A.2), the support of London is not cut. That means that the fleet in the English Channel is not dislodged. The convoy will succeed and dislodge the fleet in London. One\r\ncan argue that this violates the dislodge rule, but one may assume that the paradox convoy rule take precedence over the dislodge rule.\nIf the Simon Szykman alternative is used (which I prefer), the convoy fails and the fleet in London and the English Channel are not dislodged (which I think is a more appealing adjudication)."
  },
  {
    "id": "6.F.18",
    "section": "6.F",
    "title": "TEST CASE, BETRAYAL PARADOX",
    "orderBlocks": [
      "England:\nF North Sea Convoys A London - Belgium\nA London - Belgium\nF English Channel Supports A London - Belgium\n\nFrance:\nF Belgium Supports F North Sea\n\nGermany:\nF Helgoland Bight Supports F Skagerrak - North Sea\nF Skagerrak - North Sea"
    ],
    "expectation": "The betrayal paradox is comparable to Pandin's paradox, but now\r\nthe attacked unit directly supports the convoying fleet. Of course,\r\nthis will only happen when the player of the attacked unit is\r\nbetrayed.\nIf the English convoy from London to Belgium is successful,\r\nthen it cuts the France support necessary to hold the fleet in the North Sea (see issue 4.A.2).\nThe 1971, 2000 and 2023 rules do not give an answer on this.\nAccording to the 1982 rules the French support on the\r\nNorth Sea will not be cut. So, the fleet in the North Sea\r\nwill not be dislodged by the Germans and the army in London\r\nwill dislodge the French army in Belgium.\nIf the Szykman rule is followed (which I prefer), the convoy in the English Channel fails. Without the convoy, the move of the army in London will fail and the support in Belgium will not be cut. That means that the fleet in the North Sea will not be dislodged."
  },
  {
    "id": "6.F.19",
    "section": "6.F",
    "title": "TEST CASE, MULTI-ROUTE CONVOY DISRUPTION PARADOX",
    "orderBlocks": [
      "France:\nA Tunis - Naples\nF Tyrrhenian Sea Convoys A Tunis - Naples\nF Ionian Sea Convoys A Tunis - Naples\n\nItaly:\nF Naples Supports F Rome - Tyrrhenian Sea\nF Rome - Tyrrhenian Sea"
    ],
    "expectation": "The situation becomes more complex when the convoy has alternative routes.\r\nNow, two issues play a role. The rule about disruption of\r\nmulti-route convoys (issue 4.A.1) and the determination of how paradoxes are resolved (issue 4.A.2).\nIf the 1971 rulebook is used then a multi-route convoy is disrupted when one of the routes is disrupted. That makes this situation paradoxical and the 1971 paradox rule kicks in. The support of the fleet in Naples is not cut and the fleet in Rome dislodges the fleet in the Tyrrhenian Sea.\nWith the 1982 rulebook, the support of Naples is not cut, because it is supporting an action in a body of water that contains a convoying fleet. This means that the fleet in Rome dislodges the fleet in the Tyrrhenian Sea.\nAccording to the 2000/2023 rules the fleet in the Tyrrhenian Sea is not \"necessary\" for the convoy and the support of Naples\r\nis cut and the fleet in the Tyrrhenian Sea is not dislodged.\nIf the Szykman rule is used (which I prefer), then there is no paradoxical situation. The support of Naples is cut (the same as in the 2000/2023 ruling) and the fleet in the Tyrrhenian Sea is not dislodged."
  },
  {
    "id": "6.F.20",
    "section": "6.F",
    "title": "TEST CASE, UNWANTED MULTI-ROUTE CONVOY PARADOX",
    "orderBlocks": [
      "France:\nA Tunis - Naples\nF Tyrrhenian Sea Convoys A Tunis - Naples\n\nItaly:\nF Naples Supports F Ionian Sea\nF Ionian Sea Convoys A Tunis - Naples\n\nTurkey:\nF Aegean Sea Supports F Eastern Mediterranean - Ionian Sea\nF Eastern Mediterranean - Ionian Sea"
    ],
    "expectation": "The 1982 paradox rule allows some creative defense.\nAgain, two issues play a role. The rule about disruption of\r\nmulti-route convoys (issue 4.A.1) and the determination of how paradoxes are resolved (issue 4.A.2).\nIf the 1971 rulebook is used, then a multi-route convoy is disrupted when one of the routes is disrupted. This makes the situation paradoxical. However, since the fleet in Naples is not supporting an attack on a convoying fleet, the paradox rule does not apply and the 1971 rules do not give answer to this situation.\nWith the 1982 rules the support in Naples is not cut, because it is supporting an action in a body of water that contains a convoying fleet. That means that the fleet in the Ionian Sea is not dislodged.\nThe paradox rule of the 2000/2023 rules, does not kick in, because the support is not a support that attacks the convoying fleet. However, with these rules a multi-route convoy is only disrupted when all routes are disrupted, which prevents that this situation is a paradox. So, the support of Naples is cut and the fleet in the Ionian Sea is dislodged by the Turkish fleet in the Eastern Mediterranean.\nIf the Szykman rule is used, then there is no paradoxical situation. The support of Naples is cut and the fleet in the Ionian Sea is dislodged by the Turkish fleet in the Eastern Mediterranean.\nAs you can see, the 1982 rules allow the Italian player to save its fleet in the Ionian Sea with a trick. I do not consider this trick as normal tactical play. I prefer the Szykman rule as one of the rules that does not allow this trick. According to this rule the fleet in the Ionian Sea is dislodged."
  },
  {
    "id": "6.F.21",
    "section": "6.F",
    "title": "TEST CASE, DAD'S ARMY CONVOY",
    "orderBlocks": [
      "Russia:\nA Edinburgh Supports A Norway - Clyde\nF Norwegian Sea Convoys A Norway - Clyde\nA Norway - Clyde\n\nFrance:\nF Irish Sea Supports F Mid-Atlantic Ocean - North Atlantic Ocean\nF Mid-Atlantic Ocean - North Atlantic Ocean\n\nEngland:\nA Liverpool - Clyde via convoy\nF North Atlantic Ocean Convoys A Liverpool - Clyde\nF Clyde Supports F North Atlantic Ocean"
    ],
    "expectation": "The 1982 paradox rule has as side effect that convoying armies do not cut support in some situations that are not paradoxical.\nIn all rules, except the 1982 paradox rule, the support of the\r\nfleet in Clyde on the North Atlantic Ocean is cut and the French\r\nfleet in the Mid-Atlantic Ocean will dislodge the fleet in the\r\nNorth Atlantic Ocean. This is the preferred way.\nHowever, in the 1982 paradox rule (see issue 4.A.2),\r\nthe support of the fleet in Clyde is not cut. That means that the English fleet in\r\nthe North Atlantic Ocean is not dislodged.\nAs you can see, the 1982 rule allows England to save its fleet\r\nin the North Atlantic Ocean in a very strange way. Just the support\r\nof Clyde is insufficient (if there is no convoy, the support is cut).\r\nOnly the convoy to the area occupied by own unit, can do the trick\r\nin this situation. The embarking of troops in the fleet deceives\r\nthe enemy so much that it works as a magic cloak. The enemy is\r\nnot able to dislodge the fleet in the North Atlantic Ocean any more.\r\nOf course, this will only work in comedies. I prefer the Szykman\r\nrule as one of the rules that does not allow this trick. \r\nAccording to this rule (and all other paradox rules),\r\nthe fleet in the North Atlantic is just dislodged."
  },
  {
    "id": "6.F.22",
    "section": "6.F",
    "title": "TEST CASE, SECOND ORDER PARADOX WITH TWO RESOLUTIONS",
    "orderBlocks": [
      "England:\nF Edinburgh - North Sea\nF London Supports F Edinburgh - North Sea\n\nFrance:\nA Brest - London\nF English Channel Convoys A Brest - London\n\nGermany:\nF Belgium Supports F Picardy - English Channel\nF Picardy - English Channel\n\nRussia:\nA Norway - Belgium\nF North Sea Convoys A Norway - Belgium"
    ],
    "expectation": "Two convoys are involved in a second order paradox.\nWithout any paradox rule, there are two consistent resolutions.\r\nThe supports of the English fleet in London and the German fleet\r\nin Picardy are not cut. That means that the French fleet in the\r\nEnglish Channel and the Russian fleet in the North Sea are \r\ndislodged, which makes it impossible to cut the support.\r\nThe other resolution is that the supports of the English fleet in\r\nLondon the German fleet in Picardy are cut. In that case the\r\nFrench fleet in the English Channel and the Russian fleet in\r\nthe North Sea will survive and will not be dislodged. This\r\ngives the possibility to cut the support.\nThe 1971, 2000 and 2023 rules (see issue 4.A.2) do not have an answer on this.\nAccording to the 1982 rule, the supports are not cut which means that the French fleet in the English Channel and the Russian fleet in the North Sea are dislodged.\nThe Szykman (which I prefer), has the same result as the 1982 rule. The supports are not cut, the convoying armies fail to move, the fleet in Picardy dislodges the fleet in English Channel and the fleet in Edinburgh dislodges the fleet in the North Sea."
  },
  {
    "id": "6.F.23",
    "section": "6.F",
    "title": "TEST CASE, SECOND ORDER PARADOX WITH TWO EXCLUSIVE CONVOYS",
    "orderBlocks": [
      "England:\nF Edinburgh - North Sea\nF Yorkshire Supports F Edinburgh - North Sea\n\nFrance:\nA Brest - London\nF English Channel Convoys A Brest - London\n\nGermany:\nF Belgium Supports F English Channel\nF London Supports F North Sea\n\nItaly:\nF Mid-Atlantic Ocean - English Channel\nF Irish Sea Supports F Mid-Atlantic Ocean - English Channel\n\nRussia:\nA Norway - Belgium\nF North Sea Convoys A Norway - Belgium"
    ],
    "expectation": "In this paradox there are two consistent resolutions, but where the two convoys do not fail or succeed at the same time.\nWithout any paradox rule, there are two consistent resolutions. In one resolution, the convoy in the English Channel is dislodged by the fleet in the Mid-Atlantic Ocean, while the convoy in the North Sea succeeds. In the other resolution, it is the other way around. The convoy in the North Sea is dislodged by the fleet in Edinburgh, while the convoy in the English Channel succeeds.\nThe 1971, 2000 and 2023 rules (see issue 4.A.2) do not have an answer on this.\nAccording to the 1982 rule, the supports are not cut which means that the none of the units move.\nThe Szykman rule (which I prefer), has the same result as the 1982 rule. The convoying armies fail to move and the supports are not cut. Because of the failure to cut the support, no fleet succeeds to move."
  },
  {
    "id": "6.F.24",
    "section": "6.F",
    "title": "TEST CASE, SECOND ORDER PARADOX WITH NO RESOLUTION",
    "orderBlocks": [
      "England:\nF Edinburgh - North Sea\nF London Supports F Edinburgh - North Sea\nF Irish Sea - English Channel\nF Mid-Atlantic Ocean Supports F Irish Sea - English Channel\n\nFrance:\nA Brest - London\nF English Channel Convoys A Brest - London\nF Belgium Supports F English Channel\n\nRussia:\nA Norway - Belgium\nF North Sea Convoys A Norway - Belgium"
    ],
    "expectation": "As first order paradoxes, second order paradoxes come in two\r\nflavors, with two resolutions or no resolution.\nWhen no paradox rule is used, there is no consistent resolution. If the French support in Belgium is cut, the French fleet in the English Channel will be dislodged. That means that the support of London will not be cut and the fleet in Edinburgh will dislodge the Russian fleet in the North Sea. In this way the support in Belgium is not cut! But if the support in Belgium is not cut, the Russian fleet in the North Sea will not be dislodged and the army in Norway can cut the support in Belgium.\nThe 1971, 2000 and 2023 rules (see issue 4.A.2) do not have an answer on this.\nAccording to the 1982 rule, the supports are not cut which means that the French fleet in the English Channel will survive and but the Russian fleet in the North Sea is dislodged.\nIf the Szykman alternative is used (which I prefer), the supports are not cut and the convoying armies fail to move, which gives the same result as the 1982 rule."
  },
  {
    "id": "6.F.25",
    "section": "6.F",
    "title": "TEST CASE, CUT SUPPORT LAST",
    "orderBlocks": [
      "Germany:\nA Rhur - Belgium\nA Holland Supports Rhur - Belgium\nA Denmark - Norway\nF Skagerrak Convoys Denmark - Norway\nA Finland Supports Denmark - Norway\n\nEngland:\nA Yorkshire - Holland\nF North Sea Convoys Yorkshire - Holland\nF Helgoland Bight Supports Yorkshire - Holland\nA Belgium Hold\n\nRussia:\nF Norwegian Sea - North Sea\nF Norway Supports Norwegian Sea - North Sea\nF Sweden - Skagerrak"
    ],
    "expectation": "For manual play the rule of thumb is, cut support first. However, in below example the support of Holland is some of the last orders to adjudicated.\nThe fleet in Sweden fails to disrupt the convoy in Skagerrak. The move from Denmark to Norway succeeds and cuts the support of Norway. The fleet in the Norwegian Sea fails to disrupt the convoy in North Sea. The move from Yorkshire to Holland succeeds and cuts the support of Holland. The move from Rhur fails to dislodge the army in Belgium.\n6.G. TEST CASES, CONVOYING TO ADJACENT PROVINCES"
  },
  {
    "id": "6.G.1",
    "section": "6.G",
    "title": "TEST CASE, TWO UNITS CAN SWAP PROVINCES BY CONVOY",
    "orderBlocks": [
      "England:\nA Norway - Sweden\nF Skagerrak Convoys A Norway - Sweden\n\nRussia:\nA Sweden - Norway"
    ],
    "expectation": "The only way to swap two units, is by convoy.\nIf explicit adjacent convoying is used (DPTG, see issue\r\n4.A.3), then it is just a head-to-head battle. However, all rulebooks (which I prefer) allow that convoy intent is given by a convoying fleet of same country. So, swap should happen."
  },
  {
    "id": "6.G.2",
    "section": "6.G",
    "title": "TEST CASE, KIDNAPPING AN ARMY",
    "orderBlocks": [
      "England:\nA Norway - Sweden\n\nRussia:\nF Sweden - Norway\n\nGermany:\nF Skagerrak Convoys A Norway - Sweden"
    ],
    "expectation": "Germany promised England to support to dislodge the Russian fleet in Sweden\r\nand it promised Russia to support to dislodge the English army in Norway. Instead, the joking German orders a convoy.\nSee issue 4.A.3. If the 1971 rulebook is used, then the army in Norway is kidnapped and swaps with the army in Sweden. In all other rulebooks (which I prever), kidnapping is prevented and the armies fail to move."
  },
  {
    "id": "6.G.3",
    "section": "6.G",
    "title": "TEST CASE, AN UNWANTED DISRUPTED CONVOY TO ADJACENT PROVINCE",
    "orderBlocks": [
      "France:\nF Brest - English Channel\nA Picardy - Belgium\nA Burgundy Supports A Picardy - Belgium\nF Mid-Atlantic Ocean Supports F Brest - English Channel\n\nEngland:\nF English Channel Convoys A Picardy - Belgium"
    ],
    "expectation": "One can try to convoy an army unwanted with a fleet that is almost certainly dislodged. However, this trick should not work.\nSee issue 4.A.3. The 1982/2000/2023 rulebooks (which I prefer) will only use the convoy route if intent is clear. The army in Picardy will successfully move by land route to Belgium. In case of the 1971 rulebook it is less clear. However, since no unit in Belgium moves in opposite direction the convoy should be ignored, resulting in the same adjudication."
  },
  {
    "id": "6.G.4",
    "section": "6.G",
    "title": "TEST CASE, AN UNWANTED DISRUPTED CONVOY TO ADJACENT PROVINCE AND OPPOSITE MOVE",
    "orderBlocks": [
      "France:\nF Brest - English Channel\nA Picardy - Belgium\nA Burgundy Supports A Picardy - Belgium\nF Mid-Atlantic Ocean Supports F Brest - English Channel\n\nEngland:\nF English Channel Convoys A Picardy - Belgium\nA Belgium - Picardy"
    ],
    "expectation": "In the situation of the previous test case, it was rather\r\nclear that the army didn't want to take the convoy. But what\r\nif there is an army moving in opposite direction?\nSee issue 4.A.3. In case of the 1971 rules, it is not directly clear whether the French army in Picardy will take the land route. However, if unwanted convoys are prevented as much as possible, it will not take the convoy if it is disrupted. So, the move of the army in Picardy will succeed.\nWith the 1982/2000/2023 rulebooks (which I prefer) and with explicit adjacent convoying, kidnapping is prevented and the French army will successfully move."
  },
  {
    "id": "6.G.5",
    "section": "6.G",
    "title": "TEST CASE, SWAPPING WITH MULTIPLE FLEETS WITH ONE OWN FLEET",
    "orderBlocks": [
      "Italy:\nA Rome - Apulia\nF Tyrrhenian Sea Convoys A Apulia - Rome\n\nTurkey:\nA Apulia - Rome\nF Ionian Sea Convoys A Apulia - Rome"
    ],
    "expectation": "One fleet is sufficient to show the intent to convoy.\nIf explicit adjacent convoying is used (DPTG, see issue\r\n4.A.3), then it is just a head-to-head battle. However, all rulebooks (which I prefer) allow that convoy intent is given by a convoying fleet of same country. So, the swap should happen."
  },
  {
    "id": "6.G.6",
    "section": "6.G",
    "title": "TEST CASE, SWAPPING WITH UNINTENDED INTENT",
    "orderBlocks": [
      "England:\nA Liverpool - Edinburgh\nF English Channel Convoys A Liverpool - Edinburgh\n\nGermany:\nA Edinburgh - Liverpool\n\nFrance:\nF Irish Sea Hold\nF North Sea Hold\n\nRussia:\nF Norwegian Sea Convoys A Liverpool - Edinburgh\nF North Atlantic Ocean Convoys A Liverpool - Edinburgh"
    ],
    "expectation": "The intent is questionable.\nHere England intended to convoy via the French fleets in the Irish Sea and the North Sea. However, the French did not\r\norder the convoy. The alternative route with the Russian fleets was unintended. The English fleet in the English Channel (with the convoy order) is not part of this alternative route with the Russian fleets.\nSee issue 4.A.3.\nIf the 1971 rules are used, the intent is not important and the units are swapped.\nIn case of the 1982/2000/2023 rulebooks (which I prefer) England still intents to convoy and the armies should swap.\nWhen explicit adjacent convoying is used (DPTG),\r\nthen the English army did not receive an order to move by convoy. So, it is just a head-to-head battle and both the army in Edinburgh and Liverpool will not move."
  },
  {
    "id": "6.G.7",
    "section": "6.G",
    "title": "TEST CASE, SWAPPING WITH ILLEGAL INTENT",
    "orderBlocks": [
      "England:\nF Skagerrak Convoys A Sweden - Norway\nF Norway - Sweden\n\nRussia:\nA Sweden - Norway\nF Gulf of Bothnia Convoys A Sweden - Norway"
    ],
    "expectation": "Can the intent be made clear with an impossible order?\nSee issue 4.A.3 and 4.E.1.\nIn case the 1971 rules are used, the intent is not important and the units in Norway and Sweden swap.\nWith the 2023 rules (which I prefer) impossible orders are ignored. Also, with modern webbased adjudicators, impossible orders cannot be given at all. With this, there is no intent to convoy and the units in Norway and Sweden fail to move.\nIf explicit adjacent convoying is used (DPTG) there is also no convoy and none of the units move."
  },
  {
    "id": "6.G.8",
    "section": "6.G",
    "title": "TEST CASE, EXPLICIT CONVOY THAT ISN'T THERE",
    "orderBlocks": [
      "France:\nA Belgium - Holland via convoy\n\nEngland:\nF North Sea - Helgoland Bight\nA Holland - Kiel"
    ],
    "expectation": "What to do when a unit is explicitly ordered to move via\r\nconvoy and the convoy is not there?\r\nThe French army in Belgium intended to move convoyed with the\r\nEnglish fleet in the North Sea. But England changed its\r\nplans.\nSee issue 4.A.3.\nIn case of 1971 or 1982 rulebook, this test case not applicable, because they don't have the notion of 'via convoy'.\nFor the 2000/2023 rulebook and the DPTG, the question is whether the land route should be used as \"fallback\".\nAs discussed in the issue, I don't prefer fallback anymore."
  },
  {
    "id": "6.G.9",
    "section": "6.G",
    "title": "TEST CASE, SWAPPED OR DISLODGED?",
    "orderBlocks": [
      "England:\nA Norway - Sweden\nF Skagerrak Convoys A Norway - Sweden\nF Finland Supports A Norway - Sweden\n\nRussia:\nA Sweden - Norway"
    ],
    "expectation": "In the following situation the English army in Norway will\r\nend in all cases in Sweden. But whether it is convoyed or not\r\nhas effect on the Russian army. In case of convoy the Russian\r\narmy ends in Norway and in case of a land route the Russian\r\narmy is dislodged (see issue 4.A.3).\nIf played according to the DPTG, then an army is only convoyed to an adjacent province if it is tagged with \"via convoy\". This means that the Russian army in Sweden is dislodged by the army from Norway.\nIf played according to any of the rulebooks (which I prefer) then the move of Norway is via convoy and the armies swap."
  },
  {
    "id": "6.G.10",
    "section": "6.G",
    "title": "TEST CASE, SWAPPED OR AN HEAD-TO-HEAD BATTLE?",
    "orderBlocks": [
      "England:\nA Norway - Sweden via convoy\nF Denmark Supports A Norway - Sweden\nF Finland Supports A Norway - Sweden\n\nGermany:\nF Skagerrak Convoys A Norway - Sweden\n\nRussia:\nA Sweden - Norway\nF Barents Sea Supports A Sweden - Norway\n\nFrance:\nF Norwegian Sea - Norway\nF North Sea Supports F Norwegian Sea - Norway"
    ],
    "expectation": "Can a dislodged unit have effect on the attacker's area, when the attacker moved by convoy?\nSince England ordered the army in Norway to move explicitly\r\nvia convoy and the army in Sweden is moving in opposite direction, there is no head-to-head battle. It is clear that the army in Norway will dislodge the Russian army in Sweden. Since the strength of three is in all cases the strongest force.\nThe army in Sweden will not advance to Norway, because it\r\ncannot beat the force in the Norwegian Sea. It will be dislodged by the army from Norway.\nThe more interesting question is whether the French fleet in the Norwegian Sea is bounced by the Russian army from Sweden. \r\nThis depends on the interpretation of issue 4.A.7.\r\nIf the rulebook is taken literally (choice a), then a dislodged unit cannot bounce a unit in the area where the attacker came from. This would mean that the move of the fleet in the Norwegian Sea succeeds. However, if choice b is taken (which I prefer), then a bounce\r\nis still possible, when there is no head-to-head battle. So, the \r\nfleet in the Norwegian Sea will fail to move."
  },
  {
    "id": "6.G.11",
    "section": "6.G",
    "title": "TEST CASE, A CONVOY TO AN ADJACENT PROVINCE WITH A PARADOX",
    "orderBlocks": [
      "England:\nF Norway Supports F North Sea - Skagerrak\nF North Sea - Skagerrak\n\nRussia:\nA Sweden - Norway\nF Skagerrak Convoys A Sweden - Norway\nF Barents Sea Supports A Sweden - Norway"
    ],
    "expectation": "In this case the convoy route is available when the land\r\nroute is chosen and the convoy route is not available when\r\nthe convoy route is chosen.\nSee issue 4.A.2 and 4.A.3.\nIn case of the 1971 rulebook the move from Sweden to Norway is not a convoy (because Norway is not moving in opposite direction) and the English fleet in Norway is dislodged and the fleet in Skagerrak will not be dislodged.\nIn case of the 1982/2000/2023 rulebook, the question arises whether the land route is the fallback of the convoy route. If not, then this is just the most simple convoy paradox. The fleet in Skagerrak is dislodged and the army in Sweden will not advance.\nIn case fallback is possible, then the convoy is available when the land route is taken, but not otherwise.\nI prefer no fallback. That means that according to these\r\npreferences the fleet in the North Sea will dislodge the Russian\r\nfleet in Skagerrak and the army in Sweden will not advance."
  },
  {
    "id": "6.G.12",
    "section": "6.G",
    "title": "TEST CASE, SWAPPING TWO UNITS WITH TWO CONVOYS",
    "orderBlocks": [
      "England:\nA Liverpool - Edinburgh via convoy\nF North Atlantic Ocean Convoys A Liverpool - Edinburgh\nF Norwegian Sea Convoys A Liverpool - Edinburgh\n\nGermany:\nA Edinburgh - Liverpool via convoy\nF North Sea Convoys A Edinburgh - Liverpool\nF English Channel Convoys A Edinburgh - Liverpool\nF Irish Sea Convoys A Edinburgh - Liverpool"
    ],
    "expectation": "Of course, two armies can also swap by when they are both convoyed.\nThe armies in Liverpool and Edinburgh are swapped."
  },
  {
    "id": "6.G.13",
    "section": "6.G",
    "title": "TEST CASE, SUPPORT CUT ON ATTACK ON ITSELF VIA CONVOY",
    "orderBlocks": [
      "Austria:\nF Adriatic Sea Convoys A Trieste - Venice\nA Trieste - Venice via convoy\n\nItaly:\nA Venice Supports F Albania - Trieste\nF Albania - Trieste"
    ],
    "expectation": "If a unit is attacked by a supported unit, it is not possible to prevent \r\ndislodgement by trying to cut the support. But what, if a move is attempted via a convoy?\nFirst it should be mentioned that if for issue 4.A.3 the 1971 rulebook is chosen, the move from Trieste to Venice is just a move over land (because Venice does not move in opposite direction). In that case, the support of Venice will not be cut as normal.\nFor the 1982/2000/2023 rulebooks the attack is via convoy and it should be decided whether the Austrian attack is considered to be coming from Trieste or from\r\nthe Adriatic Sea. If it comes from Trieste, the support in Venice is not cut and the army in Trieste is dislodged by the fleet in Albania. If the Austrian attack is considered to be coming from the Adriatic Sea, then\r\nthe support is cut and the army in Trieste will not be dislodged. See also issue\r\n4.A.4.\nFirst of all, I prefer the 2023 rules for adjacent convoying, meaning that the move from Trieste uses the convoy. Furthermore, I think that the two Italian units are still stronger than the army in Trieste. Therefore, I prefer that the support in Venice is not cut and that the army in Trieste is dislodged by the fleet in Albania."
  },
  {
    "id": "6.G.14",
    "section": "6.G",
    "title": "TEST CASE, BOUNCE BY CONVOY TO ADJACENT PROVINCE",
    "orderBlocks": [
      "England:\nA Norway - Sweden\nF Denmark Supports A Norway - Sweden\nF Finland Supports A Norway - Sweden\n\nFrance:\nF Norwegian Sea - Norway\nF North Sea Supports F Norwegian Sea - Norway\n\nGermany:\nF Skagerrak Convoys A Sweden - Norway\n\nRussia:\nA Sweden - Norway via convoy\nF Barents Sea Supports A Sweden - Norway"
    ],
    "expectation": "Similar to test case 6.G.10, but now the other unit is taking the convoy.\nAgain, the army in Sweden is bounced by the fleet in\r\nthe Norwegian Sea. The army in Norway will move to\r\nSweden and dislodge the Russian army.\nThe final destination of the fleet in the Norwegian\r\nSea depends on how issue 4.A.7\r\nis resolved. If choice a is taken, then the fleet advances\r\nto Norway, but if choice b is taken (which I prefer)\r\nthe fleet bounces and stays in the Norwegian Sea."
  },
  {
    "id": "6.G.15",
    "section": "6.G",
    "title": "TEST CASE, BOUNCE AND DISLODGE WITH DOUBLE CONVOY",
    "orderBlocks": [
      "England:\nF North Sea Convoys A London - Belgium\nA Holland Supports A London - Belgium\nA Yorkshire - London\nA London - Belgium via convoy\n\nFrance:\nF English Channel Convoys A Belgium - London\nA Belgium - London via convoy"
    ],
    "expectation": "Similar to test case 6.G.10, but now both units\r\nuse a convoy and without some support.\nThe French army in Belgium is bounced by the\r\narmy from Yorkshire. The army in London move to\r\nBelgium, dislodging the unit there.\nThe final destination of the army in the Yorkshire\r\ndepends on how issue 4.A.7\r\nis resolved. If choice a is taken, then the army advances\r\nto London, but if choice b is taken (which I prefer)\r\nthe army bounces and stays in Yorkshire."
  },
  {
    "id": "6.G.16",
    "section": "6.G",
    "title": "TEST CASE, THE TWO UNIT IN ONE AREA BUG, MOVING BY CONVOY",
    "orderBlocks": [
      "England:\nA Norway - Sweden\nA Denmark Supports A Norway - Sweden\nF Baltic Sea Supports A Norway - Sweden\nF North Sea - Norway\n\nRussia:\nA Sweden - Norway via convoy\nF Skagerrak Convoys A Sweden - Norway\nF Norwegian Sea Supports A Sweden - Norway"
    ],
    "expectation": "If the adjudicator is not correctly implemented, this may lead to a resolution where two units end up in the same area.\nSee decision details 5.B.6. If the 'PREVENT STRENGTH'\r\nis incorrectly implemented, due to the fact that it does not take\r\ninto account that the 'PREVENT STRENGTH' is only zero when the\r\nunit is engaged in a head-to-head battle, then this goes wrong in\r\nthis test case. The 'PREVENT STRENGTH' of Sweden would be zero, \r\nbecause the opposing unit in Norway successfully moves. Since,\r\nthis strength would be zero, the fleet in the North Sea would move to\r\nNorway. However, although the 'PREVENT STRENGTH' is zero, the army\r\nin Sweden would also move to Norway. So, the final result would contain\r\ntwo units that successfully moved to Norway.\nOf course, this is incorrect. Norway will indeed successfully move\r\nto Sweden while the army in Sweden ends in Norway, because it is stronger\r\nthan the fleet in the North Sea. This fleet will stay in the North Sea."
  },
  {
    "id": "6.G.17",
    "section": "6.G",
    "title": "TEST CASE, THE TWO UNIT IN ONE AREA BUG, MOVING OVER LAND",
    "orderBlocks": [
      "England:\nA Norway - Sweden via convoy\nA Denmark Supports A Norway - Sweden\nF Baltic Sea Supports A Norway - Sweden\nF Skagerrak Convoys A Norway - Sweden\nF North Sea - Norway\n\nRussia:\nA Sweden - Norway\nF Norwegian Sea Supports A Sweden - Norway"
    ],
    "expectation": "Similar to the previous test case, but now the other unit moves by convoy.\nSweden and Norway are swapped, while the fleet in the\r\nNorth Sea will bounce."
  },
  {
    "id": "6.G.18",
    "section": "6.G",
    "title": "TEST CASE, THE TWO UNIT IN ONE AREA BUG, WITH DOUBLE CONVOY",
    "orderBlocks": [
      "England:\nF North Sea Convoys A London - Belgium\nA Holland Supports A London - Belgium\nA Yorkshire - London\nA London - Belgium\nA Ruhr Supports A London - Belgium\n\nFrance:\nF English Channel Convoys A Belgium - London\nA Belgium - London\nA Wales Supports A Belgium - London"
    ],
    "expectation": "Similar to the previous test case, but now both units move by convoy.\nBelgium and London are swapped, while the army in\r\nYorkshire fails to move to London."
  },
  {
    "id": "6.G.19",
    "section": "6.G",
    "title": "TEST CASE, SWAPPING WITH INTENT OF UNNECESSARY CONVOY",
    "orderBlocks": [
      "France:\nA Marseilles - Spain\nF Western Mediterranean Convoys A Marseilles - Spain\n\nItaly:\nF Gulf of Lyon Convoys A Marseilles - Spain\nA Spain - Marseilles"
    ],
    "expectation": "Can the intent made clear by the order of a fleet that is not necessary?\nSee issue 4.A.3 and 4.E.1.\nIn case the 1971 rules are used, the intent is not important and the units in Marseilles and Spain swap.\nThe point of interest is that there is a convoy route from Marseilles, Gulf of Lyon, Western Mediterranean to Spain. However, the fleet in Western Mediterranean is not necessary for this convoy and not necessary for any other convoy route. Therefore, this order should be considered illegal. Webbased adjudicators should not give this order as an option.\nWith the 2023 rules (which I prefer) illegal orders are ignored. The fleet in Gulf of Lyon is foreign and foreign units cannot express intent. With this, there is no intent to convoy and the units in Marseilles and Spain fail to move.\nIf explicit adjacent convoying is used (DPTG) there is also no convoy and none of the units move."
  },
  {
    "id": "6.G.20",
    "section": "6.G",
    "title": "TEST CASE, EXPLICIT CONVOY TO ADJACENT PROVINCE DISRUPTED",
    "orderBlocks": [
      "France:\nF Brest - English Channel\nA Picardy - Belgium via Convoy\nA Burgundy Supports A Picardy - Belgium\nF Mid-Atlantic Ocean Supports F Brest - English Channel\n\nEngland:\nF English Channel Convoys A Picardy - Belgium"
    ],
    "expectation": "If a move to adjacent province was explicit via convoy, and the convoy is disrupted, should it fall back to the land route?\nThis situation is not applicable for the 1971 and 1982 rulebooks, because they don't have the notion of 'via convoy'.\nFor the 2000/2023 rulebook the question arises whether the army in Picardy will fall back to the land route, since the convoy route is disrupted. See issue 4.A.3. \nI don't prefer the fallback anymore. So, the move of Picardy fails.\n6.H. TEST CASES, RETREATING"
  },
  {
    "id": "6.H.1",
    "section": "6.H",
    "title": "TEST CASE, NO SUPPORTS DURING RETREAT",
    "orderBlocks": [
      "Austria:\nF Trieste Hold\nA Serbia Hold\n\nTurkey:\nF Greece Hold\n\nItaly:\nA Venice Supports A Tyrolia - Trieste\nA Tyrolia - Trieste\nF Ionian Sea - Greece\nF Aegean Sea Supports F Ionian Sea - Greece",
      "Austria:\nF Trieste - Albania\nA Serbia Supports F Trieste - Albania\n\nTurkey:\nF Greece - Albania"
    ],
    "expectation": "Supports are not allowed in the retreat phase.\nThe fleet in Trieste and the fleet in Greece are dislodged. If the retreat orders are as follows:\nThe Austrian support order is illegal. Both dislodged fleets are disbanded."
  },
  {
    "id": "6.H.2",
    "section": "6.H",
    "title": "TEST CASE, NO SUPPORTS FROM RETREATING UNIT",
    "orderBlocks": [
      "England:\nA Liverpool - Edinburgh\nF Yorkshire Supports A Liverpool - Edinburgh\nF Norway Hold\n\nGermany:\nA Kiel Supports A Ruhr - Holland\nA Ruhr - Holland\n\nRussia:\nF Edinburgh Hold\nA Sweden Supports A Finland - Norway\nA Finland - Norway\nF Holland Hold",
      "England:\nF Norway - North Sea\n\nRussia:\nF Edinburgh - North Sea\nF Holland Supports F Edinburgh - North Sea"
    ],
    "expectation": "Even a retreating unit cannot give support.\nThe English fleet in Norway and the Russian fleets in Edinburgh and\r\nHolland are dislodged. If the following retreat orders are given:\nAlthough the fleet in Holland may receive an order, it may not support\r\n(it is disbanded). The English fleet in Norway and the Russian fleet in Edinburgh bounce and are disbanded."
  },
  {
    "id": "6.H.3",
    "section": "6.H",
    "title": "TEST CASE, NO CONVOY DURING RETREAT",
    "orderBlocks": [
      "England:\nF North Sea Hold\nA Holland Hold\n\nGermany:\nF Kiel Supports A Ruhr - Holland\nA Ruhr - Holland",
      "England:\nA Holland - Yorkshire\nF North Sea Convoys A Holland - Yorkshire"
    ],
    "expectation": "Convoys during retreat are not allowed.\nThe English army in Holland is dislodged. If England orders the following in retreat:\nThe convoy order is illegal. The army in Holland is disbanded."
  },
  {
    "id": "6.H.4",
    "section": "6.H",
    "title": "TEST CASE, NO OTHER MOVES DURING RETREAT",
    "orderBlocks": [
      "England:\nF North Sea Hold\nA Holland Hold\n\nGermany:\nF Kiel Supports A Ruhr - Holland\nA Ruhr - Holland",
      "England:\nA Holland - Belgium\nF North Sea - Norwegian Sea"
    ],
    "expectation": "Of course, you may not do any other move during a retreat. But look if the adjudicator checks for it.\nThe English army in Holland is dislodged. If England orders the following in retreat:\nThe fleet in the North Sea is not dislodge, so the move is illegal."
  },
  {
    "id": "6.H.5",
    "section": "6.H",
    "title": "TEST CASE, A UNIT MAY NOT RETREAT TO THE AREA FROM WHICH IT IS ATTACKED",
    "orderBlocks": [
      "Russia:\nF Constantinople Supports F Black Sea - Ankara\nF Black Sea - Ankara\n\nTurkey:\nF Ankara Hold"
    ],
    "expectation": "Well, that would be of course stupid. Still, the adjudicator must be tested on this.\nFleet in Ankara is dislodged and may not retreat to Black Sea."
  },
  {
    "id": "6.H.6",
    "section": "6.H",
    "title": "TEST CASE, UNIT MAY NOT RETREAT TO A CONTESTED AREA",
    "orderBlocks": [
      "Austria:\nA Budapest Supports A Trieste - Vienna\nA Trieste - Vienna\n\nGermany:\nA Munich - Bohemia\nA Silesia - Bohemia\n\nItaly:\nA Vienna Hold"
    ],
    "expectation": "Standoff prevents retreat to the area.\nThe Italian army in Vienna is dislodged. It may not retreat to Bohemia."
  },
  {
    "id": "6.H.7",
    "section": "6.H",
    "title": "TEST CASE, MULTIPLE RETREAT TO SAME AREA WILL DISBAND UNITS",
    "orderBlocks": [
      "Austria:\nA Budapest Supports A Trieste - Vienna\nA Trieste - Vienna\n\nGermany:\nA Munich Supports A Silesia - Bohemia\nA Silesia - Bohemia\n\nItaly:\nA Vienna Hold\nA Bohemia Hold",
      "Italy:\nA Bohemia - Tyrolia\nA Vienna - Tyrolia"
    ],
    "expectation": "There can only be one unit in an area.\nIf Italy orders the following for retreat:\nBoth armies will be disbanded."
  },
  {
    "id": "6.H.8",
    "section": "6.H",
    "title": "TEST CASE, TRIPLE RETREAT TO SAME AREA WILL DISBAND UNITS",
    "orderBlocks": [
      "England:\nA Liverpool - Edinburgh\nF Yorkshire Supports A Liverpool - Edinburgh\nF Norway Hold\n\nGermany:\nA Kiel Supports A Ruhr - Holland\nA Ruhr - Holland\n\nRussia:\nF Edinburgh Hold\nA Sweden Supports A Finland - Norway\nA Finland - Norway\nF Holland Hold",
      "England:\nF Norway - North Sea\n\nRussia:\nF Edinburgh - North Sea\nF Holland - North Sea"
    ],
    "expectation": "When three units retreat to the same area, then all three units are disbanded.\nThe fleets in Norway, Edinburgh and Holland are dislodged. If the following retreat orders are given:\nAll three units are disbanded."
  },
  {
    "id": "6.H.9",
    "section": "6.H",
    "title": "TEST CASE, DISLODGED UNIT WILL NOT MAKE ATTACKERS AREA CONTESTED",
    "orderBlocks": [
      "England:\nF Helgoland Bight - Kiel\nF Denmark Supports F Helgoland Bight - Kiel\n\nGermany:\nA Berlin - Prussia\nF Kiel Hold\nA Silesia Supports A Berlin - Prussia\n\nRussia:\nA Prussia - Berlin"
    ],
    "expectation": "An army can follow.\nThe fleet in Kiel can retreat to Berlin."
  },
  {
    "id": "6.H.10",
    "section": "6.H",
    "title": "TEST CASE, NOT RETREATING TO ATTACKER DOES NOT MEAN CONTESTED",
    "orderBlocks": [
      "England:\nA Kiel Hold\n\nGermany:\nA Berlin - Kiel\nA Munich Supports A Berlin - Kiel\nA Prussia Hold\n\nRussia:\nA Warsaw - Prussia\nA Silesia Supports A Warsaw - Prussia",
      "England:\nA Kiel - Berlin\n\nGermany:\nA Prussia - Berlin"
    ],
    "expectation": "An army cannot retreat to the area of the attacker. The easiest way to program that, is to mark that area as \"contested\". However, this is not correct. Another army may retreat to that area.\nThe armies in Kiel and Prussia are dislodged. The English army in\r\nKiel cannot retreat to Berlin, but the army in Prussia can retreat to Berlin. Suppose the following retreat orders are given:\nThe English retreat to Berlin is illegal and fails (the unit is disbanded).\r\nThe German retreat to Berlin is successful and does not bounce on the English unit."
  },
  {
    "id": "6.H.11",
    "section": "6.H",
    "title": "TEST CASE, RETREAT WHEN DISLODGED BY ADJACENT CONVOY",
    "orderBlocks": [
      "France:\nA Gascony - Marseilles via convoy\nA Burgundy Supports A Gascony - Marseilles\nF Mid-Atlantic Ocean Convoys A Gascony - Marseilles\nF Western Mediterranean Convoys A Gascony - Marseilles\nF Gulf of Lyon Convoys A Gascony - Marseilles\n\nItaly:\nA Marseilles Hold"
    ],
    "expectation": "If a unit is dislodged by an army via convoy, the question arises\r\nwhether the dislodged army can retreat to the original province of the\r\nconvoyed army. This is only relevant in case the convoy was to an adjacent province.\nThe army in Gascony takes a convoy and does not pass the border of Gascony with Marseilles (it went a completely different direction). Now, the result depends on which rule is used for retreating (see issue 4.A.5).\nThe 2023 rules explicitly allow this. So, I prefer that\r\nMarseilles may retreat to Gascony."
  },
  {
    "id": "6.H.12",
    "section": "6.H",
    "title": "TEST CASE, RETREAT WHEN DISLODGED BY ADJACENT CONVOY WHILE TRYING TO DO THE SAME",
    "orderBlocks": [
      "England:\nA Liverpool - Edinburgh via convoy\nF Irish Sea Convoys A Liverpool - Edinburgh\nF English Channel Convoys A Liverpool - Edinburgh\nF North Sea Convoys A Liverpool - Edinburgh\n\nFrance:\nF Brest - English Channel\nF Mid-Atlantic Ocean Supports F Brest - English Channel\n\nRussia:\nA Edinburgh - Liverpool via convoy\nF Norwegian Sea Convoys A Edinburgh - Liverpool\nF North Atlantic Ocean Convoys A Edinburgh - Liverpool\nA Clyde Supports A Edinburgh - Liverpool"
    ],
    "expectation": "The previous test case can be made more extra ordinary, when\r\nboth armies tried to move by convoy.\nBoth the army in Liverpool as in Edinburgh will try to move by\r\nconvoy. The army in Edinburgh will succeed. The army in Liverpool\r\nwill fail, because of the disrupted convoy. It is dislodged by the\r\narmy of Edinburgh. Now, the question is whether the army in\r\nLiverpool may retreat to Edinburgh. The result depends on which\r\nrule is used for retreating (see issue 4.A.5).\nThe 2023 rules, which I prefer, explicitly allow that\r\nthe army in Liverpool may retreat to Edinburgh."
  },
  {
    "id": "6.H.13",
    "section": "6.H",
    "title": "TEST CASE, NO RETREAT WITH CONVOY IN MOVEMENT PHASE",
    "orderBlocks": [
      "England:\nA Picardy Hold\nF English Channel Convoys A Picardy - London\n\nFrance:\nA Paris - Picardy\nA Brest Supports A Paris - Picardy"
    ],
    "expectation": "The areas where a unit may retreat to, must be determined during the\r\nmovement phase. Care should be taken that a convoy ordered in the movement phase\r\ncannot be used in the retreat phase.\nThe dislodged army in Picardy cannot retreat to London."
  },
  {
    "id": "6.H.14",
    "section": "6.H",
    "title": "TEST CASE, NO RETREAT WITH SUPPORT IN MOVEMENT PHASE",
    "orderBlocks": [
      "England:\nA Picardy Hold\nF English Channel Supports A Picardy - Belgium\n\nFrance:\nA Paris - Picardy\nA Brest Supports A Paris - Picardy\nA Burgundy Hold\n\nGermany:\nA Munich Supports A Marseilles - Burgundy\nA Marseilles - Burgundy",
      "England:\nA Picardy - Belgium\n\nFrance:\nA Burgundy - Belgium"
    ],
    "expectation": "Comparable to the previous test case, a support given in the movement phase cannot be used in the retreat phase.\nAfter the movement phase the following retreat orders are given:\nBoth the army in Picardy and Burgundy are disbanded."
  },
  {
    "id": "6.H.15",
    "section": "6.H",
    "title": "TEST CASE, NO COASTAL CRAWL IN RETREAT",
    "orderBlocks": [
      "England:\nF Portugal Hold\n\nFrance:\nF Spain(sc) - Portugal\nF Mid-Atlantic Ocean Supports F Spain(sc) - Portugal"
    ],
    "expectation": "You cannot go to the other coast from where the attacker came from.\nThe English fleet in Portugal is destroyed and cannot\r\nretreat to Spain(nc)."
  },
  {
    "id": "6.H.16",
    "section": "6.H",
    "title": "TEST CASE, CONTESTED FOR BOTH COASTS",
    "orderBlocks": [
      "France:\nF Mid-Atlantic Ocean - Spain(nc)\nF Gascony - Spain(nc)\nF Western Mediterranean Hold\n\nItaly:\nF Tunis Supports F Tyrrhenian Sea - Western Mediterranean\nF Tyrrhenian Sea - Western Mediterranean"
    ],
    "expectation": "If a coast is contested, the other is not available for retreat.\nThe French fleet in the Western Mediterranean cannot\r\nretreat to Spain(sc).\n6.I. TEST CASES, BUILDING"
  },
  {
    "id": "6.I.1",
    "section": "6.I",
    "title": "TEST CASE, TOO MANY BUILD ORDERS",
    "orderBlocks": [
      "Germany:\nBuild A Warsaw\nBuild A Kiel\nBuild A Munich"
    ],
    "expectation": "Check how program reacts when someone orders too many builds.\nGermany may build one:\nProgram should not build all three, but handle it in another\r\nway. See issue 4.D.4.\nI prefer that the build orders are just handled one by one\r\nuntil all allowed units are build. According to this preference,\r\nthe build in Warsaw fails, the build in Kiel succeeds and the\r\nbuild in Munich fails."
  },
  {
    "id": "6.I.2",
    "section": "6.I",
    "title": "TEST CASE, FLEETS CANNOT BE BUILD IN LAND AREAS",
    "orderBlocks": [
      "Russia:\nBuild F Moscow"
    ],
    "expectation": "Physical this is possible, but it is still not allowed.\nRussia has one build and Moscow is empty.\nSee issue 4.C.4. Some game masters will change the order and build an army in Moscow.\nI prefer that the build fails."
  },
  {
    "id": "6.I.3",
    "section": "6.I",
    "title": "TEST CASE, SUPPLY CENTER MUST BE EMPTY FOR BUILDING",
    "orderBlocks": [
      "Germany:\nBuild A Berlin"
    ],
    "expectation": "You can't have two units in a sector. So, you can't build\r\nwhen there is a unit in the supply center.\nGermany may build a unit but has an army in Berlin. Germany\r\norders the following:\nBuild fails."
  },
  {
    "id": "6.I.4",
    "section": "6.I",
    "title": "TEST CASE, BOTH COASTS MUST BE EMPTY FOR BUILDING",
    "orderBlocks": [
      "Russia:\nBuild A St Petersburg(nc)"
    ],
    "expectation": "If a sector is occupied on one coast, the other coast cannot be used for building.\nRussia may build a unit and has a fleet in St Petersburg(sc). Russia orders the following:\nBuild fails."
  },
  {
    "id": "6.I.5",
    "section": "6.I",
    "title": "TEST CASE, BUILDING IN HOME SUPPLY CENTER THAT IS NOT OWNED",
    "orderBlocks": [
      "Germany:\nBuild A Berlin"
    ],
    "expectation": "Building a unit is only allowed when supply center is a home\r\nsupply center and is owned. If not owned, build fails.\r\nRussia captured Berlin in Fall, but left in the next year. Germany captured other supply centers, but without recapturing Berling it may not build in Berlin.\nBuild fails."
  },
  {
    "id": "6.I.6",
    "section": "6.I",
    "title": "TEST CASE, BUILDING IN OWNED SUPPLY CENTER THAT IS NOT A HOME SUPPLY CENTER",
    "orderBlocks": [
      "Germany:\nBuild A Warsaw"
    ],
    "expectation": "Building a unit is only allowed when supply center is a home\r\nsupply center and is owned. If it is not a home supply center, the build fails.\nGermany owns Warsaw, Warsaw is empty and Germany may build one unit.\nBuild fails."
  },
  {
    "id": "6.I.7",
    "section": "6.I",
    "title": "TEST CASE, ONLY ONE BUILD IN A HOME SUPPLY CENTER",
    "orderBlocks": [
      "Russia:\nBuild A Moscow\nBuild A Moscow"
    ],
    "expectation": "If you may build two units, you can still only build one in a supply center.\nRussia owns Moscow, Moscow is empty and Russia may build two units.\nThe second build should fail.\n6.J. TEST CASES, CIVIL DISORDER AND DISBANDS"
  },
  {
    "id": "6.J.1",
    "section": "6.J",
    "title": "TEST CASE, TOO MANY DISBAND ORDERS",
    "orderBlocks": [
      "France:\nRemove F Gulf of Lyon\nRemove A Picardy\nRemove A Paris"
    ],
    "expectation": "Check how program reacts when someone orders too many disbands.\nFrance has to disband one and has an army in Paris and Picardy.\nProgram should not disband both Paris and Picardy, but should handle\r\nit in a different way. See also issue 4.D.6.\nI prefer that the disband orders are handled one by one. According\r\nto the preference, the removal of the fleet in the Gulf of Lyon fails\r\n(no fleet), the removal of the army in Picardy succeeds and the removal\r\nof the army in Paris fails (too many disbands)."
  },
  {
    "id": "6.J.2",
    "section": "6.J",
    "title": "TEST CASE, REMOVING THE SAME UNIT TWICE",
    "orderBlocks": [
      "France:\nRemove A Paris\nRemove A Paris"
    ],
    "expectation": "If you have to remove two units, you can always try to trick the\r\ncomputer by removing the same unit twice.\nFrance has to disband two and has an army in Paris.\nProgram should remove army in Paris and remove another unit by using the civil disorder rules."
  },
  {
    "id": "6.J.3",
    "section": "6.J",
    "title": "TEST CASE, CIVIL DISORDER TWO ARMIES WITH DIFFERENT DISTANCE",
    "orderBlocks": [
      "Russia has to remove one.\nRussia owns supply center St Petersburg.\nRussia has armies in Livonia and Sweden.\nRussia does not order a disband."
    ],
    "expectation": "When a player forgets to disband a unit, the civil disorder\r\nrules must be applied. When two armies have different distance\r\nfrom the home supply centers, then the army with the greatest\r\ndistance has to be removed.\nThe army in Sweden is removed."
  },
  {
    "id": "6.J.4",
    "section": "6.J",
    "title": "TEST CASE, CIVIL DISORDER TWO ARMIES WITH EQUAL DISTANCE",
    "orderBlocks": [
      "Russia has to remove one.\nRussia owns Moscow.\nRussia has armies in Livonia and Ukraine.\nRussia does not order a disband."
    ],
    "expectation": "If two armies have equal distance from the home supply centers, then alphabetical order is used.\nBoth armies have distance one. The Livonia army is removed, because it appears first in alphabetical order."
  },
  {
    "id": "6.J.5",
    "section": "6.J",
    "title": "TEST CASE, CIVIL DISORDER TWO FLEETS WITH DIFFERENT DISTANCE",
    "orderBlocks": [
      "Russia has to remove one.\nRussia owns St Petersburg.\nRussia has fleets in Skagerrak and Berlin.\nRussia does not order a disband."
    ],
    "expectation": "If two fleets have different distance from the home supply centers,\r\nthen the fleet with the greatest distance has to be removed. Note that fleets cannot go over land.\nThe distance of the fleet in Berlin is three, the fleet in Skagerrak has distance two (via Norway). So,\r\nthe fleet in Berlin has to be removed."
  },
  {
    "id": "6.J.6",
    "section": "6.J",
    "title": "TEST CASE, CIVIL DISORDER TWO FLEETS WITH EQUAL DISTANCE",
    "orderBlocks": [
      "Russia has to remove one.\nRussia owns Munich.\nRussia has fleets in Gulf of Bothnia and North Sea.\nRussia does not order a disband."
    ],
    "expectation": "Alphabetical order is used, when two fleets have equal distance to the home supply centers.\nNote, that in 2023 rules distance is calculated to owned supply centers (instead of home supply centers). Also, for distance calculations both armies and fleets can take both land and sea. Both distances are three. The fleet in Gulf of Bothnia is removed, because it appears first in alphabetical order."
  },
  {
    "id": "6.J.7",
    "section": "6.J",
    "title": "TEST CASE, CIVIL DISORDER TWO FLEETS AND ARMY WITH EQUAL DISTANCE",
    "orderBlocks": [
      "Russia has to remove one.\nRussia owns St Petersburg and Warsaw.\nRussia has an army in Bohemia, a fleet in Skagerrak and a fleet in the North Sea.\nRussia does not order a disband."
    ],
    "expectation": "In removal, the fleet has precedence over an army. In this case there are two\r\nfleets, to make the test more complex.\nThe distances of the army and the fleets to one of the owned supply centers\r\nare two. The fleets take precedence above the army (although the army is\r\nalphabetical first). The fleet in the North Sea is alphabetical first, compared\r\nto Skagerrak and has to be removed."
  },
  {
    "id": "6.J.8",
    "section": "6.J",
    "title": "TEST CASE, CIVIL DISORDER A FLEET WITH SHORTER DISTANCE THEN THE ARMY",
    "orderBlocks": [
      "Russia has to remove one.\nRussia has an army in Tyrolia and a fleet in the Baltic Sea.\nRussia owns Warsaw.\nRussia does not order a disband."
    ],
    "expectation": "If the fleet has a shorter distance than the army, the army is removed.\nThe distance of the army to Warsaw is three while the distance of the fleet is two. So, the army is removed."
  },
  {
    "id": "6.J.9",
    "section": "6.J",
    "title": "TEST CASE, CIVIL DISORDER MUST BE COUNTED FROM BOTH COASTS",
    "orderBlocks": [
      "Russia has to remove one.\nRussia owns St Petersburg and Sevastopol.\nRussia has armies in Greece and Sevastopol and a fleet in the Baltic Sea.\nRussia does not order a disband.",
      "Russia has to remove one.\nRussia owns St Petersburg and Sevastopol.\nRussia has armies in Greece and Sevastopol and a fleet in Skagerrak.\nRussia does not order a disband."
    ],
    "expectation": "Distance must be calculated from both coasts.\nThe distance of the fleet to St Petersburg(nc) is three but to St Petersburg(sc) is two. So, the army in Greece must be removed.\nThe distance of the fleet to St Petersburg(sc) is three but to St Petersburg(nc) is two. So, the army in Greece must be removed."
  },
  {
    "id": "6.J.10",
    "section": "6.J",
    "title": "TEST CASE, CIVIL DISORDER COUNTING CONVOYING DISTANCE",
    "orderBlocks": [
      "Italy has to remove one.\nItaly owns Naples.\nItaly has armies in Greece and Piedmont.\nItaly does not order a disband."
    ],
    "expectation": "For calculating the distance for armies all areas must be considered.\nThe distance from Greece to owned supply center is five over land. However, for distance calculation it can go over water and arrive in two steps. The army in Piedmont has to be removed."
  },
  {
    "id": "6.J.11",
    "section": "6.J",
    "title": "TEST CASE, DISTANCE TO OWNED SUPPLY CENTER",
    "orderBlocks": [
      "Italy has to remove one.\nItaly owns Warsaw.\nItaly has armies in Warsaw and Tuscany.\nItaly does not order a disband."
    ],
    "expectation": "The 2023 rules say that distance must be calculated to owned supply center instead of home supply center (as it was in the older rulebooks).\nThe army in Tuscany is removed and Italy will continue defending its supply center in Warsaw. Under older rulebooks the army in Tuscany was kept.\n(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML=\"window.__CF$cv$params={r:'9fec34da5990aa04',t:'MTc3OTI4OTE3OQ=='};var a=document.createElement('script');a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);\";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();"
  }
] as const satisfies readonly DatcCase[];
