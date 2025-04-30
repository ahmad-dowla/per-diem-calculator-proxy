// Slightly modified--removed HTML landing page, proxy endpoint, required API key for incoming requests, added API key for outgoing requests to GSA-- from https://developers.cloudflare.com/workers/examples/cors-header-proxy/

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
      "Access-Control-Max-Age": "86400",
    };

    async function handleRequest(request) {
      const url = new URL(request.url);
      let targetUrl = url.searchParams.get("url");

      if (targetUrl === null) {
        throw new Error('URL missing.');
      }

      if (request.headers.get('x-perdiem-key') !== env.PROXY_KEY) {
        throw new Error('Invalid API key.');
      }

      // Rewrite request to point to API URL. This also makes the request mutable so you can add the correct Origin header to make the API server think that this request is not cross-site.
      const newRequest = new Request(targetUrl, request);
      newRequest.headers.set("Origin", new URL(targetUrl).origin);
      newRequest.headers.set('x-perdiem-key',null);
      targetUrl.includes('https://api.gsa.gov') && newRequest.headers.set('x-api-key',env.GSA_KEY)
      let response = await fetch(newRequest);
      // Recreate the response so you can modify the headers

      response = new Response(response.body, response);
      // Set CORS headers

      response.headers.set("Access-Control-Allow-Origin", '*');

      // Append to/Add Vary header so browser will cache response correctly
      response.headers.append("Vary", "Origin");

      return response;
    }

    async function handleOptions(request) {
      if (
        request.headers.get("Origin") !== null &&
        request.headers.get("Access-Control-Request-Method") !== null &&
        request.headers.get("Access-Control-Request-Headers") !== null
      ) {
        // Handle CORS preflight requests.
        return new Response(null, {
          headers: {
            ...corsHeaders,
            "Access-Control-Allow-Headers": request.headers.get(
              "Access-Control-Request-Headers",
            ),
          },
        });
      } else {
        // Handle standard OPTIONS request.
        return new Response(null, {
          headers: {
            ...corsHeaders,
            Allow: "GET, HEAD, POST, OPTIONS",
          },
        });
      }
    }

      if (request.method === "OPTIONS") {
        // Handle CORS preflight requests
        return handleOptions(request);
      } else if (
        request.method === "GET" ||
        request.method === "HEAD" ||
        request.method === "POST"
      ) {
        // Handle requests to the API server
        return handleRequest(request);
      } else {
        return new Response(null, {
          status: 405,
          statusText: "Method Not Allowed",
        });
      }

  },
};