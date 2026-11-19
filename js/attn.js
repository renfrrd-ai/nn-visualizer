// =============== ATTENTION ===============
// Each word becomes a 6-number embedding with human-readable features, so the
// arithmetic stays inspectable. Three heads are hand-built to mimic behaviour
// often found in trained models; the fourth is random, i.e. untrained.
const AF=['noun','animate','pronoun','verb','adjective','function word'];
const LEX={};
const addW=(ws,fs)=>ws.split(' ').forEach(w=>{LEX[w]=fs});
addW('animal cat dog man woman girl boy bird student teacher fox horse','0 1');
addW('street mat road ball house tree food river book table room','0');
addW('it he she they him her them','2');
addW('cross crossed sat ran chased ate saw was is were jumped read left','3');
addW('tired big wide hungry quick lazy brown happy small busy','4');
addW("the a an of on in to because and but didn't not over at","5");
function aFeats(w){
  const k=w.toLowerCase().replace(/[^a-z']/g,'');let h=7;for(const c of k)h=(h*31+c.charCodeAt(0))|0;
  const r=rng(h),f=AF.map(()=>(r()-0.5)*0.16); // a little per-word noise so no two words are identical
  (LEX[k]||'').split(' ').filter(Boolean).forEach(i=>{f[+i]+=1});return f}
const DK=3;
const zW=()=>Array.from({length:6},()=>Array(DK).fill(0));
function setW(pairs){const m=zW();pairs.forEach(([f,v])=>{m[f][0]=v});return m}
function randW(seed){const r=rng(seed);return Array.from({length:6},()=>Array.from({length:DK},()=>gauss(r)*0.9))}
const HEADS=[
  {name:'Pronoun → noun',d:'Pronouns query for nouns, especially animate ones. Click "it": it settles on "animal", not "street".',q:setW([[2,3]]),k:setW([[0,1.2],[1,1.8]])},
  {name:'Verb → subject',d:'Verbs query for who is doing the action: animate nouns and pronouns.',q:setW([[3,3]]),k:setW([[1,1.8],[2,1.6],[0,0.6]])},
  {name:'Adjective → what it describes',d:'Adjectives query for the thing they describe. Click "tired".',q:setW([[4,3]]),k:setW([[1,1.6],[2,1.6],[0,0.8]])},
  {name:'Random (untrained)',d:'Random weights, which is what every head looks like before training. The pattern is noise.',q:randW(11),k:randW(23)}
];
let aWords=[],aSel=0,aHead=0,aCausal=true,AX,AQ,AK,AS,AA,AO;
const vmul=(x,M)=>Array.from({length:DK},(_,c)=>x.reduce((s,v,i)=>s+v*M[i][c],0));
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const masked=(i,j)=>aCausal&&j>i;
function aCompute(){
  aWords=($('#aText').value.trim()||'the cat sat').split(/\s+/).slice(0,12);
  const H=HEADS[aHead];AX=aWords.map(aFeats);AQ=AX.map(x=>vmul(x,H.q));AK=AX.map(x=>vmul(x,H.k));
  AS=AQ.map((q,i)=>AK.map((k,j)=>dot(q,k)/Math.sqrt(DK)));
  AA=AS.map((row,i)=>{const vis=row.map((s,j)=>masked(i,j)?-Infinity:s),m=Math.max(...vis),e=vis.map(s=>s===-Infinity?0:Math.exp(s-m)),t=e.reduce((a,b)=>a+b);return e.map(v=>v/t)});
  AO=AA.map(w=>AF.map((_,f)=>w.reduce((s,wj,j)=>s+wj*AX[j][f],0)));
  if(aSel>=aWords.length)aSel=aWords.length-1;
}
const pct=v=>v<0.005?'0%':v<0.995?Math.round(v*100)+'%':'100%';
function aArcs(){
  const n=aWords.length,gap=78,width=Math.max(700,n*gap+40),x0=(width-n*gap)/2+gap/2,ty=210,svg=$('#aSvg');
  svg.setAttribute('viewBox',`0 0 ${width} 290`);svg.style.maxWidth=width+'px';
  const X=j=>x0+j*gap,q=aSel,w=AA[q];let h='';
  // arcs first so tokens sit on top
  w.forEach((a,j)=>{if(j===q||a<0.004)return;const x1=X(q),x2=X(j),dx=Math.abs(x2-x1),hh=Math.min(170,20+dx*0.42),y=ty-20;
    h+=`<path d="M${x1},${y} C${x1},${y-hh} ${x2},${y-hh} ${x2},${y}" fill="none" stroke="${'#c1121f'}" stroke-width="${(0.6+a*9).toFixed(2)}" stroke-opacity="${(0.25+a*0.75).toFixed(2)}" stroke-linecap="round"/>`});
  aWords.forEach((word,j)=>{const x=X(j),a=w[j],m=masked(q,j),sel=j===q;
    h+=`<g data-i="${j}" style="cursor:pointer" opacity="${m?0.32:1}"><rect x="${x-38}" y="${ty-22}" width="76" height="74" fill="transparent"/><rect x="${x-36}" y="${ty-20}" width="72" height="32" fill="${PAPER}" stroke="${sel?'#c1121f':'#cfd2d8'}" stroke-width="${sel?2:1}"/>`;
    h+=`<text x="${x}" y="${ty+1}" fill="${INK}" font-size="15" text-anchor="middle">${esc(word.length>9?word.slice(0,8)+'…':word)}</text>`;
    h+=`<rect x="${x-30}" y="${ty+22}" width="60" height="6" fill="#e3e5e9"/><rect x="${x-30}" y="${ty+22}" width="${(60*a).toFixed(1)}" height="6" fill="${INK}"/>`;
    h+=`<text x="${x}" y="${ty+46}" fill="${m?'#5d6470':INK}" font-size="12.5" text-anchor="middle">${m?'hidden':pct(a)}</text></g>`});
  h+=`<text x="${X(q)}" y="${ty+66}" fill="#c1121f" font-size="12.5" font-style="italic" text-anchor="middle">query</text>`;
  svg.innerHTML=h;
  svg.querySelectorAll('g[data-i]').forEach(g=>g.addEventListener('click',()=>{aSel=+g.dataset.i;aRender()}));
}
function esc(s){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function aMatrix(){
  const n=aWords.length,el=$('#aMat');el.innerHTML='';el.style.gridTemplateColumns=`auto repeat(${n},34px)`;
  const add=(cls,txt,click)=>{const d=document.createElement('div');d.className=cls;d.textContent=txt;if(click)d.addEventListener('click',click);el.appendChild(d);return d};
  add('ml corner','');aWords.forEach(w=>add('ml top',w));
  let firstRowCell=null;
  aWords.forEach((w,i)=>{add('ml side'+(i===aSel?' on':''),w,()=>{aSel=i;aRender()});
    aWords.forEach((_,j)=>{const a=AA[i][j],m=masked(i,j),c=inkRGB(a);
      const d=add('mc'+(m?' pad':''),m?'':(a>=0.01?Math.round(a*100):''),()=>{aSel=i;aRender()});
      if(!m){d.style.background=css(c);d.style.color=ink(c)}
      if(i===aSel&&j===0)firstRowCell=d})});
  const ov=document.createElement('div');ov.className='win';el.appendChild(ov);
  if(firstRowCell){ov.style.display='block';ov.style.left=(firstRowCell.offsetLeft-2)+'px';ov.style.top=(firstRowCell.offsetTop-2)+'px';ov.style.width=(n*35+2)+'px';ov.style.height='37px'}
}
function aBreakdown(){
  const q=aSel,word=aWords[q];
  let h=`<p class="note" style="margin:0 0 12px">Query vector for <i>${esc(word)}</i>: q = [${AQ[q].map(sgn).join(', ')}]</p>`;
  h+=`<table class="br"><thead><tr><th>key</th><th>q · k</th><th>÷ √${DK}</th><th>softmax</th></tr></thead><tbody>`;
  aWords.forEach((w,j)=>{const m=masked(q,j);const dk=dot(AQ[q],AK[j]);
    h+=`<tr class="${m?'m':''}${j===q?' self':''}"><td>${esc(w)}</td><td>${m?'':sgn(dk)}</td><td>${m?'':sgn(AS[q][j])}</td><td>${m?'hidden by the mask':`<span class="bar" style="width:${Math.round(AA[q][j]*80)}px"></span>${(AA[q][j]*100).toFixed(1)}%`}</td></tr>`});
  h+='</tbody></table>';
  $('#aBreak').innerHTML=h;
  let v=`<table class="br vecs"><thead><tr><th>feature</th><th>${esc(word)} before</th><th>${esc(word)} after</th></tr></thead><tbody>`;
  AF.forEach((f,i)=>{const b=divRGB(AX[q][i],1),a=divRGB(AO[q][i],1);
    v+=`<tr><td>${f}</td><td><span class="chip" style="background:${css(b)};color:${ink(b)}">${sgn(AX[q][i])}</span></td><td><span class="chip" style="background:${css(a)};color:${ink(a)}">${sgn(AO[q][i])}</span></td></tr>`});
  $('#aVec').innerHTML=v+'</tbody></table>';
}
function aRender(){aCompute();$('#aHeadDesc').textContent=HEADS[aHead].d;aArcs();aMatrix();aBreakdown()}
HEADS.forEach((h,i)=>{const o=document.createElement('option');o.value=i;o.textContent=h.name;$('#aHead').appendChild(o)});
$('#aHead').onchange=e=>{aHead=+e.target.value;aRender()};
$('#aCausal').onchange=e=>{aCausal=e.target.checked;aRender()};
$('#aText').addEventListener('input',()=>{aRender()});
document.querySelectorAll('[data-sent]').forEach(b=>b.addEventListener('click',()=>{$('#aText').value=b.dataset.sent;aSel=+b.dataset.q;aHead=+b.dataset.h;$('#aHead').value=aHead;aRender()}));
// init: start on "it" with the pronoun head
aCompute();aSel=Math.max(0,aWords.indexOf('it'));aRender();
