# Ice Cream Parlor 🍦

A 30-day ice cream shop game for kids. Name your parlor, invent your own flavors (and give each one a color), pick a goal for the season, and run the shop one day at a time.

## Start playing

On a Mac, double-click **Start Ice Cream Parlor.command**. Or, in Terminal:

```bash
npm install
npm start
```

The game opens at **http://127.0.0.1:5174**. Bookmark that exact address: saves belong to it. See [docs/HOSTING.md](docs/HOSTING.md) for a free hosted version (GitHub Pages or Netlify), and for how backups work.

## How it plays

- **Who's playing?** Each kid has their own player: an animal buddy, a parlor name, a flavor vault, and a season shelf. Switch players from the top bar at any time. Everything saves as you go.
- **Pick an ambition** at the start of each season: The Weird Shop, The Crowd-Pleaser, Best Deal in Town, Big Time (get famous), or My Own Goal. Its progress shows all season. The season ends with a report card on the shelf.
- **Each morning** starts with a forecast (it's usually right), news, and sometimes a rumor to bet on or an ingredient shortage to handle. Then set the chalkboard menu and prices.
- **Open the shop** and watch the day play out: every customer you see is a real customer from the simulation. Then read the day's report: money in, cost of scoops, shop costs, and what each flavor earned after cost.
- **Fame** is the star meter in the top bar. Happy customers and fresh specials raise it. Overpricing, a stale menu, and flops lower it. PokéTuber milestones arrive as surprises.
- **Helper mode** (per player, in Settings) adds one-tap suggestions, "It costs you $1. You charge $3. You keep $2.", optional math questions, and bigger text. It never hides anything.

## For grown-ups

- `npm run sim` runs the balance simulation (see [docs/SIMULATION.md](docs/SIMULATION.md)).
- `npm run build` makes a static site in `dist/` that works from any web address.
- Game rules live in `src/game/` (pure JavaScript, shared by the UI and the simulation). All tunable numbers are in `src/game/tuning.js`. Saves go through `src/storage/storage.js` (versioned, with migrations).
- No network calls, no services: the art is SVG, the sounds are synthesized with WebAudio, and the fonts are bundled.
