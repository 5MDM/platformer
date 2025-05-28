import { MDslider } from "../../lib/el";
import { $, ToggleState } from "../../lib/util";

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

