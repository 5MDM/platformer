import { Filter, GlProgram, UniformGroup } from "pixi.js";
import vertex from "./light.vert?raw";
import fragment from "./light.frag?raw";
import { webglC } from "../../../../constants";
import { MDV } from "../../../misc/vectors/vectors";
import { MD2baseFilter, UniformValue } from "../baseFilter";

interface MD2lightFilterOpts {
    brightness?: number;
    radius: number;
    pos: MDV.V2;
    viewPos: MDV.V2;
    adjustForDPR?: boolean;
}

type UniformVec2F32 = UniformValue<Float32Array, "vec2<f32>">;
type UniformF32 = UniformValue<number, "f32">;

export class MD2lightFilter extends MD2baseFilter<{
    lightPos: UniformVec2F32,
    viewPos: UniformVec2F32,
    brightness: UniformF32,
    radius: UniformF32,
}> {
    name: string = "Light filter";
    description: string = "Creates darkness outside an area";

    constructor(o: MD2lightFilterOpts) {
        o.adjustForDPR ??= true;
        if(o.adjustForDPR) {
            o.pos.multiplyS(devicePixelRatio);
            o.viewPos.multiplyS(devicePixelRatio);
        }

        const glProgram = GlProgram.from({
            vertex,
            fragment,
            name: "light filter",
        });

        const uniforms = new UniformGroup({
            lightPos: {value: o.pos.toFloat32Array(), type: "vec2<f32>"},
            viewPos: {value: o.viewPos.toFloat32Array(), type: "vec2<f32>"},
            brightness: {value: o.brightness ?? 1, type: "f32"},
            radius: {value: o.radius * 100, type: "f32"},
        });

        uniforms.uniformStructures

        super({
            glProgram,
            resources: {uniforms},
            resolution: devicePixelRatio,
        });
    }
}