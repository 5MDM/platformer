import { Ticker } from "pixi.js";
import { clamp, NOOP } from "./util";

export type TweenF<T> = (o: T, prg: number, t: Ticker) => void;
type endF<T> = (o: T, prg: number) => void;

export function MD2tweenOnce<T, Args = any>(o: T, onTick: TweenF<T>, duration: number = 2000, onEnd: endF<T> = NOOP) {
    var endTime = performance.now() + duration;
    function callback(t: Ticker) {
        const now = performance.now();
        if(now > endTime) return;

        endTime -= t.deltaTime;
        const prg = clamp(0, (endTime - now) / duration, 1);

        onTick(o, prg, t);
    }

    Ticker.shared.add(callback);

    setTimeout(() => {
        Ticker.shared.remove(callback);
        onEnd(o, 1);
    }, duration);
}

export class MD2tweener<T, Args = any> {
    onTick: TweenF<T>;

    constructor(onTick: TweenF<T> = NOOP) {
        this.onTick = onTick;
    }

    tween(o: T, duration: number = 2000, args?: Args): Promise<void> {
        return new Promise(res => 
            MD2tweenOnce<T, Args>(o, this.onTick, duration, () => res())
        );
    }
}