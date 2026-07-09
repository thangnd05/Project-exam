import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(root, "src");

const srcJsAsJsx = {
  name: "src-js-as-jsx",
  setup(build) {
    build.onLoad({ filter: /\.js$/ }, (args) => {
      if (!args.path.startsWith(srcDir)) return null;
      return { loader: "jsx", contents: fs.readFileSync(args.path, "utf8") };
    });
  },
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, "");

  return {
    plugins: [react()],

    resolve: {
      alias: {
        "~": path.resolve(root, "src"),
      },
    },

    define: {
      "process.env.REACT_APP_API_BASE_URL": JSON.stringify(
        env.REACT_APP_API_BASE_URL ?? ""
      ),
      "process.env.REACT_APP_GOOGLE_CLIENT_ID": JSON.stringify(
        env.REACT_APP_GOOGLE_CLIENT_ID ?? ""
      ),
    },

    esbuild: {
      loader: "jsx",
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },

    optimizeDeps: {
      esbuildOptions: {
        plugins: [srcJsAsJsx],
      },
    },

    server: {
      port: 3000,
      open: true,
    },

    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [srcDir],
          quietDeps: true,
          silenceDeprecations: ["import", "global-builtin", "color-functions"],
        },
      },
    },

    build: {
      outDir: "build",
    },

    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      css: false,
    },
  };
});
