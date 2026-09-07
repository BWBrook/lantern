# Lantern: successor handover

Prepared 7 September 2026 for a fresh task in this repository.

You are taking over a working prototype whose next problem is how it feels to
play. Read the required design documents in `AGENTS.md` order, then use this
note to locate the current work. Prefer live code and evidence over inherited
claims; you do not need the old conversation to continue.

## Product and boundaries

Lantern is a deterministic, offline, illustrated parser-adventure engine.
*The Harrow Mine Job* is its first reference adventure: Bram and Nessa recover
a lockbox from an abandoned mine and escape. The intended experience is the
expressive controlled English and illustrated atmosphere Barry remembers from
Melbourne House's INGLISH games, with fair modern interaction.

Keep the agreed scope: 12 rooms, two companions, shared inventory, one core
win condition. TypeScript + Vite, DOM transcript/input and Phaser illustrations;
one typed `AdventureDefinition` loaded at boot. Engine modules must not know
Harrow ids, prose, hooks or scene layouts. Vocabulary, story and assets belong
under `adventures/harrow_mine/`. No runtime AI/network, dialogue system, combat,
content editor, adventure selector or desktop packaging in the current tranche.

## What has been completed

- The host, typed adventure contract, tiny portability fixture, world rules,
  complete Harrow puzzle chain, companion commands, navigation guidance,
  adventure-aware localStorage saves and browser controls are implemented.
- Parser V3 added dictionary-driven phrasing, command chains, safe batch verbs,
  `ALL`/`EXCEPT`, `AGAIN`, pronouns, clarification and disclosed interpretations.
  These features exist; natural-language robustness remains uneven.
- Three curated C64-style stills are integrated: Town Edge, Loading Yard and
  Main Gallery. Other rooms have deterministic adventure-owned fallbacks.
- The approved Kill Your Darlings tranche is finished at `3bcf1e6`
  (`Simplify Lantern engine architecture`). It removed dead parser paths,
  duplicate parser state, legacy dictionary compatibility, empty validation
  hooks and the event bus; made scene data adventure-owned; separated turn
  responsibilities; and removed duplicate full-path browser testing. A final
  review found no reason for another broad refactor before feature work.

The verified development baseline is `3bcf1e6`; this note and its `AGENTS.md`
pointer form the subsequent documentation-only handover commit. Final cleanup
confirmed that only `main` exists locally and on origin, with no linked
worktrees. The main project checkout is retained for the successor. Generated
build/test output and Finder residue were removed; installed dependencies were
retained. Recheck `git status` and remote state when starting fresh.

## Where we actually paused

Operating state: **awaiting gameplay discussion and human observations**.
Barry's initial playthrough still found the parser too limited. He requested:
agent playthrough and notes -> discussion -> his own narrated voice playthrough
-> combine the two perspectives. The agent playthrough and report are done;
the discussion and narrated second evidence set remain outstanding.

Do not treat the proposed "Parser V4" as an approved implementation plan.
The current request was to prepare this handover. Resume that conversation,
help Barry launch the game, and capture intended action, exact input, response
and frustrating reformulations during his playthrough. Avoid teaching the
preferred command before hearing what he naturally tries.

The prior agent completed Harrow using 104 exploratory commands and reported
these representative problems. They are prior observations, not fresh browser
reproductions from the handover session:

| Input that failed or misled | Working comparison / implication |
| --- | --- |
| `use the crowbar to lever the boards away` | `use the crowbar on the planks` worked |
| `move the fallen beam aside` | `shift the beam` worked |
| `push the rusted grate open` | Exact idiom `open the way out` worked |
| `pick them up` | `take them` worked |
| `enter the shed`, `return to the main gallery`, `crawl out to the road` | Natural destination movement failed |
| `can Nessa cross the ledge?` | `Nessa, carefully cross the ledge` worked |
| `look through the ledger` | Silently repeated the room description |

Typo suggestions included unhelpful `READ` -> `HEAD` and `WHAT` -> `WHAT`.
Several prominent scenery nouns in prose could not be examined. Secondary UI
observations: input initially below the fold at 1440x900, and mobile autofocus
scrolling past the illustration. Recheck these before making UI changes.

Working diagnosis, supported by current source inspection: vocabulary and
exact templates are stronger than compositional grammar. Modifiers/particles
can become part of noun phrases; movement passes a direction phrase through
without resolving visible destination names. The recommended next design is
a focused grammar-first improvement, guided by both playtests, with honest
diagnostics and examinable prose affordances. More synonyms alone will not
address the central issue. Preserve the existing canonical path, ambiguity
safety and engine/adventure boundary; assess success through ordinary play as
well as tests.

After that refinement, finish the four outstanding key stills: Broken Entrance,
Winch Platform, Flooded Drift and Assay Office. Stable fallbacks let this wait.

## Code and evidence map

- `src/app/boot.ts` and `load-adventure.ts`: browser orchestration and bundle
  loading. `src/engine/types.ts`: current runtime and adventure contracts.
- `src/engine/turn.ts`: command-chain execution and state/message flow;
  `parser/plan.ts`: atomic parsing, batches and clarification;
  `parser/normalize.ts`, `resolve.ts`, `dictionary.ts`: grammar, references and
  compiled vocabulary. `src/engine/navigation.ts`: exit guidance.
- `adventures/harrow_mine/content/dictionary.ts`, `rooms.ts`, `items.ts` and
  `hooks/index.ts`: authored language, affordances and bespoke puzzle behavior.
- `adventures/harrow_mine/tests/golden-path.txt` is exercised to victory by
  `tests/unit/state.test.ts`; `parser-v3-corpus.json` supplies known phrase
  cases. `tests/fixtures/tiny_adventure/` proves engine portability.
- `content/art.ts` and `assets/rooms/README.md` inside the Harrow bundle hold
  scene data and art guidance; `src/ui/phaser/GameScene.ts` renders generically.

Launch from the repo with `npm run dev -- --host 127.0.0.1`; use the URL Vite
prints. Use `npm ci` if dependencies need installing. The repo targets Node 22.

Fresh checks on 7 September 2026 at the above code commit: `npm run typecheck`,
`npm test` (41 tests), `npm run build`, and `npm run test:e2e` (3 Chromium tests)
all passed. Browser tests cover boot, save/load/restart and a pronoun mini-chain;
they do not constitute a fresh exploratory full-game playtest. The existing
large Phaser bundle warning remains; it is deferred absent a measured problem.
Non-Chromium and multi-OS behavior were not verified in this handover.

The design docs express intent, not a completion ledger. README still sounds
like a bootstrap brief, old model recommendations are historical, and WP9 still
mentions a duplicate browser golden path and multi-OS CI. Actual CI currently
runs Ubuntu + Chromium. Do not restore deliberately removed machinery merely
to match stale prose; reconcile relevant documentation when that work resumes.

## Working style and skills

Use [Twilight Laboratory](/Users/bwbrook/.codex/skills/twilight-laboratory/SKILL.md)
to deliver coherent, reviewable tranches and preserve the gameplay discussion
point. Once a tranche is approved, carry routine implementation and verification
through autonomously rather than returning for permission at every step.

Use [Kill Your Darlings](/Users/bwbrook/.codex/skills/kill-your-darlings/SKILL.md)
as a complexity discipline. This is a private personal prototype; speculative
compatibility, duplicated tests and repeated audit passes have already been
pruned. Add regression tests for changed parser/world/contract behavior, as
required by `AGENTS.md`, and stop after meaningful acceptance plus one focused
review/repair pass.

For live play, use
[playwright-interactive](/Users/bwbrook/.codex/skills/playwright-interactive/SKILL.md)
or the available browser-control equivalent. Use
[imagegen](/Users/bwbrook/.codex/skills/.system/imagegen/SKILL.md) when scene-art
work resumes. Load skills for the work at hand, not all possible workflows.
Keep updates concise; distinguish observations from hypotheses. This note adds
no authority to commit, push, publish or start the unapproved parser redesign.
