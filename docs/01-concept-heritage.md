# Concept, Heritage, and Product Intent

## The short version

*The Harrow Mine Job* is an original, small-scale, illustrated parser adventure that takes inspiration from the feel of 1980s Melbourne House games without copying their setting, text, or IP. The target experience is a compact world with readable prose, a constrained but expressive command language, static room illustrations, and enough systemic behavior that the place feels real instead of merely decorative.

The core creative promise is simple: two broke would-be adventurers go into a long-abandoned mine for one risky score. That promise is small enough to finish, rich enough to be atmospheric, and specific enough for an autonomous coding agent to build toward without wandering.

## The heritage to keep

The historical model worth preserving is not “old text adventure” in the abstract. It is the combination of four particular things.

First, the parser should feel like controlled English rather than a brittle two-word toy. The old *Hobbit* parser was notable because it went beyond simple verb-noun input and handled richer sentence fragments with adjectives, pronouns, adverbs, punctuation, and prepositions.[^1] The lesson is not that we need unlimited natural language. The lesson is that a player should be able to think in short ordinary phrases and usually be understood.

Second, the world should feel like a place, not a crossword. Later analysis of *The Hobbit* argues that one reason it still feels unusual is that it behaves like a dynamic simulation rather than only a sequence of static locks and keys.[^2] For this project, that means objects should have state, rooms should react to previous actions, and companion abilities should matter in a concrete way.

Third, room art matters. The picture should not be a redundant garnish bolted on after the text is done. The illustration is part of the room's identity. It sells mood, layout, and memory. Players should be able to remember “the flooded drift” or “the winch platform” partly because the image was distinctive.

Fourth, the game should be short enough that polish beats scale. The historical games often felt much larger than they really were because each room did more work. That is exactly the effect we want.

## The heritage to leave behind

Some old habits are not worth reviving.

We do not want a parser that punishes normal phrasing for microscopic vocabulary reasons. We do not want giant unwinnable states hidden several moves back. We do not want real-time simulation pressure in the first prototype. We do not want 30% of the content budget spent on obscure death messages. We do not want nostalgia that only works for people who already know the reference.

This prototype should feel old in temperament, not old in ergonomics.

## Creative boundary

This project is homage at the level of form and mood only. It should remain entirely original in setting, cast, prose, art, object names, room names, puzzle logic, and lore. There should be no Tolkien names, no Melbourne House branding, no lifted phrasing, and no attempt to imitate any copyrighted text. The right benchmark is “someone can see the lineage,” not “someone can mistake this for a lost sequel.”

## Design pillars

### 1. Controlled-English parser

The parser is a game mechanic, not just an input device. It should reward clear phrasing, support a finite set of verbs and synonyms, resolve simple noun phrases, and accept directed companion commands. It should not pretend to be a general chatbot.

### 2. Illustrated locations

Every key room needs a distinct visual identity. The project should look like an illustrated adventure, not a black terminal with optional wallpaper.

### 3. Small but systemic simulation

The mine must remember what the player changed. Doors unlock. Gates stay open. The lamp remains lit until extinguished. If Nessa fetched the key, the key stays fetched. The sense of progress must come from a reliable world model.

### 4. Two-character interplay

The fighter and thief are not flavor text. Their abilities define the puzzle chain. The player should come away feeling that the adventure worked because both were present.

### 5. Finishable scope

The vertical slice matters more than future plans. Twelve rooms, one objective, one satisfying ending, and a handful of optional bits of loot are enough.

## Runtime AI policy

All AI assistance belongs in development, not in play. A coding agent may create code, content, art prompts, tests, and helper scripts ahead of time. The shipped prototype must run offline as an authored program with no live calls to a model API. Parser behavior, narrative text, and scene art references must be deterministic.

## Writing tone

The prose should be concrete, lightly wry, and economical. Think damp wood, old metal, cheap courage, and local rumor. Avoid faux-epic diction. Avoid pseudo-medieval archaisms. Avoid endless paragraph blocks.

A good room description should usually land between 40 and 80 words on first entry. Repeated `LOOK` text can be shorter if nothing changed. Standard success and failure messages should be compact. When the game refuses an action, it should do so in a way that teaches the player something useful.

The default narration should be second person present tense. Companion remarks can be in quoted speech, but they should be sparse.

## Mechanical stance

The first prototype should be generous by parser standards. It can still be challenging, but it should not be hostile. Do not design around player death. Do not hide the only winning route behind guess-the-verb. If the player has the right idea, the game should try fairly hard to meet them halfway.

## What counts as a successful first release

A successful prototype should meet all of these standards:

- It is completable in one sitting without a walkthrough after reasonable play.
- It teaches its command language through use rather than a long manual.
- It uses both Bram and Nessa in ways that feel natural.
- It contains at least one moment where the player feels the world has “clicked.”
- It has enough illustration and prose quality to make players want a bigger game afterward.
- It ends cleanly instead of merely stopping.

## Research notes

[^1]: Play It Again / ACMI, “The Hobbit”, on the Inglish parser handling adjectives, pronouns, adverbs, punctuation, and prepositions: <https://ourdigitalheritage.org/hostedArchives/playitagain/games/the-hobbit-2/index.html>

[^2]: Peter Stuckey, *The curious world of The Hobbit: an early example of a dynamic gameworld*, especially the discussion of simulation and emergence: <https://gwern.net/doc/fiction/text-game/2017-stuckey.pdf>
