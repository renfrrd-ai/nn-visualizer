// ---------- helpers ----------
const $=s=>document.querySelector(s);
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function gauss(r){let u=0;while(!u)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r())}
const BASE=[251,251,248],POS=[176,125,18],NEG=[45,90,138],INK="#1c2430",PAPER="#fbfbf8";
function divRGB(v,m){const t=Math.max(-1,Math.min(1,v/(m||1)));const c=t>=0?POS:NEG,a=Math.abs(t);return BASE.map((b,i)=>Math.round(b+(c[i]-b)*a))}
const css=a=>`rgb(${a[0]},${a[1]},${a[2]})`;
const div=(v,m)=>css(divRGB(v,m));
const grayRGB=v=>{const g=Math.round(Math.max(0,Math.min(1,v))*255);return[g,g,g]};
// Like grayRGB, but 0 is printed ink instead of pure black (used for the small drawn grids).
const paperGray=v=>{const t=Math.max(0,Math.min(1,v));return[Math.round(28+(251-28)*t),Math.round(36+(251-36)*t),Math.round(48+(248-48)*t)]};
const ink=a=>(0.299*a[0]+0.587*a[1]+0.114*a[2])>140?INK:PAPER;
const inkRGB=v=>{const t=Math.max(0,Math.min(1,v));return[Math.round(251-(251-28)*t),Math.round(251-(251-36)*t),Math.round(248-(248-48)*t)]};
function fmt(v,d=1){if(Math.abs(v-Math.round(v))<1e-9)return String(Math.round(v));return v.toFixed(d)}
const sgn=v=>(v<0?'−':'')+Math.abs(v).toFixed(2);

function makeGrid(el,rows,cols,size=30){
  el.innerHTML='';el.style.gridTemplateColumns=`repeat(${cols},${size}px)`;
  const cells=[];
  for(let i=0;i<rows;i++){cells.push([]);for(let j=0;j<cols;j++){const d=document.createElement('div');d.className='cell';el.appendChild(d);cells[i].push(d)}}
  const ov=document.createElement('div');ov.className='win';el.appendChild(ov);
  return{cells,ov};
}
function paintCell(d,rgb,txt){d.classList.remove('empty');d.style.background=css(rgb);d.style.color=ink(rgb);d.textContent=txt}
function placeWin(ov,r,c,h,w){ov.style.display='block';ov.style.left=(c*31-2)+'px';ov.style.top=(r*31-2)+'px';ov.style.width=(w*31+3)+'px';ov.style.height=(h*31+3)+'px'}

// ---------- tabs ----------
const TABS=[...document.querySelectorAll('main>section')].map(s=>s.id.replace('tab-',''));
function route(){
  let h=location.hash.slice(1);if(!TABS.includes(h))h='conv';
  document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+h));
  document.querySelectorAll('main>section').forEach(s=>s.classList.toggle('on',s.id==='tab-'+h));
  if(h==='pool'&&typeof poolRealRender==='function')poolRealRender();
}
window.addEventListener('hashchange',route);

