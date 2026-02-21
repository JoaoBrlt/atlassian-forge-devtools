import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  outDir: "dist",
  imports: false,
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Atlassian Forge DevTools",
    browser_specific_settings: {
      gecko: {
        // @ts-expect-error: WXT does not support this field yet
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
    permissions: ["storage"],
  },
  vite: () => ({
    plugins: [tailwindcss()],
    define: {
      "import.meta.env.PACKAGE_NAME": JSON.stringify("atlassian-forge-devtools"),
      "import.meta.env.PACKAGE_VERSION": JSON.stringify(process.env.npm_package_version),
    },
  }),
});
