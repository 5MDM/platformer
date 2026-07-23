import { Container, Sprite, Texture } from "pixi.js";
import { RegionSelect } from "./region-selector";
import { MD2editorV2 } from "../../editor";
import { NameAndRotationStringGreedyMeshMap } from "../../../../misc/greedy-mesh/sorter";
import { MDV } from "../../../../misc/vectors/vectors";
import { MD2errors } from "../../../../v2/errors";
import { objIterator, simpleSwitch } from "../../../../misc/util";
import { XYWH, XYWHR } from "../../../../v2/types";

type TypeFor8dirIcorners =
  "topLeftIcorner"
| "topRightIcorner"
| "bottomLeftIcorner"
| "bottomRightIcorner";

type TypeFor8dirU =
  "topU"
| "leftU"
| "rightU"
| "bottomU";

type TypeFor8dirPipes = "topDownPipe" | "leftRightPipe";

export type ShadeTextureType = "side" | "corner" | "iCorner"

export type AdjacencyType =
  MDV.TypeFor8dir
| TypeFor8dirIcorners
| TypeFor8dirU
| TypeFor8dirPipes
| "isolated";

export abstract class BaseShader extends RegionSelect {
    protected shadedBlocksC = new Container();
    protected debugGreedyMeshC = new Container();
    readonly abstract debugRegionModeFlag: boolean;

    readonly greedyMeshBlockMap = new NameAndRotationStringGreedyMeshMap(new MDV.V2(
        MD2editorV2.maxLevelSize,
        MD2editorV2.maxLevelSize,
    ));

    override init(): void {
        super.init();

        if(this.debugRegionModeFlag)
            this.editor.c.addChild(this.debugGreedyMeshC);

        this.editor.c.addChild(this.shadedBlocksC);

        this.shadingTextures = this.initShadingTextures();
        objIterator.normal(this.shadingTextures, (key, t) => {
            t.source.scaleMode = "nearest";
            t.source.autoGenerateMipmaps = false;
        });
    }

    protected clearPrevious() {
        while(this.shadedBlocksC.children.length > 0) {
            this.shadedBlocksC.children[0].destroy();
        }

        while(this.debugGreedyMeshC.children.length > 0) {
            this.debugGreedyMeshC.children[0].destroy();
        }

        this.greedyMeshBlockMap.clear();
    }

    override afterGreedyMesh(boxes: MDV.V4[]): void {
        this.clearPrevious();

        if(this.debugRegionModeFlag) for(const box of boxes) {
            const worldBounds = box.clone().multiplyS(this.engine.blockSize);
            this.debugGreedyMeshC.addChild(new Sprite({
                texture: Texture.WHITE,
                tint: 0xffffff * Math.random(),
                width: worldBounds.w,
                height: worldBounds.h,
                position: worldBounds,
            }));
        }

        for(const box of boxes) {
            const outsidePoints = this.regionMap.getTrulyOutsidePointsWithGrid(box);

            for(let ii = 0; ii < outsidePoints.length; ii++) {
                const outsidePoint = outsidePoints[ii];

                const adjacency = this.findAdjacency(outsidePoint);
                this.onAdjacencyFound(outsidePoint.center, adjacency);
            }
        }

        const shadedBlocks = this.greedyMeshBlockMap.greedyMesh();
        this.addShadedBlocks(shadedBlocks);

        this.onShadingFinish?.();
    }

    abstract onShadingFinish?(): void;

    shadingTextures: Record<ShadeTextureType, Texture> = {
        side: Texture.WHITE,
        corner: Texture.WHITE,
        iCorner: Texture.WHITE,
    };

    abstract initShadingTextures(): Record<ShadeTextureType, Texture>;

    abstract addShadedBlocks(shadedBlocks: Record<string, XYWHR[]>): void;

    private onAdjacencyFound(gridPos: MDV.V2, adjacency: AdjacencyType) {
        gridPos = gridPos.clone();

        var rotation = 0;
        var texture: "side" | "corner" | "iCorner" = "side";
        var debugTextureColor: number | undefined;

        simpleSwitch<AdjacencyType, this>(adjacency, {
            top() {
                rotation = -90;
            },
            bottom() {
                rotation = 90;
            },
            left() {
                rotation = 180;
            },
            right() {
                //console.log(0)
            },
            topLeft() {
                texture = "corner";
                rotation = -90;
            },
            topRight() {
                texture = "corner";
            },
            bottomLeft() {
                texture = "corner";
                rotation = 180;
            },
            bottomRight() {
                texture = "corner";
                rotation = 90;
            },
            bottomLeftIcorner() {
                texture = "iCorner";
                rotation = 90;
            },
            bottomRightIcorner() {
                texture = "iCorner";
            },
            topLeftIcorner() {
                texture = "iCorner";
                rotation = 180;
            },
            topRightIcorner() {
                texture = "iCorner";
                rotation = 270;
            },
            default() {
                console.log(adjacency)
                debugTextureColor = 0xff0000;
            }
        }, this);

        if(debugTextureColor) {
            this.blockTools.placeRedSpriteAt(gridPos);
        } else this.greedyMeshBlockMap.add(
            this.greedyMeshBlockMap.createNameHash(texture, rotation),
            gridPos,
        );
    }

    private checkForIcorner(c: MDV.Some8dirAndCenter<true | undefined>):
    false | AdjacencyType {
        // an iCorner has only 1 blank spot (for now)
        // ###
        // #@#
        // ##

        if(!(c.left && c.right)) return false;

        const corners = {
            bottomLeft: c.bottomLeft,
            bottomRight: c.bottomRight,
            topLeft: c.topLeft,
            topRight: c.topRight
        };

        var countedFalse = 0;
        for(const key in corners)
            if(!corners[key]) countedFalse++;

        if(countedFalse != 1) return false;

        if(!corners.bottomLeft) return "bottomLeftIcorner";
        if(!corners.bottomRight) return "bottomRightIcorner";
        if(!corners.topLeft) return "topLeftIcorner";
        if(!corners.topRight) return "topRightIcorner";

        return false;
    }

    private findAdjacency(c: MDV.Some8dirAndCenter<NonNullable<any> | undefined>): AdjacencyType {
        if(c.bottom && !c.top) {
            // located near top

            if(c.left && c.right) {
                return "top";
            } else if(!c.left && !c.right) {
                return "topU";
            } else if(c.left) {
                return "topRight";
            } else if(c.right) {
                return "topLeft";
            } else MD2errors.ifStatementErr();
        } else if(c.top && !c.bottom) {
            // located near bottom

            if(c.left && c.right) {
                return "bottom";
            } else if(!c.left && !c.right) {
                // console.log(214, "bottomU", c);

                return "bottomU";
            } else if(c.left) {
                return "bottomRight";
            } else if(c.right) {
                return "bottomLeft";
            } else MD2errors.ifStatementErr();
        }

        // can be either !(top && bottom) or both top && bottom

        if(c.left) {
            // located near right

            if(!(c.top && c.bottom)) {
                return "rightU";
            } else if(c.top && c.bottom) {
                // first iCorner check starts here
                // top, bottom, left are all true
                const type = this.checkForIcorner(c);

                if(type) return type;
                else return "right";
            } else if(c.right) {
                return "leftRightPipe";
            } else MD2errors.ifStatementErr();
        } else if(c.right) {
            // located near left

            if(!(c.top && c.bottom)) {
                return "leftU";
            } else if(c.top && c.bottom) {
                // second iCorner check starts here
                // top, bottom, right are all true

                const type = this.checkForIcorner(c);

                if(type) return type;
                else return "left";
            } else MD2errors.ifStatementErr();
        }

        // can be still be either !(top && bottom) and both top && bottom

        if(c.top && c.bottom) {
            return "topDownPipe";
        }

        return "isolated";
    }
}