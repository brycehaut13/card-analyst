/**
 * Fanatics Collect marketplace adapter.
 *
 * Fanatics Collect (formerly Topps/Fanatics digital marketplace and Fanatics
 * Collect auction platform) does not currently expose a public API or
 * authorised automated data feed for third-party sold-comp ingestion.
 *
 * This adapter returns provider_unavailable unconditionally.
 * When Fanatics Collect grants permitted API/feed access, replace this stub
 * with a real implementation using the same SoldComp result shape.
 *
 * Controlled CSV/JSON imports from this source are supported via the
 * manual-import adapter.
 */

'use strict';

const { unavailableResult } = require('./base');

const MARKETPLACE = 'fanatics_collect';

async function fetchSoldComps(_target, _options) {
  return unavailableResult(
    'Fanatics Collect adapter is not yet implemented. ' +
    'No permitted automated API access exists for this provider. ' +
    'Use the manual-import adapter with pre-approved CSV/JSON exports.'
  );
}

module.exports = {
  name: MARKETPLACE,
  marketplace: MARKETPLACE,
  fetchSoldComps
};
