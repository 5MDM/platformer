import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { DragController } from "../drag";
import { $$, degToRad, floorToMultiples, snapToGrid, ToggleList, ToggleState } from "../util";
import { MDmatrix } from "../matrix";
import { BlockInfo, MDshell } from "./shell";
import { blockRotation } from "../../game/dev/studio";
import { PWS } from "../physics/objects";
import { GMOutput, Keymap } from "../keymap";
import { MD2Columntable, tr } from "../el";
import { Block, FgBlock } from "./unit";
import { checkIfComponentsAreEqual } from "./components";

type EditorKeybinds = 
"multi placement" | "edit" | "rotate right" | "rotate left" | "level editor" | "movement" | "pan";

type StateNames = "multiplacement" | "edit" | "delete";

export interface GameScaleObj {
    x: number;
    y: number;
    nx: number;
    ny: number;
}

interface EditorToolsOpts {
    shell: MDshell;
    keybinds: Record<string, EditorKeybinds>;
    dragController: DragController;
    controlState: ToggleState;
    editorEl: HTMLElement;
    devSprite: TilingSprite;
    gameScaleF: (percent: number) => void;
    onRotate: (degree: number) => void;
    fgListEl: HTMLDivElement;
    bgListEl: HTMLDivElement;
    gameScale: GameScaleObj;
    maxLevelSize: number;
    moveStateImg: HTMLImageElement;
    blockDataPopupElContainer: HTMLElement;
}

export class EditorTools {
    mdshell: MDshell;
    dragController: DragController;
    controlState: ToggleState;
    editorEl: HTMLElement;
    devSprite: TilingSprite;
    clearListArr: ToggleList[] = [];
    gameScaleF: (percent: number) => void;
    gameScale: GameScaleObj;
    blockDataPopupEl: HTMLElement = $$("div", {
        attrs: {
            id: "editor-tools-data-popup"
        },
        style: {
            display: "none",
        },
        children: [
            $$("table", {
                children: [
                    $$("colgroup", {
                        children: [
                            $$("col", {
                                style: {
                                    width: "100px"
                                }
                            }),
                        ]
                    }),
                    tr(
                        $$("th", {
                            text: "Name"
                        }),
                        $$("th", {
                            text: "Data"
                        }),
                    ),
                    tr(
                        $$("td", {
                            text: "Block Display Name"
                        }),
                        $$("td", {
                            attrs: {id: "block-display"},
                            text: "----"
                        }),
                    ),
                    tr(
                        $$("td", {
                            text: "Block Internal Name"
                        }),
                        $$("td", {
                            attrs: {id: "block-name"},
                            text: "----"
                        }),
                    ),
                    tr(
                        $$("td", {
                            text: "Block Type"
                        }),
                        $$("td", {
                            attrs: {id: "block-type"},
                            text: "----"
                        }),
                    ),
                    tr(
                        $$("td", {
                            text: "Components"
                        }),
                        $$("td", {
                            attrs: {id: "block-components"},
                            text: "----"
                        }),
                    ),
                ]
            }),
        ]
    });

    isTyping: boolean = false;

    fgListEl: HTMLDivElement;
    bgListEl: HTMLDivElement;
    selectedBlockName: string = "";

    hasInitialPlacement = false;
    MPix = 0;
    MPiy = 0;

    spriteArr: Sprite[] = [];
    editedBlocks: Record<number, PWS> = {};
    editorC = new Container();
    blockRecord: Record<string, MDmatrix<true>> = {};
    maxLevelSize: number;

    moveStateImg: HTMLImageElement;

    private spriteOutline: Sprite;

    constructor(o: EditorToolsOpts) {
        this.mdshell = o.shell;
        this.controlState = o.controlState;
        this.dragController = o.dragController;
        this.editorEl = o.editorEl;
        this.devSprite = o.devSprite;
        this.gameScaleF = o.gameScaleF;
        this.onRotate = o.onRotate;
        this.gameScale = o.gameScale;
        this.maxLevelSize = o.maxLevelSize;
        o.blockDataPopupElContainer.appendChild(this.blockDataPopupEl);

        this.fgListEl = o.fgListEl;
        this.bgListEl = o.bgListEl;

        this.setKeybinds(o.keybinds);

        this.dragController.defaultGrab = "grab";
        this.dragController.defaultGrabbing = "grabbing";
        this.switchToPanMode();

        this.dragController.downElement.addEventListener("mousemove", ({x, y}) => {
            if(!this.levelEditorState.isToggled) return;
            if(this.multiPlacementState.isToggled) this.multiPlacementHover(x, y);
            else this.placeHover(x, y);
        });

        this.editorC.zIndex = 1;
        this.mdshell.game.groups.static.addChild(this.editorC);
        this.moveStateImg = o.moveStateImg;

        document.addEventListener("pointerlockchange", e => {
            if(!document.pointerLockElement) this.movementState.disableIfOn(); 
        });

        this.spriteOutline = new Sprite({
            width: this.mdshell.blockSize,
            height: this.mdshell.blockSize,
            texture: Texture.WHITE,
            alpha: .3,
            tint: 0xfff000,
            visible: false,
        });

        this.mdshell.game.groups.view.addChild(this.spriteOutline);

        this.setupCloseButton();
    }

    private setupCloseButton() {
        const el = $$("button", {
            style: {
                width: "100%",
                padding: "5px",
                "margin-top": "5px",
            }, 
            text: "Close"
        });

        const self = this;

        el.onpointerup = function() {
            self.blockDataPopupElState.disableIfOn();
            //self.updateComponents();
        };

        this.blockDataPopupEl.appendChild(el);
    }

    multiPlacementHover(x: number, y: number) {
        x *= this.gameScale.x;
        y *= this.gameScale.y;
    
        const fx = 
        snapToGrid(x - this.mdshell.player.halfWS - this.mdshell.game.container.x * this.gameScale.x - this.mdshell.game.groups.world.x + this.mdshell.player.x, 0, this.mdshell.blockSize);
        const fy = 
        snapToGrid(y - this.mdshell.player.halfHS - this.mdshell.game.container.y * this.gameScale.y - this.mdshell.game.groups.world.y + this.mdshell.player.y, 0, this.mdshell.blockSize);
        
        const cursorX = floorToMultiples(this.mdshell.player.x + x - this.mdshell.player.halfWS - this.mdshell.game.groups.world.x - this.mdshell.game.container.x * this.gameScale.x, this.mdshell.blockSize) / this.mdshell.blockSize;
        const cursorY = floorToMultiples(this.mdshell.player.y + y - this.mdshell.player.halfHS - this.mdshell.game.groups.world.y - this.mdshell.game.container.y * this.gameScale.y, this.mdshell.blockSize) / this.mdshell.blockSize;
    
        const bool = this.mdshell.pw.staticGrid.isOOB(cursorX, cursorY);
        this.dragController.CAD(bool);
    
        if(!this.hasInitialPlacement) {
            this.setDevSpritePos(fx, fy);
        } else this.resize(fx, fy);
    }

    private resize0(ix: number, iy: number, fx: number, fy: number) {
        const dx = fx - ix;
        const dy = fy - iy;
    
        if(dx > 0) {
            this.devSprite.x = ix + this.mdshell.blockSizeHalf;
            this.devSprite.width = dx + this.mdshell.blockSize;
        } else {
            this.devSprite.x = fx + this.mdshell.blockSizeHalf;
            this.devSprite.width = -dx + this.mdshell.blockSize;
        }
    
        if(dy > 0) {
            this.devSprite.height = dy + this.mdshell.blockSize;
            this.devSprite.y = iy + this.mdshell.blockSizeHalf;
        } else {
            this.devSprite.y = fy + this.mdshell.blockSizeHalf;
            this.devSprite.height = -dy + this.mdshell.blockSize;
        }
    }
    
    private resize90(ix: number, iy: number, fx: number, fy: number) {
        const right = ix - fx; // left
        const up = fy - iy; // up
    
        if(up > 0) {
            this.devSprite.width = up + this.mdshell.blockSize;
            this.devSprite.y = iy + this.mdshell.blockSizeHalf;
        } else {
            this.devSprite.width = -up + this.mdshell.blockSize;
            this.devSprite.y = fy + this.mdshell.blockSizeHalf;
        }
    
        if(right > 0) {
            this.devSprite.height = right + this.mdshell.blockSize;
            this.devSprite.x = ix + this.mdshell.blockSizeHalf;
        } else {
            this.devSprite.height = -right + this.mdshell.blockSize;
            this.devSprite.x = fx + this.mdshell.blockSizeHalf;
        }
    }
    
    private resize180(ix: number, iy: number, fx: number, fy: number) {
        const up = iy - fy;
        const left = ix - fx;
    
        if(left > 0) {
            this.devSprite.x = ix + this.mdshell.blockSizeHalf;
            this.devSprite.width = left + this.mdshell.blockSize;
        } else {
            this.devSprite.x = fx + this.mdshell.blockSizeHalf;
            this.devSprite.width = -left + this.mdshell.blockSize;
        }
    
        if(up > 0) {
            this.devSprite.height = up + this.mdshell.blockSize;
            this.devSprite.y = iy + this.mdshell.blockSizeHalf;
        } else {
            this.devSprite.y = fy + this.mdshell.blockSizeHalf;
            this.devSprite.height = -up + this.mdshell.blockSize;
        }
    }
    
    private resize270(ix: number, iy: number, fx: number, fy: number) {
        const right = fx - ix; // left
        const up = iy - fy; // up
    
        if(up > 0) {
            this.devSprite.width = up + this.mdshell.blockSize;
            this.devSprite.y = iy + this.mdshell.blockSizeHalf;
        } else {
            this.devSprite.width = -up + this.mdshell.blockSize;
            this.devSprite.y = fy + this.mdshell.blockSizeHalf;
        }
    
        if(right > 0) {
            this.devSprite.height = right + this.mdshell.blockSize;
            this.devSprite.x = ix + this.mdshell.blockSizeHalf;
        } else {
            this.devSprite.height = -right + this.mdshell.blockSize;
            this.devSprite.x = fx + this.mdshell.blockSizeHalf;
        }
    }

    private resize(fx: number, fy: number) {
        if(blockRotation == 0) this.resize0(this.MPix, this.MPiy, fx, fy);
        else if(blockRotation == 90) this.resize90(this.MPix, this.MPiy, fx, fy);
        else if(blockRotation == 180) this.resize180(this.MPix, this.MPiy, fx, fy);
        else if(blockRotation == 270) this.resize270(this.MPix, this.MPiy, fx, fy);
    }

    private multiPlacementFinalize() {
        var xx = 0;
        var yy = 0;
        var w = 0;
        var h = 0;
    
        if(blockRotation == 0) {
            w = Math.round(this.devSprite.width / this.mdshell.blockSize);
            h = Math.round(this.devSprite.height / this.mdshell.blockSize);
            xx = this.devSprite.x;
            yy = this.devSprite.y;
        } else if(blockRotation == 90) {
            h = Math.round(this.devSprite.width / this.mdshell.blockSize);
            w = Math.round(this.devSprite.height / this.mdshell.blockSize);
            xx = this.devSprite.x - this.devSprite.height + this.mdshell.blockSize;
            yy = this.devSprite.y;
        } else if(blockRotation == 180) {
            w = Math.round(this.devSprite.width / this.mdshell.blockSize);
            h = Math.round(this.devSprite.height / this.mdshell.blockSize);
            xx = this.devSprite.x - this.devSprite.width + this.mdshell.blockSize;
            yy = this.devSprite.y - this.devSprite.height + this.mdshell.blockSize;
        } else if(blockRotation == 270) {
            h = Math.round(this.devSprite.width / this.mdshell.blockSize);
            w = Math.round(this.devSprite.height / this.mdshell.blockSize);
            xx = this.devSprite.x;
            yy = this.devSprite.y - this.devSprite.width + this.mdshell.blockSize;
        }
    
        const x = 
        floorToMultiples(xx - this.mdshell.game.container.x + this.gameScale.nx + this.mdshell.player.halfW, this.mdshell.blockSize) / this.mdshell.blockSize;
        const y = 
        floorToMultiples(yy - this.mdshell.game.container.y + this.gameScale.ny + this.mdshell.player.halfH, this.mdshell.blockSize) / this.mdshell.blockSize;
    
        const s = this.mdshell.createBlock({
            x, y, w, h, name: this.selectedBlockName, 
            rotation: degToRad(blockRotation),
        });
        
        this.devSprite.width = this.mdshell.blockSize;
        this.devSprite.height = this.mdshell.blockSize;
    }

    invokePan(x: number, y: number) {
        this.editorPan(x, y);
    }

    switchToPanMode() {
        this.dragController.onDrag = (x, y) => this.editorPan(x, y);
        this.dragController.setCursorToDefault();
    }

    private editorPan(x: number, y: number) {
        this.mdshell.game.groups.world.x -= x * this.gameScale.x;
        this.mdshell.game.groups.world.y -= y * this.gameScale.y;
    }

    onRotate: ((r: number) => void);

    private movementStateDownF = ({movementX, movementY}: MouseEvent) => this.invokePan(-movementX, -movementY);

    movementState = new ToggleState(() => {
        this.dragController.changeGrab("none");
        this.dragController.changeGrabbingAndCurrentCursor("none");
        this.moveStateImg.style.display = "block";
    
        this.mdshell.app.canvas.requestPointerLock()
        .catch(err => MDshell.Err(err));
    
        document.documentElement.addEventListener("mousemove", this.movementStateDownF);
    }, () => {
        this.dragController.setCursorToDefault();
        this.moveStateImg.style.display = "none";

        document.exitPointerLock();
        document.documentElement.removeEventListener("mousemove", this.movementStateDownF);

        if(!this.levelEditorState.isToggled) {
            this.mdshell.game.groups.world.x = 0;
            this.mdshell.game.groups.world.y = 0;
        }

        if(this.levelEditorState.isToggled) this.dragController.setCursorToDefault();
        else {
            this.dragController.changeDefaultAndNormalGrabbing("default");
            this.dragController.changeDefaultandNormalGrab("default");
            this.dragController.setCursorToDefault();
        }
    });

    private multiPlacementListenerDownF = (e: PointerEvent) => this.onPlacementModeDown(e);

    private finalizeSinglePlacementfinalizeEdits() {
        if(!this.hasInitialPlacement) return;
        this.hasInitialPlacement = false;
    
        for(const s of this.spriteArr) s.destroy();
        while(this.spriteArr.length != 0) this.spriteArr.pop();
    
        for(const blockId in this.blockRecord) {
            const [blockName, rotationDeg] = blockId.split(",");
            const rotationRad = degToRad(Number(rotationDeg));
    
            const boxes: GMOutput[] = 
            Keymap.GMBool(this.blockRecord[blockId].matrix, this.selectedBlockName);
            
            for(const {x, y, w, h} of boxes) {
                this.mdshell.createBlock({
                    x, y, w, h, name: blockName, rotation: rotationRad,
                });
            }
    
            delete this.blockRecord[blockId];
        } 

    }

    multiPlacementState = new ToggleState(() => {
        if(this.hasInitialPlacement) {
            this.finalizeSinglePlacementfinalizeEdits();
            this.hasInitialPlacement = false;
        }

        this.resetDevSprite();
        this.switchToPanMode();
        this.dragController.touchEl.addEventListener("pointerdown", this.multiPlacementListenerDownF);

        this.activeStates.multiplacement = this.multiPlacementState;
    }, () => {
        this.dragController.touchEl.removeEventListener("pointerdown", this.multiPlacementListenerDownF);
        this.hasInitialPlacement = false;
        if(this.placementModeState.isToggled) this.dragController.onDrag = (rx, ry, x, y) => this.placeBlock(rx, ry, x, y);

        this.activeStates.multiplacement = null;
    });

    private onPlacementModeDown(e: PointerEvent) {
        if(this.levelEditorState.isToggled) this.placeRow(0, 0, e.x, e.y);
    }

    private placeRow(rx: number, ry: number, x: number, y: number) {
        x *= this.gameScale.x;
        y *= this.gameScale.y;
        const cursorX = 
        floorToMultiples(this.mdshell.player.x + x - this.mdshell.player.halfWS - this.mdshell.game.groups.world.x - this.mdshell.game.container.x * this.gameScale.x, this.mdshell.blockSize)  /this.mdshell.blockSize;
        const cursorY = 
        floorToMultiples(this.mdshell.player.y + y - this.mdshell.player.halfHS - this.mdshell.game.groups.world.y - this.mdshell.game.container.y * this.gameScale.y, this.mdshell.blockSize) / this.mdshell.blockSize;
    
        const bool = this.mdshell.pw.staticGrid.isOOB(cursorX, cursorY);
        if(bool) return this.dragController.CAD(true);
    
        const fx = 
        snapToGrid(x - this.mdshell.player.halfWS - this.mdshell.game.container.x * this.gameScale.x - this.mdshell.game.groups.world.x + this.mdshell.player.x, 0, this.mdshell.blockSize);
        const fy = 
        snapToGrid(y - this.mdshell.player.halfHS - this.mdshell.game.container.y * this.gameScale.y - this.mdshell.game.groups.world.y + this.mdshell.player.y, 0, this.mdshell.blockSize);
        
        if(!this.hasInitialPlacement) {
            this.hasInitialPlacement = true;
            this.MPix = fx;
            this.MPiy = fy;
            this.setDevSpritePos(fx, fy);
        } else {
            // placing
            this.multiPlacementFinalize();
            this.hasInitialPlacement = false;
            this.setDevSpritePos(0 , 0);
            this.devSprite.width = this.mdshell.blockSize;
            this.devSprite.height = this.mdshell.blockSize;
        }
    }

    private placeBlock(rx: number, ry: number, x: number, y: number) {
        x *= this.gameScale.x;
        y *= this.gameScale.y;
    
        const fx = floorToMultiples(this.mdshell.player.x + x - this.mdshell.player.halfWS - this.mdshell.game.container.x * this.gameScale.x - this.mdshell.game.groups.world.x, this.mdshell.blockSize) / this.mdshell.blockSize;
        const fy = floorToMultiples(this.mdshell.player.y + y - this.mdshell.player.halfHS - this.mdshell.game.container.y * this.gameScale.y - this.mdshell.game.groups.world.y, this.mdshell.blockSize) / this.mdshell.blockSize;
    
        if(this.mdshell.game.editGrid.isOOB(fx, fy)) return this.dragController.CAD(true);
        if(this.mdshell.game.editGrid.place(fx, fy, this.selectedBlockName)) return;
    
        try {
            const got = this.mdshell.pw.staticGrid.get(fx, fy);
            if(got) {
                if(!this.editedBlocks[got.id]) {
                    this.editedBlocks[got.id] = got;
                }
            }
        } catch(err: unknown) {
            return;
        }
    
        this.hasInitialPlacement = true;
        const blockId = this.selectedBlockName + "," + blockRotation;
        const rotationRad = degToRad(blockRotation);
    
        if(!this.blockRecord[blockId]) 
            this.blockRecord[blockId] = new MDmatrix<true>(this.maxLevelSize, this.maxLevelSize);
    
        const map = this.blockRecord[blockId];
        map.set(fx, fy, true);
    
        const s = new Sprite({
            x: fx * this.mdshell.blockSize + this.mdshell.blockSizeHalf,
            y: fy * this.mdshell.blockSize + this.mdshell.blockSizeHalf,
            width: this.mdshell.blockSize,
            height: this.mdshell.blockSize,
            texture: this.devSprite.texture,
            pivot: this.devSprite.texture.width/2,
            rotation: rotationRad,
        });
    
        this.spriteArr.push(s);
        this.editorC.addChild(s);
    }

    private resetDevSprite() {
        this.devSprite.width = this.mdshell.blockSize;
        this.devSprite.height = this.mdshell.blockSize;
    }

    placementModeState = new ToggleState(() => {
        this.resetDevSprite();
        if(this.multiPlacementState.isToggled) {
            this.switchToPanMode();
            this.dragController.touchEl.addEventListener("pointerdown", this.multiPlacementListenerDownF);
        } else {
            this.dragController.onDrag = (rx, ry, x, y) => this.placeBlock(rx, ry, x, y);
        }
    
        this.dragController.changeDefaultAndNormalGrabbing("pointer");
        this.dragController.changeDefaultandNormalGrab("crosshair");
        this.devSprite.visible = true;
    }, () => {
        this.switchToPanMode();
        this.devSprite.visible = false;
        this.dragController.changeDefaultandNormalGrab("grab");
        this.dragController.changeDefaultAndNormalGrabbing("grabbing");
    });

    activeStates: Record<StateNames, ToggleState | null> = {
        edit: null,
        multiplacement: null,
        delete: null,
    };
    
    levelEditorState = new ToggleState(() => {
        this.mdshell.pw.stopClock();
        this.mdshell.app.stage.scale = 1;
        this.controlState.disableIfOn();
        this.dragController.enable();
        this.editorEl.style.display = "flex";
        this.dragController.changeDefaultandNormalGrab("grab");
        this.dragController.changeDefaultAndNormalGrabbing("grabbing");
        
        this.placementModeState.disableIfOn();
        this.mdshell.game.groups.view.addChild(this.devSprite);

        for(const name in this.activeStates) {
            const state = this.activeStates[name as StateNames];
            if(!state) continue;
            
            state.enableIfOff();
        }
    }, () => {
        this.mdshell.pw.startClock();
        this.gameScaleF(0);
        this.dragController.disable();
        this.mdshell.game.groups.world.x = 0;
        this.mdshell.game.groups.world.y = 0;        
        this.controlState.enableIfOff();
    
        this.editorEl.style.display = "none";

        this.devSprite.visible = false;
    
        this.dragController.changeDefaultAndNormalGrabbing("default");
        this.dragController.changeDefaultandNormalGrab("default");
        this.dragController.setCursorToDefault();

        //this.multiPlacementState.disableIfOn();
        this.finalizeSinglePlacementfinalizeEdits();

        for(const list of this.clearListArr) list.clear();
    
        this.movementState.disableIfOn();  
        this.mdshell.game.groups.view.removeChild(this.devSprite);

        this.blockDataPopupElState.disableIfOn();
    
        for(const name in this.activeStates) {
            const state = this.activeStates[name as StateNames];
            if(!state) continue;
            
            state.disableIfOn();
            this.activeStates[name as StateNames] = state;
        }
    });

    setKeybinds(keybinds: Record<string, EditorKeybinds>) {
        addEventListener("keydown", ({key}) => {
            const got: undefined | EditorKeybinds = keybinds[key];
            if(!got) return;

            switch(got) {
                case "multi placement": this.multiPlacementState.toggle(); break;
                case "edit": this.editState.toggle(); break;
                case "level editor": this.levelEditorState.toggle(); break;
                case "rotate left": this.onRotate(90); break;
                case "rotate right": this.onRotate(-90); break;
                case "movement": this.movementState.toggle(); break;
                case "pan": this.placementModeState.disableIfOn(); this.switchToPanMode(); break;
            }
        });
    }

    init(images: HTMLImageElement[]) {
        const fgImages: HTMLImageElement[] = [];
        const bgImages: HTMLImageElement[] = [];
    
        for(const image of images) {
            const name = image.getAttribute("data-name")!;
            const {type} = this.mdshell.getBlockInfo(name);
    
            if(type != "fg") bgImages.push(image);
            else fgImages.push(image);
        }
    
        const fgList = new ToggleList(fgImages, (el) => {
            this.placementModeState.enableIfOff();
    
            this.selectedBlockName = el.getAttribute("data-name")!;
            el.classList.add("toggled");
    
            this.devSprite.texture = this.mdshell.getTexture(this.selectedBlockName!);
            this.devSprite.tileScale = {
                x: this.mdshell.blockSize / this.devSprite.texture.width,
                y: this.mdshell.blockSize / this.devSprite.texture.height,
            };
    
        }, (el) => {
            el.classList.remove("toggled");
        }, this.fgListEl);
        
        const bgList = new ToggleList(bgImages, (el) => {
            if(!this.placementModeState.isToggled) this.placementModeState.toggle();
            
            this.selectedBlockName = el.getAttribute("data-name")!;
            el.classList.add("toggled");
    
            this.devSprite.texture = this.mdshell.getTexture(this.selectedBlockName!);
            this.devSprite.tileScale = {
                x: this.mdshell.blockSize / this.devSprite.texture.width,
                y: this.mdshell.blockSize / this.devSprite.texture.height,
            };
        }, (el) => {
            el.classList.remove("toggled");
        }, this.bgListEl);

        const self = this;
    
        this.fgListEl.prepend($$("button", {
            text: "Pan",
            up() {
                fgList.clear();
                bgList.clear();
                if(self.placementModeState.isToggled) self.placementModeState.toggle();
            },
        }));
    
        this.bgListEl.prepend($$("button", {
            text: "Pan",
            up() {
                fgList.clear();
                bgList.clear();
                if(self.placementModeState.isToggled) self.placementModeState.toggle();
            },
        }));

        this.clearListArr.push(fgList);
        this.clearListArr.push(bgList);
    }

    private placeHover(x: number, y: number) {
        x *= this.gameScale.x;
        y *= this.gameScale.y;
    
        const fx = 
        snapToGrid(x - this.mdshell.player.halfWS - this.mdshell.game.container.x * this.gameScale.x - this.mdshell.game.groups.world.x + this.mdshell.player.x, 0, this.mdshell.blockSize);
        const fy = 
        snapToGrid(y - this.mdshell.player.halfHS - this.mdshell.game.container.y * this.gameScale.y - this.mdshell.game.groups.world.y + this.mdshell.player.y, 0, this.mdshell.blockSize);
        
        const cursorX = floorToMultiples(this.mdshell.player.x + x - this.mdshell.player.halfWS - this.mdshell.game.groups.world.x - this.mdshell.game.container.x * this.gameScale.x, this.mdshell.blockSize) / this.mdshell.blockSize;
        const cursorY = floorToMultiples(this.mdshell.player.y + y - this.mdshell.player.halfHS - this.mdshell.game.groups.world.y - this.mdshell.game.container.y * this.gameScale.y, this.mdshell.blockSize) / this.mdshell.blockSize;
    
        const bool = this.mdshell.pw.staticGrid.isOOB(cursorX, cursorY);
        this.dragController.CAD(bool);
    

        this.setDevSpritePos(fx, fy);
    }

    private setDevSpritePos(x: number, y: number) {
        this.devSprite.position.set(x + this.mdshell.blockSizeHalf, y + this.mdshell.blockSizeHalf);
    }

    private changeSpriteOutlinePos(x: number, y: number) {
        x *= this.gameScale.x;
        y *= this.gameScale.y;
    
        const fx = 
        snapToGrid(x - this.mdshell.player.halfWS - this.mdshell.game.container.x * this.gameScale.x - this.mdshell.game.groups.world.x + this.mdshell.player.x, 0, this.mdshell.blockSize);
        const fy = 
        snapToGrid(y - this.mdshell.player.halfHS - this.mdshell.game.container.y * this.gameScale.y - this.mdshell.game.groups.world.y + this.mdshell.player.y, 0, this.mdshell.blockSize);
        
        const cursorX = floorToMultiples(this.mdshell.player.x + x - this.mdshell.player.halfWS - this.mdshell.game.groups.world.x - this.mdshell.game.container.x * this.gameScale.x, this.mdshell.blockSize) / this.mdshell.blockSize;
        const cursorY = floorToMultiples(this.mdshell.player.y + y - this.mdshell.player.halfHS - this.mdshell.game.groups.world.y - this.mdshell.game.container.y * this.gameScale.y, this.mdshell.blockSize) / this.mdshell.blockSize;


        this.spriteOutline.x = fx;
        this.spriteOutline.y = fy;

        /*
        const bool = this.mdshell.pw.staticGrid.isOOB(cursorX, cursorY);
        this.dragController.CAD(bool);
        if(bool) return;
        */
        //if(this.mdshell.game.editGrid.isOOB(fx, fy)) return this.dragController.CAD(true);
        
        const blockRef = this.mdshell.game.grids.fg.get(cursorX, cursorY);

        if(!blockRef) {
            this.dragController.changeGrab("not-allowed");
        } else {
            this.dragController.changeGrab("pointer")
        }
    }

    private setBlockDataPopupEntry(id: string, val: string) {
        const el = this.blockDataPopupEl.querySelector("#" + id);
        if(!el) return;
        
        el.textContent = val;
    }

    private lastEditedBlock?: FgBlock;
    private lastBlockInfo?: BlockInfo;

    private updateComponents() {
        if(!this.lastEditedBlock?.components || !this.lastBlockInfo?.components) return;

        const isEqual = 
        checkIfComponentsAreEqual(this.lastEditedBlock.components, this.lastBlockInfo.components);

        if(isEqual) {
            delete this.lastEditedBlock.components;
            this.lastEditedBlock.hasCustomComponents = false;
        }
        else {
            this.lastEditedBlock.hasCustomComponents = true;
        }

        this.lastBlockInfo = undefined;
        this.lastEditedBlock = undefined;
    }

    private updateBlockDataPopup(data: FgBlock) {
        this.updateComponents();
        const blockInfo = this.mdshell.getBlockInfo(data.name);
        this.setBlockDataPopupEntry("block-display", blockInfo.name);
        this.setBlockDataPopupEntry("block-name", data.name);
        this.setBlockDataPopupEntry("block-type", data.isOverlay ? "Foreground Overlay" : "Foreground");

        this.setBlockDataPopupEntry("block-components", "");
        if(blockInfo.components) {
            if(Object.keys(blockInfo.components).length == 0)
                this.setBlockDataPopupEntry("block-components", "No components");
            else {
                const el = this.blockDataPopupEl.querySelector("#block-components")!;

                if(el.children.length > 1) el.removeChild(el.firstChild!);

                const mdTable = new MD2Columntable();

                if(!data.components) data.components = structuredClone(blockInfo.components);
                const tableEl = mdTable.parseJSON<Record<string, Record<string, any>>>(data.components);
                this.lastEditedBlock = data;
                this.lastBlockInfo = blockInfo;

                el.prepend(tableEl);
            }
        } else this.setBlockDataPopupEntry("block-components", "No components");
    }

    blockDataPopupElState = new ToggleState(() => {
        this.blockDataPopupEl.style.display = "block";
    }, () => {
        this.blockDataPopupEl.style.display = "none";
        this.updateComponents();
    });

    private onEditStateClick(x: number, y: number) {
        x *= this.gameScale.x;
        y *= this.gameScale.y;
    
        const fx = floorToMultiples(this.mdshell.player.x + x - this.mdshell.player.halfWS - this.mdshell.game.container.x * this.gameScale.x - this.mdshell.game.groups.world.x, this.mdshell.blockSize) / this.mdshell.blockSize;
        const fy = floorToMultiples(this.mdshell.player.y + y - this.mdshell.player.halfHS - this.mdshell.game.container.y * this.gameScale.y - this.mdshell.game.groups.world.y, this.mdshell.blockSize) / this.mdshell.blockSize;
    
        if(this.mdshell.game.editGrid.isOOB(fx, fy)) return this.dragController.CAD(true);

        const blockRef = this.mdshell.game.grids.fg.get(fx, fy);
        if(!blockRef) return this.dragController.CAD(true);

        const block = this.mdshell.game.blocks.fg[blockRef.pws.id];

        this.blockDataPopupElState.enableIfOff();
        this.updateBlockDataPopup(block);
    }

    private editStateMoveF = (e: PointerEvent) => this.changeSpriteOutlinePos(e.pageX, e.pageY);
    private editStateClickF = (e: MouseEvent) => this.onEditStateClick(e.x, e.y);

    editState = new ToggleState(() => {
        this.placementModeState.disableIfOn();
        this.spriteOutline.visible = true;
        this.dragController.downElement.addEventListener("pointermove", this.editStateMoveF);
        this.dragController.downElement.addEventListener("click", this.editStateClickF);
        this.activeStates.edit = this.editState;
    }, () => {
        this.blockDataPopupElState.disableIfOn();
        this.spriteOutline.visible = false;
        this.dragController.downElement.removeEventListener("pointermove", this.editStateMoveF);
        this.dragController.downElement.removeEventListener("click", this.editStateClickF);
        this.activeStates.edit = null;
        this.updateComponents();
    });

    private deleteStateMoveF = (a: number, b: number, x: number, y: number) => this.deleteStateMove(x, y);

    private deleteStateMove(x: number, y: number) {
        x *= this.gameScale.x;
        y *= this.gameScale.y;
    
        const fx = floorToMultiples(this.mdshell.player.x + x - this.mdshell.player.halfWS - this.mdshell.game.container.x * this.gameScale.x - this.mdshell.game.groups.world.x, this.mdshell.blockSize) / this.mdshell.blockSize;
        const fy = floorToMultiples(this.mdshell.player.y + y - this.mdshell.player.halfHS - this.mdshell.game.container.y * this.gameScale.y - this.mdshell.game.groups.world.y, this.mdshell.blockSize) / this.mdshell.blockSize;
    
        if(this.mdshell.game.editGrid.isOOB(fx, fy)) return this.dragController.CAD(true);

        const overlay = this.mdshell.game.grids.overlay.get(fx, fy);
        if(!overlay) {
            const fg = this.mdshell.game.grids.fg.get(fx, fy);

            if(!fg) {
                const bg = this.mdshell.game.grids.bg.get(fx, fy);

                if(!bg) return;
                this.deleteBg(fx, fy);
            } else this.deleteFg(fx, fy);
        } else this.deleteOverlay(fx, fy);
    }

    private deleteFg(x: number, y: number) {
        this.mdshell.deleteBlock("fg", x, y);
    }

    private deleteBg(x: number, y: number) {
        this.mdshell.deleteBlock("bg", x, y);
    }

    private deleteOverlay(x: number, y: number) {
        this.mdshell.deleteBlock("overlay", x, y);
    }

    deleteState = new ToggleState(() => {
        this.dragController.onDrag = this.deleteStateMoveF;
        this.dragController.changeGrab("crosshair");
        this.dragController.grabbing = "pointer";
        this.activeStates.delete = this.deleteState;
    }, () => {
        this.dragController.onDrag = (x: number, y: number) => this.editorPan(x, y);
        this.dragController.setCursorToDefault();
        this.activeStates.delete = null;
    });
}
