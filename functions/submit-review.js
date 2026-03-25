// Example serverless function for a production deployment.
// Replace the placeholder response with logic that writes to your database.

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const payload = JSON.parse(event.body || '{}');
  const required = ['schoolId', 'reviewer', 'rating', 'body'];
  const missing = required.filter(key => !payload[key]);
  if (missing.length) {
    return { statusCode: 400, body: `Missing required fields: ${missing.join(', ')}` };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, review: payload })
  };
}
