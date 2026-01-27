const PLOW_NAMES = [
  "38 Special", "Betty Whiteout", "Blade Runner", "Frontenac Flurry",
  "Frost and Fluriest", "I.C. Rhodes", "Optimus Plow", 
  "Orange Crush", "Plowabunga", "Sir Salter"
];

const LOCATIONS = [
  { start: "-76.5000,44.4500", end: "-76.4200,44.4800" }, 
  { start: "-76.6622,44.4022", end: "-76.7000,44.3700" }, 
  { start: "-76.5989,44.4082", end: "-76.5500,44.3500" }, 
  { start: "-76.4665,44.3093", end: "-76.4200,44.3600" }, 
  { start: "-76.3500,44.4000", end: "-76.3000,44.4500" }, 
  { start: "-76.7000,44.3700", end: "-76.7500,44.4000" }, 
  { start: "-76.5500,44.3500", end: "-76.5000,44.3000" }, 
  { start: "-76.4200,44.4800", end: "-76.3700,44.5200" }, 
  { start: "-76.7500,44.4000", end: "-76.8000,44.4500" }, 
  { start: "-76.3000,44.4500", end: "-76.2500,44.5000" }, 
];

async function getRoute(start: string, end: string): Promise<number[][]> {
  const url = `http://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;
  const resp = await fetch(url);
  const data = await resp.json();
  // deno-lint-ignore no-explicit-any
  return data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
}

interface PlowState {
  status: "Active" | "Paused" | "Idle";
  pauseCounter: number;
  idleCounter: number;
}

async function startPlow(name: string, id: string, locIdx: number) {
  const loc = LOCATIONS[locIdx];
  const roadPoints = await getRoute(loc.start, loc.end);
  let step = 0;

  // Initialize plow state with random initial status
  const state: PlowState = {
    status: ["Active", "Active", "Paused"][Math.floor(Math.random() * 3)] as "Active" | "Paused" | "Idle",
    pauseCounter: 0,
    idleCounter: 0,
  };

  const statusInterval = setInterval(() => {
    // Randomly transition between states
    const rand = Math.random();
    
    if (state.status === "Active") {
      // 90% chance to stay active, 8% to pause, 2% to go idle
      if (rand < 0.08) {
        state.status = "Paused";
        state.pauseCounter = Math.floor(Math.random() * 15) + 5; // 5-20 update cycles
      } else if (rand < 0.10) {
        state.status = "Idle";
        state.idleCounter = Math.floor(Math.random() * 10) + 3; // 3-12 update cycles
      }
    } else if (state.status === "Paused") {
      state.pauseCounter--;
      // After pause duration, return to active
      if (state.pauseCounter <= 0) {
        state.status = "Active";
      }
    } else if (state.status === "Idle") {
      state.idleCounter--;
      // After idle duration, return to active
      if (state.idleCounter <= 0) {
        state.status = "Active";
      }
    }
  }, 3000); // Update status every 3 seconds

  setInterval(async () => {
    // Only advance position if active
    let currentStep = step;
    let shouldReset = false;

    if (state.status === "Active") {
      currentStep = (step + 1) % roadPoints.length;
      if (currentStep === 0) shouldReset = true;
      step = currentStep;
    }

    const [lat, lng] = roadPoints[currentStep];
    
    // Speed varies by status
    let speed: number;
    if (state.status === "Active") {
      speed = Math.floor(Math.random() * 15) + 25; // 25-40 km/h when active
    } else if (state.status === "Paused") {
      speed = Math.floor(Math.random() * 3); // 0-2 km/h when paused
    } else {
      speed = 0; // Completely stopped when idle
    }

    try {
      await fetch("http://localhost:8000/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          name, 
          lat, 
          lng, 
          speed,
          status: state.status,
          timestamp: Date.now(),
          reset: shouldReset
        }),
      });
    } catch (err: unknown) {
      if (err instanceof Error) console.error("Link error:", err.message);
    }
  }, 1000);

  // Cleanup on exit
  return () => clearInterval(statusInterval);
}

// Start all plows with staggered startup
PLOW_NAMES.forEach((name, i) => {
  setTimeout(() => startPlow(name, `plow-${i}`, i), i * 500);
});
