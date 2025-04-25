import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { version } from "./version.js";
import * as dotenv from "dotenv";
import { mnemonicToAccount } from "viem/accounts";
import { rootstock, rootstockTestnet } from "viem/chains";
import { createWalletClient, http, publicActions } from "viem";
import { rskMcpTools, toolToHandler } from "./tools/index.js";
import { RSK_RPC_URL } from "./lib/constants.js";

async function main() {
  dotenv.config();
  const seedPhrase = process.env.SEED_PHRASE;

  if (!seedPhrase) {
    console.error("Please set SEED_PHRASE environment variable");
    process.exit(1);
  }

  const viemClient = createWalletClient({
    account: mnemonicToAccount(seedPhrase),
    chain: rootstock,
    transport: http(RSK_RPC_URL),
  }).extend(publicActions);

  const server = new Server(
    {
      name: "RSK MCP Server",
      version,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("Received ListToolsRequest");
    return {
      tools: rskMcpTools,
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const tool = toolToHandler[request.params.name];
      if (!tool) {
        throw new Error(`Tool ${request.params.name} not found`);
      }

      const result = await tool(viemClient, request.params.arguments);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Tool ${request.params.name} failed: ${error}`);
    }
  });

  const transport = new StdioServerTransport();
  console.error("Connecting server to transport...");
  await server.connect(transport);
  console.error("RSK MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
