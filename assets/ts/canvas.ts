import { $ } from "./lib/util";

export const c = $("#c") as HTMLCanvasElement;

document.documentElement.style.setProperty("--h", innerHeight + "px");
document.documentElement.style.setProperty("--w", innerWidth + "px");

addEventListener("touchend", e => e.preventDefault());
