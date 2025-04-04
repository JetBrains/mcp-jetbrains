[![official JetBrains project](http://jb.gg/badges/incubator-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)
# JetBrains MCP Proxy Server

The server proxies requests from client to JetBrains IDE.

## Install MCP Server plugin

https://plugins.jetbrains.com/plugin/26071-mcp-server

## VS Code Installation

For one-click installation, click one of the install buttons below:

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPM-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=jetbrains&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40jetbrains%2Fmcp-proxy%22%5D%7D) [![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPM-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=jetbrains&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40jetbrains%2Fmcp-proxy%22%5D%7D&quality=insiders)

### Manual Installation

Add the following JSON block to your User Settings (JSON) file in VS Code. You can do this by pressing `Ctrl + Shift + P` and typing `Preferences: Open User Settings (JSON)`.

```json
{
  "mcp": {
    "servers": {
      "jetbrains": {
        "command": "npx",
        "args": ["-y", "@jetbrains/mcp-proxy"]
      }
    }
  }
}
```

Optionally, you can add it to a file called `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "jetbrains": {
      "command": "npx",
      "args": ["-y", "@jetbrains/mcp-proxy"]
    }
  }
}
```

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

