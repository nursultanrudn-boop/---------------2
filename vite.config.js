import { defineConfig } from "vite";

/** Статический сайт без SPA: несколько `.html`, без React-бандла. */
export default defineConfig({
  appType: "mpa",
});
