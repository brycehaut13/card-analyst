/**
 * Lelands marketplace adapter (stub).
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

const MARKETPLACE = 'lelands';

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
