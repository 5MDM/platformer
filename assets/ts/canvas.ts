import { $ } from "./lib/util";

document.documentElement.style.setProperty("--h", innerHeight + "px");
document.documentElement.style.setProperty("--w", innerWidth + "px");

addEventListener("resize", () => {
    document.documentElement.style.setProperty("--h", innerHeight + "px");
    document.documentElement.style.setProperty("--w", innerWidth + "px");
});

export const c = $("#c") as HTMLCanvasElement;