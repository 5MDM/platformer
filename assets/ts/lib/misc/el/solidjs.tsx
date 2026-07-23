import { createRoot, createSignal, JSXElement, Show, Signal, splitProps } from "solid-js";
import { createStore } from "solid-js/store";
import { Dict, objToCSSstring, Primative3 } from "../util";
import { MD2errors } from "../../v2/errors";

function removeUnits(val: string, n = -2): number {
    return Number(val.slice(0, n)) ?? 0;
}

type CSSunitTableInput = Dict<
  [Primative3, string] 
| [Primative3, (val: Primative3, oldVal: Primative3) => string] 
| Primative3
>;

type CSSunitTableOperators = "+=" | "-=";
type UnitF = (val: any, oldVal: any) => string;
export class CSSunitTable {
    private genTable: CSSunitTableInput = {};
    private cssObj: Dict<string> = {};
    stringSignal = createSignal("");

    constructor(o: CSSunitTableInput) {
        this.genTable = o;

        for(const name in o) {
            const prop = o[name];

            if(Array.isArray(prop))
                this.set(name, prop[0], false);
            else this.set(name, prop, false);
        }

        this.refreshSignal();
    }

    refreshSignal() {
        this.stringSignal[1](objToCSSstring(this.cssObj));
    }

    changeUnit(key: string, unitOrFunc: string | UnitF) {
        const o = this.genTable[key];
        if(Array.isArray(o)) {
            (o as [string, string | UnitF])[1] = unitOrFunc;
        } else {
            return MD2errors.err(`"${key}" has no units`);
        }
    }

    set(key: string, val: Primative3, checkForExistance: boolean = true) {
        if(checkForExistance) if(!this.cssObj[key]) return;

        const prop = this.genTable[key];

        if(Array.isArray(prop)) {
            if(typeof prop[1] == "function") {
                const [oldVal, f] = prop as [any, UnitF];
                this.cssObj[key] = f(val, oldVal);
            } else if(prop) {
                // just units
                const [oldVal, unit] = prop as [any, string];
                this.cssObj[key] = `${val}` + unit;
            }
            prop[0] = val as Primative3;
        } else {
            // just one value
            const txt = `${val}`;
            (this.genTable[key] as Primative3) = txt;
            this.cssObj[key] = txt;
        }
    }

    get(key: string): Primative3 {
        const val = this.genTable[key];
        if(!val) return 0;

        if(Array.isArray(val)) {
            return val[0];
        } else return val as Primative3;
    }

    getStr(key: string): string {
        const val = this.genTable[key];
        if(!val || typeof val !== "string") return "";
        return val;
    }
 
    operator(key: string, type: CSSunitTableOperators, n: number) {
        const old = this.getNum(key);
        if(type == "+=") this.set(key, old + n);
        else if(type == "-=") this.set(key, old - n);
    }

    getNum(key: string): number {
        return this.get(key) as number;
    }
}

export function VisibleTextIfDefined(p: {
    children: string | undefined;
    [i: string]: any;
}) {
    const [props, other] = splitProps(p, ["children"]);

    return <Show when={props?.children}>
        <p {...other}>{props?.children}</p>
    </Show>;
}

export function ExecuteCode(props: {children: () => any}): JSXElement {
    props.children();
    return <></>;
}