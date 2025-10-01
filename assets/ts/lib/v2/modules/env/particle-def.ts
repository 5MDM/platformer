import { roundToPower2 } from "../../../misc/util";
import { _MD2engine } from "../../engine";
import { XYtuple } from "../../types";
import { TickerFopts } from "./env";

type ParticleGenF<T> = (n: number, md2: _MD2engine, max?: number) => T;

export const randPresets: Record<string, ParticleGenF<XYtuple>> = {};
export const tickPresets: Record<string, (o: TickerFopts) => void> = {};

var hw = innerWidth / 2;
var hh = innerHeight / 2;

randPresets.disperseScreen = function(n, md2, max = 16) {
    max = roundToPower2(max);

    const padding = 64;

    const cx = md2.generator.player.x;
    const cy = md2.generator.player.y;

    const sx = innerWidth / Math.sqrt(max) + padding;
    const sy = innerHeight / Math.sqrt(max) + padding;

    var x = -hw + sx * n - padding;
    var y = -hh - padding;

    while(x > hw + padding * 2) {
        x -= innerWidth + padding * 4;
        y += sy;
    }
    return [cx + x, cy + y];
};

randPresets.disperseScreenS1 = function(n, md2, max = 16) {
    const [x, y] = randPresets.disperseScreen(n, md2, max);

    return [
        x + Math.round(Math.random() * 200),
        y + Math.round(Math.random() * 200),
    ];
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

        stayInsidePx = innerWidth + p.texture.width * 3;
        stayInsidePy = innerHeight + p.texture.height * 3;

        currentTick = o.iterationN;
    }

    if(p.y - p.texture.height > miny) p.y -= stayInsidePy;
    else if(p.y + p.texture.height < maxy) p.y += stayInsidePy;

    if(p.x + p.texture.width < minx) p.x += stayInsidePx;
    else if(p.x - p.texture.width > maxx) p.x -= stayInsidePx;
};