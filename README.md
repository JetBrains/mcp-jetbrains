[![official JetBrains project](http://jb.gg/badges/incubator-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)
[![smithery badge](https://smithery.ai/badge/@jetbrains/mcp-proxy)](https://smithery.ai/server/@jetbrains/mcp-proxy)
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

After installing the MCP Server Plugin, and adding the JSON to the config file, restart Claude Desktop, and make sure the Jetbrains product is open before restarting Claude Desktop. 

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

## Troubleshooting

### Node.js Version Requirements
**Problem:** Error message: `Cannot find module 'node:path'`

**Solution:**
MCP Proxy doesn't work on Node 16.
Upgrade your Node.js installation to version 18 or later. Make sure that `command` in config points to the correct Node.js version.
Try to use the full path to the latest version of NodeJS.

### 

### MacOS: Plugin Unable to Detect Node.js Installed via nvm
**Problem:** On MacOS, if you have Node.js installed through nvm (Node Version Manager), the MCP Server Plugin might be unable to detect your Node.js installation.

**Solution:** Create a symbolic link in `/usr/local/bin` pointing to your nvm npx executable:
```bash
which npx &>/dev/null && sudo ln -sf "$(which npx)" /usr/local/bin/npx
```
This one-liner checks if npx exists in your path and creates the necessary symbolic link with proper permissions.

### Using MCP with External Clients or Docker Containers (LibreChat, Cline, etc.)

**Problem:** When attempting to connect to the JetBrains MCP proxy from external clients, Docker containers, or third-party applications (like LibreChat), requests to endpoints such as http://host.docker.internal:6365/api/mcp/list_tools may return 404 errors or fail to connect.
**Solution:** There are two key issues to address:
1. Enable External Connections:

In your JetBrains IDE, enable "Can accept external connections" in the _Settings | Build, Execution, Deployment | Debugger_.

2. Configure with LAN IP and Port:

Use your machine's LAN IP address instead of `host.docker.internal`
Explicitly set the IDE_PORT and HOST in your configuration
Example configuration for LibreChat or similar external clients:
```yaml
mcpServers:
  intellij:
    type: stdio
    command: sh
    args:
      - "-c"
      - "IDE_PORT=YOUR_IDEA_PORT HOST=YOUR_IDEA_LAN_IP npx -y @jetbrains/mcp-proxy"
```
Replace:

`YOUR_IDEA_PORT` with your IDE's debug port (found in IDE settings)
`YOUR_IDEA_LAN_IP` with your computer's local network IP (e.g., 192.168.0.12)


## How to build
1. Tested on macOS
2. `brew install node pnpm`
3. Run `pnpm build` to build the project
