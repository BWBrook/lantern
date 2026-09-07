# Detailed Implementation Specification for Lantern

## Objective

Build a reusable browser-first engine, **Lantern**, for deterministic
illustrated parser adventures, and prove that engine by shipping *The Harrow
Mine Job* as the first bundled reference adventure.

The immediate deliverable is still a complete, playable Harrow Mine vertical
slice. The difference is architectural: Harrow must be implemented as adventure
content that sits on top of Lantern, not as the engine's hard-coded worldview.

The v1 result is considered “decent” when:

- Lantern has a stable engine/adventure boundary
- Harrow is complete, winnable, and pleasant to test
- the codebase is clearly organized for a second adventure later

## Non-negotiable constraints

- No runtime AI or network calls during play.
- No content editor in the first version.
- No combat system in the first version.
- No giant generic scripting framework before the known one-off rules exist.
- No per-character inventory complexity in MVP.
- No runtime adventure selector UI in the first version.
- No custom adventure-owned UI panels or layout overrides in the first version.
- No desktop packaging before the browser build is stable.

## Whole-project acceptance criteria

### Lantern engine

A finished Lantern v1 must satisfy all of the following:

- boots locally with `npm run dev`
- builds with `npm run build`
- passes unit tests and adventure-contract tests
- loads one configured adventure bundle at boot
- keeps parser, world rules, and UI cleanly separated
- validates adventure content, hook ids, and art refs during tests or startup
- stores and restores save data safely, including `adventureId`
- supports the intended parser command set, actor addressing, active-actor
  switching, and simple pronouns
- exposes a shared UI shell that can be themed by an adventure without allowing
  custom adventure UI components

### Harrow reference adventure

The bundled Harrow Mine adventure must satisfy all of the following:

- implements all 12 rooms from `docs/02-starter-plot-and-locations.md`
- reaches victory by retrieving the lockbox and exiting
- supports `NESSA, PICK LOCK`, `BE NESSA`, and the core parser verbs
- blocks critical-path mistakes fairly, without softlocking the player
- stores and restores Harrow save data accurately
- displays at least six room illustrations or stable placeholders
- passes the scripted Harrow golden-path playthrough

### Reusability proof

Lantern should also prove it is not Harrow-only by providing at least one of:

- a tiny synthetic fixture adventure used in engine tests
- a minimal documented adventure scaffold that exercises the contract end-to-end

## Recommended repo structure

The implementation should converge toward something close to this shape:

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
│     │  └─ rooms/
│     └─ tests/
│        ├─ golden-path.txt
│        └─ parser-corpus.json
├─ src/
│  ├─ main.ts
│  ├─ app/
│  │  ├─ boot.ts
│  │  ├─ load-adventure.ts
│  │  └─ settings.ts
│  ├─ engine/
│  │  ├─ adventure.ts
│  │  ├─ types.ts
│  │  ├─ validation.ts
│  │  ├─ state.ts
│  │  ├─ turn.ts
│  │  ├─ navigation.ts
│  │  ├─ parser/
│  │  │  ├─ tokenize.ts
│  │  │  ├─ normalize.ts
│  │  │  ├─ phrases.ts
│  │  │  ├─ dictionary.ts
│  │  │  ├─ diagnostics.ts
│  │  │  ├─ plan.ts
│  │  │  └─ resolve.ts
│  │  ├─ actions/
│  │  │  ├─ movement.ts
│  │  │  ├─ inventory.ts
│  │  │  ├─ objects.ts
│  │  │  └─ actors.ts
│  │  ├─ rules/
│  │  │  ├─ hooks.ts
│  │  │  └─ visibility.ts
│  │  └─ save/
│  │     └─ storage.ts
│  └─ ui/
│     ├─ dom/
│     │  ├─ transcript.ts
│     │  ├─ prompt.ts
│     │  ├─ status.ts
│     │  └─ menus.ts
│     ├─ phaser/
│     │  ├─ GameScene.ts
│     │  └─ assets.ts
│     └─ styles/
│        └─ main.css
└─ tests/
   ├─ unit/
   │  ├─ parser.test.ts
   │  ├─ parser-corpus.test.ts
   │  ├─ state.test.ts
   │  ├─ contract.test.ts
   │  └─ save.test.ts
   ├─ e2e/
   │  ├─ smoke.spec.ts
   │  └─ harrow-browser.spec.ts
   └─ fixtures/
      └─ tiny_adventure/
         └─ adventure.ts
```

This structure is a recommendation, not a law, but the separation of
responsibilities is important:

- `src/` is Lantern
- `adventures/<id>/` is authored adventure content
- `tests/fixtures/` is a safe place to prove engine portability without
  promoting fixtures to full bundled adventures

## Architectural rules

### Rule 1: parser, world rules, and UI must be separate

Do not bury world mutations inside view code. Do not let parser code emit DOM
directly. The engine should expose clean state transitions and player-facing
messages. The UI renders them.

### Rule 2: engine modules must not import adventure-specific content

Lantern code must not import Harrow ids, prose, flags, or hook names directly.
Engine behavior should be driven through typed adventure bundles and generic
interfaces.

### Rule 3: content must be validated on startup or in tests

Broken exit references, duplicate ids, missing hook ids, or missing art refs
should fail fast. Silent bad content is one of the easiest ways for an
autonomous agent to create hidden bugs.

### Rule 4: use data first, hooks second

Simple locked exits, object presence, and actor availability should be driven by
adventure data. Only a few actions in a slice should require named rule hooks.
Keep those hooks explicit and few.

### Rule 5: prototype over platformization

Do not let desktop concerns, runtime selectors, or future content tooling delay
the first complete browser build.

## Lantern v1 defaults

Use these conventions unless there is a compelling reason to change them:

- room ids, actor ids, item ids, and flags are `lower_snake_case`
- ids only need to be unique within a single adventure bundle
- one active adventure is loaded at boot in v1
- inventory is party-shared in MVP
- active-actor support exists at the engine level
- Lantern owns the canonical core verb set and intent model
- save metadata includes `adventureId`
- adventures may theme the shared UI with tokens, text, and assets, but not with
  custom layout code

## Harrow reference-adventure conventions

These are Harrow decisions, not Lantern engine rules:

- the active actor defaults to `bram`
- deeper mine progression is blocked unless the lamp is lit
- the oil flask exists but lamp fuel depletion is deferred
- `NESSA, CROSS LEDGE` is implemented as a custom scripted success path, not a
  separate far-side map segment
- win is checked when an exterior room is entered while the lockbox is in party
  inventory

Harrow-specific reference flags are:

- `shed_unlocked`
- `entrance_open`
- `lamp_lit`
- `west_gate_open`
- `brass_key_recovered`
- `beam_moved`
- `office_unlocked`
- `grate_open`
- `victory`

## Milestones

The project still breaks cleanly into three milestones.

### Milestone A — Lantern host and adventure contract

Work packages 0 to 3.  
Goal: the browser shell, parser core, world model, and adventure contract exist,
and a small fixture adventure can be driven through tests.

### Milestone B — Playable Harrow reference slice

Work packages 4 to 6.  
Goal: a human can play Harrow from start to finish in the browser, even if art
is still placeholder-grade.

### Milestone C — Persistence, art, portability, and authoring readiness

Work packages 7 to 9.  
Goal: save/load, visuals, and portability make Lantern feel like a real engine
prototype rather than a technical demo, while Harrow remains the canonical
reference adventure.

## Work package 0 — Bootstrap Lantern host and repo guardrails

### Goal

Create a stable browser-game skeleton with testing and build tooling in place
before the world logic begins.

### Tasks

- Initialize a Vite + TypeScript app.
- Add Phaser.
- Add Vitest and Playwright.
- Configure a strict TypeScript setup.
- Add npm scripts for `dev`, `build`, `test`, `test:e2e`, and `typecheck`.
- Create a minimal DOM shell plus a placeholder Phaser scene.
- Add `.nvmrc` or equivalent Node version hint set to Node 22.
- Add a minimal CI workflow that at least installs, builds, and runs unit tests.
- Add a simple active-adventure boot path, even if it points to a placeholder
  bundle at first.

### Deliverables

- a booting app
- placeholder illustration panel
- transcript container
- input field
- basic CI
- active-adventure load path

### Definition of done

- `npm run dev` launches locally on macOS
- `npm run build` succeeds
- `npm run test` succeeds
- the browser shows a placeholder room and accepts typed input without console
  errors
- the host can boot a configured adventure bundle stub

## Work package 1 — Adventure contract, registries, and validation

### Goal

Define Lantern's core data model and make invalid adventure content impossible
to ignore.

### Tasks

- Create TypeScript interfaces for adventure metadata, theme tokens, dictionary,
  rooms, items, actors, flags, and hook registries.
- Create a top-level `AdventureDefinition` contract.
- Create adventure-owned content registries under `adventures/<id>/`.
- Scaffold `adventures/harrow_mine/` as the first real bundle.
- Add validation for duplicate ids, unknown exits, unknown art references,
  unknown hook ids, and invalid initial-state references.
- Seed the project with either:
  - a tiny synthetic fixture adventure for engine tests
  - or a minimal documented scaffold that proves the contract end-to-end
- Add a content smoke test.

### Deliverables

- typed Lantern/adventure contract
- adventure registry modules
- validation helpers
- Harrow adventure scaffold
- tiny fixture adventure or equivalent contract scaffold
- content smoke tests

### Definition of done

- invalid content fails during tests or startup
- Lantern can load a typed adventure bundle without reaching into adventure
  internals
- Harrow has a clean bundle entrypoint
- a second tiny fixture or scaffold proves the contract is not Harrow-only

## Work package 2 — Parser v1 with injected dictionary

### Goal

Implement the constrained-English parser needed for Lantern while allowing each
adventure to extend vocabulary cleanly.

### Tasks

- Build tokenization and normalization.
- Create an engine-owned synonym map for verbs and directions.
- Allow adventures to provide actor names, noun aliases, and local surface-form
  synonyms.
- Support articles, simple adjectives, and prepositions.
- Support companion-directed commands via comma addressing and `TELL ... TO`.
- Support `BE <actor>`.
- Resolve `IT` and `THEM` based on recent parser context.
- Create helpful failure messages for unknown verbs, ambiguity, and incomplete
  commands.

### Deliverables

- tokenizer
- normalizer
- parser
- resolver
- parser tests

### Definition of done

- a fixture set of representative commands parses into correct canonical intents
- `NESSA, PICK LOCK`, `TAKE LAMP`, `UNLOCK DOOR WITH KEY`, and `BE NESSA` all
  parse correctly when the Harrow dictionary is loaded
- parser errors are understandable and not just raw exceptions
- the parser remains Lantern-owned rather than adventure-specific

## Work package 2b — Parser V3 near-NLP classic parser pass

### Goal

Make Lantern feel much closer to a mature illustrated-parser adventure while
remaining deterministic, offline, and engine-owned.

### Tasks

- Parse each input into one or more atomic canonical intents.
- Support polite fillers, gerunds, richer actor direction, reordered
  prepositions, noun lists, `ALL`/`EXCEPT`, `AGAIN`, and clarification
  follow-ups.
- Extend parser context in game state for last-command repeat, batch-aware
  `THEM`, and pending disambiguation.
- Allow richer adventure dictionary entries with aliases, nouns, adjectives,
  actor pronouns, noise words, and exact idiom templates.
- Expand Harrow's parser-facing dictionary and maintain a parser phrase corpus
  beside the golden path.

### Definition of done

- existing golden-path commands still work
- near-NLP Harrow phrase corpus parses to expected canonical intents
- ambiguous visible nouns can be clarified with a short follow-up
- likely non-exact parses disclose `I read that as: ...` before executing
- broad unsafe batch commands ask for specificity instead of guessing

## Work package 3 — Generic world state, action validation, and hook API

### Goal

Create the deterministic simulation layer that makes actions meaningful across
multiple adventures.

### Tasks

- Implement `GameState`, including `adventureId`.
- Implement movement, inventory, and object interaction reducers or action
  handlers.
- Add validation gates for darkness, locked paths, blocked exits, actor
  availability, and required tools.
- Add a small hook registry and dispatch flow for bespoke adventure actions.
- Add an adventure-owned objective or victory check that the engine can invoke
  without knowing story-specific ids.
- Implement message emission separate from DOM rendering.

### Deliverables

- turn engine
- action validators
- generic world mutation logic
- bespoke hook dispatch
- world tests

### Definition of done

- an automated test can drive a seed adventure or fixture world to a changed
  state through action calls
- invalid actions fail safely with readable messages
- adventures can attach bespoke hooks without engine modules importing
  adventure-specific names
- state transitions remain deterministic and transcript-friendly

## Work package 4 — Browser UI host, theme tokens, and text-first playable spike

### Goal

Make Lantern playable by a human in the browser as early as possible while
keeping the UI engine-owned.

### Tasks

- Connect DOM prompt input to the parser and engine.
- Render transcript lines with timestamps or turn numbers if useful.
- Render current room title and status strip.
- Surface active adventure metadata and active actor in the shared UI.
- Hook Phaser art changes to room changes.
- Apply adventure-provided theme tokens to the shared shell.
- Add command history via up/down arrow keys.
- Ensure the input keeps focus predictably after commands.
- Add a restart/new-game control.

### Deliverables

- playable browser shell
- transcript log
- prompt handling
- room-title/status rendering
- theme-token support
- placeholder art switching

### Definition of done

- a human can type commands in the browser and see room/state changes
- the UI supports at least the seed adventure end-to-end
- no core interaction requires mouse use
- the UI reflects adventure metadata and active actor without requiring
  adventure-owned layout code

## Work package 5 — Full Harrow Mine content integration

### Goal

Author the entire 12-room Harrow slice and make it winnable from start to
finish as a Lantern adventure bundle.

### Tasks

- Implement all Harrow rooms, items, actors, and exits from
  `docs/02-starter-plot-and-locations.md`.
- Write first-look and repeat-look descriptions for each room.
- Implement all core Harrow interactions:
  - taking the crowbar
  - Nessa opening the shed
  - taking lamp, oil, and handle
  - prying the entrance
  - lighting the lamp
  - attaching and turning the winch
  - Nessa retrieving the brass key
  - Bram moving the beam
  - unlocking and opening the assay office
  - taking the lockbox
  - opening the vent grate
  - triggering victory
- Add optional treasure if time permits, but keep it non-essential.
- Create a Harrow golden-path fixture transcript at
  `adventures/harrow_mine/tests/golden-path.txt`.

### Deliverables

- full Harrow room data
- full Harrow item and actor data
- final Harrow puzzle chain
- Harrow golden-path transcript fixture

### Definition of done

- the complete Harrow adventure is playable from start to victory
- the puzzle chain requires both Bram and Nessa
- there are no known softlocks on the critical path
- Harrow room ids and item ids match the canonical ids in
  `docs/02-starter-plot-and-locations.md`
- the Harrow golden-path fixture matches implemented behavior

## Work package 6 — Companion behavior, Harrow feedback, and narrative polish

### Goal

Make Bram and Nessa feel intentional rather than merely mechanical, and make
Harrow a good reference demonstration of Lantern's actor system.

### Tasks

- Ensure active-actor switching feels clear in the live UI.
- Ensure directed companion actions feed through the same validation pipeline as
  ordinary actions.
- Add a small set of context-sensitive companion remarks.
- Ensure ability-gated feedback teaches the right actor choice.
- Keep inventory shared, but show the active actor in the UI.
- Add a few tailored responses for obvious off-path commands.

### Deliverables

- actor switching
- companion-directed action flow
- ambient remarks
- custom Harrow failure and success prose

### Definition of done

- `NESSA, PICK LOCK`, `NESSA, CROSS LEDGE`, `BRAM, MOVE BEAM`, and `BE NESSA`
  all work in the live UI
- companion feedback makes the puzzle chain clearer rather than noisier
- at least 10 tailored companion lines or context-specific remarks exist

## Work package 7 — Save/load, settings, and adventure-aware persistence

### Goal

Add the quality-of-life features that make Lantern pleasant to replay and test,
without letting saves bleed incorrectly across adventures.

### Tasks

- Implement save/load using `localStorage`.
- Preserve enough state to restore the exact adventure, room, flags, inventory,
  active actor, and transcript state or transcript summary.
- Include `adventureId` in save metadata.
- Reject incompatible save data gracefully instead of loading the wrong
  adventure state.
- Add a small settings panel for text size and maybe reduced motion.
- Add `SAVE` and `LOAD` parser-level meta commands if feasible.
- Ensure keyboard-only operation remains intact.

### Deliverables

- save system
- load system
- settings UI
- save/load tests

### Definition of done

- a player can save in Harrow, refresh the page, and restore progress correctly
- save/load does not corrupt flags, inventory, or actor state
- Lantern does not silently load a save from the wrong adventure
- basic text-size adjustment works
- keyboard-only play remains smooth

## Work package 8 — Art pipeline, Harrow scene production, and adventure assets

### Goal

Give the Harrow reference adventure a convincing illustrated identity using
Lantern's shared asset conventions.

### Tasks

- Create an adventure-level art manifest mapping Harrow rooms to image ids,
  final image asset paths when available, and prompt notes stored beside the
  assets.
- Create stable placeholder art for every Harrow room.
- Produce at least six stronger scene illustrations for key Harrow rooms:
  - `loading_yard`
  - `broken_entrance`
  - `main_gallery`
  - `winch_platform`
  - `flooded_drift`
  - `assay_office`
- Ensure images are scaled crisply in the Phaser viewport.
- Keep source prompt text and final asset names in-repo.

### Deliverables

- Harrow art manifest with optional in-repo `assetPath` entries
- Harrow placeholder scene set
- at least six curated Harrow room images
- crisp scaling behavior

### Definition of done

- every Harrow room has a valid image reference
- no missing image breaks gameplay
- at least six Harrow rooms have more polished illustrations than the
  placeholders
- scene changes feel visually intentional

## Work package 9 — Test hardening, authoring scaffold, and cross-platform readiness

### Goal

Make Lantern reliable beyond the original dev machine and easier to reuse for
future adventures.

### Tasks

- Expand unit tests around parser and world edge cases.
- Add Playwright coverage for the Harrow golden path.
- Add or finalize contract tests for the adventure bundle boundary.
- Add a minimal authoring scaffold or checklist for creating a second adventure.
- Run build/test in CI on more than one OS.
- Audit imports, paths, and scripts for cross-platform behavior.
- Document the optional future Tauri packaging path without making it mandatory
  now.

### Deliverables

- stronger tests
- e2e Harrow golden-path spec
- adventure-contract coverage
- CI matrix or equivalent multi-OS validation
- minimal authoring scaffold or checklist
- packaging notes

### Definition of done

- CI builds succeed on at least macOS and one other OS, ideally macOS + Ubuntu +
  Windows
- the Harrow browser playthrough is automated
- there are no obvious case-sensitivity or path-separator issues left
- a second tiny fixture, scaffold, or checklist proves the path to another
  adventure is real
- future desktop packaging feels like an add-on, not a rewrite

## Harrow golden-path transcript fixture

The canonical Harrow happy-path script should be stored as a test fixture and
kept up to date whenever Harrow content changes.

A suggested initial transcript is:

```text
EAST
EAST
TAKE CROWBAR
OPEN SHED DOOR
NESSA, PICK LOCK
OPEN SHED DOOR
EAST
TAKE LAMP
TAKE OIL
TAKE HANDLE
WEST
NORTH
PRY PLANKS WITH CROWBAR
NORTH
LIGHT LAMP
NORTH
NORTH
ATTACH HANDLE TO WINCH
TURN WINCH
SOUTH
EAST
NESSA, CROSS LEDGE
WEST
WEST
MOVE BEAM
UNLOCK DOOR WITH BRASS KEY
OPEN DOOR
SOUTH
TAKE LOCKBOX
NORTH
NORTH
OPEN GRATE
EAST
```

If the final parser prefers equivalent synonyms, the fixture can change, but it
must remain readable and close to what a real player might type.

## Prototype-wide definition of done

Lantern is ready to call a solid v1 engine when all of the following are true:

- the engine can load a typed adventure bundle without adventure-specific imports
- the parser is reliable for the intended command set
- the UI shell is stable in modern desktop browsers
- save/load works and is adventure-aware
- the codebase is organized enough for a second adventure later
- at least one tiny fixture, scaffold, or documented authoring path proves the
  contract is reusable

The bundled Harrow reference adventure is ready to call a solid prototype when
all of the following are true:

- the full slice is completable without developer tools
- the Bram/Nessa puzzle chain works as intended
- the main art/view loop feels like an illustrated adventure
- Harrow passes the golden-path tests
- at least one outsider could play it without a verbal explanation from the
  developer

## Out-of-scope backlog for after prototype

These are valid future ideas, but they should not block the first complete
build:

- lamp fuel depletion
- per-character inventory
- score screen with optional treasure totals
- a larger town prologue
- more mineshaft branches
- combat
- more advanced NPC autonomy
- runtime multi-adventure selector UI
- content-editor tooling
- sound and music
- desktop packaging via Tauri
