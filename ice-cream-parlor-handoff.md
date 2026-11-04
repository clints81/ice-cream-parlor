# Ice Cream Parlor — Claude Code Build Handoff

## What this is

Build a browser-based business simulation game called **Ice Cream Parlor** for a 10–11 year old. It is inspired by the classic "Lemonade Stand" game but with a modern, more sophisticated economic model. The player runs their own ice cream shop through a 30-day season, making daily decisions about which flavors to serve, how to price them, and when to rotate specials in and out.

The game is meant to teach economic concepts — pricing, demand, opportunity cost, buzz and reputation — through play rather than instruction. Concepts should emerge from decisions, not explanations.

**Tech stack:** Vite + React. Single HTML/JS app. Persistent save state using localStorage so the player can continue across sessions.

---

## Core design values

- **Child authorship first.** The player names their parlor and builds their own flavor vault at the start. These are not defaults — they are their inputs. Preserve and display them prominently throughout.
- **Discovery over instruction.** Never explain economic concepts by name. Let the player notice that jalapeño lemon has a smaller but loyal crowd, or that keeping a special on too long makes it stop working.
- **Events drive decisions.** Every day opens with the day's event (weather, foot traffic, a blogger visiting) displayed prominently *before* the player touches their menu. The event should feel like "here's what you're walking into — now decide."
- **Sandbox over puzzle.** There is no score to beat. The reputation ladder (see below) provides milestones that feel discovered, not tracked. Cash is a useful vehicle but not the primary goal.

---

## Game flow

### 1. Setup screen (first launch only)

Ask the player for:
1. **Parlor name** — displayed in the header throughout the game
2. **Flavor vault** — they type in every flavor they've invented, one at a time. There is no pre-loaded list. This is their first authorship moment. Require at least 3 flavors to proceed.

Save both to localStorage. Never ask again unless the player explicitly resets.

---

### 2. Daily loop (Days 1–30)

Each day follows this sequence:

**A. Day open screen**

Show in this order:
1. Day number, parlor name, current cash, current reputation tier
2. **Today's event** — displayed as a prominent hero element. Include: event title, one-sentence description, and what it means for today's decisions. Color-code by type (good/bad/neutral/great). This is the first thing the player sees and should feel like the emotional anchor of the day.
3. **Today's menu** — current regular slots (up to 5) and featured special slots (up to 2), with a "Rotate flavors" button. Lollipops are always available as a fixed add-on (see below).
4. **Pricing panel** — only shown on pricing days (Day 1, then every 7 days: Day 8, 15, 22, 29). On non-pricing days, prices are locked and displayed read-only. This makes pricing feel consequential rather than mechanical.
5. **Advisor's notes** — a short panel that reads the event + current menu + buzz levels together and gives 2–4 actionable observations. Examples: "Kid-friendly day — make sure your sweeter flavors are on the menu." / "Jalapeño Lemon's buzz is starting to fade — you might get one more good day out of it." / "Pricing day tomorrow — look at today's reactions before you lock in."

**B. Flavor rotation picker (modal)**

When the player taps "Rotate flavors":
- Show all flavors in their vault as tappable chips
- First 5 taps = regular menu (shown in blue)
- Next 2 taps = featured specials (shown in gold/amber)
- Show current buzz % next to any flavor that has been featured before
- Show a "fading" warning on featured flavors in the 15–45% buzz range
- Player can change this every single day — "rotate" communicates this, not "change menu"

**C. Run the day**

Player taps "Open for business." Simulate the day (see demand model below). Show results screen.

**D. Results screen**

Show:
1. Day summary header with revenue, customers served, best-selling flavor, lollipop add-ons
2. A day-quality tag (Great day / Solid day / Slow day / Tough day) based on revenue thresholds
3. Recap of today's event and whether it played out as expected
4. **Flavor performance** — horizontal bar chart for every flavor on the menu. Bars sized relative to each other. Show scoops sold and revenue per flavor.
5. **Featured special buzz** — for each featured special, show current buzz %, whether it went up or down today, and a status tag: "buzzing" (>65%), "fading" (15–45%), or nothing in between. This is the primary signal for when to rotate a special out.
6. **Customer reactions** — 4–8 sampled customer quotes with avatar initials. Reactions should reflect whether the price felt fair, too high, or a bargain. Loved reactions for under-priced, mixed for fair, complaints for over-priced.
7. **What to think about tomorrow** — advisor panel. Flags zero-sellers to consider dropping, buzz trends, tomorrow's event preview, and pricing day warnings.

**E. Reputation events (milestone notifications)**

At certain reputation thresholds, the player receives a surprise notification — displayed as a special full-width card on the results screen, above everything else. These should feel discovered, not tracked. Do not show a reputation progress bar. The player should not know these are coming.

Reputation ladder (see full section below).

---

### 3. Season end (after Day 30)

Show a season summary screen with: final cash, total customers, best single day, final reputation tier, top 5 flavors by total scoops. Offer to save the season summary (store it in localStorage) and start a new season. Season number should increment — the save data structure should support multiple seasons from the start, even if the UI only shows the current one.

---

## Reputation ladder (PokéTuber tier system)

The player's reputation grows based on revenue performance, customer satisfaction (price/demand alignment), and buzz management. Reputation is a hidden score — the player sees their current tier name, not a number.

Milestones are delivered as surprise notification cards, not progress indicators. The language should feel like something happening *to* the parlor, not a game achievement unlocked.

| Tier | Name | Notification text (approximate) |
|------|------|----------------------------------|
| 1 | Local favorite | "Word is getting around the neighborhood. People are starting to recognize your parlor." |
| 2 | Neighborhood buzz | "A small food blog posted about your [top flavor]. A few new faces showed up today." |
| 3 | PokéTuber shoutout | "[Small channel name] just mentioned your [flavor] in their latest video. Comments are asking where to find it." |
| 4 | Featured in a video | "A mid-size PokéTuber did a 'hidden gems' episode and your parlor made the list. Traffic is up." |
| 5 | Filmed at your shop | "A popular PokéTuber reached out — they want to film a full video at your parlor. Lines around the block." |
| 6 | Sponsored flavor collab | "A major PokéTuber wants to create a signature flavor with you. It'll be a limited featured special with their name on it — and their audience will show up to try it." |

The sponsored collab tier (6) should trigger a special mechanic: a new limited flavor is added to the player's vault for 5 days, named after the channel (e.g. "PokeSnackAttack's Cotton Candy Blast"). It behaves like any featured special but arrives with high pre-built buzz (0.7) that decays faster than normal.

Use flavor names and tier names dynamically — pull from the player's actual top-performing flavor when constructing notification text.

---

## Demand model

### Flavor profiles

Each flavor has a demand profile. For flavors the player invents that aren't in this list, assign a default profile based on whether the name sounds exotic (contains words like "spicy," "hot," "jalapeño," "sriracha," "wasabi," "ghost") or standard.

| Flavor | Base demand | Exotic | Segment | Price ceiling |
|--------|-------------|--------|---------|---------------|
| Bubble Gum | 0.70 | No | kids | $3.50 |
| Blue Raspberry | 0.80 | No | kids | $3.50 |
| Strawberry | 0.75 | No | everyone | $3.75 |
| Watermelon | 0.65 | No | everyone | $3.50 |
| Green Apple | 0.55 | No | adventurous | $4.00 |
| Jalapeño Lemon | 0.28 | Yes | adventurous | $5.50 |
| Peanut Butter | 0.60 | No | everyone | $4.00 |
| Honey | 0.50 | No | everyone | $4.00 |
| Spicy Honey | 0.32 | Yes | adventurous | $5.00 |
| Cherry | 0.65 | No | everyone | $3.75 |
| Sugar Cookie | 0.70 | No | kids | $3.50 |
| Lime | 0.55 | No | adventurous | $4.00 |
| Cotton Candy | 0.72 | No | kids | $3.50 |

Default for unknown flavors: base 0.50, price ceiling $4.00, segment "everyone." If name sounds exotic: base 0.30, price ceiling $5.00, segment "adventurous."

### Customer simulation

Each day, simulate individual customers (base 14–22, scaled by reputation and event multiplier). For each customer:

1. Calculate a weight for each menu flavor: `base_demand × price_effect × segment_boost × featured_boost × buzz_effect`
   - `price_effect`: `max(0.05, 1 - (price - 2.50) × price_sensitivity × 0.18)` where price_sensitivity is 0.8 for exotic, 1.0 for standard
   - `segment_boost`: 1.45 if flavor's segment matches the day's event segment, else 1.0
   - `featured_boost`: 1.25 if the flavor is a featured special, else 1.0
   - `buzz_effect`: `1 + min(buzz × 0.45, 0.90)`
2. Choose a flavor probabilistically based on weights
3. 33% chance the customer also buys a lollipop ($1.00)
4. 28% chance of generating a visible customer reaction. Reaction tone based on price ratio vs. price ceiling: under 88% = loved, 88–115% = mixed, over 115% = complaint

### Buzz mechanics

- Featured specials gain or lose buzz each day based on sales volume and customer satisfaction
- Buzz gain formula: `(sold > 0 ? 0.12 : -0.06) + satisfaction_factor × 0.10 + event_buzz_bonus`
- Buzz decays on regular menu items: -0.015/day
- Buzz clamps between 0 and 1
- A flavor starting a new featured run with zero prior buzz should feel slow to build — this is intentional

### Supply shocks (mid-season events)

Occasionally (roughly once per season, random day between Day 8–22), trigger a supply shock for one flavor currently on the regular menu. Display as a prominent event notification:

*"There's been a shortage of [key ingredient] — [Flavor] is unavailable for the next 3–5 days."*

The affected flavor is removed from the menu automatically for that period. The player must fill its slot with something else. This is not a penalty — it's a rotation prompt. After the shock ends, the flavor returns to the vault available as normal.

### Mid-season flavor invention

Once between Day 10–20 (random), show a prompt:

*"You've been experimenting in the back kitchen. Want to add a new flavor to your vault?"*

Show a simple text input. The player names the new flavor. It's added to their vault immediately and can be featured as a special the next day. Assign it a default or exotic profile based on the name heuristic above. This is a light mechanic — no sub-game, just an authorship moment mid-season.

---

## Lollipops

Always available as an impulse add-on. Fixed price $1.00. Not on the menu rotation — present as a permanent line item. ~33% attach rate per customer. Displayed in results as a separate line. No decisions required from the player, but the revenue is visible so the player notices the pattern over time.

---

## Events

One event per day, deterministic based on day seed (so the same day always has the same event in a given season). Include at minimum:

| Event | Type | Customer multiplier | Notes |
|-------|------|-------------------|-------|
| School just let out nearby | great | 1.7 | Segment boost: kids |
| Hot and sunny afternoon | good | 1.4 | — |
| Farmers market next door | good | 1.35 | Segment boost: adventurous |
| Food blogger stopped by | great | 1.25 | Buzz bonus: +0.25 to featured specials |
| Rainy afternoon | bad | 0.5 | — |
| Quiet Tuesday | neutral | 1.0 | — |
| Birthday party group | good | 1.5 | Segment boost: kids |
| Block party nearby | great | 1.8 | — |
| Slow morning | bad | 0.65 | — |
| College students on break | good | 1.3 | Segment boost: adventurous |

---

## Save state

Use localStorage. Save on every day transition. Structure the save to support:
- Current season state (day, cash, reputation score, flavor vault, menu, prices, buzz map, sales history, all-time flavor sales)
- Season history array (season number, final cash, final reputation tier, top flavors) — for future Football Manager-style season carry-over
- Parlor name and flavor vault persist across seasons

On load: detect existing save. If mid-season, resume at the day open screen. If season complete, show the end screen with option to start a new season.

---

## Visual and UX notes

- Clean, flat design. No gradients or heavy shadows. Should feel like a well-designed mobile web app, not a toy.
- Parlor name in the header on every screen after setup.
- Day pip strip (30 dots, green = past, amber = today, gray = future) visible on all in-game screens.
- Prominent event hero card at the top of the day open screen — this is the emotional anchor of each day.
- Buzz status tags ("buzzing", "fading") should be visible on the menu screen, not just results, so the player sees them before making rotation decisions.
- "Rotate flavors" (not "Change menu") on the button. Word choice matters.
- Pricing panel should only appear on pricing days. On other days show a read-only price list with a note like "Prices locked until Day [X]."
- Reputation tier name visible in the header. No numeric score shown to the player.
- Milestone notifications should appear as a distinct full-width card at the top of the results screen, styled differently from the normal results — this is a moment, not a status update.

---

## What this is not (scope boundaries for v1)

- No multiplayer or friend mode
- No difficulty curve or escalating complexity — flat season
- No R&D sub-game beyond the single mid-season flavor invention prompt
- No AI-powered content (all simulation is deterministic/rule-based — Sonnet is sufficient for any future AI features)
- No mobile app — desktop browser only
