import type { AdventureLexicon, CanonicalVerb, Direction, Intent } from "../types";

const ARTICLES = new Set(["a", "an", "the"]);
const PREPOSITIONS = new Set(["with", "using", "at", "in", "into", "on", "from", "to", "through"]);

const BASE_VERB_ALIASES: Record<string, CanonicalVerb> = {
  attach: "ATTACH",
  be: "SWITCH_ACTOR",
  close: "CLOSE",
  cross: "CROSS",
  drop: "DROP",
  examine: "EXAMINE",
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
  pull: "PULL",
  push: "PUSH",
  save: "SAVE",
  search: "SEARCH",
  take: "TAKE",
  turn: "TURN",
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

function stripArticles(tokens: string[]): string[] {
  return tokens.filter((token) => !ARTICLES.has(token));
}

function normalizeVerb(token: string, lexicon: AdventureLexicon): CanonicalVerb | undefined {
  const mappedToken = lexicon.verbAliases[token] ?? token;

  return BASE_VERB_ALIASES[mappedToken];
}

function normalizeDirection(token: string, lexicon: AdventureLexicon): Direction | undefined {
  return lexicon.directionAliases[token] ?? BASE_DIRECTION_ALIASES[token];
}

function splitPreposition(tokens: string[]): {
  direct: string[];
  indirect: string[];
  preposition: string | undefined;
} {
  const index = tokens.findIndex((token) => PREPOSITIONS.has(token));

  if (index === -1) {
    return {
      direct: tokens,
      indirect: [],
      preposition: undefined
    };
  }

  return {
    direct: tokens.slice(0, index),
    indirect: tokens.slice(index + 1),
    preposition: tokens[index]
  };
}

export function normalizeTokens(rawTokens: string[], lexicon: AdventureLexicon): Intent {
  const tokens = stripArticles(rawTokens);

  if (tokens.length === 0) {
    throw new Error("Empty command.");
  }

  let actorId: string | undefined;
  let working = [...tokens];
  const firstToken = working[0];
  const secondToken = working[1];
  const thirdToken = working[2];

  if (firstToken && secondToken === "," && lexicon.actorAliases[firstToken]) {
    actorId = lexicon.actorAliases[firstToken];
    working = working.slice(2);
  } else if (
    firstToken === "tell" &&
    secondToken &&
    lexicon.actorAliases[secondToken] &&
    thirdToken === "to"
  ) {
    actorId = lexicon.actorAliases[secondToken];
    working = working.slice(3);
  }

  const raw = working.join(" ");

  if (working.length === 0) {
    throw new Error("Incomplete command.");
  }

  const commandHead = working[0];

  if (!commandHead) {
    throw new Error("Incomplete command.");
  }

  const direction = normalizeDirection(commandHead, lexicon);

  if (direction) {
    return {
      verb: "GO",
      actorId,
      directObject: direction,
      indirectObject: undefined,
      preposition: undefined,
      raw
    };
  }

  const verb = normalizeVerb(commandHead, lexicon);

  if (!verb) {
    throw new Error(`Unknown verb "${commandHead}".`);
  }

  const remainder = working.slice(1);

  if (verb === "SWITCH_ACTOR") {
    return {
      verb,
      actorId: undefined,
      directObject: remainder.join(" ") || undefined,
      indirectObject: undefined,
      preposition: undefined,
      raw
    };
  }

  const split = splitPreposition(remainder);

  return {
    verb,
    actorId,
    directObject: split.direct.join(" ") || undefined,
    indirectObject: split.indirect.join(" ") || undefined,
    preposition: split.preposition,
    raw
  };
}
