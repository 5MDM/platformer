import {Sprite, Texture } from "pixi.js";

export const UTIL_VERSION: number = 1.5;

export const RADIAN_QUARTER = 28.6479;

const pi180 = Math.PI / 180;
export function degToRad(n: number) {return n * pi180}

export function radToDeg(n: number) {
  return Math.round(n / pi180);
}

export function throwErr(file: string, msg: string): never {
  const err = new Error(`${file}.ts: ${msg}`);
  console.error(err);
  throw err.stack;
}

export function $(e: string): HTMLElement {
  const el = document.querySelector(e) as HTMLElement;
  if(el === null) throwErr(
    "util",
    `Can't find element "${e}"`
  );

  return el;
}

export interface $$Opts {
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

export function getRandom<T>(array: T[]): T {
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

export async function convertPathToObj<T>(e: Record<string, () => Promise<{default: T}>>): Promise<Record<string, T>> {
  const o: Record<string, T> = {};

  for(const path in e) {
    const dat = await e[path]();
    o[path] = dat.default;
  }

  return o;
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

export class ToggleState {
  isToggled: boolean;

  constructor(onEnable: () => void, onDisable: () => void, isToggled: boolean = false) {
    this.isToggled = isToggled;
    this.onEnable = onEnable;
    this.onDisable = onDisable;
  }

  toggle() {
    this.isToggled = !this.isToggled;
    if(this.isToggled) this.onEnable();
    else this.onDisable();
  }

  triggerEnable(): void {
    this.onEnable();
  }

  disableIfOn() {
    if(this.isToggled) this.toggle();
  }

  enableIfOff() {
    if(!this.isToggled) this.toggle();
  }

  private onEnable: () => void = () => undefined;
  private onDisable: () => void = () => undefined;
}

export function rotatePoints90(x: number, y: number, deg: number): [number, number] {
  if(deg == 0) return [x, y];
  if(deg == 90) return [-y, x];
  if(deg == 180) return [-x, -y];
  if(deg == 270) return [y, -x];

  throw new Error("util.ts: Invalid rotation");
  return [x, y];
}

// t must be between 0 and 1
export function lerp(start: number, end: number, t: number) {
  return start + t * (end - start);
}

export function decToFrac(val: number, denom: number): string {
  return `${denom / val}/${denom}`;
}

export async function timeArrAsync<T>(arr: T[], f: (val: T) => Promise<void | true>, time: number) {
  for(const i of arr) {
    const output = await f(i);
    if(output) return;

    await new Promise(res => setTimeout(res, time));
  }
}