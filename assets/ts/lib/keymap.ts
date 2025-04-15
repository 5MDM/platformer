import { MDmatrix } from "./util";

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
    keys: {[index: string]: (x: number, y: number, w: number, h: number) => void} = {};

    private greedyMesh(o: GMBoxes, matrix: MDmatrix<true>): GMOutput[] {
        const output: GMOutput[] = [];

        for(let y = o.ymin; y < o.ymax; y++) {
            for(let x = o.xmin; x < o.xmax; x++) {
                sweep(x, y);
            }
        }

        function sweep(rx: number, ry: number) {
            var w = 0;
            var h = 0;
            
            const x = rx - o.xmin;
            const y = ry - o.ymin;

            const res: true | undefined = matrix.get(x, y);
            if(!res) return;

            for(let fx = x; fx < o.xmax - o.xmin; fx++) {
                const res: true | undefined = matrix.get(fx, y);
                
                if(!res) break;
                w++;
            }

            for(let fy = y; fy < o.ymax - o.ymin; fy++) {
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

            output.push({x: x + o.xmin, y: y + o.ymin, w, h, type: o.type});
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

    runRaw(arr: GMOutput[]) {
        for(const {x, y, w, h, type} of arr) {
            this.keys[type]?.(x, y, w, h);
        }
    }

    // greedy mesh and run
    GMR(txt: string): GMOutput[] {
        const output: GMOutput[] = [];
        const types: {[typeName: string]: GMBoxes} = {};

        for(const key in this.keys) {
            types[key] = {xmin: Infinity, ymin: Infinity, xmax: -1, ymax: -1, type: key, doesExist: false};
        }
    
        const txtArr: string[] = txt.split("\n");  
        const ymax = txtArr.length;
    
        for(let y = 0; y != ymax; y++) {
            let x = 0;
            
            // Horizontal slice
            const hSlice = txtArr[y];
            for(const char of hSlice) {
                x++;
                const o = types[char];
                if(!o) continue;

                if(x < o.xmin) o.xmin = x-1;
                if(x >= o.xmax) o.xmax = x;

                if(y < o.ymin) o.ymin = y;
                if(y >= o.ymax) o.ymax = y+1;
                if(!o.doesExist) o.doesExist = true;
            }
        }

        const matrices: {[char: string]: MDmatrix<true>} = {};

        for(const type in types) {
            const o = types[type];
            if(!o.doesExist) {
                delete types[type];
                continue;
            }

            if(o.xmin >= o.xmax) {
                console.log(o);
                throw new Error("xmin >= xmax");
            }

            if(o.ymin >= o.ymax) {
                console.log(o);
                throw new Error("ymin >= ymax");
            }

            matrices[o.type] = new MDmatrix(o.xmax - o.xmin, o.ymax - o.ymin);
        }

        for(const ry in txtArr) {
            const y = Number(ry);
            const ySlice: string = txtArr[y];

            for(const rx in ySlice as any) {
                const x = Number(rx);
                const char = ySlice[x];
                const matrix: MDmatrix<true> | undefined = matrices[char];

                if(!matrix) continue;
                const {ymin, xmin} = types[char];
                const realY = y - ymin;
                const realX = x - xmin;

                //if(char == "#") console.log(y, matrices[char].matrix[y]);
                matrix.set(realX, realY, true);
            }
        }

        for(const type in types) {
            output.push(...this.greedyMesh(types[type], matrices[type]));
        }
       
        this.runRaw(output);

        return output;
    }

    /*run(txt: string) {
        const txtArr: string[] = txt.split("\n");  
        const yMax = txtArr.length;

        for(let y = 0; y != yMax; y++) {
            let x = 0;
            
            // Horizontal slice
            const hSlice = txtArr[y];
            for(const char of hSlice) {
                this.keys[char]?.(x, y);
                x++;
            }
        }

        this.onEnd();
    }*/

    key(char: string, f: (x: number, y: number, w: number, h: number) => void) {
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