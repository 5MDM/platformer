import { SpritesheetData } from "pixi.js";
import { _MD2dataManager } from "./data-loaders/data";
import { _MD2errorManager, MD2errors } from "./errors";
import { _md2events, Mod } from "./types";
import { createImageFromTexture } from "./data-loaders/spritesheet-functions";

const supportedVersion = JSON.stringify([0, 1, 0]);

// check version support
function CVS(data: {version: [number, number, number]}): boolean {
    if(JSON.stringify(data.version) != supportedVersion) {
        MD2errors.unsupportedVersion("Mod file", data.version, supportedVersion);
        return true;
    } else return false;
}

export function MD2dataManagerParseSpritesheets
(d: _MD2dataManager, m: Mod.ManifestV0_1_x, dir: Record<string, any>): void {
    if(m.data.spritesheets) {
        const newArr: Mod.SpritesheetObj[] = [];

        for(const {image, data} of m.data.spritesheets) {
            const o = {
                image: dir[image.slice(2)] as string,
                data: dir[data.slice(2)] as SpritesheetData
            };

            if(!o.data) {
                MD2errors.spritesheetDataManifestError(data);
                if(!o.image) {
                    MD2errors.spritesheetImageManifestError(image);
                    continue;
                } else continue;
            }

            if(!o.image) {
                MD2errors.spritesheetImageManifestError(image);
                continue;
            }

            newArr.push(o);
        }

        parseSpritesheets(d, newArr);
    }
}

export async function MD2dataManagerParseMod(d: _MD2dataManager, m: Mod.ManifestV0_1_x, dir: Record<string, any>): Promise<void> {
    if(JSON.stringify(m.version) != supportedVersion)
        return MD2errors.unsupportedVersion("Mod", m.version, supportedVersion);

    async function parse<T extends Object>(e: string[] | undefined, f: (d: _MD2dataManager, data: T) => any) {
        const val = e;
        if(!val) return;

        for(const path of val) {
            // removes "./"
            const actualPath = path.slice(2);
            const file: T = dir[actualPath];
            if(CVS(file as any)) continue;
            await f(d, file);
        }
    }

    parse(m.data.audio, parseAudio);
    parse<Mod.BlocksV0_1_x>(m.data.blocks, parseBlocks);
    parse(m.data.dialgoues, parseDialogues);
    parse<Mod.EntitiesV0_1_x>(m.data.entities, parseEntities);
    parse<Mod.ItemsV0_1_x>(m.data.items, parseItems);
    parse(m.data.levelMap, parseLevelMap);
    parse<Mod.ParticlesV0_1_x>(m.data.particles, parseParticles);
}

function parseAudio(d: _MD2dataManager) {

}

function parseBlocks(d: _MD2dataManager, file: Mod.BlocksV0_1_x) {
    for(const name in file.data) {
        const b = file.data[name];

        b.isOversize ??= false;
        
        d.engine.generator.registerBlock(b.texture, {
            ...b,
            name,
            isOversize: b.isOversize
        });
    }
}

function parseDialogues() {

}

function parseEntities(d: _MD2dataManager, file: Mod.EntitiesV0_1_x) {
    for(const name in file.data) {
        const info = file.data[name]
        d.engine.generator.registerEntity(name, info);
    }
}

async function parseItems(d: _MD2dataManager, file: Mod.ItemsV0_1_x) {
    for(const name in file.data) {
        const itemInfo = file.data[name];

        d.registerItem(name, {
            ...itemInfo,
            img: await createImageFromTexture(d, itemInfo.texture)
        });
    }
}

function parseLevelMap() {

}

function parseParticles(d: _MD2dataManager, file: Mod.ParticlesV0_1_x) {
    for(const name in file.data) {
        const texture = file.data[name];

        d.registerParticle(name, texture);
    }
}

function parseSpritesheets(d: _MD2dataManager, arr: Mod.SpritesheetObj[]) {
    for(const {data, image} of arr) {
       d.addModSpritesheet(data, image);
    }
}