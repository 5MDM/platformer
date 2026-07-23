
import { createSignal, For, JSXElement, Match, Show, splitProps, Switch } from "solid-js";
import { InnerPage, InnerPageBtn } from "../../../misc/el/inner-page";
import { BaseMode } from "./templates/base-mode";
import { ExtractUniformObject, Filter, TypedArray, UniformData, UniformGroup } from "pixi.js";
import { MD2baseFilter, UniformValue } from "../../../v2/filters/baseFilter";
import { ExecuteCode, VisibleTextIfDefined } from "../../../misc/el/solidjs";
import { isTypedArray } from "../../../misc/util";
import { Iwindow } from "../../../misc/el/window";

function InfoElForFilter(p: {
    filter: Filter;
    editorMode: BaseMode;
}): JSXElement {
    const [props, other] = splitProps(p, ["filter", "editorMode"]);
    const mode = props.editorMode;

    const filter = props.filter as (Filter | MD2baseFilter<any>);
    const isFilterMD2filter = filter instanceof MD2baseFilter;
    const possibleMD2filter = filter as Partial<MD2baseFilter<any>>;

    const info: {
        name: string;
        description: string | undefined;
        isEnabled: boolean;
        uid: number;
        resolution: number | string;
        uniforms: [string, UniformValue<any, string>][] | undefined;
    } = {
        name: isFilterMD2filter ? `"${filter.name}"` : "<Unknown external filter>",
        description: possibleMD2filter.description,
        isEnabled: filter.enabled,
        uid: filter.uid,
        resolution: filter.resolution,
        uniforms: isFilterMD2filter ? 
        Object.entries(
            filter.uniformGroup
            .uniformStructures as Record<string, UniformValue<any, string>>
        ) : undefined,
    };

    const [getIsEnabled, setIsEnabled] = createSignal<boolean>(info.isEnabled);

    return <div class="filter-card" {...other}>
        <p>Name: {info.name}</p>
        <Show when={info.description}>
            <p>Description: {info.description}</p>
        </Show>
        <p>isEnabled: {`${getIsEnabled()}`}</p>
        <p>UID: {info.uid}</p>
        <p>Resolution: {info.resolution}</p>
        <button onclick={() => {
            filter.enabled = !filter.enabled;
            setIsEnabled(filter.enabled);
        }}>
            {getIsEnabled() ? "Disable" : "Enable"}
        </button>
        <Show fallback={<p>Uniforms: none</p>} when={info.uniforms}>
            <button onclick={
                () => mode.spawnEl(<Iwindow
                    title="Uniforms"
                    class="card-window"
                    widthPercent={40}
                    heightPercent={40}
                    bottomPercent={20}
                    shrinkToScreen={true}>
                    <For each={info.uniforms}>{([name, {type, value}]) => {
                        const valType = typeof value;
                        const isRenderableNormally = 
                        valType == "number" || valType == "string" || valType == "boolean";

                        return <div>
                            <p>Uniform "{name}": {type}</p>
                            <Switch>
                                <Match when={isRenderableNormally}>
                                    <p>Value: {value}</p>
                                </Match>
                                <Match when={isTypedArray(value)}>
                                    <p>[{Array.from(value as TypedArray).join(", ")}]</p>
                                </Match>
                            </Switch>
                        </div>
                    }}</For>
                </Iwindow>)
            }>View uniforms</button>
        </Show>        
    </div> 
    
}

export class EnvChangeMode extends BaseMode {
    iconPath = "";
    modeName = "Filters";
    hasModeSettings: boolean = true;
    
    init(): void {
        super.init();

        const staticC = this.engine.levelManager.groups.static;
        const filters: readonly Filter[] = staticC.filters;

        this.addModeSettingsEl(<>
            {/* <InnerPage backBtnF={onClick =>
                <button onclick={onClick}>Back</button>
            }>{backBtn => <>

                <InnerPageBtn text="filter settings">
                    {backBtn}
                    
                    
                </InnerPageBtn>

            </>}</InnerPage> */}
            <For each={filters}>{filter => 
                <InfoElForFilter editorMode={this} filter={filter} />
            }</For>
        </>);
    }
}