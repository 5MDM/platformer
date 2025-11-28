import { Assets, CanvasSource, Spritesheet, SpritesheetData, SpriteSheetJson, Texture, TextureSource } from "pixi.js";
import { _MD2engine } from "../engine";
import { MD2errors } from "../errors";
import { MD2item } from "../items/item";
import { MD2dataManagerParseMod, MD2dataManagerParseSpritesheets } from "../mod-parser";
import { RegisterItemOpts, ModInfo, EntityFileInfo, ItemFileInfo } from "../types";
import { _MD2dataManagerOpts, MD2SpriteLoader } from "./sprite-loader";
import { combineSpritesheets } from "./spritesheet-functions";
import { sp } from "../../misc/util";

export class _MD2dataManager extends MD2SpriteLoader {
    registeredItems: Record<string, RegisterItemOpts> = {};

    playerItems: Record<string, MD2item> = {};

    particleRecord: Record<string, Texture> = {};

    mods: Record<string, ModInfo> = {};

    constructor(engine: _MD2engine, opts: _MD2dataManagerOpts) {
        super(engine, opts);

        for(const path in opts.mods) {
            const mod = opts.mods[path];
            this.mods[path.split("../").at(-1)?.split("/").at(1)
                || "unknown-" + Math.round(Math.random() * 10000)] = mod;
        }
    }

    registerParticle(name: string, t: string) {
        this.particleRecord[name] = this.getTexture(t);
    }

    registerItem(name: string, o: RegisterItemOpts) {
        this.registeredItems[name] = o;
    }

    addItem(name: string, n: number = 1) {
        if(!this.registeredItems[name]) return MD2errors.noItemFound(name);

        if(!this.playerItems[name]) this.addItemAndAddToInventory(name, n);
        else this.playerItems[name].amount += n;
    }

    addItemAndAddToInventory(name: string, n: number) {
        this.playerItems[name] = new MD2item({
            name,
            texture: this.getTexture(this.registeredItems[name].texture),
            amount: n,
        });

        this.engine.modules.gui.parts.inventory.updateSlot(name, n);
    }

    async initMods() {
        const obj = await _MD2dataManager.modGlobPr;

        const gDir: Record<string, any> = {};
        
        for(const path in this.manifestFiles) {
            const arr = path.split("/");
            arr.pop();

            const dir: Record<string, any> = {};
            const base = "../../../" + arr.join("/") + "/";
            for (const path in obj) {
                if (path.slice(0, base.length) == base) dir[path.slice(base.length)] = obj[path];
            }

            gDir[path] = dir;

            MD2dataManagerParseSpritesheets(this, this.manifestFiles[path], dir);
        }

        const texture = await Assets.load(this.multiSpritesheetData.image[0]);

        // old loader if needed
        // const spritesheetO = new Spritesheet({
        //     data: this.multiSpritesheetData.data[0],
        //     texture,
        // });

        // await spritesheet.parse();

        const spritesheet = await combineSpritesheets(this.multiSpritesheetData);
        if(!spritesheet) {
            alert("Spritesheet failed to load. Please check the console");
            return;
        }

        this.spritesheet = spritesheet;

        this.spritesheet!.textureSource.scaleMode = "nearest";

        this.getTexture = this.initializedGetTexture;
        this.getAnimationTextures = this.initializedGetAnimationTextures;

        this.spritesheetRes();

        // for(const modName in this.mods) {
        //     await this.parseMod(modName, this.mods[modName]);
        // }

        for(const path in this.manifestFiles) {
            await MD2dataManagerParseMod(this, this.manifestFiles[path], gDir[path]);
        }
    };

    c = new OffscreenCanvas(this.engine.blockSize, this.engine.blockSize);
    ctx = this.c.getContext("2d");

    getItem(name: string): MD2item | undefined {
        return this.playerItems[name];
    }

    consumeItem(item: MD2item) {

    }
}
