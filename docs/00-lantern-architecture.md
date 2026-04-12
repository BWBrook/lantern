# Lantern Architecture Note

## Purpose

Lantern is the engine. *The Harrow Mine Job* is the first bundled adventure.

The v1 goal is not to build a completely generic interactive-fiction platform.
It is to build a reusable engine for deterministic, room-based, illustrated
parser adventures, then prove that engine by shipping one complete reference
adventure inside the same repository.

Harrow Mine matters because it is both:

- the first playable game built on Lantern
- the canonical integration test for parser, world-state, save/load, and art
  workflow decisions

Future adventures should be able to live beside Harrow in the same repo without
forcing a rewrite of Lantern internals.

## Product Boundary for v1

Lantern v1 is intentionally opinionated.

- Browser-first TypeScript application, with Vite for build/dev and Phaser for
  the illustration viewport.
- Deterministic runtime only: no network dependency, no runtime GenAI, no
  procedural story generation during play.
- Exactly one active adventure is loaded at boot in v1.
- Adventure content is authored in typed TypeScript modules, not via a content
  editor or external DSL.
- Lantern owns the UI shell. Adventures provide content, assets, and a small
  theme surface, but not custom UI components.
- The engine is for room-based parser adventures. It is not trying to cover
  unrelated narrative formats in the first version.

## Ownership Split

### Lantern owns

- app bootstrapping and active-adventure loading
- parser grammar, canonical intents, tokenizer, normalizer, and resolver
- turn loop and generic world-state transitions
- core systems for rooms, exits, items, actors, flags, transcript messages, and
  save/load
- validation framework for content integrity
- DOM transcript/input shell and Phaser scene viewport
- settings, keyboard flow, and accessibility-minded interaction behavior
- engine-level tests, fixture adventures, and contract tests

### Each adventure owns

- metadata and presentation identity
- rooms, items, actors, flags, prose, and art references
- parser-facing dictionary additions such as aliases, actor names, and object names
- bespoke rule hooks referenced by that adventure's content
- initial state, objective text, and victory conditions
- bundled assets and test fixtures such as a golden-path transcript

### Boundary rule

Lantern modules must not import adventure-specific ids, prose, flags, or hook
names. The engine consumes an adventure bundle through typed interfaces. Harrow
content should exercise the engine, not leak into its internals.

## Standard Repo Shape

The repo should converge toward this split:

```text
/
├─ README.md
├─ AGENTS.md
├─ docs/
│  ├─ 00-lantern-architecture.md
│  ├─ 01-concept-heritage.md
│  ├─ 02-starter-plot-and-locations.md
│  ├─ 03-design-and-tooling.md
│  └─ 04-implementation-spec.md
├─ adventures/
│  └─ harrow_mine/
│     ├─ adventure.ts
│     ├─ content/
│     │  ├─ metadata.ts
│     │  ├─ rooms.ts
│     │  ├─ items.ts
│     │  ├─ actors.ts
│     │  ├─ flags.ts
│     │  ├─ dictionary.ts
│     │  ├─ art.ts
│     │  └─ objective.ts
│     ├─ hooks/
│     │  └─ index.ts
│     ├─ assets/
│     │  ├─ rooms/
│     │  └─ ui/
│     └─ tests/
│        ├─ golden-path.txt
│        └─ content.test.ts
├─ src/
│  ├─ main.ts
│  ├─ app/
│  ├─ engine/
│  └─ ui/
└─ tests/
   ├─ unit/
   ├─ e2e/
   └─ fixtures/
      └─ tiny_adventure/
```

The exact filenames can evolve, but the separation should not:

- `src/` is Lantern
- `adventures/<id>/` is authored adventure content
- `tests/fixtures/` can hold tiny synthetic adventures used to prove contract
  portability

## Adventure Bundle Contract

Every bundled adventure should expose a single entry module, usually
`adventure.ts`, that assembles the adventure's typed pieces into one
`AdventureDefinition`.

At minimum, the bundle should provide:

- `metadata`: stable `id`, title, short description, and version string
- `theme`: palette/token surface, labels, and presentation defaults used by the
  shared UI shell
- `dictionary`: aliases for actors, objects, verbs, directions, groups, and
  phrase forms that extend the
  engine-owned parser vocabulary
- `content`: typed registries for rooms, items, actors, flags, art references,
  and objective text
- `hooks`: a named registry of bespoke actions or rule helpers referenced by the
  adventure's content
- `createInitialState()`: the authoritative starting world state for that
  adventure
- `validate()`: an adventure-level integrity check that plugs into Lantern's
  validation flow

The runtime contract should stay small and explicit. A good starting shape is:

```ts
interface AdventureDefinition {
  metadata: AdventureMetadata;
  theme: AdventureTheme;
  dictionary: AdventureDictionary;
  content: AdventureContent;
  hooks: AdventureHookRegistry;
  createInitialState(): AdventureStateSeed;
  validate(): ValidationIssue[];
}
```

The engine should be free to add helper fields later, but the contract should
remain compact enough that a new author can understand it quickly.

## Authoring Rules

### Required structure

Each real adventure should live in its own folder under `adventures/`.

- ids remain human-readable and `lower_snake_case`
- ids only need to be unique within a single adventure bundle
- art references should resolve inside that adventure's asset set
- test fixtures should live beside the adventure they describe

### Supported extension points in v1

Authors may extend Lantern through:

- dictionary aliases and adventure-specific noun/verb surface forms
- content-driven state such as rooms, items, exits, actors, flags, and objective
  text
- named hook functions for bespoke interactions
- theme tokens, labels, and asset references
- adventure-local tests and transcript fixtures

### Explicitly unsupported in v1

Authors may not:

- replace Lantern's parser grammar
- inject custom DOM panels or Phaser scenes into the host UI
- mutate engine internals outside the hook boundary
- add runtime network or model dependencies
- rely on multiple simultaneously loaded adventures

## Hook Philosophy

Lantern should stay mostly data-driven. Most behavior should come from content
definitions and generic handlers.

Hooks exist for the narrow slice of interactions that are memorable,
adventure-specific, or awkward to force into generic data. For v1, prefer a
small explicit hook registry over a large scripting framework.

Good examples of hook-backed behavior:

- a thief opening a shed lock
- a fighter shifting a heavy beam
- a risky crossing that returns an actor with a key
- an adventure-specific victory check triggered by entering an exterior room

Bad examples:

- every ordinary door open/close action
- standard inventory behavior
- generic movement between unblocked rooms
- UI-specific formatting decisions

## Parser and Lexicon Policy

Lantern owns the parser grammar and canonical intent model. Adventures do not
get to redefine sentence structure in v1.

Adventures do get to extend the surface vocabulary by supplying:

- actor names and aliases
- object aliases and adjectives
- synonym maps that normalize local phrasing onto Lantern's canonical verbs
- direction aliases or local naming if needed

This keeps the parser reusable while still allowing adventures to sound like
themselves.

## Save/Load Policy

Save data must be adventure-aware.

- Every save record should include `adventureId`.
- Save data should also include an engine/adventure version marker once the code
  exists.
- Lantern should reject or clearly explain mismatched save files rather than
  silently loading the wrong adventure state.
- Save/load behavior must not depend on hidden global content outside the active
  adventure bundle.

## Validation Policy

Lantern should fail fast when adventure content is broken.

Adventure validation should catch at least:

- duplicate ids
- unknown exit targets
- missing actor, item, or room references
- missing art references
- unknown hook ids
- invalid initial-state references

Validation should run in tests and be easy to invoke at startup in development.

## Harrow Mine's Role

Harrow is the first bundled adventure and should remain the example authors copy
from when they add a second adventure.

It is also the deliberate stress-test for Lantern's early feature set:

- active-actor switching
- directed companion commands
- darkness gating
- data-driven progression plus bespoke hooks
- save/load boundaries
- transcript-driven browser play
- art placeholders and later scene polish

The repo should therefore treat Harrow as the reference adventure, not as the
global default shape of engine internals.

## New Adventure Author Checklist

When a new adventure is added later, the minimum path should be:

1. Create `adventures/<id>/` from the agreed structure.
2. Set stable metadata and theme tokens.
3. Author rooms, items, actors, flags, and objective text in typed modules.
4. Add dictionary aliases for the intended command language.
5. Implement only the bespoke hooks that the generic engine cannot cover.
6. Add validation and at least one smoke test.
7. Add a short happy-path transcript once the slice is playable.

If those steps feel awkward, Lantern still needs work.
