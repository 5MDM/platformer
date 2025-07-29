import "./door";
import "./doorpoint";
import "./interact";
import { _MDcomponentParser, ComponentList, ComponentName, ComponentValue } from "./parser";

export function checkIfComponentsAreEqual(obj1: ComponentList, obj2: ComponentList): boolean {
    const componentList: Record<string, true> = {};

    for(const component in obj1) componentList[component] = true;

    for(const component in obj2)
        if (!componentList[component]) return false;

    for(const component in obj1)
        for (const prop in obj1[component as ComponentName]) {
            const prop1 = (obj1[component as ComponentName] as ComponentValue)[prop];
            const prop2 = (obj2[component as ComponentName] as ComponentValue)?.[prop];

            if (prop1 != prop2) return false;
        }


    return true;
}

export {_MDcomponentParser as MDcomponentParser};
