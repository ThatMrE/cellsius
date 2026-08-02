# Cellsius — going live

The site is a static storefront with one Netlify serverless function for
Stripe. Nothing here needs a build step beyond Netlify installing the
`stripe` dependency for the function.

## 1. Affiliate links

Open `index.html` and edit the `CONFIG` block near the top of the `<script>`:

```js
const CONFIG = {
  amazonTag: 'cellsius-20',   // ← your Amazon Associates tag
  odinRef:   '',              // ← optional ODIN referral/UTM, e.g. 'ref=cellsius'
  orderEmail:'orders@cellsius.org',
  stripeLinks: { 'd-bundle': '', 'd-handbook': '', 'd-supporter': '' },
};
```

- **Amazon:** sign up at affiliate-program.amazon.com, put your tag in `amazonTag`.
  Every Amazon product link is built as a search URL with your tag attached.
- **The ODIN / other makers:** apply to their affiliate/referral programme and
  put any tracking param in `odinRef`. Verify each ODIN product URL in the
  `PRODUCTS` array — a few point to the ODIN shop root where the exact product
  slug wasn't confirmed.

## 2. Product photos (replace the SVG illustrations)

Each product in the `PRODUCTS` / `DIRECT` arrays can carry an `image` field.
If present, it's used instead of the built-in SVG:

```js
{ id:'k-crispr', /* … */ image:'assets/products/crispr-kit.jpg' },
```

- Put files in `assets/products/` (any path works) or use a full URL.
- Use photos you have the rights to (your own shots, or the vendor's with
  permission). Recommended ~800×600, under ~150 KB each.
- Leave `image` off to keep the SVG illustration.

## 3. Stripe payments (for "Our Kits")

Card payments are handled by `netlify/functions/create-checkout.js`, which
creates a Stripe Checkout Session. Product prices live **server-side** in that
file (never trust the browser) — keep them in sync with the `DIRECT` array.

**To go live:**

1. Create a Stripe account at dashboard.stripe.com.
2. Copy your **Secret key** (starts `sk_live_…`, or `sk_test_…` to test).
3. In Netlify: **Site settings → Environment variables → Add** a variable
   named `STRIPE_SECRET_KEY` with that value. Redeploy.
4. Done. "Buy now" now opens real Stripe Checkout. Card details never touch
   this site.

**Order of fallbacks** the "Buy now" button uses:

1. Stripe Checkout via the function (once `STRIPE_SECRET_KEY` is set).
2. A Stripe **Payment Link** you paste into `CONFIG.stripeLinks` (no backend needed).
3. Demo mode: opens a pre-filled email order.

After a successful payment, Stripe returns the buyer to `/?paid=1` and the site
shows a thank-you toast. To fulfil orders reliably, add a Stripe webhook
(`checkout.session.completed`) — see stripe.com/docs/payments/checkout/fulfill-orders.

## 4. Deploy

Point Netlify at this repo (publish directory `.`). Netlify auto-detects
`netlify/functions` and installs `stripe`. The `cellsi.us` domain redirects
here via the companion `cellsius-us` repo.
