import { Continue } from "../v2/types";
import { MDV } from "./vectors/vectors";

export class MDmatrix<T> {
    public matrix: T[][];
    w: number;
    h: number;

    constructor(w: number, h: number) {
        this.w = w;
        this.h = h;

        this.matrix = [];
        for (let y = 0; y < h; y++) this.matrix.push(new Array(w));
    }

    private OOB(x: number, y: number) {
        if (this.isOOB(x, y)) throw new Error(
            `(${x}, ${y})`
        );
    }

    isOOB(x: number, y: number): boolean {
        return x < 0
            || x > this.w
            || y < 0
            || y > this.h;
    }

    containsBound(b: MDV.V4) {
        return b.x > 0
        && b.y > 0
        && b.w < this.w
        && b.h < this.h;
    }

    get(x: number, y: number): T | undefined {
        this.OOB(x, y);
        return this.matrix[y][x];
    }

    set(x: number, y: number, s: T) {
        this.OOB(x, y);
        this.matrix[y][x] = s;
    }

    count(): number {
        var c = 0;
        this.forEach(t => ++c);

        return c;
    }

    logCount() {
        console.log(this.count());
    }

    place(x: number, y: number, val: T): boolean {
        if (this.get(x, y)) return false;

        this.set(x, y, val);

        return true;
    }

    delete(x: number, y: number) {
        this.OOB(x, y);
        delete this.matrix[y][x];
    }

    destroy() {
        this.matrix = [];
    }

    advForEach(f: (t: T, coord: MDV.V2, set: (val: T | any) => void) => Continue | void) {
        for(const y in this.matrix) {
            const yo = this.matrix[y];
            const yInt = parseInt(y);

            for(const x in yo) {
                const xInt = parseInt(x);
                const set = (val: T) => this.set(xInt, yInt, val);

                const canContinue = f(yo[x], new MDV.V2(xInt, yInt), set);

                if(!canContinue) return;
            }
        }
    }

    setAllTo(val: T) {
        this.advForEach((a, b, set) => set(val));
    }

    forEach(f: (t: T) => void) {
        for(const y in this.matrix) {
            const yo = this.matrix[y];

            for (const x in yo) f(yo[x]);
        }
    }

    clear(): Promise<void> {
        return new Promise(res => {
            for (const y in this.matrix) {
                const yo = this.matrix[y];

                for (const x in yo) {
                    delete yo[x];
                }
            }

            res();
        });
    }

    static GenerateFromBounds<T>(w: number, h: number, def: T): MDmatrix<T> {
        const m = new MDmatrix<T>(w, h);

        for(let y = 0; y <= h-1; y++) {
            for(let x = 0; x <= w-1; x++) {
                m.set(x, y, def);
            }
        }

        return m;
    }

    setRow(y: number, t: T) {
        if(!this.matrix[y]) return;

        for(let x = 0; x < this.w; x++) this.set(x, y, t);
    }

    checkIfEMpty(): boolean {
        var isEmpty = true;

        this.forEach(() => {
            return isEmpty = false;
        });

        return isEmpty;
    }

    copyFrom(m: MDmatrix<T>) {
        m.advForEach((t: T, coord: MDV.V2) => {
            if(coord.x > this.w
            || coord.y > this.h
            ) return;

            this.set(coord.x, coord.y, t);
        });
    }

    clone(): MDmatrix<T> {
        const m = new MDmatrix<T>(this.w, this.h);

        this.advForEach((t, coord: MDV.V2) => {
            m.set(coord.x, coord.y, t);
            return true;
        });

        return m;
    }
}
