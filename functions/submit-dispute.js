// Example serverless function for a production deployment.
// Replace the placeholder mail transport with your provider of choice.

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const payload = JSON.parse(event.body || '{}');
  const required = ['schoolName', 'reporterEmail', 'metric', 'details'];
  const missing = required.filter(key => !payload[key]);
  if (missing.length) {
    return { statusCode: 400, body: `Missing required fields: ${missing.join(', ')}` };
  }

  // TODO: send email or persist a ticket in your helpdesk.
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, message: 'Dispute queued for review.' })
  };
}
