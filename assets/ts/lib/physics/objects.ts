import { Sprite, TilingSprite, Container, Texture, AnimatedSprite } from "pixi.js";
import { lerp } from "../util";

var id = 0;

export function getNewID(): number { return id++; }

export class PWB {
    isPlayer = false;
    isDeleted = false;
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

        this.halfW = this.w / 2;
        this.halfH = this.h / 2;
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

    setW(w: number) {
        this.w = w;
        this.halfW = w / 2;
    }

    setH(h: number) {
        this.h = h;
        this.halfH = h / 2;
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

    private SMALL_VAL = -10;

    testSmallAABB(o: AnyObj) {
        return this.x + this.SMALL_VAL < o.maxX
            && this.maxX - this.SMALL_VAL > o.x
            && this.y + this.SMALL_VAL < o.maxY
            && this.maxY - this.SMALL_VAL > o.y;
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

    displayTo(c: Container) {
        c.addChild(this.sprite!);
    }

    setTexture(t: Texture) {
        this.sprite = new Sprite({
            position: { x: this.x, y: this.y },
            texture: t,
            width: this.w,
            height: this.h,
        });
    }

    toContainer(c: Container) {
        c.addChild(this.sprite!);
    }

    destroy() {
        this.sprite?.destroy();
        this.sprite = undefined;

        /*
        this.x = 0;
        this.y = 0;
        this.w = 1;
        this.h = 1;
        this.cx = .5;
        this.cy = .5;
        this.halfW = .5;
        this.halfH = .5;*/
        this.isDeleted = true;
    }
}

export class PWS extends PWB {
    type: string;

    constructor(x: number, y: number, w: number, h: number, type: string) {
        super(x, y, w, h);
        this.id = getNewID();
        this.type = type;
    }

    hasCollidedRecently: boolean = false;
    hasCollisionLeaveEvents: boolean = false;

    onCollisionLeave: ((pws: PWS) => void)[] = [];
    onCollide: ((pws: PWS) => boolean | void)[] = [];

    destroy(): void {
        super.destroy();

        /*
        this.x = 0;
        this.y = 0;
        this.w = 1;
        this.h = 1;
        this.cx = .5;
        this.cy = .5;
        this.halfW = .5;
        this.halfH = .5;
        */
        //this.onCollisionLeave = [];
        //this.onCollide = [];
        //this.hasCollidedRecently = false;
        //this.hasCollisionLeaveEvents = false;
    }
}

interface TweenStep {
    stepX: number;
    stepY: number;
    x: number;
    y: number;
    completion: number;
}

export class PWD extends PWB {
    lastAnim?: string;
    lastSprite?: string;
    current: string = "";
    container: Container = new Container();
    animations: Record<string, AnimatedSprite> = {};
    sprites: Record<string, Sprite> = {};
    vx = 0;
    vy = 0;

    tweenList: TweenStep[] = [];

    constructor(x: number, y: number, w: number, h: number) {
        super(x, y, w, h);

        this.id = getNewID();
    }

    addTween(x: number, y: number, n: number): void {
        this.tweenList.push({
            x,
            y,
            stepX: x * n,
            stepY: y * n,
            completion: 0,
        });
    }

    getLastTweenObj(): TweenStep | undefined {
        return this.tweenList[this.tweenList.length-1];
    }

    tweenStep(n: number) {
        for(let i = 0; i < this.tweenList.length; i++) {
            const obj = this.tweenList[i];

            obj.completion += n * 100;

            this.lerpX(obj.stepX);
            this.lerpY(obj.stepY);

            if((obj.completion) >= 100) this.tweenList.splice(i, 1);
        }
    }

    tweenMatches(): boolean {
        if(this.container.x == this.x
        && this.container.y == this.y) return true;

        return false;
    }

    protected lerpX(x: number): void {
        this.container.x += x;
    }

    protected lerpY(y: number) {
        this.container.y += y;
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
        if (this.current == name) return;
        this.current = name;

        if (this.lastAnim) {
            this.animations[this.lastAnim].visible = false;
            this.animations[this.lastAnim].stop();
            this.lastAnim = undefined;
        }
        if (this.lastSprite) {
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

    displayTo(c: Container) {
        c.addChild(this.container);
    }

    setSpriteX(n: number) {
        this.container.x = n;
    }

    setSpriteY(n: number) {
        this.container.y = n;
    }

    updateSprite() {
        this.container.x = this.x;
        this.container.y = this.y;
    }

    protected lerpPos(x: number, y: number, lerpTime: number) {
        this.container.x += lerp(0, x, lerpTime);
        this.container.y += lerp(0, y, lerpTime);
    }

    completeTweeningEarly(lerpTime: number) {
        if(!this.tweenMatches()) {
            while(this.tweenList.length > 0) {
                this.tweenStep(lerpTime);
            }
        }
    }
}

export type NotDynamicObj = PWS;
export type MovingObjs = PWD;
export type AnyObj = PWB | PWS | PWD;
