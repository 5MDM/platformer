import { objIterator } from "../util";
import { MDV } from "../vectors/vectors";

export class MDgrid<T extends NonNullable<any>> {
    public grid: T[][];
    w: number;
    h: number;

    constructor(w: number, h: number) {
        this.w = w;
        this.h = h;

        this.grid = [];
        for (let y = 0; y < h; y++) this.grid.push(new Array(w));
    }

    private OOB(p: MDV.XY) {
        if(this.isOOB(p)) throw new Error(
            `(${p.x}, ${p.y})`
        );
    }

    isOOB({x, y}: MDV.XY): boolean {
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

    get(p: MDV.XY): T | undefined {
        this.OOB(p);
        return this.grid[p.y][p.x];
    }

    set(p: MDV.XY, s: T) {
        this.OOB(p);
        this.grid[p.y][p.x] = s;
    }

    getCount(): number {
        var c = 0;
        this.forEach(t => ++c);

        return c;
    }

    place(p: MDV.V2, val: T): boolean {
        if(this.get(p)) return false;

        this.set(p, val);

        return true;
    }

    delete(p: MDV.V2) {
        this.OOB(p);
        delete this.grid[p.y][p.x];
    }

    destroy() {
        this.grid = [];
    }

    /**
     * This will iterate **all** tiles
     * whether or not its undefined
     */
    forEachTile(f: (t: T, coord: MDV.V2, set: (val: T) => void) => boolean | void) {
        for(let y = 0; y < this.grid.length; y++) {
            
            const ySlices = this.grid[y];
            
            for(let x = 0; x < ySlices.length; x++) {
                const val = ySlices[x];
                const v = new MDV.V2(x, y);
                const set = (valToSet: T) => this.set(v, valToSet);

                const canContinue = f(val, v.clone(), set) ?? true;
                if(!canContinue) return;
            }
        }
    }

    fillWith(val: T) {
        for(let y = 0; y < this.grid.length; y++) {
            const ySlices = this.grid[y];
            
            for(let x = 0; x < ySlices.length; x++) {
                this.set(new MDV.V2(x, y), val);
            }
        }
    }

    /**
     * **THIS WILL NOT ITERATE UNDEFINED TILES**
     */
    advForEach(f: (t: T, coord: MDV.V2, set: (val: T) => void) => boolean | void) {
        for(const y in this.grid) {
            const yo = this.grid[y];
            const yInt = parseInt(y);

            for(const x in yo) {
                const xInt = parseInt(x);
                const set = (val: T) => this.set(new MDV.V2(xInt, yInt), val);

                const canContinue = f(yo[x], new MDV.V2(xInt, yInt), set) ?? true;
                if(!canContinue) return;
            }
        }
    }

    setAllTo(val: T) {
        this.advForEach((a, b, set) => set(val));
    }

    /**
     * **THIS WILL NOT ITERATE UNDEFINED TILES**
     */
    forEach(f: (t: T) => void) {
        for(const y in this.grid) {
            const yo = this.grid[y];

            for (const x in yo) f(yo[x]);
        }
    }

    clear(): Promise<void> {
        return new Promise(res => {
            for (const y in this.grid) {
                const yo = this.grid[y];

                for (const x in yo) {
                    delete yo[x];
                }
            }

            res();
        });
    }

    static GenerateFromBounds<T>(w: number, h: number, def: T): MDgrid<T> {
        const m = new MDgrid<T>(w, h);

        for(let y = 0; y <= h-1; y++) {
            for(let x = 0; x <= w-1; x++) {
                m.set(new MDV.V2(x, y), def);
            }
        }

        return m;
    }

    setRow(y: number, t: T) {
        if(!this.grid[y]) return;

        for(let x = 0; x < this.w; x++) this.set(new MDV.V2(x, y), t);
    }

    checkIfEMpty(): boolean {
        var isEmpty = true;

        this.forEach(() => {
            return isEmpty = false;
        });

        return isEmpty;
    }

    copyFrom(m: MDgrid<T>) {
        m.advForEach((t: T, pos: MDV.V2) => {
            if(pos.x > this.w
            || pos.y > this.h
            ) return;

            this.set(pos, t);
        });
    }

    clone(): MDgrid<T> {
        const m = new MDgrid<T>(this.w, this.h);

        this.advForEach((t, pos: MDV.V2) => {
            m.set(pos, t);
            return true;
        });

        return m;
    }

    getTrulyOutsidePointsWithGrid(gridBounds: MDV.V4): MDV.Some8dirAndCenter<MDV.V2>[] {
        const output: MDV.Some8dirAndCenter<MDV.V2>[] = [];
        const removedPoints: MDV.Some8dirAndCenter<MDV.V2>[] = [];
        //const points = gridBounds.getOutsideIntPoints();
        
        // this gives the outside points but without checking the grid
        // Need to find the undefined keys
        const someOutsidePointsArr = gridBounds.getOutsidePointsReformed();
        
        for(let i = 0; i < someOutsidePointsArr.length; i++) {
            const someOutsidePoints = someOutsidePointsArr[i];
            
            for(let ii = 0; ii < MDV.V2.keysOfPointsIn8dir.length; ii++) {
                const keyR = MDV.V2.keysOfPointsIn8dir[ii] as keyof typeof someOutsidePoints;
                if(keyR == "center") continue;
                const key = keyR as MDV.TypeFor8dir;

                const point = someOutsidePoints[key];
                if(!point) {
                    // fill in missing point
                    const xy = MDV.V2.pointsIn8dir[key];
                    const isEmpty = !this.get(someOutsidePoints.center.clone().add(xy));

                    if(!isEmpty) someOutsidePoints[key] = MDV.V2.fromPoint(xy);
                }
            }

            const nOfkeys = Object.keys(someOutsidePoints).length;
            if(nOfkeys >= 9) {
                removedPoints.push(someOutsidePoints);
            } else {
                output.push(someOutsidePoints);
            }
        }

        return output;
    }
}
