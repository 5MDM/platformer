interface PointerObj {
    [key: string]: string | PointerObj;
};

interface ActualPointerObj {
    [key: string]: Vpointer<any> | ActualPointerObj;
};

export class VpointerHolder {
    private obj: Record<string, any>;
    objRef: Record<string, any>;

    constructor(obj: Record<string, any>) {
        this.obj = obj;

        const pointerObj: PointerObj = this.createPointerObj(obj);
        this.objRef = pointerObj;
    }

    static isObj(e: any): boolean {
        return !Array.isArray(e) && typeof e == "object";
    }

    private createPointerObj(obj: Record<string, any>, prev: PointerObj = {}, ref: string[] = []): PointerObj {
        for(const key in obj) {
            if(VpointerHolder.isObj(obj[key])) {
                prev[key] = {};
                prev[key].__VpointerHolderRef = ref.join(".");
                const newRef = [...ref];
                newRef.push(key);
                this.createPointerObj(obj[key], prev[key], newRef);
            } else {
                if(ref.length == 0) prev[key] = ref.join(".") + key;
                else prev[key] = ref.join(".") + "." + key;
            }
        }

        return prev;
    }

    "&"<T>(ref: string | Record<string, any> | string[]): Vpointer<any> | ActualPointerObj {
        if(Array.isArray(ref)) return new Vpointer<T>(ref, this.obj);
        else if(typeof ref == "string") return new Vpointer<T>(ref.split("."), this.obj);
        else return new Vpointer<T>(
            (ref as Record<string, any>)
            .__VpointerHolderRef.split("."), this.obj
        );
    }

    destroy() {
        this.obj = {};
        this.objRef = {};
    }
}

export class Vpointer<T> {
    lastObj: Record<string, any>;
    currentKey: string = "undefined_pointer";
    ref: string[];
    constructor(ref: string[], obj: Record<string, any>) {
        this.lastObj = obj;
        this.ref = ref;

        for(let i = 0; i < ref.length; i++) {
            const key = ref[i];
            const o = this.lastObj[key];
            this.currentKey = key;
            if(VpointerHolder.isObj(o)) this.lastObj = o;
            else if(i == ref.length-1) break;
            else {
                this.lastObj[key] = {};
                this.lastObj = this.lastObj[key];
            }
        }
    }

    get "*"(): Record<string, any> {
        return this.lastObj[this.currentKey];
    }

    set "*"(val: T) {
        this.lastObj[this.currentKey] = val;
    }

    set(val: T) {
        this.lastObj[this.currentKey] = val;
    }
}