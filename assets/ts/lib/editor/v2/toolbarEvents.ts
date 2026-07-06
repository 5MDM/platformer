import { greedyMesh } from "../../v2/generation/greedy-mesh";
import { MD2editorV2 } from "./editor";

export function initToolbarEvents(editor: MD2editorV2) {
    const md2 = editor.engine;
    const on = md2._editorOn.bind(md2);

    const grids = editor.editorGrids;

    on("save-changes", () => {
        try {
            md2.generator.injectBlocks({
                fg: grids.fg.clone(),
                bg: grids.bg.clone(),
                overlay: grids.overlay.clone()
            });
        } catch(err) {
            console.error(err);
            alert("There was an error and changes have been cancelled. Check the console");
        } finally {
            md2._editorEmit("cancel-changes");
        }
    });

    on("cancel-changes", () => {
        editor.forEachGrid(grid => {
            grid.forEach(b => b.destroy());
            grid.clear();
        });
    });

    on("toggle-editor", () => editor.state.toggle());
}