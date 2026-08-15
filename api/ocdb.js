const OCDB_URL = 'https://xoheywavlyadnczmdzaf.supabase.co';

const OCDB_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaGV5d2F2bHlhZG5jem1kemFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NzkyMjIsImV4cCI6MjA4MjM1NTIyMn0.MhnvwVJvyclQbCFBTpp1dZ7d3yLU5a-s6fHsGjC86K0';

export default async function handler(req, res) {
  try {
    const {
      resource = 'cards',
      offset = '0',
      limit = '500',
      ids = ''
    } = req.query || {};

    const safeLimit = Math.min(
      Math.max(parseInt(limit, 10) || 500, 1),
      1000
    );

    const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

    if (!['cards', 'card_images'].includes(resource)) {
      return res.status(400).json({
        error: 'resource must be cards or card_images'
      });
    }

    let path;

    if (resource === 'cards') {
      path =
        `/rest/v1/cards` +
        `?select=id,sport,year,brand,set_name,card_number,player,confidence,sightings,attributes,source_notes,created_at,updated_at` +
        `&order=id.asc` +
        `&offset=${safeOffset}` +
        `&limit=${safeLimit}`;
    } else {
      path =
        `/rest/v1/card_images` +
        `?select=id,card_id,image_url,image_type,source,image_hash,license,created_at` +
        `&order=id.asc` +
        `&offset=${safeOffset}` +
        `&limit=${safeLimit}`;
    }

    const response = await fetch(OCDB_URL + path, {
      headers: {
        apikey: OCDB_ANON,
        Authorization: `Bearer ${OCDB_ANON}`,
        Accept: 'application/json'
      }
    });

    const text = await response.text();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Cache-Control',
      's-maxage=300, stale-while-revalidate=3600'
    );

    if (!response.ok) {
      return res.status(response.status).send(
        JSON.stringify({
          error: 'OCDB request failed',
          detail: text.slice(0, 1000)
        })
      );
    }

    return res.status(200).send(text);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
