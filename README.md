# The Harrow Mine Job

*The Harrow Mine Job* is a small illustrated parser adventure in an original low-fantasy setting. It is meant to feel like a spiritual descendant of the classic 1980s illustrated text adventures: compact map, atmospheric prose, typed commands, and a world that follows clear rules. The immediate target is not a sprawling RPG. It is a short, polished vertical slice with one clean objective: get into the abandoned Harrow Mine, recover the paymaster's lockbox, and get back out with enough coin to begin a larger life.

This repo starts from design-first documents so that a coding agent can bootstrap the project with the least possible ambiguity. The game itself must be deterministic and entirely self-contained at runtime. Codex and GPT-5.4 may help write code, tests, narrative text, content data, and art prompts during development, but the shipped prototype must not make live model calls during play.

## What success looks like

A “decent working prototype” means a player can start a new game, explore twelve authored locations, use a constrained English parser, direct a companion thief, solve the mine's core puzzle chain, retrieve the lockbox, save and load progress, and reach a satisfying win screen in one session. Ideally the first playthrough lands in the twenty-to-forty minute range.

## How to read these docs

For a human reader, the cleanest order is:

1. `docs/01-concept-heritage.md`
2. `docs/02-starter-plot-and-locations.md`
3. `docs/03-design-and-tooling.md`
4. `docs/04-implementation-spec.md`
5. `AGENTS.md`

For Codex or another coding agent, the operational order should be:

1. `AGENTS.md`
2. `docs/04-implementation-spec.md`
3. `docs/03-design-and-tooling.md`
4. `docs/02-starter-plot-and-locations.md`
5. `docs/01-concept-heritage.md`

## Repo intent

This repository should eventually contain a browser-first game implementation, plus optional desktop packaging later. The initial development environment is macOS, but every important choice here is made to avoid painting the project into a platform-specific corner.

## Included starter files

- `AGENTS.md` — concise repo-local operating rules for Codex or any autonomous coding agent
- `docs/01-concept-heritage.md` — the creative brief, the lineage, and the rules of homage
- `docs/02-starter-plot-and-locations.md` — the starter cast, map, rooms, object list, and puzzle chain
- `docs/03-design-and-tooling.md` — the recommended technical stack and design parameters
- `docs/04-implementation-spec.md` — work packages, architecture, acceptance criteria, and definitions of done

## Prototype guardrails

Keep the scope deliberately narrow. Avoid building a content editor, combat engine, procedural dungeon, giant dialogue tree, online features, or “smart” runtime text generation. The heart of the project is the interaction between parser, place, objects, and a very small party of characters.
