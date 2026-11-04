# Ice Cream Parlor v2: Build Brief for Claude Code

## Read this first

An Ice Cream Parlor game already exists in this project folder (Vite + React, localStorage saves). Two kids, ages 10 and 7, have played it. Before changing anything, read the existing code, then write me a short summary of how it is structured and what you plan to keep, change, or replace. Evolve the existing game rather than starting over, unless the structure makes the changes below impractical. If you replace something, tell me why.

**Hard constraints**
- No API calls, no paid services, no network dependency at runtime. Everything runs locally in the browser.
- All art and sound must be produced in code (SVG, CSS, canvas, WebAudio). No image-generation services.
- The kids' existing saves (parlor names, flavor vaults) must survive the upgrade. Find the current localStorage key and structure and write a versioned migration.
- Prefer a plan first (use plan mode), then build in the stages listed at the bottom, leaving the game runnable after each stage.

## What we learned from watching the kids play

1. Both kids played purely to maximize cash. The game rewarded that because revenue was profit: nothing cost anything to make, so there was no real tradeoff.
2. Seasons felt the same. Events were deterministic by day, so every season played out identically.
3. The play styles differed, and both should be viable and rewarded differently in v2. One player tends to price low and chase volume without fussing over flavors. The other leans into the weird, exotic flavors. The new economics should make "cheap and busy" and "weird and loyal" both legitimate strategies, each with its own risks.
4. Clicking through the daily results was too easy. The day needs to feel like something happens.

## Design values (unchanged)

- Child authorship: the parlor name, flavor vault, and now the season ambition belong to the kid.
- Discovery over instruction: never explain economics by name. Let kids notice margins, tradeoffs, and risk by playing.
- Sandbox, not a puzzle. No single winning score.
- Events come first each day, before decisions.

## 1. Players, parlors, and seasons

**"Who's playing?" screen** on launch. Each player profile has an avatar (picked from a simple set of illustrated options), a parlor name, a flavor vault, a mode (Standard or Helper, see section 6), and a season shelf.

- Profiles are fully separate: separate saves, separate vaults, separate histories. No shared leaderboard and no cross-profile comparison anywhere in the UI.
- Switching players must be one or two taps from anywhere in the game, and must never lose progress (autosave on every state change that matters).
- Create profile, rename, and delete (delete requires a deliberate confirmation).
- **Season shelf:** each finished season becomes a card showing the season number, the ambition chosen, the result, final cash, final fame tier, and top flavors. Tapping it opens a season report.
- **New season** keeps the parlor name and vault, and lets the player add flavors before starting. Season number increments.
- **Backup:** Export and import a profile as a JSON file. localStorage lives in one browser on one machine, so this is the safety net.
- Persistence goes behind a small storage module (profiles, seasons, active season) so the backend could change later without touching game logic. Include a schema version and migrations.

## 2. Economics that create real tradeoffs

Make profit, not revenue, the cash number.

- **Cost per scoop**, per flavor. Starting values, all tunable: standard flavors $0.80 to $1.10, exotic flavors $1.40 to $2.00. Lollipops cost $0.30 and sell for $1.00.
- **Daily overhead** of about $5 (the "shop costs" line). It makes rainy days sting. Starting cash about $60.
- Results show a simple breakdown: money in, cost of scoops, shop costs, profit. For every flavor, show what it earned after cost, so the kid can see that a cheap crowd-pleaser and a pricey exotic make money in different ways.
- **Supply shocks** now do more than delete a flavor. When an ingredient has a shortage, the player chooses: pay a temporary surge cost to keep the flavor, or swap it out. Use a plain-language event card.
- Keep the existing demand model (base demand, price ceilings, segments, event multipliers, buzz). Adjust only as needed for the new economics.

**Tuning requirement:** build a headless simulation script (runs in Node, no UI) that plays many seasons with several bot strategies (always-cheap volume, always-exotic, balanced, always-max-price, random) and prints average end cash, fame, and ambition results. Tune costs, overhead, and demand until no single strategy dominates and each ambition is reachable by at least one sensible strategy. Report the results to me.

## 3. Fame: a visible number that competes with cash

Fame is now visible (a meter and a tier name, shown in the header). It is the other thing worth caring about.

- Fame goes up from happy customers (price at or below the ceiling and a flavor they liked), from fresh featured specials, and from milestone events.
- Fame goes down from gouging (prices above the ceiling produce complaints), from a stale menu, and from flops.
- Ladder: keep the PokéTuber tiers (small shoutout, featured in a "hidden gems" video, filmed at your shop, sponsored flavor collab, destination spot). Milestone moments still arrive as surprise cards, not progress bars, and keep the dynamic notification text built from the player's real top flavors. Keep the sponsored collab mechanic as specified in the earlier brief.

## 4. Season ambitions

At the start of each season the player picks an ambition. It is visible all season with a progress indicator, since they chose it. Starting set:

- **The Weird Shop:** sell a target number of scoops of exotic flavors and keep several exotic flavors in rotation.
- **The Crowd-Pleaser:** serve a target number of total customers with a high average happiness.
- **Best Deal in Town:** keep average prices low while still finishing the season profitable.
- **Big Time:** reach a chosen PokéTuber fame tier.
- **My Own Goal:** the player writes the name and picks one metric and a target from a short list.

Season-end grades are friendly: "Not yet," "Close," "Nailed it," plus a few lines about what happened and which choices mattered. Thresholds come out of the simulation work in section 2. The report card is part of the season shelf.

## 4b. Variety between seasons

Replace the fixed day-by-day event schedule with weighted random draws from the event pool, seeded per season and stored in the save so that refreshing the page cannot reroll an outcome. Two seasons should visibly differ.

## 5. Risk: real gambles

Add these three systems. The goal is decisions where the player is sometimes right and sometimes wrong for good reasons.

1. **Test batches.** Launching a brand-new special costs money upfront. Outcome varies: it can flop, do fine, or take off. Exotic flavors have higher variance. The result is revealed the next day with a short story ("Spicy Honey got a lot of attention at the farmers market").
2. **Rumor events.** One or two days ahead, an uncertain event appears with a stated likelihood ("A PokéTuber might film nearby on Saturday, maybe 40%"). The player chooses to go all in (feature a special, pay a prep cost, bigger payoff if it happens) or play it safe. The outcome is resolved when the day runs.
3. **Uncertain forecasts.** The event card at the start of each day is a forecast with a confidence label ("Likely rainy," "Probably busy"). It is mostly right but sometimes wrong. Menu and price decisions are made against the forecast, and the actual day is revealed when it runs.

Keep gambles legible: the player should always see the cost, the rough odds in plain language, and what they could gain.

## 6. Helper mode (for the younger player)

Helper mode is a per-profile toggle that can be flipped on or off at any time, and it should never hide features. It adds support:

- **Pre-filled suggestions** for the menu and prices with a short reason ("Lots of kids come on school-out days"). One tap uses the suggestion, and everything stays editable.
- **Simple money display.** Show "It costs you $1. You charge $3. You keep $2." as the unit lesson, using whole dollars or 50-cent steps. Optionally offer small, skippable math moments ("You sold 4 scoops at $3. How much is that?") with no penalty for skipping.
- **Larger text and shorter words** throughout.
- Gambles are fully available, shown in plain language with big, clear choices.

The older player can use Standard mode, or Helper mode if they want it. Either kid can switch.

## 7. Look and feel: make it feel like a real game

The current version is a form-based interface. v2 should feel like a place.

- **The parlor as the main hub.** An illustrated storefront (SVG/CSS) that changes with state: morning, afternoon, and evening light; weather; and fame upgrades (a line out the door, a PokéTuber poster in the window, awning and sign changes as fame tiers rise). The parlor name appears on the sign.
- **Chalkboard menu board** for the day's flavors and prices, with scoops drawn in each flavor's own color. Each flavor gets a **color picker** (and optionally an icon) in the vault, so the player's palette shows up everywhere.
- **Watch the day happen.** Replace the instant results screen with a short, skippable animated day: customers arrive, order, and react with speech bubbles, coins and scoops animate, and the day-end report follows. About 10 to 15 seconds by default. The animation should reflect the real simulation, not be decoration.
- **Customers with faces.** Procedurally assembled simple characters (varied heads, hair, colors) so the crowd feels varied.
- **Milestone moments** get a bigger treatment: a card with confetti or a similar effect and a sound.
- **Sound:** synthesized with WebAudio (clinks, pops, a small fanfare). Include a mute toggle that is easy to find, and remember the setting per device.
- Respect `prefers-reduced-motion`. Keep it responsive on laptop screens, and make it usable on a tablet.
- Typography and color should be warm and playful but readable. Bundle fonts locally instead of loading them from a CDN.

## 8. Running and hosting

The current local-file experience is clunky and hard to navigate. Please solve this:

- Provide a **one-command start** (and a simple double-click launcher script if feasible on macOS) so the game opens in a browser with no terminal knowledge.
- Make the production build a **static site** that can be hosted for free (for example GitHub Pages or Netlify), so the kids could open a bookmark. Do not deploy anything yourself. Write a short plain-English guide with the options, including the tradeoff that saves live in each browser and are tied to the web address, so export/import matters.
- Keep a stable origin in mind when writing the migration so existing saves are not stranded.

## Build stages

1. **Foundation:** read the existing code and summarize it, define the new data model, add the storage module and migration, and build the profile and season shelf screens.
2. **Economics and simulation:** costs, overhead, profit breakdown, and the headless tuning script. Report the strategy comparison before continuing.
3. **Fame, ambitions, and variety:** the visible fame meter, season ambitions with progress, seeded random events, and the season report card.
4. **Risk systems:** test batches, rumor events, uncertain forecasts, and the upgraded supply shock.
5. **Helper mode.**
6. **Visual layer:** hub scene, chalkboard menu, animated day, characters, sound, milestone moments.
7. **Polish and QA:** play a full season as each mode in a real browser, check save and load, profile switching, migration from an old save, refresh mid-day, and reduced-motion. Fix what you find.

## Definition of done

- A kid can open the game, pick their profile, and start playing without help.
- A full 30-day season plays start to finish in each mode without errors.
- Three or more distinct strategies each finish with meaningfully different cash, fame, and ambition outcomes (shown by the simulation script).
- Existing saves migrate cleanly.
- Nothing calls an external service.
- You tell me honestly what you tuned by feel versus what the simulation supports, and what you would test with the kids first.
