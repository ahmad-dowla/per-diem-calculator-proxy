/**
 * Use Cloudflare Workers as a serverless proxy.
 *
 * @see https://www.conroyp.com/articles/serverless-api-caching-cloudflare-workers-json-cors-proxy
 */

export default {
    // The fetch handler is invoked when this worker receives a HTTP(S) request
    // and should return a Response (optionally wrapped in a Promise)
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const targetUrl = url.searchParams.get('url');

        if (request.headers.get('x-perdiem-key') !== env.PROXY_KEY) {
            return new Response('Missing API key', { status: 400 });
        }

        if (!targetUrl) {
            return new Response('Missing "url" query parameter', {
                status: 400,
            });
        }

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*', // Allow access from all domains
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // If it's an OPTIONS request, respond with 204 immediately
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }

        const cacheUrl = url;
        const now = new Date();

        // Construct the cache key from the cache URL and current month/year, ensuring cache fetches new data at start of each month
        const cacheKey = new Request(
            `${cacheUrl.toString()}-${now.getUTCFullYear()}-${(
                now.getUTCMonth() + 1
            )
                .toString()
                .padStart(2, '0')}`,
            request,
        );
        const cache = caches.default;

        // Check whether the value is already available in the cache
        // If not, fetch it from origin, and store it in the cache
        let response = await cache.match(cacheKey);

        if (!response) {
            console.log(
                `Response for request url: ${request.url} not present in cache. Fetching and caching request.`,
            );

            let remoteResponse = await fetchRemoteUrl(cacheUrl, env.GSA_KEY);

            response = new Response(remoteResponse.body, {
                status: remoteResponse.status,
                headers: {
                    ...remoteResponse.headers,
                    ...corsHeaders,
                    'Cache-Control':
                        'public, max-age=2592000, s-maxage=2592000',
                    // Add timestamp to the response headers
                    'X-Response-Time': new Date().toISOString(),
                },
            });

            // Into the cache we go!
            ctx.waitUntil(cache.put(cacheKey, response.clone()));
        }

        return response;
    },
};

async function fetchRemoteUrl(url, GSA_KEY) {
    // If request is to GSA API, include the GSA API key
    return url.includes('api.gsa.gov')
        ? await fetch(url, {
              headers: {
                  'x-api-key': GSA_KEY,
              },
          })
        : await fetch(url);
}
