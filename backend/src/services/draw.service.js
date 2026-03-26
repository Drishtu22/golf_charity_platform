const supabase = require('../config/supabase');
const logger = require('../utils/logger');

// ─── Prize Pool Constants ──────────────────────────────────────────────────────

const POOL_SPLIT = {
  MATCH_5: 0.4,
  MATCH_4: 0.35,
  MATCH_3: 0.25,
};

const SCORE_MIN = 1;
const SCORE_MAX = 45;

// ─── Random Draw Logic ────────────────────────────────────────────────────────

/**
 * Generates 5 unique random numbers in the Stableford range.
 */
const generateRandomDraw = () => {
  const numbers = new Set();
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * (SCORE_MAX - SCORE_MIN + 1)) + SCORE_MIN);
  }
  return Array.from(numbers).sort((a, b) => a - b);
};

// ─── Weighted Algorithm Draw ──────────────────────────────────────────────────

/**
 * Generates a weighted draw based on the frequency of all user scores.
 * Scores appearing more often have higher probability (or lower, configurable).
 * @param {'most' | 'least'} bias - 'most' favours frequent scores, 'least' favours rare ones.
 */
const generateWeightedDraw = async (bias = 'most') => {
  const { data: scores, error } = await supabase
    .from('scores')
    .select('score_value');

  if (error || !scores.length) {
    logger.warn('No scores found for weighted draw — falling back to random.');
    return generateRandomDraw();
  }

  // Build frequency map
  const freq = {};
  for (let i = SCORE_MIN; i <= SCORE_MAX; i++) freq[i] = 0;
  scores.forEach(({ score_value }) => { freq[score_value] = (freq[score_value] || 0) + 1; });

  // Build weighted pool
  const pool = [];
  for (const [num, count] of Object.entries(freq)) {
    const weight = bias === 'most' ? count + 1 : Math.max(1, 10 - count);
    for (let i = 0; i < weight; i++) pool.push(Number(num));
  }

  // Pick 5 unique numbers from weighted pool
  const picked = new Set();
  let attempts = 0;
  while (picked.size < 5 && attempts < 1000) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.add(pool[idx]);
    attempts++;
  }

  // Fill remaining with random if needed
  while (picked.size < 5) picked.add(generateRandomDraw()[0]);

  return Array.from(picked).sort((a, b) => a - b);
};

// ─── Generate Draw Numbers ────────────────────────────────────────────────────

exports.generateDrawNumbers = async (mode = 'random', bias = 'most') => {
  if (mode === 'weighted') {
    return generateWeightedDraw(bias);
  }
  return generateRandomDraw();
};

// ─── Calculate Prize Pools ────────────────────────────────────────────────────

exports.calculatePrizePools = async (drawId) => {
  // Get total pool for this draw
  const { data: draw } = await supabase
    .from('draws')
    .select('total_pool, jackpot_carry_over')
    .eq('id', drawId)
    .single();

  if (!draw) throw new Error('Draw not found');

  const effectivePool = (draw.total_pool || 0) + (draw.jackpot_carry_over || 0);

  return {
    match5Pool: Math.floor(effectivePool * POOL_SPLIT.MATCH_5 * 100) / 100,
    match4Pool: Math.floor(effectivePool * POOL_SPLIT.MATCH_4 * 100) / 100,
    match3Pool: Math.floor(effectivePool * POOL_SPLIT.MATCH_3 * 100) / 100,
    effectivePool,
  };
};

// ─── Match User Scores Against Draw Numbers ───────────────────────────────────

/**
 * Checks how many of a user's 5 most recent scores match the draw numbers.
 * @param {number[]} userScores - Array of the user's score values
 * @param {number[]} drawNumbers - The 5 drawn numbers
 * @returns {number} count of matching numbers
 */
exports.countMatches = (userScores, drawNumbers) => {
  const drawSet = new Set(drawNumbers);
  return userScores.filter((s) => drawSet.has(s)).length;
};

// ─── Process Draw Results ─────────────────────────────────────────────────────

/**
 * After a draw is run:
 * 1. Fetch all active subscribers' latest 5 scores.
 * 2. Compare against draw numbers.
 * 3. Record winners in the draw_winners table.
 * 4. Handle jackpot rollover.
 */
exports.processDraw = async (drawId, drawNumbers) => {
  const { match5Pool, match4Pool, match3Pool } = await exports.calculatePrizePools(drawId);

  // Fetch all active subscribers and their scores
  const { data: subscribers, error } = await supabase
    .from('users')
    .select(`
      id,
      scores ( score_value, played_at )
    `)
    .eq('subscription_status', 'active');

  if (error) throw new Error('Failed to fetch subscribers for draw processing');

  const winners = { match5: [], match4: [], match3: [] };

  for (const user of subscribers) {
    const userScores = (user.scores || [])
      .sort((a, b) => new Date(b.played_at) - new Date(a.played_at))
      .slice(0, 5)
      .map((s) => s.score_value);

    const matchCount = exports.countMatches(userScores, drawNumbers);

    if (matchCount === 5) winners.match5.push(user.id);
    else if (matchCount === 4) winners.match4.push(user.id);
    else if (matchCount === 3) winners.match3.push(user.id);
  }

  // Calculate per-winner prize
  const buildWinnerInserts = (userIds, tier, pool) => {
    if (!userIds.length) return [];
    const prizePerWinner = Math.floor((pool / userIds.length) * 100) / 100;
    return userIds.map((userId) => ({
      draw_id: drawId,
      user_id: userId,
      match_tier: tier,
      prize_amount: prizePerWinner,
      status: 'pending_verification',
    }));
  };

  const winnerInserts = [
    ...buildWinnerInserts(winners.match5, 5, match5Pool),
    ...buildWinnerInserts(winners.match4, 4, match4Pool),
    ...buildWinnerInserts(winners.match3, 3, match3Pool),
  ];

  if (winnerInserts.length) {
    await supabase.from('draw_winners').insert(winnerInserts);
  }

  // Jackpot rollover if no 5-match winners
  const jackpotRollover = winners.match5.length === 0 ? match5Pool : 0;

  // Update draw as published with results
  await supabase
    .from('draws')
    .update({
      status: 'published',
      draw_numbers: drawNumbers,
      jackpot_rolled_over: jackpotRollover,
      published_at: new Date(),
    })
    .eq('id', drawId);

  logger.info(
    `Draw ${drawId} processed. 5-match: ${winners.match5.length}, 4-match: ${winners.match4.length}, 3-match: ${winners.match3.length}. Jackpot rollover: £${jackpotRollover}`
  );

  return {
    drawNumbers,
    winners,
    jackpotRollover,
    pools: { match5Pool, match4Pool, match3Pool },
  };
};
