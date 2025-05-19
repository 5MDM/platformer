import { AnimatedSprite, Application, Container, Sprite, Texture, TilingSprite } from "pixi.js";

var id = 0;

export function getNewID(): number {return id++}

export class PWB {
    isPlayer = false;
    sprite?: Sprite | TilingSprite;
    id: number = 0;
    x: number;
    y: number;
    w: number;
    h: number;
    maxX: number;
    maxY: number;
    halfW: number;
    halfH: number;
    cx: number;
    cy: number;

    constructor(x: number, y: number, w: number, h?: number) {
        this.w = w;
        this.h = h || w;
        this.x = x;
        this.maxX = x + this.w;
        this.y = y;
        this.maxY = y + this.h;

        this.halfW = this.w/2;
        this.halfH = this.h/2;
        this.cx = this.x + this.halfW;
        this.cy = this.y + this.halfH;
    }

    setX(x: number) {
        this.x = x;
        this.maxX = x + this.w;
        this.cx = x + this.halfW;
    }

    setY(y: number) {
        this.y = y;
        this.maxY = y + this.h;
        this.cy = y + this.halfH;
    }

    testAABB(o: AnyObj): boolean {
        // console.log(`${this.x} < ${o.maxX} 
        //     ${this.maxX} > ${o.x}
        //     ${this.y} < ${o.maxY}
        //     ${this.maxY} > ${o.y}`);
        return this.x < o.maxX 
        && this.maxX > o.x
        && this.y < o.maxY 
        && this.maxY > o.y;
    }

    testAABBminX(o: AnyObj): boolean {
        return this.x < o.maxX;
    }

    testAABBmaxX(o: AnyObj): boolean {
        return this.maxX > o.x;
    }

    testAABBX(o: AnyObj): boolean {
        return this.x < o.maxX 
        && this.maxX > o.x;
    }

    testAABBY(o: AnyObj): boolean {
        return this.y < o.maxY 
        && this.maxY > o.y;
    }

    addX(x: number) {
        this.x += x;
        this.maxX += x;
        this.cx += x;
    }

    addY(y: number) {
        this.y += y;
        this.maxY += y;
        this.cy += y;
    }

    updateSprite() {
        this.sprite!.x = this.x;
        this.sprite!.y = this.y;
    }

    display(app: Application) {
        app.stage.addChild(this.sprite!);
    }

    setTexture(t: Texture) {
        this.sprite = new Sprite({
            position: {x: this.x, y: this.y},
            texture: t,
            width: this.w,
            height: this.h,
        });
    }

    toContainer(c: Container) {
        c.addChild(this.sprite!);
    }
}

export class PWS extends PWB {    
    type: string;

    constructor(x: number, y: number, w: number, h: number, type: string) {
        super(x, y, w, h);
        this.id = getNewID();
        this.type = type;
    }
}

// export class PWK extends PWB {
//     id: number;

//     constructor(x: number, y: number, w: number, h: number) {
//         super(x, y, w, h);
//         this.id = getNewID();


//     }
// }

export class PWD extends PWB {
    lastAnim?: string;
    lastSprite?: string;
    current: string = "";
    container: Container = new Container();
    animations: {[index: string]: AnimatedSprite} = {};
    sprites: {[index: string]: Sprite} = {};
    vx = 0;
    vy = 0;

    constructor(x: number, y: number, w: number, h: number) {
        super(x, y, w, h);

        this.id = getNewID();
    }

    setAnimation(name: string, s: AnimatedSprite) {
        s.visible = false;
        this.animations[name] = s;
        this.container.addChild(s);
    }

    setSprite(name: string, s: Sprite) {
        s.visible = false;
        this.sprites[name] = s;
        this.container.addChild(s);
    }

    private beforeImageChange(name: string) {
        if(this.current == name) return;
        this.current = name;

        if(this.lastAnim) {
            this.animations[this.lastAnim].visible = false;
            this.animations[this.lastAnim].stop();
            this.lastAnim = undefined;
        }
        if(this.lastSprite) {
            this.sprites[this.lastSprite].visible = false;
            this.lastSprite = undefined;
        }
    }

    playAnimation(name: string, speed: number) {
        const animation = this.animations[name];
        animation.animationSpeed = speed;
        this.beforeImageChange(name);

        this.lastAnim = name;
        animation.visible = true;
        animation.play();
    }

    playSprite(name: string) {
        this.beforeImageChange(name);

        this.lastSprite = name;
        this.sprites[name].visible = true;
    }

    toContainer(c: Container) {
        c.addChild(this.container);
    }

    display(app: Application) {
        app.stage.addChild(this.container);
    }

    updateSprite() {
        this.container.x = this.x;
        this.container.y = this.y;
    }
}

export type NotDynamicObj = PWS;
export type MovingObjs = PWD;
export type AnyObj = PWB | PWS | PWD;