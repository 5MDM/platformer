import { $, degToRad } from "../../lib/util";
import { editorTools } from "./studio";


export var blockRotation = 0;
const con = $("#ui > #editor").getElementsByClassName("block-row");

export function devRotate(deg: number) {
    blockRotation += deg;
    if(blockRotation >= 360) blockRotation -= 360;
    if(blockRotation < 0) blockRotation = 360 + blockRotation;

    for(const div of con) 
        for(const el of div.getElementsByTagName("img"))
            el.style.rotate = `${blockRotation}deg`;

    editorTools.devSprite.rotation = degToRad(blockRotation);

}