import { md2 } from "../constants";
import { MD2editor } from "../lib/editor/main";
import { $ } from "../lib/misc/util";

const editor = new MD2editor({
    engine: md2,
    el: $("#ui > #editor-v2-c") as HTMLDivElement,
})