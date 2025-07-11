import { LevelJSONoutput } from "./md-framework/shell";
import { MDmatrix } from "./matrix";

export interface GMOutput {
    x: number;
    y: number;
    w: number;
    h: number;
    type: string;
}

interface GMBoxes {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
    type: string;
    doesExist: boolean;
}

export class Keymap {
    onEnd: () => void = () => undefined;
    keys: {[index: string]: (x: number, y: number, w: number, h: number, rotation: number) => void} = {};

    private static GreedyMesh(bounds: GMBoxes, matrix: MDmatrix<true>): LevelJSONoutput[] {
        const output: LevelJSONoutput[] = [];

        for(let y = bounds.ymin; y < bounds.ymax; y++) {
            for(let x = bounds.xmin; x < bounds.xmax; x++) {
                sweep(x, y);
            }
        }

        function sweep(rx: number, ry: number) {
            var w = 0;
            var h = 0;
            
            const x = rx - bounds.xmin;
            const y = ry - bounds.ymin;

            const res: true | undefined = matrix.get(x, y);
            if(!res) return;

            for(let fx = x; fx < bounds.xmax - bounds.xmin; fx++) {
                const res: true | undefined = matrix.get(fx, y);
                
                if(!res) break;
                w++;
            }

            for(let fy = y; fy < bounds.ymax - bounds.ymin; fy++) {
                var hasEnded = false;
                
                for(let fx = x; fx < x+w; fx++) {
                    const res: true | undefined = matrix.get(fx, fy);
                    
                    if(!res) {
                        hasEnded = true;
                        break;
                    }
                }

                if(hasEnded) break;
                h++;
            }

            for(let fy = y; fy < y+h; fy++) {
                for(let fx = x; fx < x+w; fx++) {
                    matrix.delete(fx, fy);
                }
            }

            output.push({x: x + bounds.xmin, y: y + bounds.ymin, w, h, type: bounds.type, rotation: 0});
        }
        
        return output;
    }

    static IterateGMrect(x: number, y: number, w: number, h: number, f: (x: number, y: number) => void) {
        for(let fy = y; fy < y + h; fy++) {
            for(let fx = x; fx < x + w; fx++) {
                f(fx, fy);
            }
        }
    }

    runRaw(arr: LevelJSONoutput[]) {
        for(const {x, y, w, h, rotation, type} of arr) {
            this.keys[type]?.(x, y, w, h, rotation);
        }
    }

    static GMBool(m: true[][], type: string) {
        

        const output: GMOutput[] = [];
        const bounds = {
            xmin: Infinity,
            ymin: Infinity,
            xmax: -1, 
            ymax: -1, 
            doesExist: false,
            type,
        };

        const ymax = m.length;
    
        for(let y = 0; y != ymax; y++) {
            let x = 0;
            
            // Horizontal slice
            const hSlice = m[y];
            for(const char of hSlice) {
                x++;
                if(!char) continue;

                if(x <= bounds.xmin) bounds.xmin = x-1;
                if(x > bounds.xmax) bounds.xmax = x+1;

                if(y < bounds.ymin) bounds.ymin = y;
                if(y >= bounds.ymax) bounds.ymax = y+1;
                if(!bounds.doesExist) bounds.doesExist = true;
            }
        }

        if(bounds.xmin >= bounds.xmax) {
            console.log(bounds);
            throw new Error("xmin >= xmax");
        }

        if(bounds.ymin >= bounds.ymax) {
            console.log(bounds);
            throw new Error("ymin >= ymax");
        }

        const mm: MDmatrix<true> = 
        new MDmatrix(bounds.xmax - bounds.xmin, bounds.ymax - bounds.ymin);

        for(const ry in m) {
            const y = Number(ry);
            const ySlice: true[] = m[y];

            for(const rx in ySlice) {
                const x = Number(rx);
                if(!ySlice[x]) continue;

                
                const {ymin, xmin} = bounds;
                const realY = y - ymin;
                const realX = x - xmin;

                try {
                    mm.set(realX, realY, true);
                } catch(err) {
                    console.log(`${x} - ${xmin} = ${realX}`)
                    console.error(`keymap.ts: out of bound coords (${realX}, ${realY})`);
                }
            }
        }

        output.push(...Keymap.GreedyMesh(bounds, mm));

        return output;
    }

    // greedy mesh and run
    GMR(txt: string): LevelJSONoutput[] {
        const output: LevelJSONoutput[] = [];
        const types: {[typeName: string]: GMBoxes} = {};

        for(const key in this.keys) {
            types[key] = {xmin: Infinity, ymin: Infinity, xmax: -1, ymax: -1, type: key, doesExist: false};
        }
    
        const m: string[] = txt.split("\n");  
        const ymax = m.length;
    
        for(let y = 0; y != ymax; y++) {
            let x = 0;
            
            // Horizontal slice
            const hSlice = m[y];
            for(const char of hSlice) {
                x++;
                const bounds = types[char];
                if(!bounds) continue;

                /*if(x < bounds.xmin) bounds.xmin = x-1;
                if(x >= bounds.xmax) bounds.xmax = x;

                if(y < bounds.ymin) bounds.ymin = y;
                if(y >= bounds.ymax) bounds.ymax = y+1;
                if(!bounds.doesExist) bounds.doesExist = true;*/

                if(x <= bounds.xmin) bounds.xmin = x-1;
                if(x > bounds.xmax) bounds.xmax = x+1;

                if(y < bounds.ymin) bounds.ymin = y;
                if(y >= bounds.ymax) bounds.ymax = y+1;
                if(!bounds.doesExist) bounds.doesExist = true;
            }
        }

        const matrices: {[char: string]: MDmatrix<true>} = {};

        for(const type in types) {
            const bounds = types[type];
            if(!bounds.doesExist) {
                delete types[type];
                continue;
            }

            if(bounds.xmin >= bounds.xmax) {
                console.log(bounds);
                throw new Error("xmin >= xmax");
            }

            if(bounds.ymin >= bounds.ymax) {
                console.log(bounds);
                throw new Error("ymin >= ymax");
            }

            matrices[bounds.type] = new MDmatrix(bounds.xmax - bounds.xmin, bounds.ymax - bounds.ymin);
        }

        for(const ry in m) {
            const y = Number(ry);
            const ySlice: string = m[y];

            for(const rx in ySlice as any) {
                const x = Number(rx);
                const char = ySlice[x];
                const matrix: MDmatrix<true> | undefined = matrices[char];

                if(!matrix) continue;
                const {ymin, xmin} = types[char];
                const realY = y - ymin;
                const realX = x - xmin;

                matrix.set(realX, realY, true);
            }
        }

        for(const type in types) {
            output.push(...Keymap.GreedyMesh(types[type], matrices[type]));
        }
       
        this.runRaw(output);

        return output;
    }

    /*run(txt: string) {
        const m: string[] = txt.split("\n");  
        const yMax = m.length;

        for(let y = 0; y != yMax; y++) {
            let x = 0;
            
            // Horizontal slice
            const hSlice = m[y];
            for(const char of hSlice) {
                this.keys[char]?.(x, y);
                x++;
            }
        }

        this.onEnd();
    }*/

    key(char: string, f: (x: number, y: number, w: number, h: number, rotation: number) => void) {
        this.keys[char] = f;
    }

    static async buildString(endX: number, endY: number, f: (x: number, y: number) => string | undefined): Promise<string> {
        const final: string[] = [];

        const prArr: Promise<void>[] = [];

        for(let y = 0; y < endY; y++) prArr.push(
            new Promise(res => {
                setTimeout(() => {
                    findY(y);
                    res();
                });
            }),
        );

        function findY(y: number) {
            const yLayer: string[] = [];
    
            for(let x = 0; x < endX; x++) {
                const char = f(x, y) || " ";
                yLayer.push(char);
            }
    
            final.push(yLayer.join(""));
        }

        const finalPr = Promise.all(prArr);
        await finalPr;

        return final.join("\n");
    }
}

export class Map2D<T> {
    map: {[coord: string]: T} = {};

    constructor() {}

    static coord(x: number, y: number): string {
        return `${x},${y}`;
    }

    static getFromCoord(str: string): [x: number, y: number] {
        return str.split(",").map(n => Number(n)) as [number, number];
    }

    set(coord: string, t: T) {
        this.map[coord] = t;
    }

    place(coord: string, t: T): boolean {
        if(this.map[coord]) return false;
        this.set(coord, t);

        return true;
    }

    forEach(f: (coord: string, t: T) => void) {
        for(const i in this.map) f(i, this.map[i]);
    }

    radius(x: number, y: number, rx: number, ry: number, size: number, f: (coord: string, t: T) => void) {
        for(let dx = -rx; dx <= rx; dx++) {
            for(let dy = -ry; dy <= ry; dy++) {
                //if(dx === 0 && dy === 0) continue;
                const coord: string = Map2D.coord(x + dx * size, y + dy * size);
                const res = this.map[coord];
                if(res == undefined) continue;

                f(coord, res);
           }
        }
    }
}
