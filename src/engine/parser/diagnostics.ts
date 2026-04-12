import type { CanonicalVerb } from "../types";

export type ParserDiagnosticCode =
  | "ambiguous_noun"
  | "incomplete_command"
  | "missing_direct_object"
  | "missing_indirect_object"
  | "noun_not_visible"
  | "noun_only"
  | "unknown_verb"
  | "unsupported_grammar_form";

export interface ParserDiagnostic {
  code: ParserDiagnosticCode;
  candidates?: string[];
  nounPhrase?: string;
  suggestion?: string;
  verb?: CanonicalVerb;
}

function defaultMessage(diagnostic: ParserDiagnostic): string {
  const verbLabel = diagnostic.verb ? diagnostic.verb.toLowerCase() : "that";

  switch (diagnostic.code) {
    case "incomplete_command":
      return "Incomplete command.";
    case "unknown_verb":
      return diagnostic.suggestion
        ? `I do not know "${diagnostic.nounPhrase}". Try ${diagnostic.suggestion.toUpperCase()}.`
        : `I do not know "${diagnostic.nounPhrase}".`;
    case "unsupported_grammar_form":
      return "Lantern could not make sense of that phrasing.";
    case "missing_direct_object":
      return diagnostic.verb === "UNLOCK" ? "Unlock what with what?" : `${capitalize(verbLabel)} what?`;
    case "missing_indirect_object":
      return diagnostic.verb === "UNLOCK"
        ? "Unlock what with what?"
        : `${capitalize(verbLabel)} that with what?`;
    case "ambiguous_noun":
      return "That could refer to more than one thing.";
    case "noun_not_visible":
      return "You cannot see that here.";
    case "noun_only":
      return "Try a verb with that noun.";
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export class ParserDiagnosticError extends Error {
  readonly diagnostic: ParserDiagnostic;

  constructor(diagnostic: ParserDiagnostic, message?: string) {
    super(message ?? defaultMessage(diagnostic));
    this.diagnostic = diagnostic;
    this.name = "ParserDiagnosticError";
  }
}
