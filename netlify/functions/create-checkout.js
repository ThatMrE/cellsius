// Cellsius — Stripe Checkout Session creator (Netlify Function).
//
// Goes live automatically once STRIPE_SECRET_KEY is set in the Netlify
// site's environment variables. Until then it returns 501 and the
// storefront falls back to a Payment Link or an email order.
//
// Prices live HERE on the server — never trust an amount sent by the
// browser. Keep these in sync with the DIRECT array in index.html.

const PRODUCTS = {
  'd-bundle': {
    name: 'Cellsius Starter Bundle',
    description: 'Curated first-experiment box + beginner course access.',
    amount: 5900, // cents (USD)
    mode: 'payment',
    shippable: true,
  },
  'd-handbook': {
    name: 'Cellsius Protocol Handbook (PDF)',
    description: '90-page illustrated field guide — instant digital download.',
    amount: 1900,
    mode: 'payment',
    shippable: false,
  },
  'd-supporter': {
    name: 'Supporter Membership',
    description: 'Monthly support — keeps our protocols free and open.',
    amount: 800,
    mode: 'subscription',
    interval: 'month',
    shippable: false,
  },
};

const SHIP_COUNTRIES = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'IE', 'NZ'];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Not configured yet — signal the client to use its fallback.
    return json(501, { error: 'Stripe is not configured on this site yet.' });
  }

  let id;
  try {
    id = JSON.parse(event.body || '{}').id;
  } catch (e) {
    return json(400, { error: 'Invalid request body' });
  }

  const item = PRODUCTS[id];
  if (!item) return json(404, { error: 'Unknown product: ' + id });

  const stripe = require('stripe')(key);
  const origin =
    event.headers.origin ||
    (event.headers.host ? `https://${event.headers.host}` : 'https://cellsius.org');

  const line_item = {
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: item.amount,
      product_data: { name: item.name, description: item.description },
      ...(item.mode === 'subscription' ? { recurring: { interval: item.interval } } : {}),
    },
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: item.mode,
      line_items: [line_item],
      success_url: `${origin}/?paid=1`,
      cancel_url: `${origin}/#store`,
      automatic_tax: { enabled: false },
      ...(item.shippable
        ? { shipping_address_collection: { allowed_countries: SHIP_COUNTRIES } }
        : {}),
    });
    return json(200, { url: session.url });
  } catch (err) {
    return json(500, { error: err.message || 'Stripe error' });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
