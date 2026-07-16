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
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // Tách vendor nặng thành chunk riêng để cache tốt + không nhồi hết vào 1 bundle.
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (id.includes("react-quill") || id.includes("quill")) return "vendor-quill";
            if (id.includes("recharts") || id.includes("d3-") || id.includes("victory")) return "vendor-charts";
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("react-bootstrap") || id.includes("/bootstrap/")) return "vendor-bootstrap";
            if (id.includes("react-icons") || id.includes("lucide-react") || id.includes("@fortawesome")) return "vendor-icons";
            if (id.includes("react-router") || id.includes("@remix-run")) return "vendor-router";
            if (id.includes("react-dom") || id.includes("scheduler") || id.includes("/react/")) return "vendor-react";
            return "vendor";
          },
        },
      },
    },

    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      css: false,
    },
  };
});
