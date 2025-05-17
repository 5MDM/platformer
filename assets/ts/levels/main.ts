
import level3 from "../../compiled-levels/3.json";
import { MDshell } from "../lib/md-framework/shell";

export function initLevels(sh: MDshell) {
    sh.addLevel("1", level3);
}