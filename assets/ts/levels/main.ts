
import level3 from "../../compiled-levels/1.json";
import { MDshell } from "../lib/md-framework/shell";

export function initLevels(sh: MDshell) {
    sh.addLevel("1", level3);
}