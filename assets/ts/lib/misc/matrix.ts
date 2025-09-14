
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

    forEach(f: (t: T) => void) {
        for (const y in this.matrix) {
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

    checkIfEMpty(): boolean {
        var isEmpty = true;

        this.forEach(() => {
            return isEmpty = false;
        });

        return isEmpty;
    }
}
