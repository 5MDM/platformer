import { Ticker } from "pixi.js";
import { clamp, NOOP } from "./util";

type TweenF<T> = (o: T, prg: number) => void;

export function MD2tweenOnce<T>(o: T, onTick: TweenF<T>, duration: number = 2000, onEnd: TweenF<T> = NOOP) {
    var endTime = performance.now() + duration;
    function callback(t: Ticker) {
        const now = performance.now();
        if(now > endTime) return;

        endTime -= t.deltaTime;
        const prg = clamp(0, (endTime - now) / duration, 1);

        onTick(o, prg);
    }

    Ticker.shared.add(callback);

    setTimeout(() => {
        Ticker.shared.remove(callback);
        onEnd(o, 1);
    }, duration);
}

export class MD2tweener<T> {
    onTick: TweenF<T> = NOOP;

    tween(o: T, duration: number = 2000) {
        MD2tweenOnce<T>(o, this.onTick, duration);
    }
}