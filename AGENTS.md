# AGENTS.md

Read `docs/00-lantern-architecture.md` first, then
`docs/04-implementation-spec.md`, then `docs/03-design-and-tooling.md`, then
`docs/02-starter-plot-and-locations.md`, then `docs/01-concept-heritage.md`.

## Hard constraints

- Build Lantern as a deterministic illustrated parser engine. No runtime GenAI,
  no network dependency, and no on-the-fly story generation during play.
- Treat *The Harrow Mine Job* as the first bundled reference adventure, not as
  the engine's hard-coded worldview.
- Preserve the starter Harrow scope: 12 locations, 2 party members, 1 core win
  condition, 1 short vertical slice.
- Prefer a browser-first TypeScript + Vite + Phaser implementation. Desktop
  packaging is deferred until the browser prototype is stable.
- Use repository docs as source of truth. Do not widen narrative or mechanical
  scope without first completing the work package currently in progress.
- Keep the engine/adventure boundary clean. Lantern code must not import
  adventure-specific ids, prose, or hook names directly.
- All story content, parser tables, room data, and asset references must live
  in the repo under adventure-owned folders.
- Prefer clear data and simple functions over abstract frameworks.
- Avoid OS-specific shell tricks. Use npm scripts and Node-based tooling where
  practical.

## Working order

- Follow the work packages in `docs/04-implementation-spec.md`.
- Use `docs/00-lantern-architecture.md` as the source of truth for what belongs
  to Lantern versus what belongs to an adventure bundle.
- Do not start packaging work or runtime adventure-selector work before the
  browser prototype is playable end-to-end.
- If art is missing, use stable placeholders rather than blocking progress.
- Add tests whenever parser logic, world rules, state transitions, or the
  adventure contract change.
- Keep content ids stable and human-readable within each adventure.

## Prototype done means

- Lantern boots in the browser with no console errors.
- Lantern can load a typed adventure bundle without hard-coded Harrow logic in
  engine modules.
- The bundled Harrow adventure implements the twelve starter locations.
- The parser supports navigation, examination, inventory, take/drop,
  open/close, unlock/use, lighting the lamp, companion commands, and simple
  pronouns.
- The Bram/Nessa puzzle chain is completable to victory.
- Save/load works and is adventure-aware.
- There are at least six illustrated scenes or consistent placeholders.
- Automated tests, contract tests, and the Harrow golden-path playthrough pass.
