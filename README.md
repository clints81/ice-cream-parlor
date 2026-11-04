# Ice Cream Parlor 🍦

A 30-day ice cream shop simulation game. Name your parlor, invent your own
flavors, and run the shop one day at a time — rotating specials, pricing for
volume vs. margin, riding the buzz, and rolling with whatever the day throws
at you.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (http://localhost:5174). The first start can take
up to a minute to compile; later starts are quicker.

Progress saves automatically in the browser (localStorage).

## Players (multiple saved games)

The first screen is **"Who's playing?"** — each player gets their own parlor,
flavor vault, and season that save independently. Use **+ New parlor** to add
one and **✕** to delete one. "Switch player" (in the footer) takes you back to
the picker without deleting anything.

When you create a parlor you choose a mode:

- **On my own** — the full game, with ingredient costs, pricing decisions, and
  surprises that can go either way.
- **Playing together — take it easy** — a gentler version for younger players:
  no money worries, bigger crowds, and only happy surprises.

## How a day works

1. Read the day's **event** — it tells you what kind of crowd is coming. Each
   flavor shows a **taste tag** (🍬 sweet, 🍓 fruity, 🍦 creamy, 🍋 sour,
   🌶️ spicy) so you can match flavors to the crowd (kids love sweet, the
   adventurous love sour and spicy).
2. **Rotate flavors**: up to 5 regular + 2 featured specials.
3. On **pricing days** (Day 1, 8, 15, 22, 29) you set prices. Each flavor shows
   what it **costs to make** and your **profit per scoop** — price low for
   volume, or high for margin.
4. **Open for business.** You bank **profit** (sales minus ingredient costs),
   not just sales.

Watch for **surprises**: a heat-wave rush or going viral can make your week,
while a machine breakdown, an ingredient shortage, or a rival cart opening
nearby can set you back. Each season's weather and surprises are different.

Lollipops are always for sale at $1 — no decisions needed.
