import type {
  ActorId,
  AdventureCommandTemplate,
  AdventureDefinition,
  AdventureDictionary,
  CanonicalVerb,
  DictionaryAliasEntry,
  Direction,
  ItemId
} from "../types";

export interface CompiledAdventureDictionary {
  actorAliasToIds: Map<string, ActorId[]>;
  actorPhrasesById: Map<ActorId, string[]>;
  commandWords: Set<string>;
  directionAliases: Map<string, Direction>;
  groupAliasToIds: Map<string, ItemId[]>;
  itemAliasToIds: Map<string, ItemId[]>;
  itemPhrasesById: Map<ItemId, string[]>;
  commandTemplates: Array<{ alias: string; template: AdventureCommandTemplate; tokens: string[] }>;
  noiseWords: Set<string>;
  phraseAliases: Array<{ alias: string; tokens: string[]; verb: CanonicalVerb }>;
  stopWords: Set<string>;
  verbAliases: Map<string, CanonicalVerb>;
}

const DEFAULT_STOP_WORDS = ["a", "an", "the"];
const DEFAULT_NOISE_WORDS = [
  "kindly",
  "now",
  "ok",
  "okay",
  "please",
  "try"
];

const BASE_VERB_ALIASES: Partial<Record<CanonicalVerb, string[]>> = {
  ATTACH: ["attach", "fit", "insert", "place", "put", "slot"],
  CLOSE: ["close", "shut"],
  CROSS: ["cross", "traverse"],
  DROP: ["drop", "discard", "leave", "put down"],
  EXAMINE: ["check", "describe", "examine", "inspect", "study", "x"],
  EXTINGUISH: ["douse", "extinguish", "put out", "snuff"],
  GO: ["enter", "go", "head", "leave", "walk"],
  HELP: ["help"],
  INVENTORY: ["inventory", "inv", "i"],
  LIGHT: ["ignite", "light", "oil"],
  LOAD: ["load", "restore"],
  LOOK: ["look", "l"],
  MOVE: ["force", "move", "pry", "shift"],
  OPEN: ["open", "unbar", "uncover"],
  PULL: ["drag", "haul", "pull"],
  PUSH: ["press", "push", "shove"],
  SAVE: ["save"],
  SEARCH: ["search", "look in", "look inside", "rummage"],
  SWITCH_ACTOR: ["be"],
  TAKE: ["get", "grab", "pick up", "take"],
  TURN: ["operate", "turn", "work"],
  UNLOCK: ["pick", "unlock"],
  USE: ["apply", "use"],
  WAIT: ["wait", "z"]
};

const BASE_DIRECTION_ALIASES: Partial<Record<Direction, string[]>> = {
  down: ["down", "d"],
  east: ["east", "e"],
  in: ["in", "inside"],
  north: ["north", "n"],
  out: ["out", "outside"],
  south: ["south", "s"],
  up: ["up", "u"],
  west: ["west", "w"]
};

const BASE_PHRASE_ALIASES: Record<string, CanonicalVerb> = {
  "look at": "EXAMINE",
  "look in": "SEARCH",
  "look inside": "SEARCH",
  "pick up": "TAKE",
  "put out": "EXTINGUISH",
  "pry open": "MOVE",
  "turn on": "LIGHT"
};

const BASE_COMMAND_TEMPLATES: Record<string, AdventureCommandTemplate> = {
  "look around": { verb: "LOOK" },
  "look": { verb: "LOOK" },
  "what am i carrying": { verb: "INVENTORY" },
  "what have i got": { verb: "INVENTORY" }
};

const cache = new WeakMap<AdventureDefinition, CompiledAdventureDictionary>();

function uniq(values: string[]): string[] {
  return [...new Set(values)];
}

function appendAlias<T extends string>(map: Map<string, T[]>, alias: string, target: T): void {
  const existing = map.get(alias) ?? [];

  if (!existing.includes(target)) {
    map.set(alias, [...existing, target]);
  }
}

export function expandDictionaryAliasSpec(spec: DictionaryAliasEntry | undefined): string[] {
  if (!spec) {
    return [];
  }

  const nouns = spec.nouns ?? [];
  const adjectives = spec.adjectives ?? [];
  const adjectiveNouns = nouns.flatMap((noun) => adjectives.map((adjective) => `${adjective} ${noun}`));

  return [
    ...(spec.aliases ?? []),
    ...nouns,
    ...adjectiveNouns,
    ...(spec.pronouns ?? [])
  ];
}

function addCanonicalAliases<T extends string>(
  source: Partial<Record<T, string[]>>,
  target: Map<string, T>
): void {
  for (const [canonical, aliases] of Object.entries(source) as Array<[T, string[] | undefined]>) {
    for (const alias of aliases ?? []) {
      target.set(normalizeDictionaryPhrase(alias), canonical);
    }

    target.set(normalizeDictionaryPhrase(canonical), canonical);
  }
}

function mergeVerbAliases(dictionary: AdventureDictionary): Map<string, CanonicalVerb> {
  const aliases = new Map<string, CanonicalVerb>();

  addCanonicalAliases(BASE_VERB_ALIASES, aliases);
  addCanonicalAliases(dictionary.verbs, aliases);

  return aliases;
}

function mergeDirectionAliases(dictionary: AdventureDictionary): Map<string, Direction> {
  const aliases = new Map<string, Direction>();

  addCanonicalAliases(BASE_DIRECTION_ALIASES, aliases);
  addCanonicalAliases(dictionary.directions, aliases);

  return aliases;
}

function compilePhraseAliases(dictionary: AdventureDictionary): CompiledAdventureDictionary["phraseAliases"] {
  const merged = new Map<string, CanonicalVerb>();

  for (const [alias, verb] of Object.entries(BASE_PHRASE_ALIASES)) {
    merged.set(normalizeDictionaryPhrase(alias), verb);
  }

  for (const [alias, verb] of Object.entries(dictionary.phraseAliases ?? {})) {
    merged.set(normalizeDictionaryPhrase(alias), verb);
  }

  return [...merged.entries()]
    .map(([alias, verb]) => ({
      alias,
      tokens: alias.split(" "),
      verb
    }))
    .sort((left, right) => right.tokens.length - left.tokens.length);
}

function compileCommandTemplates(dictionary: AdventureDictionary): CompiledAdventureDictionary["commandTemplates"] {
  const merged = new Map<string, AdventureCommandTemplate>();

  for (const [alias, template] of Object.entries(BASE_COMMAND_TEMPLATES)) {
    merged.set(normalizeDictionaryPhrase(alias), template);
  }

  for (const [alias, template] of Object.entries(dictionary.idioms ?? {})) {
    merged.set(normalizeDictionaryPhrase(alias), template);
  }

  return [...merged.entries()]
    .map(([alias, template]) => ({
      alias,
      template,
      tokens: alias.split(" ")
    }))
    .sort((left, right) => right.tokens.length - left.tokens.length);
}

export function normalizeDictionaryPhrase(value: string): string {
  return value
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[.!?;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function collectItemPhrases(adventure: AdventureDefinition, itemId: ItemId): string[] {
  const item = adventure.content.items.find((candidate) => candidate.id === itemId);

  if (!item) {
    return [];
  }

  const configured = expandDictionaryAliasSpec(adventure.dictionary.items[item.id]);

  return uniq(
    [item.id, item.name, ...configured]
      .map(normalizeDictionaryPhrase)
      .filter(Boolean)
  );
}

function collectActorPhrases(adventure: AdventureDefinition, actorId: ActorId): string[] {
  const actor = adventure.content.actors.find((candidate) => candidate.id === actorId);

  if (!actor) {
    return [];
  }

  const configured = expandDictionaryAliasSpec(adventure.dictionary.actors[actor.id]);

  return uniq(
    [actor.id, actor.name, ...configured]
      .map(normalizeDictionaryPhrase)
      .filter(Boolean)
  );
}

export function getCompiledDictionary(
  adventure: AdventureDefinition
): CompiledAdventureDictionary {
  const cached = cache.get(adventure);

  if (cached) {
    return cached;
  }

  const actorAliasToIds = new Map<string, ActorId[]>();
  const actorPhrasesById = new Map<ActorId, string[]>();
  const commandTemplates = compileCommandTemplates(adventure.dictionary);
  const directionAliases = mergeDirectionAliases(adventure.dictionary);
  const groupAliasToIds = new Map<string, ItemId[]>();
  const itemAliasToIds = new Map<string, ItemId[]>();
  const itemPhrasesById = new Map<ItemId, string[]>();
  const noiseWords = new Set(
    uniq([...DEFAULT_NOISE_WORDS, ...(adventure.dictionary.noiseWords ?? [])]).map(normalizeDictionaryPhrase)
  );
  const phraseAliases = compilePhraseAliases(adventure.dictionary);
  const stopWords = new Set(
    uniq([...DEFAULT_STOP_WORDS, ...(adventure.dictionary.stopWords ?? [])]).map(normalizeDictionaryPhrase)
  );
  const verbAliases = mergeVerbAliases(adventure.dictionary);

  for (const actor of adventure.content.actors) {
    const phrases = collectActorPhrases(adventure, actor.id);
    actorPhrasesById.set(actor.id, phrases);

    for (const phrase of phrases) {
      appendAlias(actorAliasToIds, phrase, actor.id);
    }
  }

  for (const item of adventure.content.items) {
    const phrases = collectItemPhrases(adventure, item.id);
    itemPhrasesById.set(item.id, phrases);

    for (const phrase of phrases) {
      appendAlias(itemAliasToIds, phrase, item.id);
    }
  }

  for (const [alias, itemIds] of Object.entries(adventure.dictionary.groups ?? {})) {
    const normalizedAlias = normalizeDictionaryPhrase(alias);
    const existing = groupAliasToIds.get(normalizedAlias) ?? [];
    groupAliasToIds.set(normalizedAlias, uniq([...existing, ...itemIds]));
  }

  const commandWords = new Set<string>([
    ...verbAliases.keys(),
    ...directionAliases.keys(),
    ...commandTemplates.flatMap((template) => template.tokens),
    ...phraseAliases.flatMap((phrase) => phrase.tokens)
  ]);

  const compiled = {
    actorAliasToIds,
    actorPhrasesById,
    commandWords,
    commandTemplates,
    directionAliases,
    groupAliasToIds,
    itemAliasToIds,
    itemPhrasesById,
    noiseWords,
    phraseAliases,
    stopWords,
    verbAliases
  };

  cache.set(adventure, compiled);

  return compiled;
}
