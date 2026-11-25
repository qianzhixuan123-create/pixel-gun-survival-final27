import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/game.js',import.meta.url),'utf8');
const start=source.indexOf('const defaultLayout=');
const end=source.indexOf('function blockedRay(',start);
function harness(saved,w=844,h=390){
 assert.ok(start>=0&&end>start,'HUD input initialization exists');
 const nodes=new Map(),winEvents=new Map();
 function node(id){if(!nodes.has(id))nodes.set(id,{style:{},events:new Map(),addEventListener(type,fn){this.events.set(type,fn)},querySelector(){return this.nub??={style:{}}}});return nodes.get(id)}
 const ctx=vm.createContext({$:node,innerWidth:w,innerHeight:h,localStorage:{getItem(){return saved},setItem(){}},window:{addEventListener(type,fn){winEvents.set(type,fn)}},layout:null});
 vm.runInContext(source.slice(start,end)+'\nglobalThis.controls={positionUI,slots,nub,handle};',ctx);
 return {ctx,nodes,winEvents};
}
test('HUD initialization executes and restores touch, keyboard, resize and layout controls',()=>{
 const {nodes,winEvents,ctx}=harness('{}');
 assert.equal(nodes.get('move').style.left,109.72+'px');
 assert.equal(nodes.get('aim').style.left,717.4+'px');
 for(const id of ['move','aim','skill'])for(const ev of ['pointerdown','pointermove','pointerup','pointercancel'])assert.ok(nodes.get(id).events.has(ev),`${id} ${ev}`);
 assert.ok(winEvents.has('keydown')&&winEvents.has('keyup')&&winEvents.has('resize'));
 assert.equal(typeof nodes.get('edit').onclick,'function');
 assert.equal(typeof ctx.controls.positionUI,'function');
});
test('invalid saved positions fall back; valid saved positions stay within viewport on resize',()=>{
 const {nodes,ctx}=harness('{"move":[-1,2],"aim":[1,1],"skill":null}');
 assert.equal(nodes.get('move').style.left,109.72+'px');
 assert.equal(nodes.get('aim').style.left,'782px');
 assert.equal(nodes.get('aim').style.top,'328px');
 ctx.innerWidth=390;ctx.innerHeight=844;ctx.controls.positionUI();
 assert.equal(nodes.get('aim').style.left,'328px');
 assert.equal(nodes.get('aim').style.top,'782px');
});
test('render loop starts after control setup and resize; map drawing is independent',()=>{
 assert.ok(source.indexOf('function positionUI()')<source.indexOf('function resize()'));
 assert.match(source,/resize\(\);requestAnimationFrame\(frame\)/);
 assert.match(source,/function drawMap\(\)/);
});
