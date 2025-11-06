import { Texture, Ticker, TickerCallback, TilingSprite, TilingSpriteOptions, UPDATE_PRIORITY } from "pixi.js";

interface AnimatedTilingSpriteOpts extends TilingSpriteOptions {
    textureList: Texture[];
    animationSpeed: number;
}

export class AnimatedTilingSprite extends TilingSprite {
    _textures: Texture[];
    _isPlaying: boolean = false;
    animationSpeed: number;
    _currentTime = 0;
    _previousFrame: number | null = null;
    currentFrame: number = 0;

    constructor(o: AnimatedTilingSpriteOpts) {
        if(!o.texture) o.texture = o.textureList[0];
        super(o);

        this._textures = o.textureList;
        this.animationSpeed = o.animationSpeed;
    }

    play() {
        if(this._isPlaying) return;
        this._isPlaying = true;

        Ticker.shared.add(this.md2Update, this, UPDATE_PRIORITY.HIGH);
    }

    private md2Update: TickerCallback<this> = (t: Ticker) => {
        if(!this._isPlaying) return;

        const elapsed = this.animationSpeed * t.deltaTime;
        this._currentTime += elapsed;

        this.updateTexture();
    }

    stop() {
        if(!this._isPlaying) return;
        this._isPlaying = false;

        Ticker.shared.remove(this.md2Update, this);
    }

    private updateTexture(): void {
        const {currentFrame} = this;

        this._previousFrame = currentFrame;
        
        const frame = Math.floor((this._currentTime * this.animationSpeed) % this._textures.length);

        this.currentFrame = frame;

        if(this._previousFrame === this.currentFrame) return;
        super.texture = this._textures[currentFrame];

    }
}