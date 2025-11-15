import { Spritesheet, SpritesheetData, Texture } from "pixi.js";
import { Mod } from "../types";
import { MD2errors } from "../errors";
import { _MD2dataManager } from "./data";

export async function createImageFromTexture
(dm: _MD2dataManager, textureName: string, format = false):
Promise<HTMLImageElement> {
    var res!: (el: HTMLImageElement) => void;
    var rej!: () => void;
    const pr = new Promise<HTMLImageElement>((r, rj) => {
        res = r;
        rej = rj;
    });

    if(!dm.ctx) {
        MD2errors.ctxErr();
        rej();
        return pr;
    }

    const t = dm.getTexture(textureName);
    const re = t.source.resource;
    if(!re || !(re instanceof OffscreenCanvas)) {
        rej();

        return pr;
    };
    
    dm.c.width = t.width;
    dm.c.height = t.height;

    dm.ctx.drawImage
    (re, t.frame.left, t.frame.top, t.frame.width, t.frame.height, 0, 0, t.frame.width, t.frame.height);

    const g = await dm.c.convertToBlob();
    const url = URL.createObjectURL(g);

    const img = new Image(t.width, t.height);
    img.src = url;
    img.onload = () => {
        img.width = dm.engine.blockSize;
        img.height = dm.engine.blockSize;
        res(img);
    };

    return pr;
}

export async function combineSpritesheets
(multiSpritesheetData: Mod.MultiSpritesheetDataHolder): Promise<Spritesheet | void> {
    const o = multiSpritesheetData;
    const images: HTMLImageElement[] = [];

    var biggestWidth = 0;
    var h = 0;
    var y = 0;

    for(const i in o.image) {
        await new Promise<void>(
            res => {
                const img = new Image();
                img.src = o.image[i];

                img.onload = function() {
                    if(biggestWidth < img.width) biggestWidth = img.width;
                    h += img.height;
                    images.push(img);

                    res();
                };

                img.onabort = () => MD2errors.spritesheetImageManifestError(img.src);
            }
        );
    }
    
    const c = new OffscreenCanvas(biggestWidth, h);
    const ctx = c.getContext("2d");
    if(!ctx) return MD2errors.ctxErr();

    const combinedData: SpritesheetData = {
        frames: {},
        meta: {
            scale: "1"
        },
        animations: {}
    };

    for(const i in images) {
        const img = images[i];
        ctx.drawImage(img, 0, y);

        const d = o.data[i];

        for(const name in d.frames) {
            d.frames[name].frame.y += y;
            combinedData.frames[name] = d.frames[name];
        } 

        for(const name in d.animations) {
            combinedData.animations![name] = d.animations[name];
        }

        combinedData.meta = d.meta;

        y += img.height;
    }

    const spritesheet = new Spritesheet({
        texture: Texture.from(c),
        data: combinedData
    });

    await spritesheet.parse();  
    
    return spritesheet;
}