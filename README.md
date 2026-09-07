# Lantern

Lantern is a browser-first engine for deterministic, illustrated parser
adventures. *The Harrow Mine Job* is the first bundled adventure in this repo:
the reference implementation, the first playable vertical slice, and the main
testbed for iterating on the engine.

This repository starts from design-first documents so that code generation can
begin with a clear boundary between engine and adventure. The shipped runtime
must remain entirely self-contained. A coding agent (Claude from September
2026; Codex earlier) may help write code, tests, narrative text, content data,
and art prompts during development, but the finished program must not make
live model calls during play.

## What success looks like

A solid first result means Lantern can boot a typed adventure bundle, drive a
constrained English parser, maintain deterministic world state, save and load
progress safely, and render an illustrated transcript-first browser UI. Harrow
then proves that contract by shipping a complete 12-room adventure with Bram,
Nessa, the lockbox puzzle chain, and a passing golden-path playthrough.

## How to read these docs

For a human reader, the cleanest order is:

1. `docs/00-lantern-architecture.md`
2. `docs/01-concept-heritage.md`
3. `docs/02-starter-plot-and-locations.md`
4. `docs/03-design-and-tooling.md`
5. `docs/04-implementation-spec.md`
6. `AGENTS.md`

For a coding agent, the operational order should be:

1. `AGENTS.md`
2. `docs/00-lantern-architecture.md`
3. `docs/04-implementation-spec.md`
4. `docs/03-design-and-tooling.md`
5. `docs/02-starter-plot-and-locations.md`
6. `docs/01-concept-heritage.md`

## Repo intent

This repository should grow into a browser-first engine plus a set of bundled
adventures that live under a common Lantern contract. Harrow Mine is the first
of those adventures. The initial development environment is macOS, but every
important choice here is made to avoid painting the project into a
platform-specific corner.

## Included starter files

- `AGENTS.md` — concise repo-local operating rules for any autonomous coding
  agent (`CLAUDE.md` includes it for Claude Code)
- `docs/00-lantern-architecture.md` — the Lantern/Harrow boundary, adventure
  contract, and recommended repo shape
- `docs/01-concept-heritage.md` — the Harrow creative brief, lineage, and rules
  of homage
- `docs/02-starter-plot-and-locations.md` — the Harrow cast, map, rooms, object
  list, and puzzle chain
- `docs/03-design-and-tooling.md` — the recommended technical stack and design
  parameters
- `docs/04-implementation-spec.md` — work packages, architecture, acceptance
  criteria, and definitions of done for Lantern plus Harrow

## Prototype guardrails

Keep the scope deliberately narrow. Build the engine/adventure boundary early.
Avoid a content editor, combat engine, procedural dungeon, giant dialogue tree,
runtime selector UI, online features, or “smart” runtime text generation. The
heart of this repo is the interaction between Lantern's parser/world/UI core
and a small, well-authored adventure bundle.
