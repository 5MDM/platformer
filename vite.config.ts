import {defineConfig} from "vite";
import {checker} from "vite-plugin-checker";

export default defineConfig({
  build: {
    target: "es2022",
    assetsInlineLimit: 0
  },
  plugins: [
    checker({
      typescript: true,
    }),
    /*react({
      devTarget: "es2022",
    }),*/
  ],
  base: "/platformer/"
});