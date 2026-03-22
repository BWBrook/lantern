# AGENTS.md

Read `docs/04-implementation-spec.md` first, then `docs/03-design-and-tooling.md`, then `docs/02-starter-plot-and-locations.md`, then `docs/01-concept-heritage.md`.

## Hard constraints

- Build a deterministic illustrated parser adventure. No runtime GenAI, no network dependency, and no on-the-fly story generation during play.
- Preserve the starter scope: 12 locations, 2 party members, 1 core win condition, 1 short vertical slice.
- Prefer a browser-first TypeScript + Vite + Phaser implementation. Desktop packaging is deferred until the browser prototype is stable.
- Use repository docs as source of truth. Do not widen narrative or mechanical scope without first completing the work package currently in progress.
- All story content, parser tables, room data, and asset references must live in the repo.
- Prefer clear data and simple functions over abstract frameworks.
- Avoid OS-specific shell tricks. Use npm scripts and Node-based tooling where practical.

## Working order

- Follow work packages in `docs/04-implementation-spec.md`.
- Do not start packaging work before the browser prototype is playable end-to-end.
- If art is missing, use stable placeholders rather than blocking progress.
- Add tests whenever parser logic, world rules, or state transitions change.
- Keep content ids stable and human-readable.

## Prototype done means

- The game boots in the browser with no console errors.
- The twelve starter locations are implemented.
- The parser supports navigation, examination, inventory, take/drop, open/close, unlock/use, lighting the lamp, companion commands, and simple pronouns.
- The Bram/Nessa puzzle chain is completable to victory.
- Save/load works.
- There are at least six illustrated scenes or consistent placeholders.
- Automated tests and the golden-path playthrough pass.
