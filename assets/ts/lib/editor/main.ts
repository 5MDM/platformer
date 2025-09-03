import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { _MD2engine } from "../v2/engine";
import { MDcreatorToolsUI } from "./creator-tools";
import { _toolbarEvents, editorClickArea } from "./el";
import { degToRad, RotationHolder, snapToGrid, ToggleState } from "../misc/util";
import { _MD2editorClick } from "./modes/click";
import { Player } from "../v2/entities/player";
import { MDmatrix } from "../misc/matrix";
import { AnyBlock } from "../v2/block";
import { _utilBar, _utilBarEvents } from "./util-bar";
import { _MD2deleteClick } from "./modes/delete";
import { _MD2editorBase } from "./modes/main";
import { MDgameGridType } from "../v2/types";

export interface MD2editorOpts {
    engine: _MD2engine;
    el: HTMLDivElement;
}

export const _editorGridBlocks: HTMLElement[] = [];

export function _setEditorGridBlocks(e: HTMLElement[]) {
    _editorGridBlocks.push(...e);
}

export class MD2editor {
    engine: _MD2engine;
    player: Player;

    selectedBlock = "";
    selectedBlockType: MDgameGridType = "fg";
    selectedEntity = "";
    isEntitySelected = false;

    ui: MDcreatorToolsUI;

    testSprite: TilingSprite | Sprite;

    private editorClick: _MD2editorClick;
    private deleteClick: _MD2deleteClick;

    container = new Container();

    static maxLevelSize = 1024;

    grids: Record<MDgameGridType, MDmatrix<AnyBlock>> = {
        fg: new MDmatrix(MD2editor.maxLevelSize, MD2editor.maxLevelSize),
        bg: new MDmatrix(MD2editor.maxLevelSize, MD2editor.maxLevelSize),
        overlay: new MDmatrix(MD2editor.maxLevelSize, MD2editor.maxLevelSize),
    };

    activateEditorMode: _MD2editorBase;

    list: Record<number, AnyBlock> = {};

    rotation = new RotationHolder();

    static creatorToolsState = new ToggleState(() => {}, () => {}, true);

    constructor(o: MD2editorOpts) {
        this.engine = o.engine;
        this.player = this.engine.generator.player;

        this.ui = new MDcreatorToolsUI(this);
        this.ui.bindTo(o.el);

        this.engine.initPromise.then(() => this.init());

        this.ui.onGridButtonSelect = ((type: string, name: string) => {
            if(type == "block") this.onBlockSelect(name);
            else if(type == "entity") this.onEntitySelect(name);
        });

        MD2editor.creatorToolsState.onEnable = function() {
            MDcreatorToolsUI.creatorToolsEl.style.display = "grid";
        };

        MD2editor.creatorToolsState.onDisable = function() {
            MDcreatorToolsUI.creatorToolsEl.style.display = "none";
        };

        this.testSprite = new TilingSprite({
            width: this.engine.blockSize,
            height: this.engine.blockSize,
            texture: Texture.EMPTY,
            alpha: 0.5,
        });

        this.editorClick = new _MD2editorClick(this, editorClickArea);
        this.activateEditorMode = this.editorClick;
        this.editorClick.state.enableIfOff();
        this.editorClick.init();

        this.deleteClick = new _MD2deleteClick(this, editorClickArea);
        this.deleteClick.init();

        this.engine.levelManager.groups.static.addChild(this.container);

        _toolbarEvents.edit.saveChanges = () => this.saveChanges();
        _toolbarEvents.edit.cancelChanges = () => this.cancelChanges();
        _toolbarEvents.edit.toggleCreatorTools = () => {
            MD2editor.creatorToolsState.toggle();

            if(MD2editor.creatorToolsState.isToggled) {
                this.activateEditorMode.state.enableIfOff();
                this.testSprite.visible = true;
            } else {
                this.activateEditorMode.state.disableIfOn();
                this.testSprite.visible = false;
            }
        };

        _utilBarEvents.rotateLeft = () => this.rotateLeft();
        _utilBarEvents.rotateRight = () => this.rotateRight();
        _utilBarEvents.activateDelete = () => {
            this.deleteClick.state.enableIfOff();
            this.activateEditorMode.state.disableIfOn();
            this.activateEditorMode = this.deleteClick;
        };

        this.rotation.onRotation = () => this.onRotation();
    }

    private onEntitySelect(name: string) {
        this.isEntitySelected = true;
        this.selectedEntity = name;
        const s = this.engine.generator.createEntitySprite(name);

        this.testSprite.destroy();

        this.testSprite = s || new TilingSprite({texture: Texture.WHITE, width: 100, height: 100});
    }

    private cancelChanges() {
        this.grids.fg.forEach(block => block.destroy());
        this.grids.bg.forEach(block => block.destroy());
        this.grids.overlay.forEach(block => block.destroy());

        this.grids.fg.clear();
        this.grids.bg.clear();
        this.grids.overlay.clear();
    }

    private onRotation() {
        for(const el of _editorGridBlocks) {
            const img = el.children[0] as HTMLImageElement;
            img.style.transform = `rotate(${this.rotation.deg}deg)`;
        }

        this.testSprite.rotation = degToRad(this.rotation.deg);
    }

    private rotateLeft() {
        this.rotation.add(-90);
    }

    private rotateRight() {
        this.rotation.add(90);
    }

    private saveChanges() {
        this.engine.generator.injectBlocks(this.grids);

        this.cancelChanges();
    }

    snapToGridFromScreen(x: number, y: number, pos: {x: number, y: number} = this.engine.levelManager.groups.view): [number, number] {
        return [
            snapToGrid(
                x,
                pos.x,
                this.engine.blockSize
            ),
            snapToGrid(
                y,
                pos.y, 
                this.engine.blockSize
            ),
        ];
    }

    private setupListeners() {
        addEventListener("pointermove", e => {
            const [x, y] = this.snapToGridFromScreen(e.x, e.y, this.engine.levelManager.groups.view);
            this.testSprite.position.set(x + this.engine.blockSizeHalf, y + this.engine.blockSizeHalf);
        });
    }

    createSprite(): TilingSprite | false {
        if(this.selectedBlock == "") return false;
        const info = this.engine.generator.getBlockDef(this.selectedBlock);
        if(!info) return false;

        const s = this.engine.generator.createSprite({
            x: 0,
            y: 0,
            w: this.engine.blockSize,
            h: this.engine.blockSize,
            name: this.selectedBlock,
            rotation: this.rotation.deg,
        }, info);

        s.alpha = .5;

        s.pivot.set(this.engine.blockSizeHalf);

        return s;
    }

    private onBlockSelect(name: string) {
        this.isEntitySelected = false;
        this.selectedBlock = name;
        const info = this.engine.generator.getBlockDef(name);
        if(info) this.selectedBlockType = info.type || "fg";
       
        this.testSprite.destroy();

        this.testSprite = this.createSprite() || new TilingSprite({texture: Texture.WHITE});

        this.engine.levelManager.groups.world.addChild(this.testSprite);
    }

    private init() {
        this.ui.setGridBlocks(this.engine.generator.getBlockDefArr());
        this.ui.setGridEntities(this.engine.generator.getEntityDefArr());

        this.engine.levelManager.groups.world.addChild(this.testSprite);

        this.setupListeners();
    }
}