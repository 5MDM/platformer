
import { Container } from "pixi.js";
import { fileNameRegex, iteratePaths } from "../lib/util";
import { toLoad } from "../loader";
import "../mods";
import { levelmap } from "../mods";

export var currentLevelName: string;
export const levelTextMap: {[name: string]: string} = {};

const im = import.meta.glob<{default: string}>("./*.txt");
const iterate = iteratePaths<string>(im, addLevel);
toLoad.push(iterate);
await iterate;

async function addLevel(path: string, dat: string) {
    const name = fileNameRegex.exec(path)?.[0];
    if(!name) return console.error(`File error: "${path}"`);
    
    const levelDat: Promise<string> = fetch(dat).then(e => e.text());
    toLoad.push(levelDat);

    levelTextMap[name] = await levelDat;
}

export function setCurrentLevel(name: string) {
    currentLevelName = name;

    const levelDat = levelTextMap[currentLevelName];
    if(!levelDat) throw new Error(`Level name "${name}" doesn't exist`);

    levelmap.run(levelDat);
}