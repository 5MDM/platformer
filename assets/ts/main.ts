import { toLoad } from "./loader";
import "./levels/main";
import "./mods";
import { startGame } from "./game/main";

export const blockSize = 32;

Promise.all(toLoad)
.then(() => {
    startGame();
});