import level1 from "../../compiled-levels/1.json";
import level2 from "../../compiled-levels/2.json";
import level3 from "../../compiled-levels/3.json";
import forest1 from "../../compiled-levels/forest/1.json";
import errorLevel from "../../compiled-levels/error.json";
import { LevelData } from "../lib/md-framework/level-gen";
import { MDshell } from "../lib/md-framework/shell";

export function initLevels(sh: MDshell) {
    function l(name: string, level: Object) {
        sh.addLevel(name, level as LevelData);
    }

    //l("1", level1 as LevelData);
    //l("2", level2 as LevelData);
    //l("3", level3 as LevelData);
    l("1", forest1);

    l("error", errorLevel as LevelData);
}