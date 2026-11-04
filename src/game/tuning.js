// Every tunable number in one place. The headless simulation script
// (scripts/simulate.mjs) can override these to explore balance.

export const TUNING = {
  startCash: 60,
  overhead: 10,

  // Walk-in crowd
  walkInMin: 11,
  walkInMax: 17,
  refPrice: 3.25, // average menu price that draws a "normal" crowd
  valueExp: 1.3, // how strongly cheap prices pull in extra people
  valueMin: 0.55,
  valueMax: 1.45,
  fameCrowd: 0.5, // at fame 100, crowd × (1 + this)

  // Who walks in: share of kids / everyone / adventurous
  segmentMix: { kids: 0.32, everyone: 0.48, adventurous: 0.2 },
  segmentEventShift: 0.25, // event segment gets this much extra share

  // How much each kind of customer likes each kind of flavor
  affinity: {
    kids: { kids: 1.3, everyone: 1.0, adventurous: 0.25 },
    everyone: { kids: 0.9, everyone: 1.1, adventurous: 0.45 },
    adventurous: { kids: 0.6, everyone: 0.9, adventurous: 2.6 },
  },
  appealToBuy: 0.42, // best weight at which a customer is sure to buy

  // Willingness to pay vs. the flavor's price ceiling
  walkAwaySlope: 2.4,
  walkAwayMax: 0.9,
  fanTolerance: 1.2,
  dealTolerance: 0.85,

  // Loyal fans of exotic flavors
  fanGainLoved: 0.32,
  fanGainMixed: 0.14,
  fanVisitRate: 0.5,
  fanDecayOn: 0.03,
  fanDecayOff: 0.22,
  fanCap: 6,
  fanCapTotal: 16,
  fanFameWeight: 0.3,
  exoticFanGainMult: 1.0,
  standardFanGainMult: 0.03,

  // Deal hunters (attracted by low prices, leave when prices rise)
  dealPrice: 3.4, // average price under which deal hunters start to gather
  dealGain: 0.11,
  dealDecay: 0.1,
  dealCap: 16,
  dealVisitRate: 0.55,

  lollipopRate: 0.33,
  lollipopKidRate: 0.5,

  // Fame
  fameDrift: -0.8,
  fameGainDamp: 170, // gains shrink as fame rises: × (1 − fame/this)
  fameHappyStd: 0.25, // × sqrt(happy standard customers)
  fameHappyExotic: 0.2, // per happy exotic customer
  fameFreshSpecial: 0.15,
  fameGrumble: -0.12,
  fameWalkAway: -0.28,
  fameStaleDays: 4,
  fameStale: -0.8,
  fameFlop: -3,
  fameHit: 3,

  // Test batches (first time a flavor is featured in a season)
  batchCostStd: 6,
  batchCostExotic: 9,
  batchOddsStd: { flop: 0.15, fine: 0.65, hit: 0.2 },
  batchOddsExotic: { flop: 0.3, fine: 0.3, hit: 0.4 },
  hitBuzz: 0.45,
  flopDemand: 0.5,

  // Supply shocks
  surgePerScoop: 0.9,
};
