import { RobautoClient, RobautoError, type ClientConfig } from "./client.js";
import { tools, type Tool } from "./tools.js";

export { RobautoClient, RobautoError, tools };
export type { ClientConfig, Tool };

interface PluginContext {
  config?: ClientConfig;
  registerTool: (definition: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    handler: (args: Record<string, any>) => Promise<unknown>;
  }) => void;
  log?: (message: string) => void;
}

/**
 * Harness entry point. The host calls this once at load and the plugin
 * registers its tools into whatever registry the host provides.
 */
export default function activate(ctx: PluginContext) {
  const client = new RobautoClient(ctx.config ?? {});

  for (const tool of tools) {
    ctx.registerTool({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      handler: async (args) => {
        try {
          return await tool.run(args ?? {}, client);
        } catch (error) {
          if (error instanceof RobautoError) {
            return { error: error.message, status: error.status ?? null };
          }
          throw error;
        }
      },
    });
  }

  ctx.log?.(`Robauto Growth Agent registered ${tools.length} tools.`);
}
