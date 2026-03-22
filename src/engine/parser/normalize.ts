import type { AdventureLexicon, CanonicalVerb, Direction } from "../types";

const ARTICLES = new Set(["a", "an", "the"]);
const PREPOSITIONS = new Set(["with", "using", "at", "in", "into", "on", "from", "to", "through"]);

const BASE_VERB_ALIASES: Record<string, CanonicalVerb> = {
  be: "SWITCH_ACTOR",
  close: "CLOSE",
  drop: "DROP",
  extinguish: "EXTINGUISH",
  go: "GO",
  help: "HELP",
  inventory: "INVENTORY",
  light: "LIGHT",
  load: "LOAD",
  look: "LOOK",
  move: "MOVE",
  open: "OPEN",
  pick: "UNLOCK",
  pry: "MOVE",
  save: "SAVE",
  search: "SEARCH",
  take: "TAKE",
  unlock: "UNLOCK",
  use: "USE",
  wait: "WAIT"
};

const BASE_DIRECTION_ALIASES: Record<string, Direction> = {
  e: "east",
  east: "east",
  n: "north",
  north: "north",
  s: "south",
  south: "south",
  w: "west",
  west: "west"
};

export interface NormalizedCommand {
  actorAlias: string | undefined;
  direction: Direction | undefined;
  directObjectTokens: string[];
  indirectObjectTokens: string[];
  preposition: string | undefined;
  raw: string;
  verb: CanonicalVerb | undefined;
}

export function isPreposition(token: string): boolean {
  return PREPOSITIONS.has(token);
}

function normalizeVerb(token: string, lexicon: AdventureLexicon): CanonicalVerb | undefined {
  const mappedToken = lexicon.verbAliases[token] ?? token;

  return BASE_VERB_ALIASES[mappedToken];
}

function normalizeDirection(token: string, lexicon: AdventureLexicon): Direction | undefined {
  return lexicon.directionAliases[token] ?? BASE_DIRECTION_ALIASES[token];
}

export function normalizeTokens(
  tokens: string[],
  lexicon: AdventureLexicon
): NormalizedCommand {
  const articleFiltered = tokens.filter((token) => !ARTICLES.has(token));

  if (articleFiltered.length === 0) {
    return {
      actorAlias: undefined,
      direction: undefined,
      directObjectTokens: [],
      indirectObjectTokens: [],
      preposition: undefined,
      raw: "",
      verb: undefined
    };
  }

  let actorAlias: string | undefined;
  let working = [...articleFiltered];
  const firstToken = working[0];
  const secondToken = working[1];
  const thirdToken = working[2];

  if (firstToken && secondToken === "," && lexicon.actorAliases[firstToken]) {
    actorAlias = firstToken;
    working = working.slice(2);
  } else if (
    firstToken === "tell" &&
    secondToken &&
    thirdToken === "to" &&
    lexicon.actorAliases[secondToken]
  ) {
    actorAlias = secondToken;
    working = working.slice(3);
  }

  const raw = working.join(" ");
  const verbToken = working[0];
  const standaloneDirection = verbToken ? normalizeDirection(verbToken, lexicon) : undefined;

  if (standaloneDirection) {
    return {
      actorAlias,
      direction: standaloneDirection,
      directObjectTokens: [standaloneDirection],
      indirectObjectTokens: [],
      preposition: undefined,
      raw,
      verb: "GO"
    };
  }

  const verb = verbToken ? normalizeVerb(verbToken, lexicon) : undefined;
  const remainder = working.slice(1);
  const prepositionIndex = remainder.findIndex((token) => isPreposition(token));

  if (prepositionIndex === -1) {
    return {
      actorAlias,
      direction: undefined,
      directObjectTokens: remainder,
      indirectObjectTokens: [],
      preposition: undefined,
      raw,
      verb
    };
  }

  return {
    actorAlias,
    direction: undefined,
    directObjectTokens: remainder.slice(0, prepositionIndex),
    indirectObjectTokens: remainder.slice(prepositionIndex + 1),
    preposition: remainder[prepositionIndex],
    raw,
    verb
  };
}
