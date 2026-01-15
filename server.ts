// Use a Set to keep track of all connected browser clients
const clients = new Set<WebSocket>();

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // 1. WebSocket Endpoint: Browsers connect here to listen for updates
  if (url.pathname === "/ws") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    socket.onopen = () => clients.add(socket);
    socket.onclose = () => clients.delete(socket);
    socket.onerror = (e) => console.error("WebSocket error:", e);
    
    return response;
  }

  // 2. Data Ingestion: The simulator POSTs data here
  if (req.method === "POST" && url.pathname === "/ingest") {
    const data = await req.json();
    console.log("Plow Update Received:", data);

    // Broadcast the data to every connected browser
    const message = JSON.stringify(data);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
    return new Response("OK", { status: 200 });
  }

  // 3. Static File Server: Serves your index.html
  if (url.pathname === "/" || url.pathname === "/index.html") {
    const file = await Deno.readTextFile("./index.html");
    return new Response(file, {
      headers: { "content-type": "text/html" },
    });
  }

  return new Response("Not Found", { status: 404 });
});