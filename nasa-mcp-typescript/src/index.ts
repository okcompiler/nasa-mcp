#!/usr/bin/env node

/**
 * NASA Space Explorer — MCP Server (TypeScript)
 *
 * Tools:
 *   1. get_astronomy_picture – Astronomy Picture of the Day
 *   2. get_asteroids         – Near-Earth asteroids in a date range
 *
 * Uses NASA's free DEMO_KEY by default.
 * Set the NASA_API_KEY env var for higher rate limits.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------- config ----------

const API_KEY = process.env.NASA_API_KEY ?? "DEMO_KEY";
const BASE = "https://api.nasa.gov";

// ---------- helpers ----------

async function nasaFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(path, BASE);
  url.searchParams.set("api_key", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "nasa-mcp-server/1.0" },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`NASA API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------- types (partial, just what we use) ----------

interface ApodResponse {
  title: string;
  date: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: string;
  copyright?: string;
}

interface Asteroid {
  name: string;
  id: string;
  estimated_diameter: {
    meters: { estimated_diameter_min: number; estimated_diameter_max: number };
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: Array<{
    close_approach_date: string;
    miss_distance: { kilometers: string };
    relative_velocity: { kilometers_per_hour: string };
  }>;
}

interface NeoFeedResponse {
  element_count: number;
  near_earth_objects: Record<string, Asteroid[]>;
}

// ---------- server ----------

const server = new McpServer({
  name: "nasa-space-explorer",
  version: "1.0.0",
});

// Tool 1 — Astronomy Picture of the Day
server.registerTool(
  "get_astronomy_picture",
  {
    title: "Astronomy Picture of the Day",
    description:
      "Get NASA's Astronomy Picture of the Day. Returns the title, explanation, and image URL. Optionally pass a date (YYYY-MM-DD) to see a past picture.",
    inputSchema: {
      date: z
        .string()
        .optional()
        .describe("Date in YYYY-MM-DD format (defaults to today)"),
    },
  },
  async ({ date }) => {
    const params: Record<string, string> = {};
    if (date) params.date = date;

    const data = await nasaFetch<ApodResponse>("/planetary/apod", params);

    const lines = [
      `🌌 ${data.title}`,
      `Date: ${data.date}`,
      `Media type: ${data.media_type}`,
      data.copyright ? `Copyright: ${data.copyright}` : null,
      "",
      data.explanation,
      "",
      `Image URL: ${data.url}`,
      data.hdurl ? `HD Image URL: ${data.hdurl}` : null,
    ];

    return {
      content: [{ type: "text", text: lines.filter(Boolean).join("\n") }],
    };
  }
);

// Tool 2 — Near-Earth Asteroids
server.registerTool(
  "get_asteroids",
  {
    title: "Near-Earth asteroids",
    description:
      "Search for near-Earth asteroids (NEOs) within a date range (max 7 days). Returns name, size, hazard status, miss distance, and velocity for each asteroid.",
    inputSchema: {
      start_date: z
        .string()
        .optional()
        .describe("Start date YYYY-MM-DD (defaults to today)"),
      end_date: z
        .string()
        .optional()
        .describe("End date YYYY-MM-DD (defaults to start_date + 1 day)"),
    },
  },
  async ({ start_date, end_date }) => {
    const start = start_date ?? today();
    const params: Record<string, string> = { start_date: start };
    if (end_date) params.end_date = end_date;

    const data = await nasaFetch<NeoFeedResponse>("/neo/rest/v1/feed", params);

    const lines: string[] = [
      `Found ${data.element_count} near-Earth asteroid(s):\n`,
    ];

    for (const [_date, asteroids] of Object.entries(data.near_earth_objects)) {
      for (const a of asteroids) {
        const diam = a.estimated_diameter.meters;
        const approach = a.close_approach_data[0];
        const hazard = a.is_potentially_hazardous_asteroid ? "⚠️ YES" : "No";

        lines.push(
          `• ${a.name}`,
          `  Diameter: ${diam.estimated_diameter_min.toFixed(0)}–${diam.estimated_diameter_max.toFixed(0)} m`,
          `  Potentially hazardous: ${hazard}`,
          approach
            ? `  Closest approach: ${approach.close_approach_date}` +
            ` | Miss distance: ${Number(approach.miss_distance.kilometers).toLocaleString()} km` +
            ` | Velocity: ${Number(approach.relative_velocity.kilometers_per_hour).toLocaleString()} km/h`
            : "",
          ""
        );
      }
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
);

// ---------- start ----------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("NASA Space Explorer MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
