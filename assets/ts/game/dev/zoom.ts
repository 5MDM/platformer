import { player } from "../../constants";
import { MDslider } from "../../lib/el";
import { $, ToggleState } from "../../lib/util";
import { app, mdshell } from "../../main";

const zoomRow = $("#ui > #editor > #zoom-row");

const slider = new MDslider({
    min: -100,
    max: 100,
    default: 0,
    id: "zoom-slider",
    markers: [-100, -50, 0, 50, 100],
    inputF: (num: number) => (num + "%"),
    step: 5,
});

slider.appendTo(zoomRow);

export const zoomState = new ToggleState(() => {
    zoomRow.style.display = "flex";
}, () => {
    zoomRow.style.display = "none";
});

// zoomRow.style.display = "none";

var lastVal = 1;
slider.el.addEventListener("input", () => {
    scale(Number(slider.el.value));
});

function scale(percent: number) {
    const val = (percent + 100) / 100;
    const dval = lastVal - val;
    app.stage.x += player.halfWS * dval + dval * player.halfW;
    app.stage.scale.x = val;
    app.stage.y += player.halfHS * dval + dval * player.halfH;
    app.stage.scale.y = val;   
    lastVal = val;
}

export function setGameScale(percent: number) {
    slider.setValue(percent);
    scale(percent);
}