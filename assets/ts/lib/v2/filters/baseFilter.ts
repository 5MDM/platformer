import { Filter, FilterWithShader, TypedArray, UniformData, UniformGroup } from "pixi.js";

export abstract class MD2baseFilter<T extends Record<string, UniformData>> extends Filter {
    abstract readonly name: string;
    abstract readonly description: string;

    uniformGroup: UniformGroup<T>;

    constructor(o: FilterWithShader & {resources: {uniforms: UniformGroup<T>}}) {
        super(o);

        this.uniformGroup = o.resources.uniforms;
    }
}

export interface UniformValue<V extends TypedArray | number, T extends string> {
    value: V;
    type: T;
};
