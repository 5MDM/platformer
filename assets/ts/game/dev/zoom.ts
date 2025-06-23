import { mdshell, player } from "../../constants";
import { MDslider } from "../../lib/el";
import { GameScaleObj } from "../../lib/md-framework/editor-tools";
import { $, ToggleState } from "../../lib/util";

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

function scale(percent: number) {
    const val = (percent + 100) / 100;
    const dval = lastVal - val;
    const nx = (player.halfWS) * dval;
    const ny = (player.halfHS) * dval;

    mdshell.game.container.x += nx + dval * player.halfW;
    mdshell.game.container.scale.x = val;
    mdshell.game.container.y += ny + dval * player.halfH;
    mdshell.game.container.scale.y = val;   
    lastVal = val;

    gameScale.x = 1 / ((val == 0) ? 1 : val);
    gameScale.y = 1 / ((val == 0) ? 1 : val);
    gameScale.nx += nx;
    gameScale.ny += ny;
}

export function setGameScale(percent: number) {
    slider.setValue(percent);
    scale(percent);
}