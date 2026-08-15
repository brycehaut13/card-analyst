const crypto = require('crypto');

const ENDPOINT =
  'https://card-analyst.vercel.app/api/ebay/account-deletion';

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const challengeCode = req.query?.challenge_code;
    const verificationToken =
      process.env.EBAY_DELETION_VERIFICATION_TOKEN;

    if (!challengeCode) {
      return res.status(400).json({
        error: 'Missing challenge_code'
      });
    }

    if (!verificationToken) {
      return res.status(500).json({
        error: 'Server verification token is not configured'
      });
    }

    const challengeResponse = crypto
      .createHash('sha256')
      .update(challengeCode)
      .update(verificationToken)
      .update(ENDPOINT)
      .digest('hex');

    res.setHeader('Content-Type', 'application/json');

    return res.status(200).json({
      challengeResponse
    });
  }

  if (req.method === 'POST') {
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, POST');

  return res.status(405).json({
    error: 'Method not allowed'
  });
};
