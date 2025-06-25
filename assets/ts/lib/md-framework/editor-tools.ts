import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { DragController } from "../drag";
import { $$, degToRad, floorToMultiples, MDmatrix, snapToGrid, ToggleList, ToggleState } from "../util";
import { MDshell } from "./shell";
import { player } from "../../constants";
import { blockRotation } from "../../game/dev/studio";
import { PWS } from "../pw-objects";
import { GMOutput, Keymap } from "../keymap";

type EditorKeybinds = 
"multi placement" | "edit" | "rotate right" | "rotate left" | "level editor" | "movement" | "pan";

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
    }

    multiPlacementHover(x: number, y: number) {
        x *= this.gameScale.x;
        y *= this.gameScale.y;
    
        const fx = 
        snapToGrid(x - player.halfWS - this.mdshell.game.container.x * this.gameScale.x - this.mdshell.game.groups.world.x + player.x, 0, this.mdshell.blockSize);
        const fy = 
        snapToGrid(y - player.halfHS - this.mdshell.game.container.y * this.gameScale.y - this.mdshell.game.groups.world.y + player.y, 0, this.mdshell.blockSize);
        
        const cursorX = floorToMultiples(player.x + x - player.halfWS - this.mdshell.game.groups.world.x - this.mdshell.game.container.x * this.gameScale.x, this.mdshell.blockSize) / this.mdshell.blockSize;
        const cursorY = floorToMultiples(player.y + y - player.halfHS - this.mdshell.game.groups.world.y - this.mdshell.game.container.y * this.gameScale.y, this.mdshell.blockSize) / this.mdshell.blockSize;
    
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
        floorToMultiples(xx - this.mdshell.game.container.x + this.gameScale.nx + player.halfW, this.mdshell.blockSize) / this.mdshell.blockSize;
        const y = 
        floorToMultiples(yy - this.mdshell.game.container.y + this.gameScale.ny + player.halfH, this.mdshell.blockSize) / this.mdshell.blockSize;
    
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
    }, () => {
        this.dragController.touchEl.removeEventListener("pointerdown", this.multiPlacementListenerDownF);
        this.hasInitialPlacement = false;
        if(this.placementModeState.isToggled) this.dragController.onDrag = (rx, ry, x, y) => this.placeBlock(rx, ry, x, y);
    });

    private onPlacementModeDown(e: PointerEvent) {
        if(this.levelEditorState.isToggled) this.placeRow(0, 0, e.x, e.y);
    }

    private placeRow(rx: number, ry: number, x: number, y: number) {
        x *= this.gameScale.x;
        y *= this.gameScale.y;
        const cursorX = 
        floorToMultiples(player.x + x - player.halfWS - this.mdshell.game.groups.world.x - this.mdshell.game.container.x * this.gameScale.x, this.mdshell.blockSize)  /this.mdshell.blockSize;
        const cursorY = 
        floorToMultiples(player.y + y - player.halfHS - this.mdshell.game.groups.world.y - this.mdshell.game.container.y * this.gameScale.y, this.mdshell.blockSize) / this.mdshell.blockSize;
    
        const bool = this.mdshell.pw.staticGrid.isOOB(cursorX, cursorY);
        if(bool) return this.dragController.CAD(true);
    
        const fx = 
        snapToGrid(x - player.halfWS - this.mdshell.game.container.x * this.gameScale.x - this.mdshell.game.groups.world.x + player.x, 0, this.mdshell.blockSize);
        const fy = 
        snapToGrid(y - player.halfHS - this.mdshell.game.container.y * this.gameScale.y - this.mdshell.game.groups.world.y + player.y, 0, this.mdshell.blockSize);
        
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
    
        const fx = floorToMultiples(player.x + x - player.halfWS - this.mdshell.game.container.x * this.gameScale.x - this.mdshell.game.groups.world.x, this.mdshell.blockSize) / this.mdshell.blockSize;
        const fy = floorToMultiples(player.y + y - player.halfHS - this.mdshell.game.container.y * this.gameScale.y - this.mdshell.game.groups.world.y, this.mdshell.blockSize) / this.mdshell.blockSize;
    
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
        this.editState.disableIfOn();
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
        snapToGrid(x - player.halfWS - this.mdshell.game.container.x * this.gameScale.x - this.mdshell.game.groups.world.x + player.x, 0, this.mdshell.blockSize);
        const fy = 
        snapToGrid(y - player.halfHS - this.mdshell.game.container.y * this.gameScale.y - this.mdshell.game.groups.world.y + player.y, 0, this.mdshell.blockSize);
        
        const cursorX = floorToMultiples(player.x + x - player.halfWS - this.mdshell.game.groups.world.x - this.mdshell.game.container.x * this.gameScale.x, this.mdshell.blockSize) / this.mdshell.blockSize;
        const cursorY = floorToMultiples(player.y + y - player.halfHS - this.mdshell.game.groups.world.y - this.mdshell.game.container.y * this.gameScale.y, this.mdshell.blockSize) / this.mdshell.blockSize;
    
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
        snapToGrid(x - player.halfWS - this.mdshell.game.container.x * this.gameScale.x - this.mdshell.game.groups.world.x + player.x, 0, this.mdshell.blockSize);
        const fy = 
        snapToGrid(y - player.halfHS - this.mdshell.game.container.y * this.gameScale.y - this.mdshell.game.groups.world.y + player.y, 0, this.mdshell.blockSize);
        
        const cursorX = floorToMultiples(player.x + x - player.halfWS - this.mdshell.game.groups.world.x - this.mdshell.game.container.x * this.gameScale.x, this.mdshell.blockSize) / this.mdshell.blockSize;
        const cursorY = floorToMultiples(player.y + y - player.halfHS - this.mdshell.game.groups.world.y - this.mdshell.game.container.y * this.gameScale.y, this.mdshell.blockSize) / this.mdshell.blockSize;


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

    private onEditStateClick(x: number, y: number) {
        x *= this.gameScale.x;
        y *= this.gameScale.y;
    
        const fx = floorToMultiples(player.x + x - player.halfWS - this.mdshell.game.container.x * this.gameScale.x - this.mdshell.game.groups.world.x, this.mdshell.blockSize) / this.mdshell.blockSize;
        const fy = floorToMultiples(player.y + y - player.halfHS - this.mdshell.game.container.y * this.gameScale.y - this.mdshell.game.groups.world.y, this.mdshell.blockSize) / this.mdshell.blockSize;
    
        if(this.mdshell.game.editGrid.isOOB(fx, fy)) return this.dragController.CAD(true);

        const blockRef = this.mdshell.game.grids.fg.get(fx, fy);
        if(!blockRef) return this.dragController.CAD(true);

        const block = this.mdshell.game.blocks.fg[blockRef.id];
        
        block.pwb.sprite!.tint = 0xfff000;
    }

    private editStateMoveF = (e: PointerEvent) => this.changeSpriteOutlinePos(e.pageX, e.pageY);
    private editStateClickF = (e: MouseEvent) => this.onEditStateClick(e.x, e.y);

    editState = new ToggleState(() => {
        this.placementModeState.disableIfOn();
        this.spriteOutline.visible = true;
        this.dragController.downElement.addEventListener("pointermove", this.editStateMoveF);
        this.dragController.downElement.addEventListener("click", this.editStateClickF)
    }, () => {
        this.spriteOutline.visible = false;
        this.dragController.downElement.removeEventListener("pointermove", this.editStateMoveF);
    });
}
