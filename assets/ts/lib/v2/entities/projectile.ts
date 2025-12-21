import { Container, ContainerChild, Particle, ParticleContainer, Sprite, Texture } from "pixi.js";
import { MovingDynamicObj, MovingDynamicObjOpts } from "./entity";

export interface ProjectileOpts extends MovingDynamicObjOpts {
    texture: Texture;
}

export class Projectile extends MovingDynamicObj {
    override container = new ParticleContainer();

    sprite: Particle;

    constructor(o: ProjectileOpts) {
        super(o);

        this.sprite = new Particle({
            texture: o.texture,
        });

        this.container.addParticle(this.sprite);
    }
}