addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url') // Get the target URL from the `url` query parameter

  if (!targetUrl) {
    return new Response('Missing "url" query parameter', { status: 400 })
  }

  if (request.headers.get("x-perdiem-key") !== env.PROXY_KEY) {
    return new Response('Invalid API key', { status: 400 })
  }

  // Clone headers
  const headers = new Headers(request.headers)

  // Create a request for the target URL
  const targetRequest = new Request(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
  })

  // If request is to GSA, include the GSA API key
  targetUrl.includes("https://api.gsa.gov") && targetRequest.headers.set("x-api-key", env.GSA_KEY);
  

  try {
    const response = await fetch(targetRequest)

    // Add CORS headers to allow all origins
    const newHeaders = new Headers(response.headers)
    newHeaders.set('Access-Control-Allow-Origin', '*')
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    })
  } catch (error) {
    return new Response('Error fetching the target URL', { status: 500 })
  }
}