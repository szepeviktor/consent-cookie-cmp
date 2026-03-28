# AGENTS.md

## Shell and tooling

- Always use `python3` instead of `python` for shell commands.
- For local browser testing, serve this directory with `python3 -m http.server 8000`.
- When testing consent behavior, prefer a fresh isolated browser context so cookies and storage start empty.

## Project layout

- The working demo files live in the repo root:
  - `index.html`
  - `cmp-bootstrap.js`
  - `klaro-config.js`
  - `cmp.css`
  - `klaro.css`
  - `klaro.js`
- `index.html` should use local relative paths like `./cmp-bootstrap.js`, not `/cmp/...`.

## Bootstrap rules

- `cmp-bootstrap.js` is plain browser JavaScript and should stay ES5-compatible.
- Keep the bootstrap modular with small internal pieces, but do not introduce a build step or framework.
- Tag integrations should follow the shared consent lifecycle:
  - implement explicit `grant()` and `revoke()` behavior
  - let the registry drive consent transitions
- Current supported bootstrap attributes:
  - `data-gtm-id`
  - `data-layer-name` (optional)
  - `data-meta-pixel-id`

## Tag behavior

- Google Tag Manager:
  - load only after consent
  - on revoke, keep the script loaded but send denied Consent Mode updates
- Meta Pixel:
  - load only after consent
  - call `fbq('set', 'autoConfig', false, pixelId)` before `fbq('init', pixelId)`
  - use `fbq('consent', 'grant')` and `fbq('consent', 'revoke')`
  - do not add a Pixel `noscript` fallback unless it is separately consent-gated

## Klaro config rules

- Keep separate Klaro services for:
  - `klaro` as a required `functional` service
  - `google-tag-manager` as `analytics`
  - `meta-pixel` as `advertising`
- Keep explicit cookie deletion lists so revoke clears browser cookies:
  - `klaro`: `klaro`
  - `google-tag-manager`: `_ga`, `^_ga_.*`, `_gid`, `^_gat.*`
  - `meta-pixel`: `_fbp`, `_fbc`

## Browser test checklist

- Start from an empty cookie/storage state.
- Inspect the modal service rows against the active `data-*` attributes.
- Verify initial state:
  - no GTM globals
  - no Meta globals
  - no cookies
- Verify consent grant:
  - GTM and Meta globals appear
  - vendor scripts load
  - expected cookies appear
- Verify revoke:
  - vendor cookies are removed
  - only the `klaro` cookie remains
  - GTM may still emit denied-mode requests after revoke; that is expected with the current Consent Mode approach
  - Meta should not emit the previous auto-tracked `SubscribedButtonClick` event now that `autoConfig` is disabled
