import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(root, "src");

// CRA cho phép viết JSX trong file .js. Khi Vite quét/pre-bundle deps, esbuild cần
// hiểu các file .js trong src/ là JSX. Plugin này CHỈ áp jsx loader cho file trong
// src/, KHÔNG đụng node_modules -> tránh làm hỏng các thư viện CommonJS
// (ép .js -> jsx toàn cục sẽ gây lỗi "require is not defined" ở runtime).
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

    // Giữ alias "~" -> "src" như cấu hình module-resolver cũ (76 file đang dùng)
    resolve: {
      alias: {
        "~": path.resolve(root, "src"),
      },
    },

    // Giữ nguyên cách dùng process.env.REACT_APP_* trong code (9 chỗ) -> không phải sửa
    define: {
      "process.env.REACT_APP_API_BASE_URL": JSON.stringify(
        env.REACT_APP_API_BASE_URL ?? ""
      ),
      "process.env.REACT_APP_GOOGLE_CLIENT_ID": JSON.stringify(
        env.REACT_APP_GOOGLE_CLIENT_ID ?? ""
      ),
    },

    // JSX trong file .js của src/ cho pipeline transform/build (Rollup)
    esbuild: {
      loader: "jsx",
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },

    // Cho phần pre-bundle deps (dev): dùng plugin giới hạn ở src/, không ép loader
    // toàn cục nên CommonJS deps được chuyển sang ESM đúng cách.
    optimizeDeps: {
      esbuildOptions: {
        plugins: [srcJsAsJsx],
      },
    },

    server: {
      port: 3000,
      open: true,
    },

    // Tắt cảnh báo deprecation của Dart Sass (cú pháp SCSS cũ vẫn chạy tốt với sass 1.x).
    // Không sửa file .scss nào — chỉ ẩn log cho đỡ rối. Bỏ block này nếu muốn migrate SCSS sau.
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          silenceDeprecations: ["import", "global-builtin", "color-functions"],
        },
      },
    },

    // Giữ thư mục output là "build" như CRA để không phải đổi script deploy
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
