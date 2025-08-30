import level1 from "../../compiled-levels/1.json";
import level2 from "../../compiled-levels/2.json";
import level3 from "../../compiled-levels/3.json";
import forest1 from "../../compiled-levels/forest/1.json";
import abandoned_house_inside from "../../compiled-levels/forest/abandoned_house_inside.json";
import errorLevel from "../../compiled-levels/error.json";
import { LevelData } from "../lib/md-framework/level-gen";
import { _MD2engine } from "../lib/v2/engine";

export function initLevels(md2: _MD2engine) {
    function l(name: string, level: Object) {
        //sh.addLevel(name, level as LevelData);
        md2.levelManager.setLevel(name, level as LevelData);
    }
    
    //l("1", level1 as LevelData);
    //l("2", level2 as LevelData);
    //l("3", level3 as LevelData);
    l("1", forest1);
    l("abandoned_house_inside", abandoned_house_inside);

    l("error", errorLevel as LevelData);
}