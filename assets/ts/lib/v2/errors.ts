

export class _MD2errorManager {
    private static err(msg: string): void {
        const error = new Error(msg);
        console.error(error);
    }

    private static notFound(type: string, data: string) {
        this.err(`${type} "${data}" not found`);
    }

    levelNotFound(levelName: string) {
        _MD2errorManager.notFound("Level", levelName);
    }

    blockNotFound(blockName: string) {
        _MD2errorManager.notFound("Block", blockName);
    }

    textureUnaccess(name: string) {
        _MD2errorManager.err(`Texture "${name}" was acessed before initialization`);
    }

    textureNotFound(textureName: string) {
        _MD2errorManager.notFound("Texture", textureName);
    }

    static animationNotFound(name: string) {
        _MD2errorManager.notFound("Animation", name);
    }

    particleNotFound(name: string) {
        _MD2errorManager.notFound("Particle", name);
    }

    static entityStanceNotFound(name: string) {
        _MD2errorManager.notFound("Stance", name);
    }

    outdatedVersion(old: string, ne: string) {
        _MD2errorManager.err(`Outdated version. Supported version is ${ne}. Got version ${old} instead`);
    }

    static wrongType(wrongT: string, correctT: string): TypeError {
        const err = new TypeError(`Type ${wrongT} was assigned to a type ${correctT} variable`);
        console.error(err);

        return err;
    }

    static noItemFound(name: string) {
        _MD2errorManager.notFound("Item", name);
    }
}