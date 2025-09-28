import "./env";
import { _MD2envModule } from "./env";
import "./particle-def";
import { randPresets, tickPresets } from "./particle-def";

_MD2envModule.randPresets = randPresets;
_MD2envModule.tickerPresets = tickPresets;

export {_MD2envModule as MD2envModule};