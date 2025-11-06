import { EventEmitter } from "pixi.js";
import { $$ } from "../util";
import { Vpointer, VpointerHolder } from "../vpointer";
import { _MD2errorManager } from "../../v2/errors";

type O = Record<string, any>;
type SupportedTypes = "string" | "number" | "boolean";

export class JSONtable {
    protected o: O = {};
    pointer!: VpointerHolder;
    ignoreList: Record<string, true> = {};

    events = new EventEmitter();

    static editEvent = "edit";

    static styles: Record<string, Record<string, string>> = {
        row: {
            padding: "4px",
        },
        innerObj: {
            "margin-left": "3px",
            "font-size": ".6rem",
            border: "3px solid black",
            padding: "4px",

        },
        hr: {
            "margin-bottom": "4px",
            "margin-top": "4px",
            "border-color": "black"
        }
    };

    constructor(ignoreArr: string[] = []) {
        for(const i of ignoreArr) 
            this.ignoreList[i] = true;
    }

    parse(o: O): HTMLElement {
        this.events.removeAllListeners();

        this.o = o;
        this.pointer = new VpointerHolder(o);
        
        const el = this.innerParse(o);

        return el;
    }

    protected innerParse(o: O, pref: string[] = []): HTMLDivElement {
        const el = $$("div");

        for(const key in o) {
            if(this.ignoreList[key]) continue;
            const val = o[key];

            if(typeof val == "object" && !Array.isArray(val)) {
                const ref = [...pref];
                ref.push(key);

                el.appendChild($$("div", {
                    style: JSONtable.styles.innerObj,
                    children: [
                        $$("p", {text: key}),
                        $$("hr", {style: JSONtable.styles.hr}),
                        this.innerParse(val, ref),
                    ]
                }));
            } else el.appendChild(this.createDiv(key, val, typeof key as SupportedTypes, pref));
        }

        return el;
    }

    protected createDiv(key: string, val: string, type: SupportedTypes, pref: string[]): HTMLElement {
        const ref = [...pref];
        ref.push(key);

        const textVal = (() => {
            if(type == "string") return val;
            else if(type == "number") return val.toString();
            else if(type == "boolean") return val ? "true" : "false"
            else return "unknown";
        })();

        const input = $$("input", {
            attrs: {
                value: textVal,
                placeholder: "Enter a " + typeof val,
            }
        });

        const el = $$("div", {
            children: [
                $$("p", {text: key}),
                input,
            ],
            style: JSONtable.styles.row,
        });

        const pointer = this.pointer["&"](ref) as Vpointer<any>;

        input.addEventListener("input", () => input.setAttribute("data-edited", "true"), {once: true})

        this.events.on(JSONtable.editEvent, () => {
            if(input.getAttribute("data-edited") == "true")
                this.editVal(pointer, input.value);
        });

        return el;
    }

    triggerEdit() {
        this.events.emit(JSONtable.editEvent);
    }

    private editVal(pointer: Vpointer<any>, val: string) {
        const t = typeof pointer["*"];
        const valt = typeof val;

        if(t == valt) pointer["*"] = val;
        else if(t == "number") {
            pointer["*"] = Number(val);
        } else _MD2errorManager.wrongType(valt, t);
    }
}