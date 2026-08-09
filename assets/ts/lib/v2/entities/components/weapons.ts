import { buildPixelLine, Container, EventEmitter, Texture, Ticker } from "pixi.js";
import { MD2componentModule } from "../../../misc/components";
import { Entity } from "../entity";
import { MD2entityComponentManager } from "./main";
import { MDV } from "../../../misc/vectors/vectors";
import { MD2tweener, MD2tweenOnce, TweenF } from "../../../misc/tweener";
import { XYWH } from "../../types";
import { Projectile } from "../projectile";

interface TweenArg {
    obj: Projectile;
    pos: MDV.V2;
    step?: MDV.V2;
    tickF?: TweenF<Projectile>;
}

export abstract class WeaponsComponent<Attacks extends string = "main"> extends MD2componentModule<Entity> {
    damage = 1;
    isAffectedByGravity = false;

    getObjtexture(name: string): Texture {
        return MD2entityComponentManager.md2.modules.env.getParticle(name);
    }

    mapObj = {
        set(p: Projectile, record = true) {
            this.map.set(p.id, p);
            if(record) MD2entityComponentManager.md2.levelManager.recordProjectile(p);
        },
        delete(p: Projectile, wasRecorded = true) {
            this.map.delete(p.id);
            if(wasRecorded) MD2entityComponentManager.md2.deletor.deleteProjectile(p);
        },
        deleteAll(wasRecord = true) {
            this.map.forEach(p => this.delete(p, wasRecord));
        },
        map: new Map<number, Projectile>(),
    }

    async moveObjByVel(e: Projectile[], vel: MDV.V2, time: number): Promise<void> {        
        return new Promise(res => {
            MD2tweenOnce<Projectile[]>(e, () => {
                for(const obj of e) {
                    obj.addFx(vel.x);
                    obj.addFy(vel.y);
                }
            }, time, () => res());
        });
    }

    async moveObjToStatically(e: Projectile[], p: MDV.V2, time: number): Promise<any> {     
        const pr: Promise<void>[] = [];
        for(const obj in e) {
            pr.push(this.moveObjTweener.tween({
                obj: e[obj],
                pos: MDV.V2.fromPoint(e[obj])
            }, time));
        }

        return Promise.all(pr);
    }

    moveObjTweener = new MD2tweener<TweenArg, MDV.V2>((e, prg, t) => {
        if(e.obj.isDestroyed) return;
        e.obj.addFx(e.step?.x ?? (-e.obj.x + e.pos.x));
        e.obj.addFy(e.step?.y ?? (-e.obj.y + e.pos.y));

        e.tickF?.(e.obj, prg, t);
    });

    deleteProjectiles(arr: Projectile[]) {
        for(const i of arr) MD2entityComponentManager.md2.deletor.deleteProjectile(i);
    }

    onObjMoveTick(e: Projectile, prg: number, t: Ticker) {
        const s = e.container;

        s.scale.set(.2 * Math.sin(Math.PI * performance.now() / 1000 * 4 + e.randNum) + 1);
    }

    async moveEntitiesTo(e: Map<number, Projectile>, p: MDV.V2, time: number): Promise<void[]> { 
        time = Math.max(.01, time);
        
        const pr: Promise<void>[] = [];

        e.forEach(obj => {
            const inPr = this.moveObjTweener.tween({
                obj,
                pos: p,
                tickF: this.onObjMoveTick.bind(this),
                //step: p.clone().divideS(time),
            }, time);

            pr.push(inPr);
        });

        return Promise.all(pr);
    }

    createProjectile(name: string, t: Texture, bounds: Partial<XYWH> = {}): Projectile {
        const md2 = MD2entityComponentManager.md2;

        const coords = MDV.V2.fromPoint(this.manager.target);

        const s = md2.generator.returnProjectile({
            name,
            x: bounds.x ?? coords.x,
            y: bounds.y ?? coords.y,
            w: bounds.w,
            h: bounds.h,
            texture: t,
        }, false);

        //s.sprite.anchorX = .5;
        s.sprite.anchorY = .5;


        s.isAffectedByGravity = this.isAffectedByGravity;

        return s;
    }

    recordProjectile(e: Projectile) {
        MD2entityComponentManager.md2.levelManager.recordProjectile(e);
    }

    events = new EventEmitter<string, any>();
    emitAtk(name: Attacks, ...args) {
        this.events.emit("atk:" + name, ...args);
    }

    fire(name: Attacks, ...args) {
        this.emitAtk(name, args);
    }

    fireMain(...args) {
        this.emitAtk("main" as Attacks, ...args);
    }

    async init() {
        await this.registerAttacks();
    }

    onAtkEvent(name: Attacks, f: (...args) => void) {
        this.events.on("atk:" + name, (...args) => f(...args));
    }

    abstract registerAttacks(): Promise<void>;
}   