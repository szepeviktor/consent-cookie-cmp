# consent-cookie-cmp

A lightweight Klaro-based JavaScript consent manager with modular, consent-gated loading for analytics, marketing tags, and embedded media.

## Requirements

- Static hosting for these files:
  - `cmp-bootstrap.js`
  - `cmp.css`
  - `klaro-config.js`
  - `klaro.css`
  - `klaro.js`
- A browser with ES5-compatible JavaScript support.
- A Klaro configuration that defines the services used by the bootstrap.
- If you use YouTube blocking, the page must contain normal YouTube embed iframes; the bootstrap will replace them with consent-gated placeholders.

The current standalone setup expects these Klaro services in `klaro-config.js`:

- `klaro`
- `google-tag-manager`
- `hotjar`
- `meta-pixel`
- `linkedin-insight-tag`
- `pinterest-tag`
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
    data-hotjar-id="1234567"
    data-hotjar-version="6"
    data-meta-pixel-id="123456789012345"
    data-linkedin-partner-id="1234567"
    data-pinterest-tag-id="1234567890123"
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

## Configuration

The bootstrap is configured through `data-*` attributes on the `cmp-bootstrap.js` script tag.

- `data-gtm-id`
  - Google Tag Manager container ID.
- `data-layer-name`
  - Optional custom dataLayer name for GTM. Default: `dataLayer`.
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
- Pinterest Tag
  - Loads only after consent.
  - Uses `pintrk('load', tagId)`, `pintrk('page')`, and `pintrk('setconsent', true|false)`.
- YouTube
  - Existing YouTube iframes are replaced with placeholders before consent.
  - After consent, embeds are recreated on `youtube-nocookie.com`.
  - On revoke, embeds are removed and placeholders are restored.

Your `klaro-config.js` should also define cookie cleanup lists for the services you enable, so consent revoke removes their first-party cookies.

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

To add YouTube consent blocking, place a normal YouTube embed iframe in the HTML. The bootstrap handles the placeholder and consent-gated restore automatically.
