[![smithery badge](https://smithery.ai/badge/@jetbrains/mcp-proxy)](https://smithery.ai/server/@jetbrains/mcp-proxy)
[![official JetBrains project](http://jb.gg/badges/incubator-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)
# JetBrains MCP Proxy Server

The server proxies requests from client to JetBrains IDE.

## Installation

### Installing via Smithery

To install JetBrains MCP Proxy Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@jetbrains/mcp-proxy):

```bash
npx -y @smithery/cli install @jetbrains/mcp-proxy --client claude
```

### Install MCP Server plugin

https://plugins.jetbrains.com/plugin/26071-mcp-server

## Usage with Claude Desktop

To use this with Claude Desktop, add the following to your `claude_desktop_config.json`.
The full path on MacOS: `~/Library/Application\ Support/Claude/claude_desktop_config.json`, on Windows: `%APPDATA%/Claude/claude_desktop_config.json`.

```json
{
  "mcpServers": {
    "jetbrains": {
      "command": "npx",
      "args": ["-y", "@jetbrains/mcp-proxy"]
    }
  }
}
```

## Configuration

If you're running multiple IDEs with MCP server and want to connect to the specific one, add to the MCP server configuration:
```json
"env": {
  "IDE_PORT": "<port of IDE's built-in webserver>"
}
```

By default, we connect to IDE on  127.0.0.1 but you can specify a different address/host:
```json
"env": {
  "HOST": "<host/address of IDE's built-in webserver>"
}
```

To enable logging add:
```json
"env": {
  "LOG_ENABLED": "true"
}
```

## How to build
1. Tested on macOS
2. `brew install node pnpm`
3. Run `pnpm build` to build the project
