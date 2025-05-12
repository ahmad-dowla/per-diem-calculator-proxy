/**
 * Use Cloudflare Workers as a serverless proxy.
 *
 * @see https://www.conroyp.com/articles/serverless-api-caching-cloudflare-workers-json-cors-proxy
 */

export default {
    // The fetch handler is invoked when this worker receives a HTTP(S) request
    // and should return a Response (optionally wrapped in a Promise)
    async fetch(request, env, ctx) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*', // Allow access from all domains
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
        };

        // If it's an OPTIONS request, respond with 204 immediately
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }
        const cacheUrl = new URL(request.url);
        const targetUrl = cacheUrl.searchParams.get('url');

        if (targetUrl === null) throw new Error('URL missing');
        if (request.headers.get('x-perdiem-key') !== env.PROXY_KEY)
            throw new Error('Invalid API key.');
        if (targetUrl.includes('https://api.gsa.gov'))
            corsHeaders['x-api-key'] = env.GSA_KEY;

        // Construct the cache key from the cache URL and today's month/year
        const cacheKey = cacheUrl.toString();
        const cache = caches.default;

        // Check whether the value is already available in the cache
        // If not, fetch it from origin, and store it in the cache
        let response = await cache.match(cacheKey);

        if (!response) {
            console.log(
                `Response for request url: ${request.url} not present in cache. Fetching and caching request.`,
            );

            let remoteResponse = await fetch(cacheUrl, corsHeaders);

            response = new Response(remoteResponse.body, {
                status: remoteResponse.status,
                headers: {
                    ...remoteResponse.headers,
                    ...corsHeaders,
                    'Cache-Control': 'public, max-age=21600, s-maxage=21600', // Cache for 6 hours
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
