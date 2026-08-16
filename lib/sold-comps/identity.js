/**
 * Exact-match identity scoring for sold-comp ingestion.
 *
 * Reuses the same strict identity principles as the active-listing search
 * (api/ebay/search.js) with these additional constraints:
 *
 *   1. rawOnly is ALWAYS true for raw flip comps – graded cards are hard-rejected.
 *   2. Never mix PSA/BGS/SGC sales into raw fair value.
 *   3. Ambiguous listings go to 'review', never 'accepted'.
 *   4. Automated ingestion requires confidence >= SOLD_COMP_MIN_CONFIDENCE (0.98).
 *
 * Identity dimensions checked (all must pass):
 *   player, year, manufacturer/set/product, card_number, parallel,
 *   serial_numbering, autograph_state, raw/graded state, grade, grader.
 */

'use strict';

const SOLD_COMP_MIN_CONFIDENCE = 0.98;

// ── Shared text helpers ────────────────────────────────────────────────────

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasWord(hay, word) {
  return ` ${norm(hay)} `.includes(` ${norm(word)} `);
}

function containsNormalizedPhrase(hay, phrase) {
  const h = ` ${norm(hay)} `;
  const p = ` ${norm(phrase)} `;
  return p.trim() && h.includes(p);
}

function hasSerial(title, serialTo) {
  if (!serialTo) return false;
  const escaped = String(serialTo).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`/\\s*${escaped}(?:\\D|$)`, 'i').test(String(title || ''));
}

function extractSerials(title) {
  return [...String(title || '').matchAll(/\/\s*(\d{1,5})(?=\D|$)/g)].map(
    m => Number(m[1])
  );
}

function looksLikeLot(title) {
  const t = norm(title);
  return (
    /(^| )(lot|bundle|set of)( |$)/.test(t) ||
    /(^| )x ?[2-9][0-9]*( |$)/.test(t) ||
    /(^| )[2-9][0-9]*x( |$)/.test(t)
  );
}

// ── Parallel conflict lists (mirrors search.js) ───────────────────────────

const PARALLEL_CONFLICTS = [
  'silver', 'refractor', 'holo', 'hyper', 'wave', 'china', 'ice',
  'cracked ice', 'pink ice', 'red ice', 'green ice', 'blue ice', 'pulsar',
  'checkerboard', 'choice', 'fast break', 'disco', 'scope', 'mojo',
  'shimmer', 'sparkle', 'orange', 'gold', 'black', 'purple', 'pink', 'red',
  'blue', 'green', 'white', 'neon', 'ruby', 'tiger', 'elephant', 'snakeskin',
  'prizm break', 'variation', 'glitter', 'silver glitter', 'ssp',
  'super short print', 'mini diamond', 'mini-diamond', 'superfractor',
  'super fractor', 'aqua', 'teal'
];

const BASE_PARALLEL_CONFLICTS = [
  ...PARALLEL_CONFLICTS,
  'pink cracked ice',
  'red white blue',
  'red/white/blue'
];

const SET_STOPWORDS = new Set([
  'topps', 'panini', 'baseball', 'basketball', 'football',
  'card', 'cards', 'trading', 'autograph', 'autographs'
]);

// Grader names that indicate a graded (slabbed) card
const GRADED_WORDS = ['psa', 'bgs', 'sgc', 'cgc', 'gma', 'beckett', 'graded', 'gem mint', 'mint 10'];

/**
 * Score a single sold-comp candidate against a card identity target.
 *
 * @param {object} item
 *   item.title      {string}  – listing title
 *   item.condition  {string}  – e.g. "Ungraded", "Graded"
 *
 * @param {object} target  – card identity (see enrichment queue columns):
 *   target.player       {string}
 *   target.year         {string|number}
 *   target.set          {string}
 *   target.cardNumber   {string}
 *   target.parallel     {string}  – '' for base
 *   target.serialTo     {number|null}
 *   target.isAutograph  {boolean}
 *   target.grade        {string}  – '' for raw
 *   target.grader       {string}  – '' for raw
 *
 * @returns {{ score: number, status: 'accepted'|'review'|'rejected', reasons: string[] }}
 */
function scoreSoldComp(item, target) {
  const rawTitle = String(item.title || '');
  const title = norm(rawTitle);

  const targetSet = norm(target.set || '');
  const wanted = norm(target.parallel || '');
  const wantedGrader = norm(target.grader || '');
  const wantedGrade = norm(target.grade || '');

  const reasons = [];
  let score = 1.0;

  // ── 1. Player (hard reject) ──────────────────────────────────────────────
  const playerTokens = norm(target.player || '').split(' ').filter(Boolean);
  if (playerTokens.some(token => !hasWord(title, token))) {
    return { score: 0, status: 'rejected', reasons: ['player_mismatch'] };
  }

  // ── 2. Lot/bundle detection (hard reject) ────────────────────────────────
  if (looksLikeLot(rawTitle)) {
    return { score: 0.1, status: 'rejected', reasons: ['multi_card_or_lot'] };
  }

  // ── 3. Graded-card check – raw flip comps ONLY accept ungraded ────────────
  //    PSA/BGS/SGC sales must never feed raw fair value.
  const titleLooksGraded = GRADED_WORDS.some(w => containsNormalizedPhrase(title, w));
  const conditionLooksGraded =
    /^graded$/i.test(String(item.condition || '').trim()) || titleLooksGraded;

  if (conditionLooksGraded) {
    return {
      score: 0.2,
      status: 'rejected',
      reasons: ['graded_copy_rejected_for_raw_comp']
    };
  }

  // ── 4. Autograph state ───────────────────────────────────────────────────
  const autoInTitle = /(^| )(auto|autograph|autographs)( |$)/.test(title);
  if (target.isAutograph) {
    if (!autoInTitle) {
      return { score: 0.45, status: 'rejected', reasons: ['autograph_not_explicit'] };
    }
  } else if (autoInTitle) {
    return { score: 0.25, status: 'rejected', reasons: ['unexpected_autograph'] };
  }

  // ── 5. Card number ───────────────────────────────────────────────────────
  if (target.cardNumber) {
    const cardPhrase = norm(String(target.cardNumber).replace(/^#/, ''));
    if (!containsNormalizedPhrase(title, cardPhrase)) {
      score -= 0.26;
      reasons.push('card_number_not_explicit');
    }
  }

  // ── 6. Year ──────────────────────────────────────────────────────────────
  const yearTokens = norm(target.year || '').split(' ').filter(Boolean);
  if (yearTokens.length && yearTokens.some(y => !hasWord(title, y))) {
    score -= 0.10;
    reasons.push('year_not_explicit');
  }

  // ── 7. Set tokens ────────────────────────────────────────────────────────
  const setTokens = targetSet
    .split(' ')
    .filter(t => t.length > 2 && !SET_STOPWORDS.has(t));
  if (setTokens.length && setTokens.some(t => !hasWord(title, t))) {
    score -= 0.10;
    reasons.push('set_not_explicit');
  }

  // ── 8. Parallel conflicts ────────────────────────────────────────────────
  const parallelConflicts = wanted ? PARALLEL_CONFLICTS : BASE_PARALLEL_CONFLICTS;
  for (const conflict of parallelConflicts) {
    const conflictNorm = norm(conflict);
    const conflictIsSetWord = targetSet.includes(conflictNorm);
    const conflictIsWanted = wanted.includes(conflictNorm);
    if (hasWord(title, conflict) && !conflictIsWanted && !conflictIsSetWord) {
      return {
        score: 0.25,
        status: 'rejected',
        reasons: [`wrong_parallel:${conflict}`]
      };
    }
  }

  // ── 9. Wanted parallel presence ─────────────────────────────────────────
  if (wanted) {
    const wantedTokens = wanted
      .split(' ')
      .filter(t => t.length > 2 && !['prizm', 'refractor'].includes(t));
    if (wantedTokens.length && wantedTokens.some(t => !hasWord(title, t))) {
      score -= 0.18;
      reasons.push('parallel_not_explicit');
    }
    if (wanted.includes('silver') && !hasWord(title, 'silver')) {
      score -= 0.28;
      reasons.push('silver_not_explicit');
    }
    if (containsNormalizedPhrase(title, wanted)) {
      score += 0.03;
    }
  }

  // ── 10. Serial numbering ─────────────────────────────────────────────────
  if (target.serialTo) {
    const serials = extractSerials(rawTitle);
    if (serials.length && !serials.includes(Number(target.serialTo))) {
      return {
        score: 0.15,
        status: 'rejected',
        reasons: [`wrong_serial:/${serials.join(',/')}`]
      };
    }
    if (!hasSerial(rawTitle, target.serialTo)) {
      score -= 0.22;
      reasons.push('serial_not_explicit');
    } else {
      score += 0.03;
    }
  }

  // ── 11. Grader / grade (for graded targets – not used for raw comps) ─────
  const titleGraderMatch = rawTitle.match(/\b(psa|bgs|sgc|cgc|gma|beckett)\b/i);
  const titleGradeMatch = rawTitle.match(
    /\b(?:psa|bgs|sgc|cgc|gma|beckett)\s*(\d{1,2}(?:\.\d)?)\b/i
  );
  const titleGrader = norm(titleGraderMatch?.[1] || '');
  const titleGrade = norm(titleGradeMatch?.[1] || '');

  if (wantedGrader) {
    if (
      titleGrader &&
      !(
        titleGrader === wantedGrader ||
        (wantedGrader === 'beckett' && titleGrader === 'bgs') ||
        (wantedGrader === 'bgs' && titleGrader === 'beckett')
      )
    ) {
      return { score: 0.2, status: 'rejected', reasons: [`wrong_grader:${titleGrader}`] };
    }
    if (
      !hasWord(title, wantedGrader) &&
      !(wantedGrader === 'beckett' && hasWord(title, 'bgs')) &&
      !(wantedGrader === 'bgs' && hasWord(title, 'beckett'))
    ) {
      score -= 0.22;
      reasons.push('grader_not_explicit');
    }
  }

  if (wantedGrade) {
    if (titleGrade && titleGrade !== wantedGrade) {
      return { score: 0.2, status: 'rejected', reasons: [`wrong_grade:${titleGrade}`] };
    }
    if (!containsNormalizedPhrase(title, wantedGrade)) {
      score -= 0.22;
      reasons.push('grade_not_explicit');
    }
  }

  // ── 12. Ungraded condition bonus ─────────────────────────────────────────
  if (norm(item.condition || '').includes('ungraded')) {
    score += 0.03;
  }

  // ── 13. Autograph present when wanted ────────────────────────────────────
  if (target.isAutograph && autoInTitle) {
    score += 0.02;
  }

  score = Math.max(0, Math.min(1, score));

  // ── Final status determination ────────────────────────────────────────────
  // For sold-comp ingestion we require >= 0.98 for automated acceptance.
  // Anything below that goes to 'review' or 'rejected'.
  let status;
  if (score >= SOLD_COMP_MIN_CONFIDENCE) {
    status = 'accepted';
  } else if (score >= 0.75) {
    status = 'review';
  } else {
    status = 'rejected';
  }

  return { score, status, reasons };
}

module.exports = {
  scoreSoldComp,
  SOLD_COMP_MIN_CONFIDENCE
};
