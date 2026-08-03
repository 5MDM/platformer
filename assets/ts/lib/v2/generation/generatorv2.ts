import { Texture, TextureSource, TilingSprite, TilingSpriteOptions } from "pixi.js";
import { degToRad, Dict, radToDeg } from "../../misc/util";
import { _MD2engine } from "../engine";
import { Player } from "../entities/player";
import { BlockInfo, EntityInfo, LevelJSONoutput, MDgameGridType, XYWH } from "../types";
import { MDV } from "../../misc/vectors/vectors";
import { MgeneratorUtils } from "./generatorv2-utils";
import { MD2errors } from "../errors";

export type MgeneratorCreateTileSpriteFromBoundsOpts = 
Omit<TilingSpriteOptions, "position" | "width" 
| "height" | "roundPixels" | "texture" | "tileRotation"
| "x" | "y" | "width" | "height">;

export class Mgenerator {
    player: Player;
    /** **uses a texture path as a key** */
    blockDefs: Dict<BlockInfo> = {};
    /** **uses a texture path as a key** */
    entityDefs: Dict<EntityInfo> = {};
    md2: _MD2engine;

    util: MgeneratorUtils;

    constructor(md2: _MD2engine) {
        this.md2 = md2;
        this.util = new MgeneratorUtils(this);

        this.player = new Player({
            x: 0,
            y: 0,
            w: 32,
            h: 64,
            id: this.md2.dataManager.getNewId(),
            view: this.md2.levelManager.groups.view,
            animOpts: {
            },
            name: "player",
        });

        this.md2.initPromise.then(() => this.player.init());
        this.md2.levelManager.recordPlayer(this.player);
    }

    parseAndRecordIndividualBlock(info: BlockInfo, o: LevelJSONoutput, fixPosition = true) {
        const worldBounds = MDV.V4.fromBounds(o)
        .multiplyS(this.util.bz);
        const t = this.md2.dataManager.getTexture(info.texture);

        var spriteOpts!: MgeneratorCreateTileSpriteFromBoundsOpts;

        if(!info.isOversize) {
            if(fixPosition)
                worldBounds.addPos(worldBounds.getWH().divideS(2));

            spriteOpts = {
                tileScale: this.util.getTileScaleFromTexture(t),
                pivot: worldBounds.clone().divideS(2),
            };
        } else {
            spriteOpts = {
                pivot: this.util.getPivotFromTexture(t),
            };
        }

        const block = this.util.createBlockFromInfo
        (info, worldBounds, t, o.rotation, spriteOpts);

        this.md2.levelManager.recordBlock(block.type, block);
    }

    /**
     * **not needed yet**
     */
    parseAndRecordIndividualEntity(info: EntityInfo, o: LevelJSONoutput) {

    }

    /**
     * this will delete and replace blocks that are already
     * in the same position in the same grid type
     */
    parseData(data: LevelJSONoutput[]) {
        for(const o of data) {
            // texture path
            const tPath = o.type;
            const blockInfo = this.blockDefs[tPath];
            const entityInfo = this.entityDefs[tPath];

            if(blockInfo) this.parseAndRecordIndividualBlock(blockInfo, o);
            else if(entityInfo) this.parseAndRecordIndividualEntity(entityInfo, o);
            else {
                MD2errors.notFound("game object", tPath);
                continue;
            }
        }
    }
}