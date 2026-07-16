# AGENTS.md

## Shell and tooling

- Always use `python3` instead of `python` for shell commands.
- For local browser testing, serve this directory with `python3 -m http.server 8000`.
- When testing consent behavior, prefer a fresh isolated browser context so cookies and storage start empty.

## Project layout

- The working standalone files live in the repo root:
  - `index.html`
  - `cmp-bootstrap.js`
  - `klaro-config.js`
  - `cmp.css`
  - `klaro.css`
  - `klaro.js`
  - `favicon.ico`
- Example integration files live under `examples/`:
  - `examples/cmp.html`
  - `examples/cmp.php`
- `index.html` should use local relative paths like `./cmp-bootstrap.js`, not `/cmp/...`.

## Bootstrap rules

- `cmp-bootstrap.js` is plain browser JavaScript and must stay ES5-compatible.
- Keep the bootstrap modular with small internal pieces, but do not introduce a build step or framework.
- The bootstrap should read configuration from `data-*` attributes on its own `<script>` tag.
- Tag integrations should follow the shared consent lifecycle:
  - implement explicit `grant()` and `revoke()` behavior
  - let the registry drive consent transitions
- Current supported bootstrap attributes:
  - `data-bugsnag-api-key`
  - `data-gtm-id`
  - `data-layer-name`
  - `data-clarity-project-id`
  - `data-hotjar-id`
  - `data-hotjar-version`
  - `data-activecampaign-account-id`
  - `data-meta-pixel-id`
  - `data-linkedin-partner-id`
  - `data-pinterest-tag-id`
  - `data-tiktok-pixel-id`
  - `data-youtube-service`
  - `data-settings-button`

## Tag behavior

- Bugsnag:
  - loads immediately when `data-bugsnag-api-key` is present
  - remains a required functional service, not an optional consent-gated vendor
- Google Tag Manager:
  - loads only after consent
  - on revoke, keep the script loaded but send denied Consent Mode updates
- Microsoft Clarity:
  - loads only after consent
  - on revoke, switch to denied state and clear Clarity cookies
- Hotjar:
  - loads only after consent
  - on revoke, clear Hotjar storage where possible
- ActiveCampaign Site Tracking:
  - loads only after consent
  - use `vgo('setTrackByDefault', false)` before consent
  - on grant, allow tracking explicitly
  - on revoke, clear `ac_enable_tracking`
- Meta Pixel:
  - load only after consent
  - call `fbq('set', 'autoConfig', false, pixelId)` before `fbq('init', pixelId)`
  - use `fbq('consent', 'grant')` and `fbq('consent', 'revoke')`
  - do not add a Pixel `noscript` fallback unless it is separately consent-gated
- LinkedIn Insight Tag:
  - loads only after consent
  - on revoke, clear local/session state where possible
  - there is no reliable full runtime revoke API, so reload-based cleanup may still be the safest path
- Pinterest Tag:
  - loads only after consent
  - use runtime consent updates instead of custom one-off flow
- TikTok Pixel:
  - loads only after consent
  - on revoke, clear TikTok session storage keys in addition to cookie cleanup
- YouTube:
  - block embeds before consent and restore them only after consent
  - prefer an inert `iframe` with no `src`, storing the URL in `data-cmp-src`
  - `data-src` is allowed for compatibility, but `data-cmp-src` is the preferred markup

## Klaro config rules

- Keep separate Klaro services for:
  - `klaro` as a required `functional` service
  - `bugsnag` as a required `functional` service when enabled
  - `google-tag-manager` as `analytics`
  - `microsoft-clarity` as `analytics`
  - `hotjar` as `analytics`
  - `activecampaign-site-tracking` as `analytics`
  - `meta-pixel` as `advertising`
  - `linkedin-insight-tag` as `advertising`
  - `pinterest-tag` as `advertising`
  - `tiktok-pixel` as `advertising`
  - `youtube` as `advertising`
- Keep explicit cookie deletion lists so revoke clears browser cookies:
  - `klaro`: `klaro`
  - `google-tag-manager`: `_ga`, `^_ga_.*`, `_gid`, `^_gat.*`
  - `microsoft-clarity`: `_clck`, `_clsk`
  - `activecampaign-site-tracking`: `ac_enable_tracking`
  - `meta-pixel`: `_fbp`, `_fbc`
  - keep vendor-specific cleanup lists updated whenever a new integration is added
- The bootstrap filters `window.klaroConfig.services` based on active `data-*` attributes, so enabled services in the config should match the bootstrap-supported options.

## Browser test checklist

- Start from an empty cookie/storage state.
- Inspect the modal service rows against the active `data-*` attributes on the page.
- Verify initial state:
  - no optional vendor globals are active
  - no vendor network requests fire before consent
  - no vendor cookies are present
- Verify consent grant:
  - only configured vendor globals appear
  - vendor scripts load
  - expected cookies or storage entries appear
  - YouTube placeholders turn into embeds only after the matching consent is granted
- Verify revoke:
  - vendor cookies are removed
  - only required-state cookies such as `klaro` remain
  - GTM may still emit denied-mode requests after revoke; that is expected with the current Consent Mode approach
  - Meta should not emit the previous auto-tracked `SubscribedButtonClick` event now that `autoConfig` is disabled
  - YouTube embeds should be removed again and placeholders restored
