# Balance simulation

`npm run sim` plays hundreds of 30-day seasons through the real game engine (no UI) with six bot strategies, then prints the results. Try tuning changes without editing code:

```bash
npm run sim -- --n 500 --set overhead=5 --set refPrice=3.5
```

Every number it can change lives in `src/game/tuning.js`.

## Strategies

| Bot | What it does |
|---|---|
| Cheap & busy | Plain crowd-pleasers at $2.25, never changes the menu, plays rumors safe, swaps out short flavors |
| Weird & loyal | Spicy/weird flavors first, priced near the top of what people will pay (~95% of the ceiling), new specials every 6 days, bets on rumors at 40%+ |
| Weird, fair price | Same menu as above, priced at ~85% of the ceiling |
| Balanced | Mix of plain and weird, adjusts to the forecast, fresh specials every 4 days, ~85% of the ceiling |
| Always max price | ~145% of the ceiling on everything |
| Random | Random menu, random prices ($1.50–$5.50), random choices |

The sim vault has 14 flavors: 9 plain (chocolate, vanilla, cotton candy…) and 5 weird or spicy.

## Results (500 seasons each, start with $60, $10/day shop costs)

| Strategy | End cash (p10 / median / p90) | Avg fame | Typical top tier | Scoops | $/scoop | Fan visits | Bad-weather day profit |
|---|---|---|---|---|---|---|---|
| Cheap & busy | 1,116 / **1,349** / 1,546 | 11 | Local favorite | **974** | 2.25 | 5 | $16.88 |
| Weird & loyal | 750 / 1,006 / 1,232 | 23 | PokéTuber shoutout | 434 | 4.05 | 83 | $11.67 |
| Weird, fair price | 1,030 / 1,266 / 1,486 | **45** | Filmed at your shop | 592 | 3.76 | **172** | $18.13 |
| Balanced | 980 / 1,205 / 1,420 | 39 | Hidden gems video | 583 | 3.47 | 108 | $15.37 |
| Always max price | −199 / −163 / −123 | 0 | New in town | 26 | 5.39 | 0 | −$8.75 |
| Random | 389 / 544 / 694 | 9 | Local favorite | 423 | 2.93 | 21 | $0.93 |

Ambitions, % "Nailed it" (+ % "Close"):

| Strategy | Weird Shop | Crowd-Pleaser | Best Deal | Big Time: Hidden gems | Big Time: Filmed | Big Time: Collab |
|---|---|---|---|---|---|---|
| Cheap & busy | 0 | **78** (+22) | **100** | 0 (+8) | 0 | 0 |
| Weird & loyal | 35 (+56) | 0 | 0 | 25 (+34) | 0 (+20) | 0 (+2) |
| Weird, fair price | **99** (+1) | 0 (+30) | 0 | **97** (+3) | **56** (+40) | **11** (+66) |
| Balanced | 5 (+62) | 0 (+26) | 0 | 88 (+11) | 24 (+62) | 1 (+46) |
| Always max price | 0 | 0 | 0 | 0 | 0 | 0 |
| Random | 0 | 0 | 3 (+86) | 1 (+4) | 0 | 0 |

## What this shows

- **Cheap & busy** makes the most money and serves the most people, but it stays barely known. It's the only strategy that hits Crowd-Pleaser and Best Deal.
- **Weird at a fair price** ends with almost as much cash, gets by far the most fame and loyal fans, and wins Weird Shop and Big Time. Its fans keep showing up on gray days, so its rainy-day profit is the highest.
- **Weird at premium prices** is the risky version: most expensive scoops, fewest customers, widest spread of results, and a soft bad-weather floor. Some players will learn here that "weird" and "expensive" are separate choices.
- **Balanced** is a solid all-rounder but doesn't win any ambition outright.
- **Max price** goes broke. Random play stays positive, which is deliberate for a 7-year-old poking around.

## How it changed while tuning

- **First pass.** Price only shifted which flavor people picked, never how many came, so max price was nearly free money. I added walk-aways, price-driven crowd size, deal hunters, and loyal fans.
- **Fans.** At first they snowballed: weird-and-fair made $2,289 and hit 83 fame, beating everything. I capped the town's total fan pool and made regulars spread less fame.
- **Fame.** It hit 100 too easily, then barely moved. I added a "the more famous you are, the harder it gets" curve and lowered the top tiers a little.
- **Overhead.** I raised it from the brief's $5 to $10. At $5, a rainy day earned about $20 for everyone and didn't sting. At $10 it's about $11–18, and storms can lose money. With `--set overhead=5`, every strategy just ends about $150 higher. The ranking doesn't change.
