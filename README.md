# consent-cookie-cmp

A lightweight Klaro-based JavaScript consent manager with Google CMP compatibility and modular, consent-gated loading for analytics, marketing tags, and embedded media.

## Requirements

- Static hosting for the CMP assets and configuration files.
- A browser with ES5-compatible JavaScript support.
- A Klaro configuration that defines the services used by the bootstrap.
- If you use YouTube blocking, prefer an inert YouTube iframe with no `src`; keep the embed URL in `data-cmp-src` so the browser cannot start the YouTube embed before consent.

The current standalone setup expects these Klaro services in `klaro-config.js`:

- `klaro`
- `google-tag-manager`
- `google-tag`
- `microsoft-clarity`
- `hotjar`
- `meta-pixel`
- `linkedin-insight-tag`
- `pinterest-tag`
- `tiktok-pixel`
- `youtube`

## Installation

Copy these files to your site:

- `cmp-bootstrap.js`
- `cmp.css`
- `klaro-config.js`
- `klaro.css`
- `klaro.js`

Include them in your page in this order.

At the top of the page, inside `<head>`:

```html
<link rel="stylesheet" href="/cmp/klaro.css">
<link rel="stylesheet" href="/cmp/cmp.css">
<script
    src="/cmp/cmp-bootstrap.js"
    data-gtm-id="GTM-XXXXXXX"
    data-gtag-ids="G-AAAAAAAAAA,AW-BBBBBBBBBB,DC-CCCCCCCCC"
    data-clarity-project-id="abcdefghij"
    data-hotjar-id="1234567"
    data-hotjar-version="6"
    data-meta-pixel-id="123456789012345"
    data-linkedin-partner-id="1234567"
    data-pinterest-tag-id="1234567890123"
    data-tiktok-pixel-id="ABC123DEF456GHI789JKL"
    data-youtube-service="advertising"
    data-settings-button="floating"
></script>
```

At the bottom of the page, before `</body>`:

```html
<script src="/cmp/klaro-config.js"></script>
<script src="/cmp/klaro.js" defer></script>
```

`cmp-bootstrap.js` must be loaded before `klaro.js`, because the bootstrap reads its `data-*` attributes from the current script tag and then waits for Klaro to become available.

Use `data-gtm-id` when you manage tags through Google Tag Manager, or `data-gtag-id` / `data-gtag-ids` when you want to load standalone `gtag.js` without GTM.

## Configuration

The bootstrap is configured through `data-*` attributes on the `cmp-bootstrap.js` script tag.

- `data-gtm-id`
  - Google Tag Manager container ID.
- `data-gtag-id`
  - Standalone Google tag ID for `gtag.js` (for example `G-XXXXXXXXXX`).
- `data-gtag-ids`
  - Comma-separated standalone Google tag IDs for `gtag.js` (for example `G-AAAAAAAAAA,AW-BBBBBBBBBB,DC-CCCCCCCCC`).
  - Use this when one consent-controlled Google tag setup should configure multiple destinations.
  - If both `data-gtag-id` and `data-gtag-ids` are present, the bootstrap combines them and de-duplicates repeated IDs.
- `data-clarity-project-id`
  - Microsoft Clarity project ID.
- `data-layer-name`
  - Optional custom dataLayer name for GTM or `gtag.js`. Default: `dataLayer`.
- `data-hotjar-id`
  - Hotjar site ID.
- `data-hotjar-version`
  - Optional Hotjar script version. Default: `6`.
- `data-meta-pixel-id`
  - Meta Pixel ID.
- `data-linkedin-partner-id`
  - LinkedIn Insight Tag partner ID.
- `data-pinterest-tag-id`
  - Pinterest Tag ID.
- `data-tiktok-pixel-id`
  - TikTok Pixel ID.
- `data-youtube-service`
  - Klaro service name or Klaro purpose/category name that controls YouTube embeds.
  - Example: `youtube` or `advertising`.
- `data-settings-button`
  - Optional floating settings trigger.
  - Current value: `floating`.

Behavior by integration:

- Google Tag Manager
  - Loads only after consent.
  - On revoke, stays loaded but receives denied Consent Mode updates.
- Google tag
  - Loads `gtag.js` only after consent.
  - Supports either `data-gtag-id` for one destination or `data-gtag-ids` for multiple destinations.
  - On revoke, stays loaded but receives denied Consent Mode updates.
- Microsoft Clarity
  - Loads only after consent.
  - On revoke, stays loaded, switches to denied `consentv2` state, and clears Clarity cookies for the current site.
- Hotjar
  - Loads only after consent.
  - On revoke, client-side Hotjar storage cleanup runs where possible.
- Meta Pixel
  - Loads only after consent.
  - Uses `fbq('set', 'autoConfig', false, pixelId)` before `fbq('init', pixelId)`.
  - Uses `fbq('consent', 'grant')` and `fbq('consent', 'revoke')`.
- LinkedIn Insight Tag
  - Loads only after consent.
  - On revoke, `li_adsid` is removed from local and session storage when present.
  - LinkedIn does not provide a reliable runtime revoke API, so the safest revoke flow is to clear local state and reload the page.
- Pinterest Tag
  - Loads only after consent.
  - Uses `pintrk('load', tagId)`, `pintrk('page')`, and `pintrk('setconsent', true|false)`.
- TikTok Pixel
  - Loads only after consent.
  - Uses the standard `ttq` base code shape and fires `ttq.page()` after consent.
  - On revoke, Klaro clears TikTok cookies and the bootstrap clears TikTok session storage keys.
- YouTube
  - Existing YouTube iframes are replaced with placeholders before consent.
  - Preferred markup is an `iframe` without `src`, using `data-cmp-src` or `data-src` for the embed URL.
  - After consent, embeds are recreated on `youtube-nocookie.com`.
  - On revoke, embeds are removed and placeholders are restored.

Your `klaro-config.js` should also define cookie cleanup lists for the services you enable, so consent revoke removes their first-party cookies.
For Microsoft Clarity, include `_clck` and `_clsk`.

## Usage

Once the files are included:

1. The Klaro notice is shown on first load.
2. Optional services stay blocked until the user grants consent.
3. The bootstrap loads only the vendors whose matching `data-*` attributes are present.
4. If `data-settings-button="floating"` is enabled, a floating settings button appears after the user has made an initial consent choice.

Typical page flow:

- Top of page:
  - include `klaro.css`
  - include `cmp.css`
  - include `cmp-bootstrap.js` with the tag IDs you want to enable
- Bottom of page:
  - include `klaro-config.js`
  - include `klaro.js` with `defer`

For arbitrary third-party scripts, use Klaro's built-in blocked-script markup instead of adding a new `data-*` attribute to `cmp-bootstrap.js`.
Keep the script in your HTML, but convert it to the consent-gated form:

```html
<script
    type="text/plain"
    data-type="text/javascript"
    data-name="custom-vendor"
    data-src="https://example.com/vendor.js"
></script>
```

`data-name` must match a Klaro service in `klaro-config.js`. Short example:

```js
{
    name: 'custom-vendor',
    title: 'Custom Vendor',
    purposes: ['advertising'],
    default: false,
    required: false,
    onlyOnce: true,
    cookies: []
}
```

To add YouTube consent blocking, place an inert YouTube iframe in the HTML and move the embed URL into `data-cmp-src`. Omitting `src` on an `iframe` is valid HTML5, and it avoids the browser starting a third-party request before the CMP can intervene.

```html
<iframe
    width="560"
    height="315"
    data-cmp-src="https://www.youtube-nocookie.com/embed/LgKwD3MYNH8?rel=0"
    title="Sample YouTube embed"
    loading="lazy"
    referrerpolicy="strict-origin-when-cross-origin"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
></iframe>
```

The bootstrap also accepts `data-src` for compatibility, and still supports legacy live `src` embeds, but that older pattern is not privacy-safe because the browser may fetch YouTube before the placeholder swap happens.
