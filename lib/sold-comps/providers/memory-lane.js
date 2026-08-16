/**
 * Memory Lane marketplace adapter (stub).
 *
 * This provider does not currently expose a permitted automated API or data
 * feed for third-party sold-comp ingestion.  This adapter returns
 * provider_unavailable unconditionally so that no fake comps are fabricated.
 *
 * When permitted API/feed access is granted, replace this stub with a real
 * implementation that conforms to the SoldComp result shape defined in base.js.
 *
 * Controlled CSV/JSON imports are supported via the manual-import adapter.
 */

'use strict';

const { unavailableResult } = require('./base');

// NOTE: The file is named memory-lane.js (kebab-case) to match the filesystem
// convention used by other adapters.  The provider slug stored in provider_name
// and used as the MARKETPLACE_RELEVANCE key in valuation.js is 'memory_lane'
// (snake_case).  These intentionally differ; always use the slug constant below
// when setting provider_name on a comp so the valuation lookup is correct.
const MARKETPLACE = 'memory_lane';

async function fetchSoldComps(_target, _options) {
  return unavailableResult(
    `${MARKETPLACE} adapter: no permitted automated access. ` +
    'Use the manual-import adapter with pre-approved CSV/JSON exports.'
  );
}

module.exports = {
  name: MARKETPLACE,
  marketplace: MARKETPLACE,
  fetchSoldComps
};
