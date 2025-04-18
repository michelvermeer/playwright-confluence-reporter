import { defineConfig } from "vite";
import path from "path";
import dts from "vite-plugin-dts";

export default defineConfig(() => {
  return {
    plugins: [
      dts({
        rollupTypes: true,
        include: ["src/confluence-reporter.ts"],
        exclude: ["**/*.spec.*"],
      }),
    ],
    build: {
      outDir: "package/dist",
      lib: {
        entry: path.resolve(__dirname, "src/confluence-reporter.ts"),
        name: "playwright-confluence-reporter",
        fileName: (format) => `index.${format}.js`,
      },
      rollupOptions: {
        input: path.resolve(__dirname, "src/confluence-reporter.ts"),
        external: ["@playwright"],
        output: {
          globals: {
            "@playwright": "playwright",
          },
        },
      },
      sourcemap: true,
      emptyOutDir: true,
    },
  };
});
