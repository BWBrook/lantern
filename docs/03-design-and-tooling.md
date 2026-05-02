# Design Parameters and Recommended Tooling

## Recommended technical stance

Build the first playable version as a browser-first TypeScript project, using Vite for the dev/build pipeline and Phaser for scene rendering. Keep the parser, world model, and content data entirely local and deterministic. Use ordinary HTML and CSS for transcript, input, and menus, while Phaser handles the illustration pane, asset loading, scaling, and simple visual transitions.

This is the simplest combination that gives fast iteration, clean cross-platform behavior, and a strong retro presentation without turning text input into a UI problem.

OpenAI's current guidance is a good fit for this workflow: for most code-generation tasks it recommends starting with `gpt-5.4`, and Codex explicitly reads `AGENTS.md` files before it starts work.[^1][^2] That means this repo should be treated as an AI-assisted codebase from day one, with the rules and scope written down where the agent will see them.

## Why this stack

### TypeScript

TypeScript is the best fit for a small parser adventure because the project is mostly state management, string normalization, and content typing. Strong types help the agent avoid silent data-shape drift as the room and item definitions grow.

### Vite

Vite is a very practical default for this kind of browser game. It gives a fast local loop and a low-friction production build. Current docs note that Vite requires Node.js 20.19+ or 22.12+.[^3] In practice, that argues for standardizing the repo on Node 22 LTS or newer.

### Phaser

Phaser is useful here not because this is an action game, but because it gives you a lightweight, proven rendering layer for pixel-art presentation. Phaser's own examples support `pixelArt: true`, and its camera docs recommend `roundPixels` when you need to avoid sub-pixel blur in pixel-art output.[^4] That is exactly what an illustrated retro adventure wants.

The key design choice is to use Phaser only where it helps. Let Phaser render the scene art and manage scaling. Let the DOM handle text transcript, command input, buttons, and accessibility. Do not force the whole interface into a canvas.

### Vitest

Vitest is a natural fit because it works cleanly with Vite and is very good for fast parser and world-state tests. The docs describe it as Vite-powered and note that it requires Vite 6+ and Node 20+.[^5]

### Playwright

Playwright should handle the end-to-end tests. Official docs emphasize cross-browser coverage across Chromium, Firefox, and WebKit, which is valuable here because the prototype is intentionally browser-first and must behave well beyond the original macOS dev machine.[^6]

### Tauri later, not now

If a desktop wrapper is wanted later, Tauri is the best next step because it accepts a web frontend and targets macOS, Linux, and Windows.[^7] But it should not shape the MVP architecture. Get the browser game stable first. Then package.

Tauri's docs also make an important practical point: platform builds and release pipelines are the safer route, with dedicated GitHub Actions support and per-platform code-signing guidance for Windows and macOS.[^8] So the repo should be prepared for CI-based packaging later, not for magical local cross-builds now.

## Core design parameters

### 1. The game is deterministic

No runtime AI. No network. No procedural story text during play. The exact same input in the exact same state should produce the exact same result.

### 2. The game is room-based, not free-roaming

Every location is a named room with authored text, state, exits, and one illustration reference. Movement is discrete. The world should feel spatially coherent, but not simulated at a tile level.

### 3. The parser is constrained English

The parser should understand an explicit deterministic grammar and a
well-maintained adventure dictionary. Parser V3 can feel near-NLP by accepting
polite fillers, reordered prepositions, command chains, `ALL`/`EXCEPT`,
`AGAIN`, and clarification follow-ups, but it should not attempt general
semantic chat. Better to parse many physical adventure commands reliably than
pretend to parse everything badly.

### 4. The world model comes before polish

Parser and prose alone will not make the game feel alive. The data model must track doors, locks, obstacles, room conditions, inventory, light state, companion abilities, and scripted one-off transitions.

### 5. Art is authored content, not wallpaper

Every room definition should include an image id and an art prompt seed. Placeholder art is acceptable early on. Final art should be curated and kept consistent.

## Suggested internal resolution and layout

A sensible target for the first build is an internal canvas around **320×240** or **384×240**, integer-scaled to fit the browser window. The layout should reserve the upper portion for the illustrated room view and the lower portion for the text interface. The exact split can be tuned later, but the important thing is to keep pixels crisp and the transcript easy to read.

One practical arrangement is:

- top panel: scene illustration
- lower panel: transcript log
- bottom line: prompt and command entry
- side or status strip: active actor, lamp state, objective reminder

## UI architecture recommendation

Use a hybrid shell.

- **DOM** should own transcript rendering, text input, command history, settings, save/load controls, and any accessibility toggles.
- **Phaser** should own only the image viewport and perhaps light transitional effects like scene fades or subtle background animation.
- The engine should expose plain state and message updates so that either the DOM layer or Phaser can subscribe without becoming the source of truth.

This gives you easier testing, better text accessibility, cleaner browser focus behavior, and simpler later packaging.

## Parser scope for the prototype

The supported grammar should be small and explicit.

### Verbs that should exist in MVP

`LOOK`, `EXAMINE`, `GO`, `NORTH`, `SOUTH`, `EAST`, `WEST`, `UP`, `DOWN`, `OUT`, `TAKE`, `DROP`, `OPEN`, `CLOSE`, `UNLOCK`, `USE`, `LIGHT`, `EXTINGUISH`, `MOVE`, `PUSH`, `PULL`, `SEARCH`, `INVENTORY`, `WAIT`, `BE`, `SAVE`, `LOAD`, `HELP`

Not every verb needs unique logic. Some can normalize to a smaller canonical set.

### Companion addressing

The prototype should support:

- `NESSA, PICK LOCK`
- `TELL NESSA TO PICK LOCK`
- `BE NESSA`

That is enough to capture the flavor of directed commands without implementing full sentence chaining.

### Noun phrase support

The parser should recognize:

- articles: `the`, `a`, `an`
- simple adjectives: `brass lamp`, `iron gate`, `fallen beam`
- prepositions: `with`, `using`, `at`, `in`, `into`, `on`, `from`, `to`, `through`

### Pronouns

Support `IT` and `THEM` at minimum. If simple actor pronouns (`HER`, `HIM`) are easy to add cleanly, that is welcome, but not required for prototype completeness.

### Explicitly out of scope

- open-ended dialogue parsing
- full sentence conjunction logic
- combat parser
- fuzzy natural language as a chat experience

## Suggested parser grammar

```ebnf
command          := meta_command | directed_command | action_command ;
meta_command     := "save" | "load" | "help" | "inventory" ;
directed_command := actor_ref "," action_command
                 | "tell" actor_ref "to" action_command
                 | "be" actor_ref ;
action_command   := verb [noun_phrase] [preposition noun_phrase] ;
noun_phrase      := [article] {adjective} noun ;
preposition      := "with" | "using" | "at" | "in" | "into" | "on" | "from" | "to" | "through" ;
```

The implementation can be more pragmatic than formal. The important part is that the parser produces a clean canonical intent object.

## World architecture recommendation

The world engine should revolve around a small set of explicit concepts:

- `rooms`
- `items`
- `actors`
- `exits`
- `flags`
- `inventory`
- `message_log`

A good turn pipeline is:

1. raw input  
2. tokenize and normalize  
3. parse into a canonical intent  
4. resolve references against current world state  
5. validate whether the action is possible  
6. apply the state change  
7. emit player-facing messages  
8. run any post-action scripted consequences  
9. refresh UI

That structure makes the project testable. It also makes Codex less likely to mix parsing, validation, and narration into one tangled function.

## Suggested code-level data shape

The prototype should start with content authored directly in TypeScript modules rather than an external editor format. That keeps the first version simple and type-safe.

A room definition might look like this:

```ts
type RoomId =
  | "town_edge"
  | "mine_road"
  | "loading_yard"
  | "foreman_shed"
  | "broken_entrance"
  | "lamp_room"
  | "main_gallery"
  | "winch_platform"
  | "flooded_drift"
  | "stores_chamber"
  | "assay_office"
  | "vent_crawl";

interface RoomDef {
  id: RoomId;
  title: string;
  artId: string;
  darkness: "lit" | "dark";
  descriptions: {
    first: string;
    repeat: string;
  };
  exits: ExitDef[];
  objects: string[];
}
```

A canonical intent object can stay small:

```ts
type CanonicalVerb =
  | "LOOK" | "GO" | "EXAMINE" | "TAKE" | "DROP"
  | "OPEN" | "CLOSE" | "UNLOCK" | "USE"
  | "LIGHT" | "EXTINGUISH"
  | "MOVE" | "SEARCH" | "INVENTORY" | "WAIT"
  | "SWITCH_ACTOR" | "SAVE" | "LOAD" | "HELP";

interface Intent {
  verb: CanonicalVerb;
  actorId?: "bram" | "nessa";
  directObjectId?: string;
  indirectObjectId?: string;
  preposition?: string;
  raw: string;
}
```

Most of the world should be declarative. A small script registry should handle the handful of bespoke interactions that make the slice memorable. Aim for roughly **80% data, 20% custom rule hooks**.

Examples of bespoke hooks for this prototype:

- Nessa picks the shed lock
- Bram pries open the entrance
- Turning the winch opens the west gate
- Nessa crosses the flooded ledge and returns with the key
- Bram shifts the fallen beam
- Opening the vent grate exposes the shortcut exit

Do not build a giant general scripting framework until these simple named hooks exist and are working.

## Shared-party inventory rule

For the first prototype, inventory should be shared at the party level. This keeps the project small and avoids needless transfer logic. Actor identity still matters for ability-gated actions, but not for micro-managing who is holding the crowbar versus the lamp.

If a later version wants per-character inventory, that can be added after the MVP is solid.

## Art workflow recommendation

Every room definition should carry an `artId`. The adventure's `content/art.ts`
manifest should then describe that art id, optionally point at a final in-repo
image with `assetPath`, and keep prompt notes beside the assets. The art
pipeline should work like this:

1. lock the room list and room identities  
2. write short style-guide rules for framing, palette, and mood  
3. generate or iterate room illustrations outside runtime  
4. curate them manually  
5. downscale or palette-constrain them for crisp in-game use  
6. store the prompt text and final asset reference in-repo

OpenAI's image tooling supports both generation and iterative editing, and the GPT-5.4 frontend guidance explicitly recommends exploratory mood boards and multiple visual options before settling on final UI or visual direction.[^9][^10] That is a good fit here.

### Art style constraints

- fixed room viewpoint per scene, not free camera
- no UI text burned into the image
- no photorealism
- 16–32 color target after cleanup if possible
- consistent lighting logic
- characters only when they are a stable part of the room fiction
- prefer memory-friendly composition over visual busyness

## macOS-first development assumptions

The initial dev machine can be macOS, but the repo should behave like a neutral web project.

That means:

- standardize on Node 22 or newer
- prefer npm scripts over ad hoc shell snippets
- avoid scripts that assume BSD or GNU command differences
- use Node APIs or cross-platform JS scripts for file work when practical
- test in at least Chromium plus one non-Chromium browser before declaring UI work “done”

## Cross-platform preparation

Before desktop packaging exists, the browser build should already be portable.

That means:

- no hard-coded absolute paths
- no Finder-specific or AppleScript steps
- no case-sensitive import mistakes
- no reliance on Safari-only or Chrome-only browser behavior
- CI should run builds and at least some tests on more than one OS by the time the prototype is stable

## Optional tools worth considering later

### Ink for conversations only

Ink is excellent for branching dialogue and interactive scripts.[^11] If the project later grows a denser conversation layer, it may be worth using for dialogue scenes or letters. It should not be the core of the world simulation for this prototype. The mine slice is fundamentally a parser-and-state game, not a branching narrative shell.

### Tauri for desktop packaging

Once the browser prototype is reliable, Tauri can wrap the same frontend for desktop distribution. Keep it a separate phase.

## Research notes

[^1]: OpenAI, “Code generation” guide, recommending `gpt-5.4` as the default starting point for many coding tasks: <https://platform.openai.com/docs/guides/code>

[^2]: OpenAI, “AGENTS.md” guide for Codex, on repository-local instructions that Codex reads before working: <https://developers.openai.com/codex/agents-md>

[^3]: Vite guide, Node version requirements: <https://vite.dev/guide/>

[^4]: Phaser pixel-art example and camera docs: <https://phaser.io/examples/v3.85.0/game-config/view/pixel-art-mode> and <https://docs.phaser.io/phaser/concepts/cameras>

[^5]: Vitest guide and requirements: <https://vitest.dev/guide/>

[^6]: Playwright browser support docs: <https://playwright.dev/docs/browsers>

[^7]: Tauri homepage and start docs, on using an existing frontend stack and targeting multiple desktop platforms: <https://v2.tauri.app/> and <https://v2.tauri.app/start/>

[^8]: Tauri GitHub Actions distribution guide, including `tauri-action` and code-signing notes: <https://v2.tauri.app/distribute/pipelines/github/>

[^9]: OpenAI, “Image generation” guide: <https://platform.openai.com/docs/guides/image-generation>

[^10]: OpenAI, “Designing delightful frontends with GPT-5.4”, especially the advice on mood boards, multiple directions, and iterative refinement: <https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4/>

[^11]: Inkle, “ink” documentation, describing it as a narrative scripting language for interactive scripts and branching dialogue: <https://www.inklestudios.com/ink/> and <https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md>
