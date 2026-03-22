# Starter Plot, Cast, Map, and Locations

## Working title

**The Harrow Mine Job**

This is intentionally a “first real score” story rather than an epic quest. The party is not trying to save the kingdom. They are trying to get enough money to become the sort of people who someday might.

## Premise

Greywick is a market town with old mine-workings in the hills above it. Harrow Mine once produced decent silver, then thin silver, then accidents, then superstition. It closed fifteen years ago after a cave-in and a bad-air incident. Since then the place has sat rotting above town while everyone agrees that nothing useful remains inside.

Everyone is wrong.

Bram Pike, a young fighter with more honesty than prospects, and Nessa Vale, a thief with more prospects than honesty, have heard the same rumor from different drunks: the old paymaster's lockbox was never recovered from the assay office. If the box is still there and they can get out with it, they will finally have enough coin to buy proper gear and leave Greywick for real adventuring.

That is the whole story engine for the first prototype.

## Tone

The tone should be grounded, modest, and a little hungry. The mine is eerie but not cosmic. The danger comes from age, darkness, water, bad timber, and the simple fact that two amateurs are trying to act like professionals. There can be dry humor, especially from Nessa, but not broad parody.

## Party

### Bram Pike

Bram is the starting viewpoint character. He is sturdy, decent, and practical. He can force stuck doors, shift heavy obstacles, pry boards with leverage, and generally do the obvious physical thing.

### Nessa Vale

Nessa is the companion thief. She can pick simple locks, squeeze across narrow or unstable surfaces Bram would not risk, notice hidden catches, and make dry remarks when Bram misses the obvious.

For the first prototype, the player can either direct Nessa with commands such as `NESSA, PICK LOCK` and `TELL NESSA TO SEARCH DESK`, or switch the active actor with `BE NESSA`. True free-form party AI is out of scope. Nessa should behave like a smart companion with a short leash, not like an independently simulated adventurer.

## Core goal

Recover the paymaster's lockbox from the assay office and get back to the mine road.

## Win condition

The game is won when the party reaches an exterior location while carrying the lockbox.

## Failure stance

The prototype should avoid hard fail states. Darkness, locked routes, and missing tools should block progress with clear feedback rather than sudden death. The mine feels dangerous, but the first finished build should be fair.

## Map overview

```text
[01 Town Edge] -- east -- [02 Mine Road] -- east -- [03 Loading Yard]
                                              |
                                              east
                                              |
                                       [04 Foreman's Shed]

[03 Loading Yard] -- north -- [05 Broken Entrance] -- north -- [06 Lamp Room] -- north -- [07 Main Gallery]
                                                                                               |        |        |
                                                                                              north     east     west*
                                                                                               |        |        |
                                                                                        [08 Winch Platform] [09 Flooded Drift] [10 Stores Chamber]
                                                                                                                         |             |             |
                                                                                                              key via Nessa only      south        north
                                                                                                                                       |             |
                                                                                                                             [11 Assay Office]  [12 Vent Crawl] -- east -- [02 Mine Road]

* west exit from Main Gallery is blocked until the winch is operated.
```

## Canonical ids

Use these exact stable ids in code unless a later refactor clearly updates all docs and tests together.

### Rooms

- `town_edge`
- `mine_road`
- `loading_yard`
- `foreman_shed`
- `broken_entrance`
- `lamp_room`
- `main_gallery`
- `winch_platform`
- `flooded_drift`
- `stores_chamber`
- `assay_office`
- `vent_crawl`

### Actors

- `bram`
- `nessa`

### Core flags

- `shed_unlocked`
- `entrance_open`
- `lamp_lit`
- `west_gate_open`
- `brass_key_recovered`
- `beam_moved`
- `office_unlocked`
- `grate_open`
- `victory`

## Critical puzzle chain

The intended golden path is:

1. Get the crowbar from the loading yard.
2. Have Nessa open the locked foreman's shed.
3. Take the lamp, oil, and winding handle from the shed.
4. Pry open the mine entrance.
5. Light the lamp before going deeper.
6. Use the winding handle at the winch platform to open the west gate from the main gallery.
7. Have Nessa cross the flooded ledge and retrieve the brass office key.
8. Move the fallen beam in the stores chamber.
9. Unlock and open the assay office.
10. Take the lockbox.
11. Use the vent crawl as a quick way back to the road, or retrace the route if desired.

## MVP simplifications

These simplifications are intentional and should be preserved unless the project is already solid and complete.

- Inventory is shared at the party level in the prototype. Do not build per-character encumbrance.
- The lamp is binary on/off in MVP. Oil exists in the fiction and inventory, but fuel depletion can wait.
- `NESSA, CROSS LEDGE` should be a bespoke action that returns Nessa to the party with the key rather than requiring a hidden “far side” room.
- The vent crawl does not require a separate crawling minigame. It is just a room and shortcut.
- Optional treasure is welcome, but none of it may create or solve the critical path.

## Required object list

| Object ID | Name | Initial location | Purpose |
|---|---|---|---|
| `crowbar` | old crowbar | `loading_yard` | Pries boards at the entrance; can serve as a general physical tool |
| `lamp` | brass lamp | `foreman_shed` | Enables exploration of dark rooms |
| `oil_flask` | flask of lamp oil | `foreman_shed` | Supports lamp fiction; can be simple flavor in MVP or real fuel later |
| `winding_handle` | iron winding handle | `foreman_shed` | Operates the winch at `winch_platform` |
| `brass_key` | brass office key | `flooded_drift` via bespoke Nessa action | Unlocks the assay office door |
| `lockbox` | paymaster's lockbox | `assay_office` | Core objective item |

Optional valuables for score can include a coin purse in the flooded drift, silver assay weights in the office, and a lucky buckle or miner's token elsewhere. None of these should be required to win.

## Location roster

### 01. Town Edge (`town_edge`)

This is the opening frame: a low stone wall, wet grass, the first pale light over Greywick, and the mine road heading east into the scrub. The point of the room is mood and motivation. Bram and Nessa are not heroes yet. They are cold, under-equipped, and trying to look unafraid.

**Exits:** east to Mine Road  
**Important objects:** scenery only  
**Gameplay role:** start room, optional return room after victory  
**Art seed:** dawn roadside, low wall, distant town roofs, bare hedges, muted grey-green palette

### 02. Mine Road (`mine_road`)

A rutted track with gorse on either side, a broken milestone, and the hill rising ahead. Once the vent crawl is opened, this room also becomes the shortcut exit from the mine.

**Exits:** west to Town Edge, east to Loading Yard, hidden arrival from Vent Crawl once opened  
**Important objects:** milestone, hidden grate exit becomes visible later  
**Gameplay role:** exterior hub and win trigger location  
**Art seed:** muddy hill road, scrub, old milestone, mine spoil heap in distance

### 03. Loading Yard (`loading_yard`)

The yard is a confusion of bent rails, rotten sleepers, split timbers, and a pair of dead ore carts. This is the first room that should feel materially useful. The player finds the crowbar here and first sees both the locked shed and the blocked mine entrance.

**Exits:** west to Mine Road, east toward Foreman's Shed, north to Broken Entrance  
**Important objects:** crowbar, broken carts, crane hook, general scenery  
**Gameplay role:** outdoor puzzle hub  
**Art seed:** abandoned loading yard, ore carts, broken gantry, scattered tools, weathered timber

### 04. Foreman's Shed (`foreman_shed`)

A cramped timber shed under a skewed roof, still somehow drier than the world outside. Inside are the practical leftovers of the mine's last useful week: a brass lamp, a flask of oil, the winding handle, and some papers that confirm the assay office once held the paymaster's lockbox.

**Exits:** west to Loading Yard  
**Important objects:** lamp, oil flask, winding handle, optional ledger note  
**Gameplay role:** first lock-and-loot room; teaches companion-directed action  
**Art seed:** dim wooden shed interior, shelf, lamp, papers, cold daylight through slats

### 05. Broken Entrance (`broken_entrance`)

The adit mouth is blocked with warped planks and old collapse debris. The planks are not load-bearing anymore; they are simply in the way. Bram with a crowbar can open a gap. Without the crowbar, the room should strongly imply leverage rather than brute force.

**Exits:** south to Loading Yard, north to Lamp Room once opened  
**Important objects:** nailed planks, collapse rubble  
**Gameplay role:** first environmental obstacle  
**Art seed:** mine mouth with splintered boards, dark gap behind, mossy stone, damp timbers

### 06. Lamp Room (`lamp_room`)

This room marks the tonal shift from outdoor salvage to underground adventure. The air is colder, the stone is damp, and the old lamp brackets are streaked with soot. This is the safest place to teach `LIGHT LAMP` if the player has not already done it.

**Exits:** south to Broken Entrance, north to Main Gallery  
**Important objects:** soot-blackened brackets, optional spare wick, dust  
**Gameplay role:** transitional room; teaches light-state importance  
**Art seed:** small chamber with lamp brackets, damp stone, warm lamp glow against dark walls

### 07. Main Gallery (`main_gallery`)

The main gallery is the underground hub. Old rails vanish into dark, water drips somewhere ahead, and three routes branch away. The west gate to the stores chamber is closed at first. The player should understand that this is the center of the mine slice.

**Exits:** south to Lamp Room, north to Winch Platform, east to Flooded Drift, west to Stores Chamber once opened  
**Important objects:** rails, signboards, closed iron gate  
**Gameplay role:** central hub, gating state changes, memory anchor for the map  
**Art seed:** broad mine gallery, tracks, dripping roof supports, iron gate, lantern-lit darkness

### 08. Winch Platform (`winch_platform`)

A timber platform overlooks a dark shaft. The winch mechanism is present, but its handle is missing until the player brings it from the shed. Turning the winch should produce a satisfying state change elsewhere: the iron gate in the main gallery lifts or unlocks.

**Exits:** south to Main Gallery  
**Important objects:** winch, missing-handle socket, shaft  
**Gameplay role:** remote gate control  
**Art seed:** mine platform, rusted brake wheel, vertical shaft, chains, heavy timbers

### 09. Flooded Drift (`flooded_drift`)

Black water fills most of the drift, leaving only a narrow, treacherous ledge along one wall. Bram will not risk it. Nessa will, with appropriate commentary. The reward is the brass office key and perhaps a little extra silver if the player is feeling greedy.

**Exits:** west to Main Gallery  
**Important objects:** flooded channel, far-side satchel or corpse, brass key, optional coin purse  
**Gameplay role:** second companion-specific puzzle  
**Art seed:** dark flooded tunnel, narrow ledge, reflected lamp light, abandoned satchel across water

### 10. Stores Chamber (`stores_chamber`)

This room is accessible only after the winch has opened the gallery gate. Broken crates and old tools lie under dust. A fallen beam partly blocks the assay office door to the south, giving Bram one last obvious physical job before the final room. A loose grate or draft here hints at the vent crawl shortcut.

**Exits:** east back to Main Gallery, south to Assay Office once beam moved and door opened, north to Vent Crawl once discovered/opened  
**Important objects:** fallen beam, old crates, loose grate, draft  
**Gameplay role:** final staging room and shortcut discovery space  
**Art seed:** cluttered supply room, crates, broken picks, fallen beam across doorway

### 11. Assay Office (`assay_office`)

The assay office is the objective room: desk, scales, shelves, a cracked ledger, and the paymaster's iron lockbox. The room should feel slightly drier and more ordered than the rest of the mine, as though the clerks left in a hurry but not in chaos.

**Exits:** north to Stores Chamber  
**Important objects:** lockbox, desk, scales, optional silver weights, ledger  
**Gameplay role:** reward room and victory-object pickup  
**Art seed:** dusty office carved into rock, desk, scales, lockbox, shelves, stale stillness

### 12. Vent Crawl (`vent_crawl`)

A cramped, air-stirred crawl leading to a rusted grate near the road. It is not elegant, but it is a satisfying shortcut and a good reward for paying attention to drafts and loose metal earlier. Opening the grate should feel like the moment the mine finally gives up.

**Exits:** south to Stores Chamber, east to Mine Road once grate opened  
**Important objects:** grate, latch, cold draft  
**Gameplay role:** quick exit loop and pacing release after the objective room  
**Art seed:** narrow stone crawl, rusted bars, daylight beyond, close claustrophobic framing

## Suggested prose samples

These are not mandatory final text, but they establish tone.

### Example: Loading Yard, first look

> The loading yard has collapsed into a carpenter's bad dream: bent rails, split sleepers, a dead crane, and two ore carts leaning against one another like drunks at closing time. To the east stands a small shed with a stout padlock. North, warped planks still cover the mine mouth. An old crowbar lies half-hidden beneath a wet length of chain.

### Example: Foreman's Shed, lock opened

> Nessa crouches by the padlock, listens once, then twice, and gives it a look of theatrical disappointment. The hasp clicks. “These miners trusted rock more than locksmiths,” she says.

### Example: Flooded Drift, refusal for Bram

> The ledge is there, yes. So is the water, black and depthless-looking. Bram has exactly enough sense not to try that in borrowed boots.

### Example: Assay Office, objective reveal

> The office is smaller than the rumors made it sound. A desk, a set of scales, shelves with warped ledgers, and beside them the paymaster's lockbox: iron-banded, ugly, and very real.

## Command-friendly affordances

The game should naturally suggest verbs. A player seeing the yard should think `TAKE CROWBAR`. Seeing the shed should think `OPEN DOOR`, then `NESSA, PICK LOCK`. Seeing the entrance should think `PRY PLANKS`. Seeing the winch should think `ATTACH HANDLE` or `TURN WINCH`. Seeing the drift should think `NESSA, CROSS LEDGE`. This is important: the environment description should teach the parser.

## Optional garnish, not MVP-critical

A single roaming mine rat that steals shiny optional treasure could be fun later, but it is not required for the first finished build. If added, it must never steal a required item or create an unwinnable state.
