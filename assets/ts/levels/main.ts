
import { Container } from "pixi.js";
import { fileNameRegex, iteratePaths } from "../lib/util";
import "../mods";
import { levelmap } from "../mods";

export var currentLevelName: string;
export const levelTextMap: {[name: string]: string} = {};

const im = import.meta.glob<{default: string}>("./*.txt");

export const levelPromises: Promise<void>[] = [];
export const iterate = iteratePaths<string>(im, (path: string, dat: string) => {
    levelPromises.push(addLevel(path, dat));
});

async function addLevel(path: string, dat: string): Promise<void> {
    const name = fileNameRegex.exec(path)?.[0];
    if(!name) return console.error(`File error: "${path}"`);
    
    const levelDat: Promise<string> = (await fetch(dat)).text();

    levelTextMap[name] = await levelDat;
}

export function setCurrentLevel(name: string) {
    currentLevelName = name;

    const levelDat = levelTextMap[currentLevelName];
    if(!levelDat) throw new Error(`Level name "${name}" doesn't exist`);

    levelmap.run(levelDat);
}