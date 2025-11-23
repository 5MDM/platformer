import { CMM, MD2componentModule } from "../../../misc/components";
import { Entity } from "../entity";

export class MD2entityComponentManager extends CMM<Entity, MD2componentModule<Entity>> {
    entity: Entity;

    constructor(entity: Entity, defaultComponents: Record<string, Record<string, any>>) {
        super({
            target: entity,
            defaultComponents,
        });

        this.entity = entity;
    }
}