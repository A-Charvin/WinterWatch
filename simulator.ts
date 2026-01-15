const PLOW_ID = "plow-01";
const PLOW_NAME = "Optimus Plow";

// From Sydenham (Point A) to near the Kingston 401 exit (Point B)
const START = "-76.5989,44.4082"; 
const END = "-76.4665,44.3093"; 

interface OSRMResponse {
  routes: Array<{ geometry: { coordinates: [number, number][]; }; }>;
}

async function getRoute(): Promise<number[][]> {
  const url = `http://router.project-osrm.org/route/v1/driving/${START};${END}?overview=full&geometries=geojson`;
  try {
    const resp = await fetch(url);
    const data = (await resp.json()) as OSRMResponse;
    return data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
  } catch {
    // Longer fallback
    return [[44.4082, -76.5989], [44.3500, -76.5500], [44.3093, -76.4665]];
  }
}

const roadPoints = await getRoute();
let step = 0;

console.log(`🚜 Long-haul route active: ${roadPoints.length} points.`);

setInterval(async () => {
  const [lat, lng] = roadPoints[step];
  const nextIdx = (step + 1) % roadPoints.length;
  
  try {
    const response = await fetch("http://localhost:8000/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        id: PLOW_ID, 
        name: PLOW_NAME, 
        lat, lng, 
        speed: 45, // Set a steady speed for this long run
        status: "Active",
        timestamp: Date.now(),
        reset: step === 0 
      }),
    });
    if (response.body) await response.body.cancel();
    step = nextIdx;
  } catch (err: unknown) {
    if (err instanceof Error) console.error("Link error:", err.message);
  }
}, 500);