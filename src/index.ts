#!/usr/bin/env node
import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {CallToolRequestSchema, CallToolResult, ListToolsRequestSchema,} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// Logging is enabled only if LOG_ENABLED environment variable is set to 'true'
const LOG_ENABLED = process.env.LOG_ENABLED === 'true';

const HOST = process.env.HOST ?? "127.0.0.1"

export function log(...args: any[]) {
    if (LOG_ENABLED) {
        console.error(...args);
    }
}

interface IDEResponseOk {
    status: string;
    error: null;
}

interface IDEResponseErr {
    status: null;
    error: string;
}

type IDEResponse = IDEResponseOk | IDEResponseErr;

/**
 * Globally store the cached IDE endpoint.
 * We'll update this once at the beginning and every 10 seconds.
 */
let cachedEndpoint: string | null = null;

/**
 * If you need to remember the last known response from /mcp/list_tools, store it here.
 * That way, you won't re-check it every single time a new request comes in.
 */
let previousResponse: string | null = null;

/**
 * Helper to send the "tools changed" notification.
 */
function sendToolsChanged() {
    try {
        log("Sending tools changed notification.");
        server.notification({method: "notifications/tools/list_changed"});
    } catch (error) {
        log("Error sending tools changed notification:", error);
    }
}

/**
 * Test if /mcp/list_tools is responding on a given endpoint
 *
 * @returns true if working, false otherwise
 */
async function testListTools(endpoint: string): Promise<boolean> {
    log(`Sending test request to ${endpoint}/mcp/list_tools`);
    try {
        const res = await fetch(`${endpoint}/mcp/list_tools`);
        if (!res.ok) {
            log(`Test request to ${endpoint}/mcp/list_tools failed with status ${res.status}`);
            return false;
        }

        const currentResponse = await res.text();
        log(`Received response from ${endpoint}/mcp/list_tools: ${currentResponse.substring(0, 100)}...`);

        // If the response changed from last time, notify
        if (previousResponse !== null && previousResponse !== currentResponse) {
            log("Response has changed since the last check.");
            sendToolsChanged();
        }
        previousResponse = currentResponse;

        return true;
    } catch (error) {
        log(`Error during testListTools for endpoint ${endpoint}:`, error);
        return false;
    }
}

/**
 * Finds and returns a working IDE endpoint using IPv4 by:
 * 1. Checking process.env.IDE_PORT, or
 * 2. Scanning ports 63342-63352
 *
 * Throws if none found.
 */
async function findWorkingIDEEndpoint(): Promise<string> {
    log("Attempting to find a working IDE endpoint...");

    // 1. If user specified a port, just use that
    if (process.env.IDE_PORT) {
        log(`IDE_PORT is set to ${process.env.IDE_PORT}. Testing this port.`);
        const testEndpoint = `http://${HOST}:${process.env.IDE_PORT}/api`;
        if (await testListTools(testEndpoint)) {
            log(`IDE_PORT ${process.env.IDE_PORT} is working.`);
            return testEndpoint;
        } else {
            log(`Specified IDE_PORT=${process.env.IDE_PORT} but it is not responding correctly.`);
            throw new Error(`Specified IDE_PORT=${process.env.IDE_PORT} but it is not responding correctly.`);
        }
    }

    // 2. Reuse existing endpoint if it's still working
    if (cachedEndpoint != null && await testListTools(cachedEndpoint)) {
        log('Using cached endpoint, it\'s still working')
        return cachedEndpoint
    }

    // 3. Otherwise, scan a range of ports
    for (let port = 63342; port <= 63352; port++) {
        const candidateEndpoint = `http://${HOST}:${port}/api`;
        log(`Testing port ${port}...`);
        const isWorking = await testListTools(candidateEndpoint);
        if (isWorking) {
            log(`Found working IDE endpoint at ${candidateEndpoint}`);
            return candidateEndpoint;
        } else {
            log(`Port ${port} is not responding correctly.`);
        }
    }

    // If we reach here, no port was found
    previousResponse = "";
    log("No working IDE endpoint found in range 63342-63352");
    throw new Error("No working IDE endpoint found in range 63342-63352");
}

/**
 * Updates the cached endpoint by finding a working IDE endpoint.
 * This runs once at startup and then once every 10 seconds in runServer().
 */
async function updateIDEEndpoint() {
    try {
        cachedEndpoint = await findWorkingIDEEndpoint();
        log(`Updated cachedEndpoint to: ${cachedEndpoint}`);
    } catch (error) {
        // If we fail to find a working endpoint, keep the old one if it existed.
        // It's up to you how to handle this scenario (e.g., set cachedEndpoint = null).
        log("Failed to update IDE endpoint:", error);
    }
}

/**
 * Main MCP server
 */
const server = new Server(
    {
        name: "jetbrains/proxy",
        version: "0.1.0",
    },
    {
        capabilities: {
            tools: {
                listChanged: true,
            },
            resources: {},
        },
    },
);

/**
 * Handles listing tools by using the *cached* endpoint (no new search each time).
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    log("Handling ListToolsRequestSchema request.");
    if (!cachedEndpoint) {
        // If no cached endpoint, we can't proceed
        throw new Error("No working IDE endpoint available.");
    }
    try {
        log(`Using cached endpoint ${cachedEndpoint} to list tools.`);
        const toolsResponse = await fetch(`${cachedEndpoint}/mcp/list_tools`);
        if (!toolsResponse.ok) {
            log(`Failed to fetch tools with status ${toolsResponse.status}`);
            throw new Error("Unable to list tools");
        }
        const tools = await toolsResponse.json();
        log(`Successfully fetched tools: ${JSON.stringify(tools)}`);
        return {tools};
    } catch (error) {
        log("Error handling ListToolsRequestSchema request:", error);
        throw error;
    }
});

/**
 * Handle calls to a specific tool by using the *cached* endpoint.
 */
async function handleToolCall(name: string, args: any): Promise<CallToolResult> {
    log(`Handling tool call: name=${name}, args=${JSON.stringify(args)}`);
    if (!cachedEndpoint) {
        // If no cached endpoint, we can't proceed
        throw new Error("No working IDE endpoint available.");
    }

    try {
        log(`ENDPOINT: ${cachedEndpoint} | Tool name: ${name} | args: ${JSON.stringify(args)}`);
        const response = await fetch(`${cachedEndpoint}/mcp/${name}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(args),
        });

        if (!response.ok) {
            log(`Response failed with status ${response.status} for tool ${name}`);
            throw new Error(`Response failed: ${response.status}`);
        }

        // Parse the IDE's JSON response
        const {status, error}: IDEResponse = await response.json();
        log("Parsed response:", {status, error});

        const isError = !!error;
        const text = status ?? error;
        log("Final response text:", text);
        log("Is error:", isError);

        return {
            content: [{type: "text", text: text}],
            isError,
        };
    } catch (error: any) {
        log("Error in handleToolCall:", error);
        return {
            content: [{
                type: "text",
                text: error instanceof Error ? error.message : "Unknown error",
            }],
            isError: true,
        };
    }
}

// 1) Do an initial endpoint check (once at startup)
await updateIDEEndpoint();

/**
 * Request handler for "CallToolRequestSchema"
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    log("Handling CallToolRequestSchema request:", request);
    try {
        const result = await handleToolCall(request.params.name, request.params.arguments ?? {});
        log("Tool call handled successfully:", result);
        return result;
    } catch (error) {
        log("Error handling CallToolRequestSchema request:", error);
        throw error;
    }
});

/**
 * Starts the server, connects via stdio, and schedules endpoint checks.
 */
async function runServer() {
    log("Initializing server...");

    const transport = new StdioServerTransport();
    try {
        await server.connect(transport);
        log("Server connected to transport.");
    } catch (error) {
        log("Error connecting server to transport:", error);
        throw error;
    }

    // 2) Then check again every 10 seconds (in case IDE restarts or ports change)
    setInterval(updateIDEEndpoint, 10_000);
    log("Scheduled endpoint check every 10 seconds.");

    log("JetBrains Proxy MCP Server running on stdio");
}

// Start the server
runServer().catch(error => {
    log("Server failed to start:", error);
});