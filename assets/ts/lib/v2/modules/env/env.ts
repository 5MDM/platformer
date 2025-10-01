import { Particle, ParticleContainer, Texture } from "pixi.js";
import { convertPathToObj } from "../../../misc/util";
import { _MD2engine } from "../../engine";
import { XYtuple } from "../../types";
import { MD2module } from "../main";

interface AddParticleOpts {
    name: string;
    number: number;
    duration?: number;
    fullscreen?: boolean;
    tickerF?: (o: TickerFopts) => void;
    genF: (p: Particle, n: number, md2: _MD2engine) => void;
}

interface ParticleManifest {
    version: [number, number, number];
    particles: Record<string, string>;
}

export interface TickerFopts {
    seconds: number;
    n: number;
    particle: Particle;
    md2: _MD2engine;
    iterationN: number;
}

export class _MD2envModule extends MD2module {
    private static path = convertPathToObj(import.meta.glob<{ default: ParticleManifest; }>("../../../../../mods/*/particles.json"));
    c = new ParticleContainer();

    private pl: Record<string, Texture> = {};

    static randPresets: Record<string, (n: number, md2: _MD2engine, max: number) => XYtuple> = {};
    static tickerPresets: Record<string, (o: TickerFopts) => void> = {};

    constructor(md2: _MD2engine) {
        super(md2);
    }

    parseManifest(o: ParticleManifest) {
        for (const name in o.particles) {
            const path = o.particles[name];
            const t: Texture = this.md2.dataManager.getTexture(path);

            this.pl[name] = t;
        }
    }

    async init() {
        this.md2.levelManager.groups.view.addChild(this.c);

        _MD2envModule.path.then(o => {
            const particleManifests: ParticleManifest[] = Object.values(o);
            for (const i of particleManifests) this.parseManifest(i);
        });
    }

    getParticle(name: string): Texture {
        const t: Texture | undefined = this.pl[name];

        if (!t) {
            this.md2.errorManager.particleNotFound(name);
            return Texture.WHITE;
        } else return t;
    }

    addParticles(o: AddParticleOpts) {
        const t = this.getParticle(o.name);
        const particles: Particle[] = [];

        if (o.number <= 0) return;

        for (let i = 0; i < o.number; i++) {
            const particle = new Particle({
                texture: t,
            });

            o.genF(particle, i, this.md2);

            particles.push(particle);

            this.c.addParticle(particle);
        }

        const now = performance.now();

        var tickNumber = 0;
        if (o.tickerF) this.md2.app.ticker.add(() => {
            const s = performance.now() - now;

            for(const i in particles) {
                const tickerFopts: TickerFopts = {
                    particle: particles[i],
                    n: Number(i),
                    seconds: s,
                    md2: this.md2,
                    iterationN: tickNumber,
                };
                o.tickerF!(tickerFopts);
            }

            tickNumber++;
        });
    }
}
