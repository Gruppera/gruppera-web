# Turn off caching on gruppera.net so every push to main shows up

Branch: `lab4/db-cache-off`

## What is actually happening today

Measured against the live site, not assumed:

```
$ curl -sSI https://gruppera.net/
HTTP/1.1 200 OK
Content-Type: text/html
CF-Cache-Status: HIT
Cache-Control: public, max-age=0, must-revalidate
```

Three things worth knowing before changing anything:

1. **The deploy pipeline works.** `/vilka-ar-vi/mattias` answered 200 about four
   minutes after #6 merged. Pushes to `main` do reach gruppera.net.
2. **HTML already carries `max-age=0, must-revalidate`** — that is the Workers
   static-assets default, and it means a browser must revalidate before reusing a
   page. So the CDN is not the obvious culprit it looks like.
3. **`CF-Cache-Status: HIT` appears even on a URL nobody has ever requested**
   (`/?cb=zzz123`). That is Workers Assets' internal, content-addressed cache, not
   the ordinary URL-keyed CDN cache. It is keyed to the deployed Worker version, so
   it turns over on its own at every deploy.

There is still one real gap: the HTML response carries **no `ETag`**, so
"revalidate" cannot resolve to a cheap 304 — and any intermediary or browser that
treats `max-age=0` loosely can still show a stale page. Closing that gap is what
this change does.

## The change — `public/_headers`

Workers static assets parse a `_headers` file from the assets root and apply it to
asset responses; it can override `Cache-Control`. Next's static export copies
`public/` verbatim into `out/`, so `public/_headers` lands at `out/_headers`, which
is the assets root named in `wrangler.jsonc`.

```
# HTML is never reused. Every navigation asks Cloudflare, so a push to main is
# visible on the next reload.
/*
  Cache-Control: no-store, must-revalidate
```

That is the whole "turn the cache off" ask, in one version-controlled file.

## The decision worth making explicitly

`/*` also matches `/_next/static/*` — the hashed JS and CSS bundles. Turning those
off costs real speed on every page view and buys nothing, because their filenames
already change whenever their contents change. So there are two shapes:

**A. Off for HTML, cached hard for hashed bundles** (recommended)

```
/*
  Cache-Control: no-store, must-revalidate

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
```

Pages update on the next reload; bundles stay fast. Correct because the filenames
are content hashes.

**B. Off for absolutely everything**

Just the `/*` rule. Simplest to reason about, and every visitor re-downloads every
bundle on every page view. Literally what "turn off the cache" says.

Plan assumes **A** unless told otherwise.

### The trap in option A

Cloudflare's docs are explicit that matching rules *accumulate*: "An incoming
request which matches multiple rules' URL patterns will inherit all rules'
headers," and "if a header is applied twice in the `_headers` file, the values are
joined with a comma separator." There is no specificity precedence. So the naive
two-rule version yields, on a bundle:

```
Cache-Control: no-store, must-revalidate, public, max-age=31536000, immutable
```

which is nonsense and leaves the bundles effectively uncached. The specific rule
must therefore drop the inherited value with `! Cache-Control` before setting its
own. Verified locally rather than assumed — see the PR body.

## Two things only the Cloudflare dashboard can answer

Neither is fixable from this repo, so they go in the PR body as notes:

- **Workers Builds production branch.** If it is not `main`, pushes to other
  branches never reach gruppera.net and no header change will make them.
- **Cache Rules / Page Rules on the `gruppera.net` zone.** A "Cache Everything"
  rule with an Edge TTL override would hold stale HTML across deploys and would
  beat the `_headers` file. Worth confirming there is none.

## Not in scope

- `.github/workflows/deploy-production.yml` — off limits per `.claude/CLAUDE.md`,
  and irrelevant: it is `workflow_dispatch`-only and deploys gruppera.**se** over
  SSH, not the Cloudflare Worker behind gruppera.**net**.
- `next.config.ts`, `wrangler.jsonc` — no change needed; `_headers` is the
  documented lever.
- No new dependencies.

## Verification

```bash
npm run lint
npm run build
cat out/_headers          # proves the export actually carries the file
```

Then after the PR merges and Workers Builds finishes:

```bash
curl -sSI https://gruppera.net/ | grep -i cache-control        # expect no-store
curl -sSI https://gruppera.net/_next/static/... | grep -i cache-control
```

`npm test` does not exist in this repo — there is no test runner to report on.
