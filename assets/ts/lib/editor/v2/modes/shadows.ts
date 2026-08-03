import { MDV } from "../../../misc/vectors/vectors";
import {Texture, TilingSprite } from "pixi.js";
import { degToRad } from "../../../misc/util";
import { XYWHR } from "../../../v2/types";
import { BaseShader, ShadeTextureType } from "./templates/base-shader";

export class ShadowMode extends BaseShader {
    modeName: string = "Place Shadows";
    iconPath: string = "";

    debugRegionModeFlag: boolean = false;

    onShadingFinish = undefined;

    canPlace(gridPos: MDV.V2): boolean {
        return this.blockTools.getFirstAvailableWorldBlock(
            gridPos.clone()
        ) != undefined;
    }
    
    initShadingTextures(): Record<ShadeTextureType, Texture> {
        const dm = this.editor.engine.dataManager;
        
        return {
            iCorner: dm.getTexture("black-icorner.png"),
            side: dm.getTexture("black-fade.png"),
            corner: dm.getTexture("black-fade-corner.png"),
        };
    }

    addShadedBlocks(shadedBlocks: Record<string, XYWHR[]>): void {
        for(const textureName in shadedBlocks) {
            const t = this.shadingTextures[textureName];
            if(!t) continue;

            const boxes = shadedBlocks[textureName];
            for(const xywhr of boxes) {
                const worldBounds = MDV.V4.fromBounds(xywhr)
                .multiplyS(this.engine.blockSize);

                const r = degToRad(xywhr.rotation);

                this.recordTilingSprite({
                    worldBounds,
                    texture: t,
                    rotation: r,
                });
            }
        }
    }

    protected recordTilingSprite({worldBounds, texture, rotation}: {
        worldBounds: MDV.V4,
        texture: Texture,
        rotation: number,
    }) {
        const s = new TilingSprite({
            position: worldBounds.clone(),
            width: worldBounds.w+.1,
            height: worldBounds.h+.1,
            texture,
            tileScale: new MDV.V4(
                this.editor.engine.blockSize / texture.width,
                this.editor.engine.blockSize / texture.height,
            ),
            tileRotation: rotation,
        });

        this.shadedBlocksC.addChild(s);
    }
}
