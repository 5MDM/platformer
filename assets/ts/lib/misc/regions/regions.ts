import { Continue, XYWH } from "../../v2/types";
import { MDmatrix } from "../matrix";
import { MDV } from "../vectors/vectors";

export class MDregion<T> {
    id: number;
    data: MDmatrix<T>;
    bounds: MDV.V4;

    constructor(bounds: MDV.V4, id: number) {
        this.id = id;
        this.bounds = bounds;

        this.data = new MDmatrix(bounds.w, bounds.y);
    }

    resize(w: number, h: number) {
        const newMatrix = new MDmatrix<T>(w, h);
        newMatrix.copyFrom(this.data);

        this.data = newMatrix;
    }
}

export class MDregionHolder<T> {
    idCounter = 0;
    private regions: Record<number, MDregion<T>> = {};

    private setRegion(r: MDregion<T>) {
        this.regions[r.id] = r;
    }

    getRegionByID(id: number): MDregion<T> | undefined {
        return this.regions[id];
    }

    clearRegions() {
        this.regions = {};
    }

    deleteRegionByID(id: number) {
        delete this.regions[id];
    }

    addRegion(v4: MDV.V4): MDregion<T> {
        const r = new MDregion<T>(v4, this.idCounter++);
        this.setRegion(r);

        return r;
    }
}
