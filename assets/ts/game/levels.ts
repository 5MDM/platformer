
import forest1 from "../../compiled-levels/forest/1.json";
import abandoned_house_inside from "../../compiled-levels/forest/abandoned_house_inside.json";
import errorLevel from "../../compiled-levels/error.json";
import { _MD2engine } from "../lib/v2/engine";
import { LevelDataV0_0_0 } from "../lib/v2/types";

import forest2 from "../../compiled-levels/forest/2.json";
import test from "../../compiled-levels/forest/test.json";

export function initLevels(md2: _MD2engine) {
    function l(name: string, level: Object) {
        md2.levelManager.setLevel(name, level as LevelDataV0_0_0);
    }
    
    l("1", forest1);
    l("abandoned_house_inside", abandoned_house_inside);
    l("2", forest2);

    l("error", errorLevel as LevelDataV0_0_0);
    l("test", test);
}