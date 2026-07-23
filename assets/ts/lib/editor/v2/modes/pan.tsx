import { MDV } from "../../../misc/vectors/vectors";
import { BaseMode } from "./templates/base-mode";
import { createSignal, Show } from "solid-js";
import { AdvancedListener } from "../../../misc/adv-listener";

export class PanMode extends BaseMode {
    iconPath: string = "";
    modeName: string = "Pan";

    hasModeSettings: boolean = true;

    pointerLockSignal = createSignal(false);

    expressModeListener = new AdvancedListener<Window, PointerEvent>({
        eventTarget: window,
        event: "pointermove",
        isMounted: false,
        f: e => this.handleDrag(new MDV.V2(-e.movementX, -e.movementY)),
    });

    private enableExpressMode() {
        this.editor.targetEl.requestPointerLock()
        .then(() => {
            this.pointerLockSignal[1](true);
            this.expressModeListener.mount();
        });
    }

    private goBackToPlayer() {
        this.editor.engine.levelManager.groups.world.x = 0;
        this.editor.engine.levelManager.groups.world.y = 0;
    }

    init(): void {
        super.init();

        this.addModeSettingsEl(<>
            <Show fallback={<>
                <button onclick={() => this.enableExpressMode()}>Express mode</button>
                <button onclick={() => this.goBackToPlayer()}>Go back to player</button>
            </>} when={this.pointerLockSignal[0]()}>
                <p>
                    You're in express mode! Swipe with one finger
                    to move around quickly.
                </p>
                <p>Press "esc" to exit</p>
            </Show>
        </>);

        document.addEventListener("pointerlockchange", () => {
            if(document.pointerLockElement == null) {
                this.pointerLockSignal[1](false);
                this.expressModeListener.unmount();
            }
        });
    }

    onDrag(blockPos: MDV.V2, pointerPosChange: MDV.V2): void {
        this.handleDrag(pointerPosChange);
    }

    private handleDrag(pointerPosChange: MDV.V2) {
        const [x, y] = pointerPosChange;
        this.editor.engine.levelManager.groups.world.x -= x;
        this.editor.engine.levelManager.groups.world.y -= y;
    }
}