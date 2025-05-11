import { Application, Color, Container, Sprite, Texture } from "pixi.js";

export const UTIL_VERSION: number = 1.4;

export const RADIAN_QUARTER = 28.6479;

export function throwErr(file: string, msg: string): never {
  const err = new Error(`${file}.ts: ${msg}`);
  console.error(err);
  throw err.stack;
}

export function $(e: string): Element {
  const el = document.querySelector(e);
  if(el === null) throwErr(
    "util",
    `Can't find element "${e}"`
  );

  return el;
}

interface $$Opts {
  text?: string;
  children?: Element[];
  up?: () => void;
  down?: () => void;
  attrs?: {[key: string]: string},
  style?: {[key: string]: string},
}

export function $$
<N extends keyof HTMLElementTagNameMap>
(name: N, opts?: $$Opts): HTMLElementTagNameMap[N] {
  const el: HTMLElementTagNameMap[N] = 
  document.createElement(name) as 
  HTMLElementTagNameMap[N];

  if(!opts) return el;

  if(opts.text) el.textContent = opts.text;

  if(opts.children) 
    for(const i of opts.children)
      el.appendChild(i);

  if(opts.up)
    el.addEventListener("pointerup", opts.up);

  if(opts.down)
    el.addEventListener("pointerdown", opts.down);

  if(opts.attrs)
    for(const name in opts.attrs)
      el.setAttribute(name, opts.attrs[name]);

  if(opts.style)
    for(const name in opts.style)
      el.style.setProperty(name, opts.style[name]);

  return el;
}


export interface HideableInterface {
  el: Element;
  show: () => void;
  hide: () => void;
  toggle: () => void;
}

export function hideable(el: HTMLElement, type?: string): HideableInterface {
  type ||= "flex";
  return {
    el,
    show() {
      el.style.display = type;
    },
    hide() {
      el.style.display = "none";
    },
    toggle() {
      if(el.style.display == "none") {
        el.style.display = type;
      } else {
        el.style.display = "none";
      }
    }
  };
}

export function getRandom(array: any[]): any {
  return array[Math.floor(Math.random() * array.length)];
}

export function clamp(min: number, num: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

export function fr60(f: () => void) {
  setInterval(f, 1000 / 60)
}

export function sp(x: number, y: number, width: number, height: number, color: number = Math.random() * 0xffffff): Sprite {
  const s = new Sprite(Texture.WHITE);
  s.position.set(x, y);
  s.width = width;
  s.height = height;
  s.tint = Math.random() * 0xffffff;
  s.zIndex = -1;
  return s;
}

export function toggleElement(el: HTMLElement, bool: boolean, type: string = "block") {
  if(bool) {
    el.style.display = type || el.getAttribute("data-display")!;
  } else {
    el.style.display = "none";
  }
}

export interface BtnList {
  arr: HTMLElement[];
  addTo: (el: HTMLElement) => void;
}

export function btnList(arr: HTMLElement[], up?: (el: HTMLElement, e: PointerEvent) => void) {
  function addTo(el: HTMLElement) {
    for(const btn of arr) el.appendChild(btn);
  }

  if(up)
    for(const btn of arr) btn.addEventListener("pointerup", e => up(btn, e));

  return {
    arr,
    addTo,
  } as BtnList;
}

export class ToggleList {
  lastElement?: HTMLElement;
  list: BtnList;
  unselect: (el: HTMLElement) => void;

  constructor(
    arr: HTMLElement[],
    select: (el: HTMLElement, e: PointerEvent) => void,
    unselect: (el: HTMLElement) => void,
    target: HTMLElement,
  ) {
    this.unselect = unselect;

    this.list = btnList(arr, (el, e) => {
      if(this.lastElement) unselect(this.lastElement);
      select(el, e);
      this.lastElement = el;
    });

    this.list.addTo(target);
  }

  clear() {
    if(!this.lastElement) return;
    
    this.unselect(this.lastElement);
    this.lastElement = undefined;
  }
}

export function rand255(): number {
  return Math.floor(Math.random() * 256);
}

export function round(n: number, digits: number) {
  return Math.round(n * digits) / digits;
}

export function floorToMultiples(n: number, mul: number) {
  return Math.floor(n / mul) * mul;
}

export interface ImportGlob {
  [path: string]: () => string;
}

export async function iteratePaths<T>(e: Record<string, () => Promise<{default: T}>>, f: (path: string, obj: T) => Promise<void | void[]>): Promise<void> {
  for(const path in e) {
    const dat = await e[path]();
    await f(path, dat.default);
  }
}

export function stopAnimLoop(f: (start: () => void, stop: () => void) => void, counterO: number = 1):
{start: () => void, stop: () => void} {
  var counter = counterO;
  var isRunning = false;

  function loop() {
    counter--;
    if(counter <= 0) {
      counter = counterO;
      f(start, stop);
    }

    if(isRunning) requestAnimationFrame(loop);
  }

  function start() {
    if(isRunning) return;
    isRunning = true;
    loop();
  }

  function stop() {
    isRunning = false;
  }

  return {start, stop};
}

export function attatchToggle(el: HTMLElement, on: () => void, off: () => void, isToggled: boolean = false) {
  el.addEventListener("pointerup", () => {
    isToggled = !isToggled;
    if(isToggled) on(); else off();
  });
}

export const fileNameRegex = /([^\/\.]+)/;

export function hexStringToNumber(str: string): number {
  return parseInt(str.slice(1), 16);
}

export function countingSort(arr: number[]) {
  const aux = new Uint16Array(arr.length);
  
  for(const i in arr) {
    const val = arr[i];
    aux[val] = val;
  }

  var count = 0;
  for(const i in aux) {
    const val = aux[i];
    if(val == 0) continue;

    arr[count++] = val;
  }

  arr.splice(count);
}

export class MDmatrix<T> {
  public matrix: T[][];
  w: number;
  h: number;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;

    this.matrix = [];
    for(let y = 0; y < h; y++) this.matrix.push(new Array(w));
  }

  private OOB(x: number, y: number) {
    if(this.isOOB(x, y)) throw new Error(
      `(${x}, ${y})`
    );
  }

  isOOB(x: number, y: number): boolean {
    return x < 0
    || x > this.w
    || y < 0
    || y > this.h;
  }
  
  get(x: number, y: number): T | undefined {   
    this.OOB(x, y); 
    return this.matrix[y][x];
  }

  set(x: number, y: number, s: T) {
    this.OOB(x, y);
    this.matrix[y][x] = s;
  }

  delete(x: number, y: number) {
    this.OOB(x, y);
    delete this.matrix[y][x];
  }

  destroy() {
    this.matrix = [];
  }

  forEach(f: (t: T) => void) {
    for(const y in this.matrix) {
      const yo = this.matrix[y];

      for(const x in yo) f(yo[x]);
    }
  }

  clear() {
    for(const y in this.matrix) {
      const yo = this.matrix[y];

      for(const x in yo) delete yo[x];
    }
  }
}

export function normalize(min: number, val: number, max: number): number {
  return (val - min) / (max - min);
}

export function resizeDebounce(f: () => void, time: number) {
  var timer = setTimeout(f, time);

  return function() {
    if(timer) clearTimeout(timer);
    timer = setTimeout(f, time);
  }
}

export function snapToGrid(n: number, gridPos: number, blockSize: number): number {
  const offset = gridPos % blockSize;
    
  return floorToMultiples(n - offset, blockSize) + offset;
}

export function removeContainerChildren(c: Container) {
  while(c.children[0]) c.removeChild(c.children[0]);
}