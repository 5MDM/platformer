import { c } from "../../canvas";
import { mdshell } from "../../constants";
import { MDslider } from "../../lib/el";
import { GameScaleObj } from "../../lib/md-framework/editor-tools/main";
import { $, clamp, round, ToggleState } from "../../lib/util";
import { editorTools } from "./studio";

export const gameScale: GameScaleObj = {
    x: 1,
    y: 1,
    nx: 0,
    ny: 0,
};

const zoomRow = $("#ui > #editor > #zoom-row");

const slider = new MDslider({
    min: -95,
    max: 100,
    default: 0,
    id: "zoom-slider",
    markers: [-95, -50, 0, 50, 100],
    inputF: (num: number) => (num + "%"),
    step: 5,
});

slider.appendTo(zoomRow);

export const zoomState = new ToggleState(() => {
    zoomRow.style.display = "flex";
}, () => {
    zoomRow.style.display = "none";
});

zoomRow.style.display = "none";

var lastVal = 1;
slider.el.addEventListener("input", () => {
    scale(Number(slider.el.value));
});

addEventListener("wheel", e => {
    e.preventDefault();
    //lastVal += e.deltaY / 10;
    if(!editorTools.levelEditorState.isToggled) return;
    slider.setValue(clamp(-95, Math.round(Number(slider.el.value) - e.deltaY), 100));
    scale(Number(slider.el.value));
}, {passive: false});

function scale(percent: number) {
    const val = (percent + 100) / 100;
    const dval = lastVal - val;
    const nx = (mdshell.player.halfWS) * dval;
    const ny = (mdshell.player.halfHS) * dval;

    mdshell.game.container.x += nx + dval * mdshell.player.halfW;
    mdshell.game.container.scale.x = val;
    mdshell.game.container.y += ny + dval * mdshell.player.halfH;
    mdshell.game.container.scale.y = val;   
    lastVal = val;

    gameScale.x = 1 / ((val == 0) ? 1 : val);
    gameScale.y = 1 / ((val == 0) ? 1 : val);
    gameScale.nx += nx;
    gameScale.ny += ny;

    mdshell.backgroundSprite.scale.x = gameScale.x;
    mdshell.backgroundSprite.scale.y = gameScale.y;
}

export function setGameScale(percent: number) {
    slider.setValue(percent);
    scale(percent);
}