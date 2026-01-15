# 🚜 WinterWatch

### Real-Time Telemetry Workflow & Dashboad Demonstration

**WinterWatch** is a technical proof of concept demonstrating an end to end real time data pipeline for fleet management. 
This prototype showcases how vehicle telemetry, specifically GPS data from snowplows can be ingested, processed, and visualized in a live operational environment.

## Demonstration Goals

This project serves as a **Workflow Demonstration** to highlight:

* **High-Frequency Ingestion:** Handling incoming telemetry strings via HTTP POST.
* **Real-Time Distribution:** Using WebSockets to broadcast data to multiple clients with zero latency.
* **Geospatial Processing:** On the fly calculation of **Odometer** (total distance) and **Velocity** (live speed).
* **Operational Intelligence:** Automated "Heartbeat" monitoring that flags connectivity loss and switches vehicle status based on movement.

## Technical Architecture

1. **The Hub (`server.ts`):** A Deno-powered backend that acts as the central message broker. It receives data from the fleet and pushes it to all active dashboards.
2. **The Workflow Simulator (`simulator.ts`):** A TypeScript engine that mimics hardware GPS units. It utilizes the **OSRM Routing API** to drive realistic, road-accurate paths through **South Frontenac**.
3. **The Live Dashboard (`index.html`):** A responsive Leaflet.js interface that renders "breadcrumb" pathing, custom vehicle iconography, and live performance metrics.


## Running the Demo

### 1. Initialize the Hub

Start the Deno server to begin listening for telemetry:

```bash
deno run --allow-net --allow-read server.ts

```

### 2. Access the Dashboard

Open `http://localhost:8000/` in any modern web browser. The map will initialize, centered on the South Frontenac region.

### 3. Deploy the Simulation

Launch the virtual plow to begin the data flow:

```bash
deno run --allow-net simulator.ts

```

## Key Features Displayed

* **Live Breadcrumbs:** Visualizes the exact route taken by the vehicle.
* **Dynamic Status:** Icons change color and popups update based on whether the unit is "Active" or "Idle."
* **Auto-Follow Map:** The interface automatically pans to keep the active unit in view.
* **Signal Monitoring:** Units visually "fade out" on the map if data transmission is interrupted.
