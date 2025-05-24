# per-diem-calculator-proxy

CORS and API proxy deployed to Cloudflare Workers for https://github.com/ahmad-dowla/per-diem-calculator. Cloudflare's free tier allows for 100k requests/day and 1k requests/min.

Adapted from https://developers.cloudflare.com/workers/examples/cors-header-proxy/ and https://www.conroyp.com/articles/serverless-api-caching-cloudflare-workers-json-cors-proxy.

git clone https://github.com/ahmad-dowla/per-diem-calculator-proxy.git

cd per-diem-calculator-proxy

In development

worker.js
'Access-Control-Allow-Origin': 'https://perdiemcalc.org', to
'Access-Control-Allow-Origin': '\*',

wrangler.toml
Delete routes = [
{ pattern = "*proxy.perdiemcalc.org/*", zone_name = "perdiemcalc.org" },
]

Update name if you want to give worker a different name

Got to Cloudflare's "Workers & Pages" which is under "Compute (Workers)"
