import { $$ } from "../../util";

export const levelSettingsPopupEl = $$("div", {
    children: [
        $$("h1", {
            text: "Level Settings",
        }),
        $$("div", {
            attrs: {
                id: "settings-break",
            },
            style: {
                height: "20px",
                "border-top": "4px solid gray"
            },
        }),
        $$("div", {
            children: [
                $$("label", {
                    text: "Background Image Name: ",
                }),
                $$("input", {
                    attrs: {
                        placeholder: "your-image.png",
                        id: "bg-img-input",
                    }
                }),
            ],
        }),
    ],
});