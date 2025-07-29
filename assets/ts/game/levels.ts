
import level1 from "../../compiled-levels/1.json";
import level2 from "../../compiled-levels/2.json";
import level3 from "../../compiled-levels/3.json";
import errorLevel from "../../compiled-levels/error.json";
import { LevelJSONoutput, MDshell } from "../lib/md-framework/shell";

export function initLevels(sh: MDshell) {
    function l(name: string, level: LevelJSONoutput[]) {
        sh.addLevel(name, level);
    }

    l("1", level1);
    l("2", level2);
    l("3", level3);
    l("error", errorLevel);
}