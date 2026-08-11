# Cellsius — going live

A static storefront with one Netlify serverless function for Stripe. Nothing
here needs a build step, apart from Netlify installing the `stripe` dependency
for the function.

## 1. Affiliate links

Open `index.html` and edit the `CONFIG` block near the top of the `<script>`:

```js
const CONFIG = {
  amazonTag: 'cellsius-20',   // ← your Amazon Associates tag
  odinRef:   '',              // ← optional ODIN referral/UTM, e.g. 'ref=cellsius'
  orderEmail:'hello@biopunklab.com',
  stripeLinks: { 'd-bundle': '', 'd-handbook': '', 'd-supporter': '' },
};
```

- **Amazon:** sign up at affiliate-program.amazon.com, put your tag in `amazonTag`.
  Every Amazon product link is built as a search URL with your tag attached.
- **The ODIN and other makers:** apply to their affiliate or referral program and
  put any tracking parameter in `odinRef`. Check each ODIN product URL in the
  `PRODUCTS` array. A few point at the ODIN shop root, because nobody confirmed
  the exact product slug.

## 2. Product photos (replace the SVG illustrations)

Each product in the `PRODUCTS` and `DIRECT` arrays can carry an `image` field.
The card then shows that file instead of the built-in SVG:

```js
{ id:'k-crispr', /* … */ image:'assets/products/crispr-kit.jpg' },
```

- Put files in `assets/products/` (any path works) or use a full URL.
- Use photos you have the rights to (your own shots, or the vendor's with
  permission). Recommended ~800×600, under ~150 KB each.
- Leave `image` off to keep the SVG illustration.

## 3. Stripe payments (for "Our Kits")

`netlify/functions/create-checkout.js` handles card payments. It creates a
Stripe Checkout Session. Product prices live **server-side** in that file,
because the browser is not a source you can trust. Keep them in step with the
`DIRECT` array.

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
shows a thank-you toast. To fulfill orders reliably, add a Stripe webhook on
`checkout.session.completed`. See stripe.com/docs/payments/checkout/fulfill-orders.

## 4. Deploy

Point Netlify at this repo, with `.` as the publish directory. Netlify finds
`netlify/functions` on its own and installs `stripe`. The companion
`cellsius-us` repo redirects the `cellsi.us` domain here.
