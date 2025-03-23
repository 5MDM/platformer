import {defineConfig} from "vite";
//import react from "@vitejs/plugin-react-swc";
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