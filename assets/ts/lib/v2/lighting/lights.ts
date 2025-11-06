import { AlphaFilter, BlurFilterPass, Circle, Filter, FilterSystem, Fragment, GlProgram, GlProgramOptions, GpuProgram, Matrix, Mesh, PointData, QuadGeometry, RenderSurface, Shader, ShaderWithResources, Texture, TexturePool, TextureShader, Ticker, UniformGroup, Vertex } from "pixi.js";
import { clamp } from "../../misc/util";
import vertex from "./light.vert?raw";
import fragment from "./light.frag?raw";
import { app, webglC } from "../../../constants";
import { Player } from "../entities/player";
import { c } from "../../../canvas";
import { BasicBox } from "../blocks/blocks";

interface MD2lightFilterOpts {
    player: Player;
    color?: [number, number, number];
    brightness?: number;
    radius: number;
    pos?: [number, number];
    follow?: BasicBox;
}

export class MD2lightFilter extends Filter {
    //lightBufferLocation: WebGLUniformLocation;
    // group: UniformGroup<{
    //     lightPos: {value: Float32Array, type: "vec2<f32>"},
    // }>;

    constructor(o: MD2lightFilterOpts) {
        if(!o.pos && o.follow) o.pos = [o.follow.x, o.follow.y];
        else o.pos ??= [0, 0];

        const glProgram = GlProgram.from({
            vertex,
            fragment,
            name: 'alpha-filter',
        });

        const alphaUniforms = new UniformGroup({
            dpr: {value: devicePixelRatio, type: "f32"},
            lightPos: {value: new Float32Array(o.pos), type: "vec2<f32>"},
            playerPos: {value: new Float32Array([o.player.x, o.player.y]), type: "vec2<f32>"},
            screen: {value: new Float32Array([c.width, c.height]), type: "vec2<f32>"},
            brightness: {value: o.brightness ?? 1, type: "f32"},
            radius: {value: o.radius * 100, type: "f32"},
        });

        super({
            glProgram,
            resources: {
                alphaUniforms,
            },
            resolution: devicePixelRatio,
        });

        if(o.follow) {
            Ticker.shared.add(() => {
                alphaUniforms.uniforms.playerPos = new Float32Array([o.player.x, o.player.y]);
                alphaUniforms.uniforms.lightPos = new Float32Array([o.follow!.x, o.follow!.y]);
            });
        } else {
            Ticker.shared.add(() => {
                alphaUniforms.uniforms.playerPos = new Float32Array([o.player.x, o.player.y]);
            });
        }
    }

    static createShader(str: string, tType: "vert" | "frag") {
        const type = tType == "vert" ? webglC.VERTEX_SHADER : webglC.FRAGMENT_SHADER;

        const shader = webglC.createShader(type)!;
        webglC.shaderSource(shader, str);
        webglC.compileShader(shader);

        return shader;
    }


}