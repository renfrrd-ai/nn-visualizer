// =============== PERCEPTRON ===============
const PACT={step:z=>z>=0?1:0,sigmoid:z=>1/(1+Math.exp(-z)),relu:z=>Math.max(0,z)};
const PACTN={step:'step',sigmoid:'sigmoid',relu:'ReLU'};
let nx=[1,0],nw=[1,1],nb=-1.5,nAct='step';

// ---- Figure 1: one neuron, every part labelled ----
function nRender(){
  const z=nw[0]*nx[0]+nw[1]*nx[1]+nb,f=PACT[nAct],y=f(z),svg=$('#nSvg'),MUTED='#5d6470',RED='#c1121f';
  const node=(x,y0,r,v,m,txt)=>{const c=divRGB(v,m);return`<circle cx="${x}" cy="${y0}" r="${r}" fill="${css(c)}" stroke="${INK}" stroke-width="1"/><text x="${x}" y="${y0+5}" fill="${ink(c)}" font-size="14" text-anchor="middle">${txt}</text>`};
  const note=(x,y0,t,anchor='middle')=>`<text x="${x}" y="${y0}" fill="${MUTED}" font-size="13.5" font-style="italic" text-anchor="${anchor}">${t}</text>`;
  const edge=(x1,y1,x2,y2,w)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${w>=0?'#b07d12':'#2d5a8a'}" stroke-width="${(0.8+Math.min(Math.abs(w),2)*1.8).toFixed(2)}"/>`;
  const S=[380,150];let h=`<defs><marker id="nar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="${INK}"/></marker></defs>`;
  // edges
  h+=edge(116,90,S[0]-33,S[1]-10,nw[0])+edge(116,210,S[0]-33,S[1]+10,nw[1]);
  h+=`<line x1="${S[0]}" y1="252" x2="${S[0]}" y2="${S[1]+36}" stroke="${INK}" stroke-width="1.2" marker-end="url(#nar)"/>`;
  h+=`<text x="232" y="${(90+S[1])/2-16}" fill="${INK}" font-size="14" text-anchor="middle" paint-order="stroke" stroke="${PAPER}" stroke-width="5"><tspan font-style="italic">w</tspan><tspan font-size="10" dy="3">1</tspan><tspan dy="-3"> = ${sgn(nw[0])}</tspan></text>`;
  h+=`<text x="232" y="${(210+S[1])/2+30}" fill="${INK}" font-size="14" text-anchor="middle" paint-order="stroke" stroke="${PAPER}" stroke-width="5"><tspan font-style="italic">w</tspan><tspan font-size="10" dy="3">2</tspan><tspan dy="-3"> = ${sgn(nw[1])}</tspan></text>`;
  // nodes
  h+=node(90,90,26,nx[0],1,nx[0].toFixed(2))+node(90,210,26,nx[1],1,nx[1].toFixed(2));
  h+=`<text x="52" y="95" fill="${INK}" font-size="17" font-style="italic" text-anchor="end">x<tspan font-size="11" dy="3">1</tspan></text><text x="52" y="215" fill="${INK}" font-size="17" font-style="italic" text-anchor="end">x<tspan font-size="11" dy="3">2</tspan></text>`;
  h+=node(S[0],272,20,nb,2,sgn(nb));
  h+=`<circle cx="${S[0]}" cy="${S[1]}" r="36" fill="${PAPER}" stroke="${INK}" stroke-width="1.2"/><text x="${S[0]}" y="${S[1]-6}" fill="${MUTED}" font-size="15" text-anchor="middle">Σ</text><text x="${S[0]}" y="${S[1]+15}" fill="${INK}" font-size="14" text-anchor="middle">${sgn(z)}</text>`;
  // activation box with its curve
  const bx=490,by=100,bw=120,bh=100,zx=v=>bx+(Math.max(-4,Math.min(4,v))+4)/8*bw,fy=v=>{const top=nAct==='relu'?4:1;return by+bh-10-Math.max(0,Math.min(top,v))/top*(bh-20)};
  h+=`<line x1="${S[0]+36}" y1="${S[1]}" x2="${bx-4}" y2="${S[1]}" stroke="${INK}" stroke-width="1.2" marker-end="url(#nar)"/>`;
  h+=`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${PAPER}" stroke="${INK}" stroke-width="1.2"/>`;
  h+=`<line x1="${bx+6}" y1="${by+bh-10}" x2="${bx+bw-6}" y2="${by+bh-10}" stroke="#cfd2d8"/><line x1="${zx(0)}" y1="${by+6}" x2="${zx(0)}" y2="${by+bh-6}" stroke="#cfd2d8"/>`;
  let d='';for(let i=0;i<=80;i++){const v=-4+i/10;d+=(i?'L':'M')+zx(v).toFixed(1)+','+fy(f(v)).toFixed(1)}
  h+=`<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
  h+=`<circle cx="${zx(z)}" cy="${fy(y)}" r="5" fill="${RED}"/>`;
  h+=`<line x1="${bx+bw}" y1="${S[1]}" x2="${640}" y2="${S[1]}" stroke="${INK}" stroke-width="1.2" marker-end="url(#nar)"/>`;
  h+=node(676,S[1],30,y,1,nAct==='step'?String(y):y.toFixed(2));
  // labels: the vocabulary of the chapter
  h+=note(90,40,'inputs')+note(238,40,'weights')+note(S[0]+30,290,'bias','start')+note(S[0],98,'weighted sum z')+note(bx+bw/2,88,'activation: '+PACTN[nAct])+note(676,104,'output ŷ');
  svg.innerHTML=h;
  $('#nCalc').innerHTML=`<b>z</b> = (${sgn(nw[0])})(${nx[0].toFixed(2)}) + (${sgn(nw[1])})(${nx[1].toFixed(2)}) + (${sgn(nb)}) = <b>${sgn(z)}</b>\n<b>ŷ</b> = ${PACTN[nAct]}(${sgn(z)}) = <b>${nAct==='step'?y:sgn(y)}</b>`;
  let t='<table class="br"><thead><tr><th><i>x</i>₁</th><th><i>x</i>₂</th><th><i>z</i></th><th><i>ŷ</i></th></tr></thead><tbody>';
  [[0,0],[0,1],[1,0],[1,1]].forEach(([a,b])=>{const zz=nw[0]*a+nw[1]*b+nb,yy=f(zz);t+=`<tr><td>${a}</td><td>${b}</td><td>${sgn(zz)}</td><td><b>${nAct==='step'?yy:sgn(yy)}</b></td></tr>`});
  $('#nTable').innerHTML=t+'</tbody></table>';
  ['x0','x1','w0','w1','b'].forEach(k=>{const v=k[0]==='x'?nx[+k[1]]:k[0]==='w'?nw[+k[1]]:nb;$('#n'+k).value=v;$('#nv'+k).textContent=sgn(v)});
}
['x0','x1','w0','w1','b'].forEach(k=>$('#n'+k).addEventListener('input',e=>{const v=+e.target.value;if(k[0]==='x')nx[+k[1]]=v;else if(k[0]==='w')nw[+k[1]]=v;else nb=v;nRender()}));
$('#nAct').onchange=e=>{nAct=e.target.value;nRender()};
$('#nAnd').onclick=()=>{nw=[1,1];nb=-1.5;nAct='step';$('#nAct').value='step';nRender()};
$('#nOr').onclick=()=>{nw=[1,1];nb=-0.5;nAct='step';$('#nAct').value='step';nRender()};

// ---- Figure 2: the perceptron learning rule ----
const PS=340;let pData,pw,pb,pIdx,pEpoch,pMist,pLastMist,pMsg,pDone,pRunT=null,pCur=-1;
const pCtx=(()=>{const c=$('#tCanvas'),d=window.devicePixelRatio||1;c.width=PS*d;c.height=PS*d;const x=c.getContext('2d');x.scale(d,d);return x})();
const PX=v=>(v+0.5)/2*PS,PY=v=>PS-(v+0.5)/2*PS;
function pMakeData(kind){
  const gate=f=>[[0,0],[0,1],[1,0],[1,1]].map(([a,b])=>[a,b,f(a,b)]);
  if(kind==='and')return gate((a,b)=>a&b);
  if(kind==='or')return gate((a,b)=>a|b);
  if(kind==='xor')return gate((a,b)=>a^b);
  const r=rng(5),pts=[];for(let i=0;i<12;i++){pts.push([1.0+gauss(r)*0.17,0.95+gauss(r)*0.17,1]);pts.push([0.05+gauss(r)*0.17,0.2+gauss(r)*0.17,0])}return pts;
}
const pPred=p=>(pw[0]*p[0]+pw[1]*p[1]+pb)>=0?1:0;
function pReset(rand){const r=rand?Math.random:rng(3);pw=[(r()-0.5),(r()-0.5)];pb=(r()-0.5)*0.4;pIdx=0;pEpoch=1;pMist=0;pLastMist=null;pDone=false;pCur=-1;pMsg='Press Step to show the perceptron its first example.';pRender()}
const fx=v=>{const s=Number.isInteger(v)?String(v):v.toFixed(2);return s};
function pStep(){
  if(pDone)return;const eta=+$('#tEta').value,p=pData[pIdx],x=[p[0],p[1]],y=p[2],yh=pPred(p),err=y-yh;pCur=pIdx;
  const where=`Epoch ${pEpoch}, example ${pIdx+1} of ${pData.length}: point (${fx(x[0])}, ${fx(x[1])}) has label <b>${y}</b>; the perceptron says <b>${yh}</b>.`;
  if(err===0)pMsg=where+'\nCorrect, so nothing changes.';
  else{pMist++;const o=[pw[0],pw[1],pb];pw[0]+=eta*err*x[0];pw[1]+=eta*err*x[1];pb+=eta*err;
    pMsg=where+`\nWrong, so every weight moves by η·(y − ŷ)·x = ${eta}·(${err})·x:\n  w₁ = ${sgn(o[0])} + ${eta}·(${err})·${fx(x[0])} = <b>${sgn(pw[0])}</b>\n  w₂ = ${sgn(o[1])} + ${eta}·(${err})·${fx(x[1])} = <b>${sgn(pw[1])}</b>\n  b  = ${sgn(o[2])} + ${eta}·(${err}) = <b>${sgn(pb)}</b>`}
  pIdx++;
  if(pIdx>=pData.length){pLastMist=pMist;
    if(pMist===0){pDone=true;pMsg+=`\n\nA full epoch with no mistakes. Every point is on the correct side of the line, so training stops.`}
    else if(pEpoch>=40){pDone=true;pMsg+=`\n\nStill ${pMist} mistakes after 40 epochs. ${$('#tData').value==='xor'?'For XOR no straight line exists, so the perceptron will cycle forever.':'Try a larger learning rate.'}`}
    pIdx=0;pEpoch++;pMist=0}
  pRender();
}
function pRender(){
  const c=pCtx;c.clearRect(0,0,PS,PS);const blk=5;
  for(let i=0;i<PS;i+=blk)for(let j=0;j<PS;j+=blk){const x=(i+blk/2)/PS*2-0.5,y=(PS-j-blk/2)/PS*2-0.5;c.fillStyle=div(pPred([x,y])?0.16:-0.16,1);c.fillRect(i,j,blk,blk)}
  c.strokeStyle='#cfd2d8';c.lineWidth=1;c.beginPath();c.moveTo(PX(0),0);c.lineTo(PX(0),PS);c.moveTo(0,PY(0));c.lineTo(PS,PY(0));c.stroke();
  c.fillStyle='#5d6470';c.font='italic 13px Literata, Georgia, serif';c.fillText('x₁',PS-22,PY(0)-8);c.fillText('x₂',PX(0)+8,16);c.fillText('1',PX(1)-3,PY(0)+16);c.fillText('1',PX(0)-14,PY(1)+4);
  // decision boundary w1 x1 + w2 x2 + b = 0
  c.strokeStyle=INK;c.lineWidth=2;c.beginPath();
  if(Math.abs(pw[1])>1e-9){const y=x=>-(pw[0]*x+pb)/pw[1];c.moveTo(PX(-0.5),PY(y(-0.5)));c.lineTo(PX(1.5),PY(y(1.5)))}
  else if(Math.abs(pw[0])>1e-9){const x=-pb/pw[0];c.moveTo(PX(x),0);c.lineTo(PX(x),PS)}
  c.stroke();
  pData.forEach((p,i)=>{const x=PX(p[0]),y=PY(p[1]);
    if(pPred(p)!==p[2]){c.strokeStyle='#c1121f';c.lineWidth=1.5;c.beginPath();c.arc(x,y,12,0,7);c.stroke()}
    if(i===pCur){c.fillStyle='rgba(193,18,31,.18)';c.beginPath();c.arc(x,y,16,0,7);c.fill()}
    c.beginPath();c.arc(x,y,7,0,7);c.fillStyle=p[2]?INK:PAPER;c.fill();c.strokeStyle=INK;c.lineWidth=1.5;c.stroke()});
  const wrong=pData.filter(p=>pPred(p)!==p[2]).length;
  $('#tState').innerHTML=`w₁ = <b>${sgn(pw[0])}</b>   w₂ = <b>${sgn(pw[1])}</b>   b = <b>${sgn(pb)}</b>\nPoints on the wrong side right now: <b>${wrong}</b> of ${pData.length}`;
  $('#tMsg').innerHTML=pMsg;
}
function pStop(){clearTimeout(pRunT);pRunT=null;$('#tRun').textContent='Train'}
$('#tStep').onclick=()=>{pStop();pStep()};
$('#tRun').onclick=()=>{if(pRunT){pStop();return}if(pDone)return;$('#tRun').textContent='Pause';const tick=()=>{pStep();if(pDone){pStop();return}pRunT=setTimeout(tick,pData.length>8?90:450)};tick()};
$('#tReset').onclick=()=>{pStop();pReset(true)};
$('#tData').onchange=e=>{pStop();pData=pMakeData(e.target.value);pReset(false)};
$('#tEta').onchange=()=>{};
pData=pMakeData('and');pReset(false);

// ---- Figure 3: XOR with a hidden layer ----
(function xorFig(){
  const S=260,cv=$('#xCanvas'),d=window.devicePixelRatio||1;cv.width=S*d;cv.height=S*d;const c=cv.getContext('2d');c.scale(d,d);
  const st=z=>z>=0?1:0,h1=(a,b)=>st(a+b-0.5),h2=(a,b)=>st(-a-b+1.5),out=(a,b)=>st(h1(a,b)+h2(a,b)-1.5);
  const X=v=>(v+0.5)/2*S,Y=v=>S-(v+0.5)/2*S,blk=4;
  for(let i=0;i<S;i+=blk)for(let j=0;j<S;j+=blk){const a=(i+blk/2)/S*2-0.5,b=(S-j-blk/2)/S*2-0.5;c.fillStyle=div(out(a,b)?0.16:-0.16,1);c.fillRect(i,j,blk,blk)}
  c.setLineDash([6,5]);c.strokeStyle=INK;c.lineWidth=1.5;
  [[0.5],[1.5]].forEach(([k])=>{c.beginPath();c.moveTo(X(-0.5),Y(k+0.5));c.lineTo(X(1.5),Y(k-1.5));c.stroke()});
  c.setLineDash([]);c.fillStyle='#5d6470';c.font='italic 13px Literata, Georgia, serif';c.fillText('h₁ line',X(-0.47),Y(0.42));c.fillText('h₂ line',X(0.98),Y(1.42));
  [[0,0,0],[0,1,1],[1,0,1],[1,1,0]].forEach(([a,b,y])=>{c.beginPath();c.arc(X(a),Y(b),7,0,7);c.fillStyle=y?INK:PAPER;c.fill();c.strokeStyle=INK;c.lineWidth=1.5;c.stroke()});
  let t='<table class="br"><thead><tr><th><i>x</i>₁</th><th><i>x</i>₂</th><th><i>h</i>₁ (OR)</th><th><i>h</i>₂ (NAND)</th><th><i>ŷ</i> (AND of h)</th></tr></thead><tbody>';
  [[0,0],[0,1],[1,0],[1,1]].forEach(([a,b])=>{t+=`<tr><td>${a}</td><td>${b}</td><td>${h1(a,b)}</td><td>${h2(a,b)}</td><td><b>${out(a,b)}</b></td></tr>`});
  $('#xTable').innerHTML=t+'</tbody></table>';
})();

nRender();
