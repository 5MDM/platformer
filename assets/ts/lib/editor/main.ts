import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { _MD2engine } from "../v2/engine";
import { _setGridBlocks, _setGridF } from "./creator-tools";
import { _editorEl, _toolbarEvents, editorClickArea, isCreatorToolsEnabled } from "./el";
import { RotationHolder, snapToGrid, ToggleState } from "../misc/util";
import { _MD2editorClick } from "./modes/click";
import { Player } from "../v2/entities/player";
import { MDgameGridType } from "../md-framework/game";
import { MDmatrix } from "../misc/matrix";
import { AnyBlock } from "../v2/block";
import { _utilBar, _utilBarEvents } from "./util-bar";
import { _MD2deleteClick } from "./modes/delete";
import { _MD2editorBase } from "./modes/main";
import { _setEngine } from "./left-tabs";

export interface MD2editorOpts {
    engine: _MD2engine;
    el: HTMLDivElement;
}

export var _editorGridBlocks: HTMLElement[];

export function _setEditorGridBlocks(e: HTMLElement[]) {
    _editorGridBlocks = e;
}

export class MD2editor {
    engine: _MD2engine;
    static editorEl = _editorEl;
    player: Player;

    selectedBlock = "";
    selectedBlockType: MDgameGridType = "fg";

    testSprite: TilingSprite;

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

    static creatorToolsState = new ToggleState(() => {}, () => {}, isCreatorToolsEnabled);

    constructor(o: MD2editorOpts) {
        this.engine = o.engine;
        this.player = this.engine.generator.player;

        o.el.appendChild(MD2editor.editorEl);

        this.engine.initPromise.then(() => this.init());

        _setEngine(this.engine);
        _setGridF((name: string) => this.onBlockSelect(name));

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
    }

    private rotateLeft() {
        this.rotation.add(-90);
    }

    private rotateRight() {
        this.rotation.add(90);
    }

    private saveChanges() {
        this.engine.generator.injectBlocks(this.grids);
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
            this.testSprite.position.set(x, y);
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
        s.pivot.set(.5);

        return s;
    }

    private onBlockSelect(name: string) {
        this.selectedBlock = name;
        const info = this.engine.generator.getBlockDef(name);
        if(info) this.selectedBlockType = info.type || "fg";
       
        this.testSprite.destroy();

        this.testSprite = this.createSprite() || new TilingSprite({texture: Texture.WHITE});

        this.engine.levelManager.groups.world.addChild(this.testSprite);
    }

    private init() {
        _setGridBlocks(this.engine.generator.getBlockDefArr());
        this.engine.levelManager.groups.world.addChild(this.testSprite);

        this.setupListeners();
    }
}