import { getItemById } from "../adventure";
import type {
  AdventureDefinition,
  AtomicCommand,
  CanonicalVerb,
  CommandPlan,
  GameState,
  Intent,
  ResolvedIntent
} from "../types";
import { getCompiledDictionary, normalizeDictionaryPhrase } from "./dictionary";
import { ParserDiagnosticError } from "./diagnostics";
import { normalizeTokens } from "./normalize";
import { resolveIntent, resolveObjectId } from "./resolve";
import { tokenize } from "./tokenize";

const SAFE_BATCH_VERBS = new Set<CanonicalVerb>(["TAKE", "DROP", "EXAMINE", "OPEN", "CLOSE"]);
const META_VERBS = new Set<CanonicalVerb>(["HELP", "INVENTORY", "LOAD", "LOOK", "SAVE", "WAIT"]);

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function formatIntent(intent: ResolvedIntent): string {
  return [
    intent.verb,
    intent.directObjectId,
    intent.preposition,
    intent.indirectObjectId
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/_/g, " ")
    .toUpperCase();
}

function atomicFromResolved(source: string, intent: ResolvedIntent): AtomicCommand {
  return {
    confidence: intent.confidence ?? "exact",
    intent,
    normalized: intent.normalized ?? formatIntent(intent),
    source
  };
}

export function isParserMetaVerb(verb: CanonicalVerb): boolean {
  return META_VERBS.has(verb);
}

export function splitCommandChain(raw: string): string[] {
  return raw
    .replace(/\s*,\s*then\s+/gi, "\n")
    .replace(/\s+and\s+then\s+/gi, "\n")
    .replace(/\s+then\s+/gi, "\n")
    .replace(/[.;]+/g, "\n")
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function phraseTokens(phrase: string): string[] {
  return normalizeDictionaryPhrase(phrase).split(" ").filter(Boolean);
}

function phraseMatchesCandidate(candidatePhrase: string, query: string): boolean {
  const candidate = normalizeDictionaryPhrase(candidatePhrase);
  const queryTokens = phraseTokens(query);
  const candidateTokens = phraseTokens(candidate);

  return candidate === normalizeDictionaryPhrase(query) || queryTokens.every((token) => candidateTokens.includes(token));
}

function splitNounList(phrase: string): string[] {
  return phrase
    .replace(/\s*,\s*/g, " and ")
    .split(/\s+and\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function visibleRoomItems(adventure: AdventureDefinition, state: GameState) {
  return adventure.content.items.filter((item) => (state.itemLocations[item.id] ?? item.location) === state.currentRoomId);
}

function inventoryItems(adventure: AdventureDefinition, state: GameState) {
  return adventure.content.items.filter((item) => state.inventory.includes(item.id));
}

function candidateBatchItems(
  adventure: AdventureDefinition,
  state: GameState,
  verb: CanonicalVerb
) {
  const roomItems = visibleRoomItems(adventure, state);
  const carried = inventoryItems(adventure, state);

  switch (verb) {
    case "TAKE":
      return roomItems.filter((item) => item.portable !== false && !item.scenery);
    case "DROP":
      return carried;
    case "EXAMINE":
      return unique([...roomItems, ...carried]);
    case "OPEN":
    case "CLOSE":
      return roomItems.filter((item) => item.openable);
    default:
      return [];
  }
}

function buildResolvedIntent(
  source: string,
  intent: Intent,
  actorId: string,
  directObjectId: string | undefined,
  indirectObjectId: string | undefined
): ResolvedIntent {
  const resolved: ResolvedIntent = {
    verb: intent.verb,
    actorId,
    directObjectId,
    indirectObjectId,
    preposition: intent.preposition,
    raw: source
  };

  if (intent.confidence) {
    resolved.confidence = intent.confidence;
  }

  if (intent.normalized) {
    resolved.normalized = intent.normalized;
  }

  return resolved;
}

function parseExceptPhrase(phrase: string): { exceptPhrase: string | undefined; targetPhrase: string } {
  const match = phrase.match(/^(all|everything)(?:\s+except\s+(.+))?$/);

  if (!match) {
    return { exceptPhrase: undefined, targetPhrase: phrase };
  }

  return {
    exceptPhrase: match[2]?.trim(),
    targetPhrase: match[1]!
  };
}

function expandBatchCommand(
  adventure: AdventureDefinition,
  state: GameState,
  source: string,
  intent: Intent
): AtomicCommand[] | undefined {
  const directObject = normalizeDictionaryPhrase(intent.directObject ?? "");
  const batchPhrase = parseExceptPhrase(directObject);
  const isAll = batchPhrase.targetPhrase === "all" || batchPhrase.targetPhrase === "everything";
  const isThemBatch = directObject === "them" && (state.pronouns.them ?? []).length > 1;

  if (!isAll && !isThemBatch) {
    return undefined;
  }

  if (!SAFE_BATCH_VERBS.has(intent.verb)) {
    throw new ParserDiagnosticError({ code: "batch_unsafe", verb: intent.verb });
  }

  const actorId = intent.actorId ?? state.activeActorId;
  let targetIds = isThemBatch
    ? state.pronouns.them ?? []
    : candidateBatchItems(adventure, state, intent.verb).map((item) => item.id);

  if (batchPhrase.exceptPhrase) {
    const exceptIds = splitNounList(batchPhrase.exceptPhrase).map((phrase) =>
      resolveObjectId(adventure, state, phrase, false)
    );
    targetIds = targetIds.filter((itemId) => !exceptIds.includes(itemId));
  }

  targetIds = unique(targetIds);

  if (targetIds.length === 0) {
    throw new ParserDiagnosticError({ code: "batch_empty", verb: intent.verb });
  }

  return targetIds.map((itemId) =>
    atomicFromResolved(
      source,
      buildResolvedIntent(
        source,
        {
          ...intent,
          normalized: `${intent.verb} ${getItemById(adventure, itemId).name}`.toUpperCase()
        },
        actorId,
        itemId,
        undefined
      )
    )
  );
}

function expandNounList(
  adventure: AdventureDefinition,
  state: GameState,
  source: string,
  intent: Intent
): AtomicCommand[] | undefined {
  if (!intent.directObject || intent.directObject === "them") {
    return undefined;
  }

  const parts = splitNounList(intent.directObject);

  if (parts.length <= 1) {
    return undefined;
  }

  const actorId = intent.actorId ?? state.activeActorId;

  return parts.map((part) => {
    const itemId = resolveObjectId(adventure, state, part, false);

    return atomicFromResolved(
      source,
      buildResolvedIntent(
        source,
        {
          ...intent,
          directObject: part,
          normalized: `${intent.verb} ${part}`.toUpperCase()
        },
        actorId,
        itemId,
        undefined
      )
    );
  });
}

function resolveClarification(
  adventure: AdventureDefinition,
  state: GameState,
  source: string
): AtomicCommand[] | undefined {
  const pending = state.parser.pendingClarification;

  if (!pending) {
    return undefined;
  }

  const compiled = getCompiledDictionary(adventure);
  const query = normalizeDictionaryPhrase(source);
  const matches = pending.candidateIds.filter((itemId) => {
    const phrases = compiled.itemPhrasesById.get(itemId) ?? [];

    return phrases.some((phrase) => phraseMatchesCandidate(phrase, query));
  });

  if (matches.length !== 1) {
    throw new ParserDiagnosticError({ code: "clarification_needed" });
  }

  const actorId = pending.intent.actorId ?? state.activeActorId;
  const directObjectId =
    pending.objectRole === "directObject"
      ? matches[0]
      : resolveObjectId(adventure, state, pending.intent.directObject, false);
  const indirectObjectId =
    pending.objectRole === "indirectObject"
      ? matches[0]
      : resolveObjectId(adventure, state, pending.intent.indirectObject, false);

  const resolved = buildResolvedIntent(
    source,
    {
      ...pending.intent,
      confidence: "likely",
      normalized:
        pending.intent.normalized ??
        [pending.intent.verb, pending.intent.directObject, pending.intent.preposition, pending.intent.indirectObject]
          .filter(Boolean)
          .join(" ")
          .toUpperCase()
    },
    actorId,
    directObjectId,
    indirectObjectId
  );

  return [atomicFromResolved(source, resolved)];
}

function isAgain(source: string): boolean {
  return ["again", "g"].includes(normalizeDictionaryPhrase(source));
}

export function parseAtomicCommands(
  adventure: AdventureDefinition,
  state: GameState,
  source: string
): AtomicCommand[] {
  if (isAgain(source)) {
    if (!state.parser.lastIntent) {
      throw new ParserDiagnosticError({ code: "again_unavailable" });
    }

    return [
      atomicFromResolved(source, {
        ...state.parser.lastIntent,
        raw: source
      })
    ];
  }

  const clarification = resolveClarification(adventure, state, source);

  if (clarification) {
    return clarification;
  }

  const dictionary = getCompiledDictionary(adventure);
  const intent = normalizeTokens(tokenize(source), dictionary);

  try {
    const batchCommands = expandBatchCommand(adventure, state, source, intent);

    if (batchCommands) {
      return batchCommands;
    }

    const listCommands = expandNounList(adventure, state, source, intent);

    if (listCommands) {
      return listCommands;
    }

    return [atomicFromResolved(source, resolveIntent(adventure, state, intent))];
  } catch (error) {
    if (error instanceof ParserDiagnosticError && error.diagnostic.code === "ambiguous_noun") {
      throw new ParserDiagnosticError(
        {
          ...error.diagnostic,
          intent
        },
        error.message
      );
    }

    throw error;
  }
}

export function parseCommandPlan(
  adventure: AdventureDefinition,
  state: GameState,
  raw: string
): CommandPlan {
  return {
    commands: splitCommandChain(raw).flatMap((source) => parseAtomicCommands(adventure, state, source)),
    raw
  };
}
