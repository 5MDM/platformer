import { tr } from "../../el";
import { $$, SimpleExpander } from "../../util";

export const blockDataPopupEl = $$("div", {
    attrs: {
        id: "editor-tools-data-popup"
    },
    style: {
        display: "none",
    },
    children: [
        $$("table", {
            children: [
                $$("colgroup", {
                    children: [
                        $$("col", {
                            style: {
                                width: "100px"
                            }
                        }),
                    ]
                }),
                tr(
                    $$("th", {
                        text: "Name"
                    }),
                    $$("th", {
                        text: "Data"
                    })
                ),
                ...new SimpleExpander<[string, string], HTMLTableRowElement>(([name, id]) => 
                    tr(
                        $$("td", {text: name}),
                        $$("td", {text: "----", attrs: {id}}),
                    )
                ).parse([
                    ["Id", "block-id"],
                    ["Block Display Name", "block-display"],
                    ["Block Internal Name", "block-name"],
                    ["Block Type", "block-type"],
                    ["Components", "block-components"]
                ]),
            ]
        }),
    ]
});

