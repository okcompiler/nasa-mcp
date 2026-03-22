# Simple NASA Space Explorer MCP Server

An MCP server that gives Claude (or any MCP client) access to NASA's open APIs.
Available in both **TypeScript** and **Ruby**.

## Tools

| Tool | Description |
|------|-------------|
| `get_astronomy_picture` | NASA's Astronomy Picture of the Day (APOD) — title, explanation, image URL |
| `get_asteroids` | Near-Earth asteroids in a date range — size, hazard status, miss distance |

## API Key

Both versions work immediately with NASA's free `DEMO_KEY` (30 req/hr).
For higher limits, get a free key at <https://api.nasa.gov/> and set:

```bash
export NASA_API_KEY="your-key-here"
```

---

## TypeScript Setup

```bash
cd nasa-mcp-ts
npm install
npm run build
```

Test with the MCP Inspector:

```bash
npm run inspector
```

Run directly:

```bash
node build/index.js
```

### Claude Desktop config (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "nasa": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/nasa-mcp-ts/build/index.js"],
      "env": {
        "NASA_API_KEY": "your-key-here"
      }
    }
  }
}
```

---

## Ruby Setup

```bash
cd nasa-mcp-ruby
bundle install
```

Test with the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector ruby server.rb
```

Run directly:

```bash
bundle exec ruby server.rb
```

### Claude Desktop config (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "nasa": {
      "command": "bundle",
      "args": ["exec", "ruby", "/ABSOLUTE/PATH/TO/nasa-mcp-ruby/server.rb"],
      "env": {
        "NASA_API_KEY": "your-key-here"
      }
    }
  }
}
```

---

## Example Prompts

Once connected, try asking Claude:

- "Show me today's astronomy picture of the day"
- "Are there any potentially hazardous asteroids approaching Earth this week?"
- "What was the astronomy picture on my birthday this year (YEAR-MONTH-DAY)?"
- "Find asteroids between 2024-12-25 and 2024-12-31"

## How It Works

```txt
You ask Claude about space
        ↓
Claude decides which NASA tool to call
        ↓
MCP client sends JSON-RPC request to your server
        ↓
Your server calls the NASA API
        ↓
Results flow back to Claude
        ↓
Claude explains the data in natural language
```
