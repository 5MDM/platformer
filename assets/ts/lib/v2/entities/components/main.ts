import { CMM, MD2componentModule } from "../../../misc/components";
import { Entity } from "../entity";
import { WeaponsComponent } from "./weapons";
import { WeaponGun } from "./weapons/gun";

export class MD2entityComponentManager extends CMM<Entity, MD2componentModule<Entity>> {
    entity: Entity;

    static ComponentList = {
        gun: WeaponGun,
    };

    constructor(entity: Entity, defaultComponents: Record<string, Record<string, any>>) {
        super({
            target: entity,
            defaultComponents,
        });

        this.entity = entity;
    }
}