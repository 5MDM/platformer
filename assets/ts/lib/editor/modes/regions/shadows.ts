import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { MDV } from "../../../misc/vectors/vectors";
import { FgBlock } from "../../../v2/blocks/blocks";
import { XYWH } from "../../../v2/types";
import { MD2editor } from "../../main";
import { EditorRegionBase } from "./base";
import { $$, degToRad, simpleSwitch, ToggleState } from "../../../misc/util";

const toggleShadowBtn = $$("button", {
    text: "Toggle Shadows"
});

const el = $$("div", {
    children: [
        toggleShadowBtn,
    ],
    style: {
        position: "fixed",
        right: "0",
    }
});

export class EditorRegionShadows extends EditorRegionBase<FgBlock> {
    override getItemF(v2: MDV.V2) {
        return (this.editor.engine.levelManager
        .levelGrids.fg.get(v2.x, v2.y) as FgBlock | undefined);
    }

    override textures = {
        shaded: Texture.WHITE,
        shadeCorner: Texture.WHITE,
    };

    shadowC = new Container();

    init(): void {
        super.init();
        this.editor.engine.levelManager.groups.static.addChild(this.c);

        this.el.appendChild(el);

        toggleShadowBtn.addEventListener("pointerup", this.shadowState.toggle.bind(this));

        this.editor.engine.levelManager.groups.static.addChild(this.shadowC);

        this.textures.shaded = this.editor.engine.dataManager.getTexture("black-fade.png");
        this.textures.shadeCorner = this.editor.engine.dataManager.getTexture("black-fade-corner.png");
    }

    shadowState = new ToggleState(this.onShadowEnable.bind(this), this.onShadowDisable.bind(this));

    onShadowEnable() {
        this.shadowC.visible = true;
    }

    onShadowDisable() {
        this.shadowC.visible = false;
    }

    protected sprites: Sprite[] = [];
    protected shadows: (Sprite | TilingSprite)[] = [];
    protected c = new Container();

    protected clearPrevious() {
        this.c.removeChildren();
        for(const s of this.sprites) s.destroy();
        this.sprites = [];

        this.shadowC.removeChildren();
        for(const s of this.shadows) s.destroy();
        this.shadows = [];
    }

    override onGreedyMesh(boxes: XYWH[]): void {
        this.clearPrevious();

        for(const box of boxes) {
            this.colorBoxes(box);
            this.generateShadows(box);
            this.fillVoid(box);
        }
    }

    fillVoid(box: XYWH) {
        const bounds = MDV.V4.fromBounds(box);
        if(bounds.w <= 2 || bounds.h <= 2) return;

        const ib = bounds.clone();
        ib.x += 1;
        ib.y += 1;
        ib.w -= 2;
        ib.h -= 2;
        ib.multiplyS(this.editor.engine.blockSize);

        const s = new TilingSprite({
            texture: Texture.WHITE,
            position: ib,
            width: ib.w,
            height: ib.h,
        });

        s.tint = 0;

        this.shadowC.addChild(s);
        this.shadows.push(s);
    }

    generateShadows(box: XYWH) {
        const bounds = MDV.V4.fromBounds(box);

        const points = bounds.findAdjacencyForEachOutsidePointUsingGrid(this.regionMap);

        for(const i of points.removedPoints) {
            const bz = this.editor.engine.blockSize;
            const p = i.point!.clone().multiplyS(bz);

            const s = new Sprite({
                texture: Texture.WHITE,
                position: p,
                width: bz,
                height: bz,
            });

            s.tint = 0;

            this.shadowC.addChild(s);
            this.shadows.push(s);
        }

        for(const cell of points.main) {
            const gridCoord = cell.point!.clone();

            const block = this.editor.engine.levelManager.levelGrids.fg
            .get(gridCoord.x, gridCoord.y) as FgBlock;

            if(block) {
                gridCoord.multiplyS(this.editor.engine.blockSize);
                gridCoord.x += this.editor.engine.blockSizeHalf;
                gridCoord.y += this.editor.engine.blockSizeHalf;

                this.shade(gridCoord, cell);
            }
        }
    }

    shade({x, y}: MDV.V2, cell: MDV.V4NeighborCellType) {
        var rotation = 0;
        var texture = this.textures.shaded;
        var invalid = false;

        const th = this.textures;

        simpleSwitch<MDV.V4cellNeighborType, this>(cell.type, {
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
            "top-left-corner"() {
                texture = th.shadeCorner;
                rotation = -90;
            },
            "top-right-corner"() {
                texture = th.shadeCorner;
            },
            "bottom-left-corner"() {
                texture = th.shadeCorner;
                rotation = 180;
            },
            "bottom-right-corner"() {
                texture = th.shadeCorner;
                rotation = 90;
            },
            default() {
                invalid = true;
            }
        }, this);

        const bz = this.editor.engine.blockSize;
        const s = new Sprite({
            texture,
            position: {x, y},
            width: bz,
            height: bz,
            rotation: degToRad(rotation),
            anchor: .5,
        });

        if(invalid) s.texture = Texture.WHITE;

        this.shadowC.addChild(s);
    }

    colorBoxes(box: XYWH) {
        const {x, y, w, h} = MDV.V4.fromBounds(box)
        .multiplyS(this.editor.engine.blockSize);

        const s = new Sprite({
            texture: Texture.WHITE,
            tint: 0xff0000,
            width: w,
            height: h,
            x,
            y,
            alpha: 0.2,
        });

        this.sprites.push(s);
        this.c.addChild(s);
    }
}