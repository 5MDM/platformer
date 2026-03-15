import { Container, Point, Sprite, Texture, TilingSprite } from "pixi.js";
import { MDV } from "../../../misc/vectors/vectors";
import { FgBlock } from "../../../v2/blocks/blocks";
import { XYWH, XYWHR } from "../../../v2/types";
import { MD2editor } from "../../main";
import { EditorRegionBase } from "./base";
import { $$, degToRad, simpleSwitch, ToggleState } from "../../../misc/util";
import { EditorRegionBaseShader } from "./baseShader";
import { MD2errors } from "../../../v2/errors";

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

type GMkeys = "block" | "corner" | "invalid" | "iCorner";

export class EditorRegionShadows extends EditorRegionBaseShader<FgBlock> {
    mustClearPrevious = true;

    override getItemF(v2: MDV.V2) {
        return (this.editor.engine.levelManager
        .levelGrids.fg.get(v2.x, v2.y) as FgBlock | undefined);
    }

    override textures = {
        shaded: Texture.WHITE,
        shadeCorner: Texture.WHITE,
        shadeIcorner: Texture.WHITE,
    };

    init(): void {
        super.init();

        this.el.appendChild(el);

        toggleShadowBtn.addEventListener("pointerup", this.shadowState.toggle.bind(this));

        this.textures.shaded = this.editor.engine.dataManager.getTexture("black-fade.png");
        this.textures.shadeCorner = this.editor.engine.dataManager.getTexture("black-fade-corner.png");
        this.textures.shadeIcorner = this.editor.engine.dataManager.getTexture("black-icorner.png");
    }

    shadowState = new ToggleState(this.onShadowEnable.bind(this), this.onShadowDisable.bind(this));

    onShadowEnable() {
        this.fillsC.visible = true;
    }

    onShadowDisable() {
        this.fillsC.visible = false;
    }

    onVoidFill(ib: MDV.V4): void {
        const s = new TilingSprite({
            texture: Texture.WHITE,
            position: ib,
            width: ib.w,
            height: ib.h,
        });

        s.tint = 0;

        this.fillsC.addChild(s);
        this.fills.push(s);
    }

    shade({x, y}: MDV.V2, cell: MDV.V4NeighborCellType) {
        var rotation = 0;
        var texture = this.textures.shaded;
        var invalid = false;

        var isCorner = false;
        var isIcorner = false;

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
            right() {},
            "top-left-corner"() {
                texture = th.shadeCorner;
                isCorner = true;
                rotation = -90;
            },
            "top-right-corner"() {
                texture = th.shadeCorner;
                isCorner = true;
            },
            "bottom-left-corner"() {
                texture = th.shadeCorner;
                isCorner = true;
                rotation = 180;
            },
            "bottom-right-corner"() {
                texture = th.shadeCorner;
                rotation = 90;
                isCorner = true;
            },
            "bottom-left-icorner"() {
                isIcorner = true;
                rotation = 90;
            },
            "bottom-right-icorner"() {
                isIcorner = true;
            },
            "top-left-icorner"() {
                isIcorner = true;
                rotation = 180;
            },
            "top-right-icorner"() {
                isIcorner = true;
                rotation = 270;
            },
            isolated() {
                MD2errors.err("Isolated shade found at " + `(${x}, ${y})`);
            },
            default() {
                invalid = true;
            }
        }, this);

        var name: GMkeys = "block";
        if(isCorner) name = "corner";
        if(isIcorner) name = "iCorner";
        if(invalid) name = "invalid";

        this.fillMap.add(this.fillMap.createNameHash(
            name,
            rotation,
        ), cell.point!);
    }

    colorBoxes(p: MDV.V4) {
        const {x, y, w, h} = 
        p.multiplyS(this.editor.engine.blockSize);

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

    onGreedyMeshFinish(): void {
        const o: Record<GMkeys, XYWHR[]> = this.fillMap.greedyMesh();
        const bz = this.editor.engine.blockSize;

        if(o.block) for(const i of o.block) 
            this.generateBlock(MDV.V4.fromBounds(i).multiplyS(bz), degToRad(i.rotation));

        if(o.corner) for(const i of o.corner) 
            this.generateCorner(MDV.V4.fromBounds(i).multiplyS(bz), degToRad(i.rotation));

        if(o.iCorner) for(const i of o.iCorner) 
            this.generateIcorner(MDV.V4.fromBounds(i).multiplyS(bz), degToRad(i.rotation));

        if(o.invalid) for(const i of o.invalid) 
            this.generateInvalid(MDV.V4.fromBounds(i).multiplyS(bz), degToRad(i.rotation));
    }

    generateBlock(b: MDV.V4, r: number) {
        const t = this.textures.shaded;

        const s = new TilingSprite({
            tileRotation: r,
            position: b,
            tileScale: new MDV.V4(
                this.editor.engine.blockSize / t.width,
                this.editor.engine.blockSize / t.height,
            ),
            width: b.w + .1,
            height: b.h + .1,
            texture: t,
        });

        this.fillsC.addChild(s);
        this.fills.push(s);
    }

    generateIcorner(b: MDV.V4, r: number) {
        const t = this.textures.shadeIcorner;

        const s = new TilingSprite({
            tileRotation: r,
            position: b,
            tileScale: new MDV.V4(
                this.editor.engine.blockSize / t.width,
                this.editor.engine.blockSize / t.height,
            ),
            width: b.w + .1,
            height: b.h + .1,
            texture: t
        });

        this.fillsC.addChild(s);
        this.fills.push(s);
    }

    generateCorner(b: MDV.V4, r: number) {
        const t = this.textures.shadeCorner;

        const s = new TilingSprite({
            tileRotation: r,
            position: b,
            tileScale: new MDV.V4(
                this.editor.engine.blockSize / t.width,
                this.editor.engine.blockSize / t.height,
            ),
            width: b.w + .1,
            height: b.h + .1,
            texture: t,
        });

        this.fillsC.addChild(s);
        this.fills.push(s);
    }

    generateInvalid(b: MDV.V4, r: number) {
        const s = new TilingSprite({
            tileRotation: r,
            position: b,
            width: b.w,
            height: b.h,
            texture: Texture.WHITE,
        });

        this.fillsC.addChild(s);
        this.fills.push(s);
    }
}