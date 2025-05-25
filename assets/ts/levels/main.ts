
import level1 from "../../compiled-levels/1.json";
import level2 from "../../compiled-levels/2.json";
import level3 from "../../compiled-levels/3.json";
import { MDshell } from "../lib/md-framework/shell";

export function initLevels(sh: MDshell) {
    sh.addLevel("1", level1);
    sh.addLevel("2", level2);
    sh.addLevel("3", level3);
}