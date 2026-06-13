import { Dict } from "../../misc/util";

export const MDregex = {
    spritesheetName: /(\w+\/){2}/,
};

export const MDregexUtils = {
    splitResourcePath(path: string): [string, string] {
        const spritesheetName = path
        .match(MDregex.spritesheetName)?.[0].slice(0, -1);
        
        if(!spritesheetName) {
            return ["NO SPRITESHEET FOUND", path];
        } else return [spritesheetName, path.slice(spritesheetName.length + 1)];
    }
};