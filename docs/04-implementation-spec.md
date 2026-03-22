# Detailed Implementation Specification

## Objective

Build a playable browser prototype of *The Harrow Mine Job* that a new player can finish in one sitting. The prototype must include the twelve starter locations, Bram and Nessa as usable party members, the complete lockbox puzzle chain, save/load, a transcript-driven interface, and enough illustration support to make the project feel like an illustrated adventure rather than a parser running in a plain terminal.

The prototype is considered “decent” when it is complete, winnable, internally consistent, and pleasant to test. It does not need to be large.

## Non-negotiable constraints

- No runtime AI or network calls during play.
- No content editor in the first version.
- No combat system in the first version.
- No multi-command parser chaining in the first version.
- No giant generic scripting framework before the known one-off rules exist.
- No per-character inventory complexity in MVP.
- No desktop packaging before the browser build is stable.

## Whole-project acceptance criteria

A finished prototype must satisfy all of the following:

- boots locally with `npm run dev`
- builds with `npm run build`
- passes unit tests
- passes the scripted golden-path playthrough
- implements all 12 rooms from `docs/02-starter-plot-and-locations.md`
- reaches victory by retrieving the lockbox and exiting
- supports `NESSA, PICK LOCK`, `BE NESSA`, and the core parser verbs
- blocks critical-path mistakes fairly, without softlocking the player
- stores and restores save data accurately
- displays at least six room illustrations or stable placeholders

## Recommended repo structure

The implementation should converge toward something close to this shape:

```text
/
├─ README.md
├─ AGENTS.md
├─ docs/
├─ public/
│  └─ art/
│     ├─ rooms/
│     └─ ui/
├─ src/
│  ├─ main.ts
│  ├─ app/
│  │  ├─ boot.ts
│  │  ├─ settings.ts
│  │  └─ event-bus.ts
│  ├─ engine/
│  │  ├─ types.ts
│  │  ├─ state.ts
│  │  ├─ turn.ts
│  │  ├─ parser/
│  │  │  ├─ tokenize.ts
│  │  │  ├─ normalize.ts
│  │  │  ├─ parse.ts
│  │  │  └─ resolve.ts
│  │  ├─ actions/
│  │  │  ├─ movement.ts
│  │  │  ├─ inventory.ts
│  │  │  ├─ objects.ts
│  │  │  └─ actors.ts
│  │  ├─ rules/
│  │  │  ├─ validators.ts
│  │  │  ├─ scripts.ts
│  │  │  └─ darkness.ts
│  │  └─ save/
│  │     └─ storage.ts
│  ├─ content/
│  │  ├─ rooms.ts
│  │  ├─ items.ts
│  │  ├─ actors.ts
│  │  ├─ art-prompts.ts
│  │  └─ world.ts
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
   │  ├─ world.test.ts
   │  ├─ content.test.ts
   │  └─ save.test.ts
   ├─ e2e/
   │  └─ golden-path.spec.ts
   └─ fixtures/
      └─ golden-path.txt
```

This structure is a recommendation, not a law, but the separation of responsibilities is important.

## Architectural rules

### Rule 1: parser, world rules, and UI must be separate

Do not bury world mutations inside view code. Do not let parser code emit DOM directly. The engine should expose clean state transitions and player-facing messages. The UI renders them.

### Rule 2: content must be validated on startup or in tests

Broken exit references, duplicate ids, or missing art refs should fail fast. Silent bad content is one of the easiest ways for an autonomous agent to create hidden bugs.

### Rule 3: use data first, scripts second

Simple locked exits and object presence should be driven by room/item data. Only a few actions in this slice require named rule hooks. Keep those hooks explicit and few.

### Rule 4: prototype over platformization

Do not let desktop concerns or cross-platform packaging delay the first complete browser build.

## Core engine conventions

Use these conventions unless there is a compelling reason to change them:

- room ids, actor ids, item ids, and flags are lower_snake_case
- inventory is party-shared in MVP
- the active actor defaults to `bram`
- deep rooms are blocked unless `lamp_lit === true`
- the oil flask exists but lamp fuel depletion is deferred
- `NESSA, CROSS LEDGE` is implemented as a custom scripted success path, not a separate far-side map segment
- win is checked when an exterior room is entered while the lockbox is in party inventory

## Milestones

The project breaks cleanly into three milestones.

### Milestone A — Engine skeleton

Work packages 0 to 3.  
Goal: the parser and world model exist, and a content stub can be driven via tests.

### Milestone B — Playable text-first slice

Work packages 4 to 6.  
Goal: a human can play from start to finish in the browser, even if art is placeholder-grade.

### Milestone C — Illustrated prototype and portability hardening

Work packages 7 to 9.  
Goal: saves, visuals, and cross-platform readiness make the project feel like a real prototype rather than a technical demo.

## Work package 0 — Bootstrap and repo guardrails

### Goal

Create a stable browser-game skeleton with testing and build tooling in place before the world logic begins.

### Tasks

- Initialize a Vite + TypeScript app.
- Add Phaser.
- Add Vitest and Playwright.
- Configure a strict TypeScript setup.
- Add npm scripts for `dev`, `build`, `test`, `test:e2e`, and `typecheck`.
- Create a minimal DOM shell plus a placeholder Phaser scene.
- Add `.nvmrc` or equivalent Node version hint set to Node 22.
- Add a minimal CI workflow that at least installs, builds, and runs unit tests.

### Deliverables

- a booting app
- placeholder illustration panel
- transcript container
- input field
- basic CI

### Definition of done

- `npm run dev` launches locally on macOS
- `npm run build` succeeds
- `npm run test` succeeds
- the browser shows a placeholder room and accepts typed input without console errors

## Work package 1 — Core types, content registries, and validation

### Goal

Define the game's core data model and make invalid content impossible to ignore.

### Tasks

- Create TypeScript interfaces for rooms, items, actors, exits, and flags.
- Create content registries in `src/content`.
- Add validation for duplicate ids, unknown exits, and unknown art references.
- Seed the project with 2–3 rooms and a few placeholder items so the engine has something concrete to operate on.
- Add a content smoke test.

### Deliverables

- typed content model
- content registry modules
- validation helpers
- content smoke tests

### Definition of done

- invalid content fails during tests or startup
- all seed content resolves without missing references
- room ids and item ids match the canonical ids in `docs/02-starter-plot-and-locations.md`

## Work package 2 — Parser v1

### Goal

Implement the constrained-English parser needed for the prototype.

### Tasks

- Build tokenization and normalization.
- Create a synonym map for verbs and directions.
- Support articles, simple adjectives, and prepositions.
- Support companion-directed commands via comma addressing and `TELL ... TO`.
- Support `BE NESSA`.
- Resolve `IT` and `THEM` based on recent parser context.
- Create helpful failure messages for unknown verbs, ambiguity, and incomplete commands.

### Deliverables

- tokenizer
- normalizer
- parser
- resolver
- parser tests

### Definition of done

- a fixture set of representative commands parses into correct canonical intents
- `NESSA, PICK LOCK`, `TAKE LAMP`, `UNLOCK DOOR WITH KEY`, and `BE NESSA` all parse correctly
- parser errors are understandable and not just raw exceptions

## Work package 3 — World state, action validation, and turn loop

### Goal

Create the deterministic simulation layer that makes actions meaningful.

### Tasks

- Implement `GameState`.
- Implement movement, inventory, and object interaction reducers or action handlers.
- Add validation gates for darkness, locked paths, blocked exits, and required tools.
- Add a small script registry for bespoke mine actions.
- Implement flag changes for:
  - `shed_unlocked`
  - `entrance_open`
  - `lamp_lit`
  - `west_gate_open`
  - `brass_key_recovered`
  - `beam_moved`
  - `office_unlocked`
  - `grate_open`
  - `victory`
- Implement message emission separate from DOM rendering.

### Deliverables

- turn engine
- action validators
- basic world mutation logic
- bespoke script hooks
- world tests

### Definition of done

- an automated test can drive the seed world to a changed state through action calls
- invalid actions fail safely with readable messages
- bespoke hooks exist for winch, shed lock, flooded ledge, beam, and grate logic

## Work package 4 — Browser UI shell and text-first playable spike

### Goal

Make the engine playable by a human in the browser as early as possible.

### Tasks

- Connect DOM prompt input to the parser and engine.
- Render transcript lines with timestamps or turn numbers if useful.
- Render current room title and status strip.
- Hook Phaser art changes to room changes.
- Add command history via up/down arrow keys.
- Ensure the input keeps focus predictably after commands.
- Add a restart/new-game control.

### Deliverables

- playable browser shell
- transcript log
- prompt handling
- room-title/status rendering
- placeholder art switching

### Definition of done

- a human can type commands in the browser and see room/state changes
- the UI supports at least the seed rooms end-to-end
- no core interaction requires mouse use

## Work package 5 — Full Harrow Mine content integration

### Goal

Author the entire 12-room slice and make it winnable from start to finish.

### Tasks

- Implement all rooms, items, and exits from `docs/02-starter-plot-and-locations.md`.
- Write first-look and repeat-look descriptions for each room.
- Implement all core interactions:
  - taking the crowbar
  - Nessa opening the shed
  - taking lamp, oil, handle
  - prying the entrance
  - lighting the lamp
  - attaching/turning the winch
  - Nessa retrieving the brass key
  - Bram moving the beam
  - unlocking/opening the assay office
  - taking the lockbox
  - opening the vent grate
  - triggering victory
- Add optional treasure if time permits, but keep it non-essential.
- Create a golden-path fixture transcript.

### Deliverables

- full room data
- full item data
- final puzzle chain
- golden-path transcript fixture

### Definition of done

- the complete adventure is playable from start to victory
- the puzzle chain requires both Bram and Nessa
- there are no known softlocks on the critical path
- the golden-path fixture matches the implemented game behavior

## Work package 6 — Companion behavior, feedback, and narrative polish

### Goal

Make Bram and Nessa feel intentional rather than merely mechanical.

### Tasks

- Add active-actor switching.
- Add directed companion action handling that feeds through the same validation pipeline.
- Add a small set of context-sensitive companion remarks.
- Ensure ability-gated feedback teaches the right actor choice.
- Keep inventory shared, but show the active actor in the UI.
- Add a few tailored responses for obvious off-path commands.

### Deliverables

- actor switching
- companion-directed action flow
- ambient remarks
- custom failure/success prose

### Definition of done

- `NESSA, PICK LOCK`, `NESSA, CROSS LEDGE`, `BRAM, MOVE BEAM`, and `BE NESSA` all work in the live UI
- companion feedback makes the puzzle chain clearer rather than noisier
- at least 10 tailored companion lines or context-specific remarks exist

## Work package 7 — Save/load, settings, and transcript usability

### Goal

Add the quality-of-life features that make the prototype pleasant to replay and test.

### Tasks

- Implement save/load using localStorage.
- Preserve enough state to restore the exact room, flags, inventory, and transcript state or transcript summary.
- Add a small settings panel for text size and maybe reduced motion.
- Add `SAVE` and `LOAD` parser-level meta commands if feasible.
- Ensure keyboard-only operation remains intact.

### Deliverables

- save system
- load system
- settings UI
- save/load tests

### Definition of done

- a player can save in the mine, refresh the page, and restore progress correctly
- save/load does not corrupt flags or inventory
- basic text-size adjustment works
- keyboard-only play remains smooth

## Work package 8 — Art pipeline, placeholders, and scene production

### Goal

Give the prototype a convincing illustrated identity.

### Tasks

- Create an art manifest mapping rooms to image ids and prompt seeds.
- Create stable placeholder art for every room.
- Produce at least six stronger scene illustrations for key rooms:
  - loading_yard
  - broken_entrance
  - main_gallery
  - winch_platform
  - flooded_drift
  - assay_office
- Ensure images are scaled crisply in the Phaser viewport.
- Keep source prompt text and final asset names in-repo.

### Deliverables

- art manifest
- placeholder scene set
- at least six curated room images
- crisp scaling behavior

### Definition of done

- every room has a valid image reference
- no missing image breaks gameplay
- at least six rooms have more polished illustrations than the placeholders
- scene changes feel visually intentional

## Work package 9 — Test hardening and cross-platform readiness

### Goal

Make the prototype reliable beyond the original dev machine and prepare it for later desktop packaging.

### Tasks

- Expand unit tests around parser and world edge cases.
- Add Playwright coverage for the golden path.
- Run build/test in CI on more than one OS.
- Audit imports, paths, and scripts for cross-platform behavior.
- Document the optional future Tauri packaging path without making it mandatory now.

### Deliverables

- stronger tests
- e2e golden-path spec
- CI matrix or equivalent multi-OS validation
- packaging notes

### Definition of done

- CI builds succeed on at least macOS and one other OS, ideally macOS + Ubuntu + Windows
- the golden-path browser playthrough is automated
- there are no obvious case-sensitivity or path-separator issues left
- future desktop packaging feels like an add-on, not a rewrite

## Golden-path transcript fixture

The canonical happy-path script should be stored as a test fixture and kept up to date whenever content changes.

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

If the final parser prefers equivalent synonyms, the fixture can change, but it must remain readable and close to what a real player might type.

## Prototype-wide definition of done

The project is ready to call a solid prototype when all of the following are true:

- the full slice is completable without developer tools
- the parser is reliable for the intended command set
- the UI is stable in modern desktop browsers
- save/load works
- the main art/view loop feels like an illustrated adventure
- the codebase is organized enough for future expansion
- at least one outsider could play it without a verbal explanation from the developer

## Out-of-scope backlog for after prototype

These are valid future ideas, but they should not block the first complete build:

- lamp fuel depletion
- per-character inventory
- score screen with optional treasure totals
- a larger town prologue
- more mineshaft branches
- combat
- more advanced NPC autonomy
- sound and music
- desktop packaging via Tauri
