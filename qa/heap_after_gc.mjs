// usage: node qa/heap_after_gc.mjs <cdp ws url from `agent-browser get cdp-url`>  — forces a GC on the game tab and prints the live JS heap
const base=process.argv[2];
let wsUrl=base;
if(!base.includes('/devtools/page/')){const http=base.replace('ws://','http://').replace(/\/devtools\/browser\/.*/,'');const l=await (await fetch(http+'/json/list')).json();wsUrl=l.find(t=>t.type==='page'&&/r18/.test(t.url)).webSocketDebuggerUrl;}
const ws=new WebSocket(wsUrl);let id=0;const pend={};
ws.onmessage=e=>{const m=JSON.parse(e.data);if(pend[m.id]){pend[m.id](m);delete pend[m.id];}};
await new Promise(r=>ws.onopen=r);
const send=(method,params={})=>new Promise(r=>{const i=++id;pend[i]=r;ws.send(JSON.stringify({id:i,method,params}));});
const heap=async()=>{await send('HeapProfiler.enable');await send('HeapProfiler.collectGarbage');const r=await send('Runtime.evaluate',{expression:'(performance.memory.usedJSHeapSize/1048576).toFixed(1)'});return r.result.result.value;};
console.log('after GC MB',await heap());
ws.close();
