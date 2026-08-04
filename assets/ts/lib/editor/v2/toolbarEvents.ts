import { greedyMesh } from "../../v2/generation/greedy-mesh";
import { MD2editorV2 } from "./editor";

export function initToolbarEvents(editor: MD2editorV2) {
    const md2 = editor.engine;
    const on = md2._editorOn.bind(md2);

    const grids = editor.editorGrids;

    on("save-changes", () => {
        try {
            const blocks = greedyMesh({
                fg: grids.fg.clone(),
                bg: grids.bg.clone(),
                overlay: grids.overlay.clone()
            });

            editor.engine.generator.replaceBlocks(blocks);
        } catch(err) {
            console.error(err);
            alert("There was an error and changes have been cancelled. Check the console");
        } finally {
            setTimeout(() => md2._editorEmit("cancel-changes"), 100);
        }
    });

    on("cancel-changes", () => {
        editor.forEachGrid(grid => {
            grid.forEach(b => b.destroy());
            grid.clear();
        });
    });

    on("toggle-editor", () => {
        if(editor.state.isEnabled) {
            editor.selection.mode?.state.disableIfOn();
            editor.selection.mode = undefined;
            editor.selection.modeName[1](undefined);

            var hasUnsavedChanges = false;
            for(const gridName in editor.editorGrids) {
                const grid = editor
                .editorGrids[gridName as keyof typeof editor.editorGrids];
                const count = grid.count();
                if(count > 0) {
                    hasUnsavedChanges = true;
                    break;
                }
            }

            if(hasUnsavedChanges) {
                const needsToDeleteChanges = 
                confirm("You have an unsaved changes. Continue without saving?");
                if(needsToDeleteChanges) md2._editorEmit("cancel-changes");
            }
        }

        editor.state.toggle();
    });
}