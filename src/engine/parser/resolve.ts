import type { AdventureDefinition, Intent } from "../types";

function resolveAlias(
  value: string | undefined,
  aliases: Record<string, string>
): string | undefined {
  if (!value) {
    return undefined;
  }

  return aliases[value] ?? value;
}

export function resolveIntent(
  adventure: AdventureDefinition,
  intent: Intent
): Intent {
  return {
    ...intent,
    actorId: intent.actorId
      ? adventure.lexicon.actorAliases[intent.actorId] ?? intent.actorId
      : undefined,
    directObject: resolveAlias(intent.directObject, adventure.lexicon.nounAliases),
    indirectObject: resolveAlias(intent.indirectObject, adventure.lexicon.nounAliases)
  };
}
