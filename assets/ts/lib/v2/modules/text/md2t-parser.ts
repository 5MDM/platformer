import { $$ } from "../../../misc/util";

const errorText = "<text_error>";

export interface MD2t {
    version: [number, number, number];
    data: MD2tTextNode[];
}

interface MD2tTextNode {
    text: string;
    color?: string;
    opacity?: number;
    size?: string;
    spacing?: number;
    bgColor?: string;
    tickerF?: (dt?: number) => void;
}

function p(t: string, style?: Record<string, string>) {
    return $$("p", {
        text: t,
        style,
    })
}

export function parseMD2t(t: MD2t): HTMLParagraphElement {
    if(t.version[0] != 0) return p(errorText);

    return parseWithoutTicker(t.data, t.version);
}

const defaultValues = {
    color: "#ffffff",
    opacity: 1,
    size: ""
};

function parseWithoutTicker
(t: MD2tTextNode[], v: [number, number, number]): HTMLParagraphElement {
    const ch: HTMLSpanElement[] = [];

    for(const i of t) {
        const span = $$("span", {
            text: i.text,
            style: {
                color: i.color || defaultValues.color,
                opacity: (i.opacity || defaultValues.opacity).toString(),
                "font-size": i.size || defaultValues.size,
                "background": i.bgColor || "",
            }
        });

        if(i.spacing)
            for(let z = 0; z < i.spacing; z++) span.textContent += " ";

        ch.push(span);
    }

    return $$("p", {
        children: ch,
    }) as HTMLParagraphElement;
}

export function createMD2t(rawDat: (MD2tTextNode | string)[]): MD2t {
    for(const i in rawDat) {
        if(typeof rawDat[i] == "string") rawDat[i] = {
            text: rawDat[i],
        };
    }

    return {
        version: [0, 0, 0],
        data: rawDat as MD2tTextNode[],
    } as MD2t;
}