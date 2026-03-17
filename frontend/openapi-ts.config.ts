import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  // Fetch the live OpenAPI schema from the running backend.
  // Run `npm run generate-client` with the backend up to regenerate src/client/.
  input: "./openapi.json",
  output: "./src/client",
  plugins: [
    {
      // TypeScript types — enums as plain JS objects (tree-shakeable, no TS const enum pitfalls)
      name: "@hey-api/typescript",
      enums: "javascript",
    },
    {
      // Underlying fetch client — handles base URL, headers, interceptors
      name: "@hey-api/client-fetch",
    },
    {
      // Class-based SDK
      name: "@hey-api/sdk",
      transformer: true,
      operations: {
        strategy: "byTags",
        nesting: "operationId",
      },
    },
    {
      // Exports raw JSON Schema objects alongside the TypeScript types
      name: "@hey-api/schemas",
      type: "json",
    },
    {
      // Automatically converts ISO date strings in responses to Date objects
      name: "@hey-api/transformers",
      dates: true,
    },
    {
      // Generates queryOptions() factories for every SDK method so pages can
      // use useQuery / useSuspenseQuery without writing the options manually
      name: "@tanstack/react-query",
    },
  ],
});
