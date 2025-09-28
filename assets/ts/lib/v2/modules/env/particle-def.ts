import { Particle } from "pixi.js";
import { _MD2engine } from "../../engine";
import { XYtuple } from "../../types";
import { TickerFopts } from "./env";

type ParticleGenF<T> = (n: number, md2: _MD2engine) => T;

export const randPresets: Record<string, ParticleGenF<XYtuple>> = {};
export const tickPresets: Record<string, (o: TickerFopts) => void> = {};

var hw = innerWidth / 2;
var hh = innerHeight / 2;

randPresets.disperseScreen = function(n, md2) {
    n -= 2;
    n *= 1.2;

    const xstep = innerWidth / 50;

    const x = xstep * n + md2.generator.player.x - hw - 25;
    const y = md2.generator.player.y + hh * 1.1 * Math.sin(n);

    return [x, y];
};

var currentTick = -1;

tickPresets.float = function(o) {
    const m = .2 * Math.sin((o.seconds + 1000 * o.n) / 2_000);

    const x = m * Math.cos(o.n);
    const y = m * Math.sin(o.n);

    o.particle.x += x;
    o.particle.y += y;
}

var minx = 0;
var maxx = 0;
var miny = 0;
var maxy = 0;
var stayInsidePy = 0;
var stayInsidePx = 0;

tickPresets.stayInside = function(o) {
    const p = o.particle;

    if(currentTick != o.iterationN) {
        miny = o.md2.generator.player.y + hh;
        maxy = o.md2.generator.player.y - hh;
        minx = o.md2.generator.player.x - hw;
        maxx = o.md2.generator.player.x + hw;

        stayInsidePx = innerWidth + p.texture.width * 2;
        stayInsidePy = innerHeight + p.texture.height * 2;

        currentTick = o.iterationN;
    }

    if(p.y - p.texture.height > miny) p.y -= stayInsidePy;
    else if(p.y + p.texture.height < maxy) p.y += stayInsidePy;

    if(p.x + p.texture.width < minx) p.x += stayInsidePx;
    else if(p.x - p.texture.width > maxx) p.x -= stayInsidePx;
};