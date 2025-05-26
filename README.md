# Per Diem Calculator Proxy

CORS and API proxy deployed to Cloudflare Workers as a companion to [Per Diem Calculator](https://github.com/ahmad-dowla/per-diem-calculator).

## Purpose

This worker will proxy access to your GSA API key and avoid exposing the key in your calculator frontend.

It will also avoid CORS issues during local development when the calculator makes fetch requests to the GSA and DOD websites.

Lastly, it will cache fetch responses for six hours on Cloudflare's edge network and avoid potential rate-liming issues.

Cloudflare's free tier allows for 100k requests/day and 1k requests/min.

## Getting Started

### Prerequisites

-   Cloudflare account
-   GSA per diem API key obtainable at [https://open.gsa.gov/api/perdiem/](https://open.gsa.gov/api/perdiem/)
-   Your own generated API key to authorize access between the calculator and the proxy

### Deploy to Cloudflare

-   Fork this repository
-   In Cloudflare, go to "Compute (Workers)" -> "Workers & Pages"
-   Select "Create", and under the "Workers" tab, select the "Import a repository" option
-   Choose your forked respository and select "Save and Deploy"

### Update Cloudflare Settings

Once deployed, go to the "Settings" tab.

In the "Variables and Secrets" section, select "+ Add", and select "Deploy" with the following:

-   Type: Secret
-   Variable name: GSA_KEY
-   Value: Paste in your GSA API key

Repeat the previous step and select "Deploy" with the following:

-   Type: Secret
-   Variable name: PROXY_KEY
-   Value: Paste in your generated API key

Lastly, in the "Observability" section, enable "Workers Logs".

## Usage

### In Development

-   The proxy is ready to use with your calculator through your PROXY_KEY, and the proxy worker URL available under "Settings" -> "Domains & Routes"
-   Note that under the default settings, worker.js has 'Access-Control-Allow-Origin' set to '\*'

### In Production

-   Update worker.js to restrict access to your production calculator:

```
const corsHeaders = {
    /// Unrestricted
    /// In production, restrict access to calculator's domain. E.g.:
    /// 'Access-Control-Allow-Origin': 'https://perdiemcalc.org'
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
};
```

## Attribution

This was adapted from:

-   https://developers.cloudflare.com/workers/examples/cors-header-proxy/
-   https://www.conroyp.com/articles/serverless-api-caching-cloudflare-workers-json-cors-proxy
