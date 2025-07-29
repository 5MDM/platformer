import { MDshell } from "../shell";
import { FgBlock } from "../unit";
import { DoorComponent } from "./door";
import { DoorpointComponent } from "./doorpoint";
import { InteractComponent } from "./interact";

export interface ComponentList {
    door?: DoorComponent;
    interact?: InteractComponent;
    doorpoint?: DoorpointComponent;
}

export type ComponentName = keyof ComponentList;
export type ComponentValue = keyof ComponentList[ComponentName];

type ComponentParserF = (shell: MDshell, block: FgBlock, component: ComponentValue) => void;

interface MDcomponentParserOpts {
    shell: MDshell;
}

export class _MDcomponentParser {
    static componentDefs: 
    Record<string, ComponentParserF> = {};

    mdshell: MDshell;

    constructor(o: MDcomponentParserOpts) {
        this.mdshell = o.shell;
    }

    parseComponents(block: FgBlock) {
        if(!block.components) return;

        for(const name in block.components) {
            const f: ComponentParserF | undefined = _MDcomponentParser.componentDefs[name];

            if(!f) {
                MDshell.Err(
                    `Component "${name}" not found`
                );
                continue;
            } else f(this.mdshell, block, block.components[name as ComponentName] as ComponentValue);
        }
    }
}