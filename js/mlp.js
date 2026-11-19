// =============== DENSE NETWORK ===============
const ML=[3,4,4,2],ACT={relu:z=>Math.max(0,z),tanh:Math.tanh,sigmoid:z=>1/(1+Math.exp(-z))},ACTN={relu:'ReLU',tanh:'tanh',sigmoid:'sigmoid'};
let mW,mB,mX=[0.6,-0.4,0.9],mSeed=7,mReveal=3,mFlow=0,mSel=null,mTimer=null,mA,mZ;
function mInit(){const r=rng(mSeed);mW=[];mB=[];for(let l=0;l<ML.length-1;l++){mW.push(Array.from({length:ML[l+1]},()=>Array.from({length:ML[l]},()=>gauss(r)*0.9)));mB.push(Array.from({length:ML[l+1]},()=>gauss(r)*0.25))}}
function mForward(){const f=ACT[$('#mAct').value];mA=[mX.slice()];mZ=[null];
  for(let l=0;l<mW.length;l++){const z=mW[l].map((row,i)=>row.reduce((s,w,j)=>s+w*mA[l][j],0)+mB[l][i]);mZ.push(z);
    if(l===mW.length-1){const mx=Math.max(...z),e=z.map(v=>Math.exp(v-mx)),t=e.reduce((a,b)=>a+b);mA.push(e.map(v=>v/t))}else mA.push(z.map(f))}}
const mPos=(l,i)=>[100+l*190,200+(i-(ML[l]-1)/2)*80];
function mRender(){
  mForward();const svg=$('#mSvg');let h='';
  const names=['Input','Hidden 1','Hidden 2','Output'];
  ML.forEach((n,l)=>{h+=`<text x="${mPos(l,0)[0]}" y="28" fill="#8b93a7" font-size="12" text-anchor="middle">${names[l]}</text>`});
  for(let l=0;l<mW.length;l++)mW[l].forEach((row,i)=>row.forEach((w,j)=>{const[a,b]=mPos(l,j),[c,d]=mPos(l+1,i);
    const sel=mSel&&mSel[0]===l+1&&mSel[1]===i,dim=mSel&&!sel;const on=l+1<=mReveal;
    h+=`<line x1="${a+22}" y1="${b}" x2="${c-22}" y2="${d}" stroke="${w>0?'#f59e0b':'#3b82f6'}" stroke-width="${(0.6+Math.min(Math.abs(w),2)*1.6).toFixed(2)}" opacity="${dim?0.08:on?0.75:0.18}" class="${mFlow===l+1?'flow':''}"/>`;
    if(sel)h+=`<text x="${(a+c)/2}" y="${(b+d)/2-4}" fill="#e6e9ef" font-size="10.5" text-anchor="middle" paint-order="stroke" stroke="#161b25" stroke-width="4">${sgn(w)}</text>`}));
  ML.forEach((n,l)=>{for(let i=0;i<n;i++){const[x,y]=mPos(l,i),on=l<=mReveal,v=mA[l][i];
    const fill=on?div(v,l===ML.length-1?1:1.5):'#1d2330',rgb=on?divRGB(v,l===ML.length-1?1:1.5):[29,35,48];
    const sel=mSel&&mSel[0]===l&&mSel[1]===i;
    h+=`<g style="cursor:${l?'pointer':'default'}" data-l="${l}" data-i="${i}"><circle cx="${x}" cy="${y}" r="22" fill="${fill}" stroke="${sel?'#f472b6':'#2a3242'}" stroke-width="${sel?3:1.5}"/>`;
    h+=`<text x="${x}" y="${y+4}" fill="${ink(rgb)}" font-size="11" text-anchor="middle" pointer-events="none">${on?(l===ML.length-1?Math.round(v*100)+'%':v.toFixed(2)):'?'}</text></g>`;
    if(l===0)h+=`<text x="${x-32}" y="${y+4}" fill="#8b93a7" font-size="12" text-anchor="end">x${'₁₂₃'[i]}</text>`;
    if(l===ML.length-1)h+=`<text x="${x+32}" y="${y+4}" fill="${on?'#e6e9ef':'#8b93a7'}" font-size="12">class ${'AB'[i]}</text>`}});
  svg.innerHTML=h;
  svg.querySelectorAll('g[data-l]').forEach(g=>g.addEventListener('click',()=>{const l=+g.dataset.l,i=+g.dataset.i;if(!l){mSel=null;mDetail();mRender();return}mSel=[l,i];mReveal=3;mRender();mDetail()}));
}
function mDetail(){const el=$('#mDetail');if(!mSel){el.textContent='No neuron selected.';return}
  const[l,i]=mSel,ws=mW[l-1][i],prev=mA[l-1],last=l===ML.length-1;
  const terms=ws.map((w,j)=>`(${sgn(w)})(${sgn(prev[j])})`).join(' + ');
  let s=`<b>${last?'Output neuron '+'AB'[i]:'Neuron '+(i+1)+' in Hidden '+l}</b>\n\nz = ${terms} + b(${sgn(mB[l-1][i])})\n  = <b>${sgn(mZ[l][i])}</b>\n\n`;
  if(last)s+=`softmax turns the output z values into probabilities that sum to 1:\nz = [${mZ[l].map(sgn).join(', ')}]  →  p = [${mA[l].map(v=>(v*100).toFixed(1)+'%').join(', ')}]`;
  else s+=`a = ${ACTN[$('#mAct').value]}(z) = <b>${sgn(mA[l][i])}</b>  ← this is what the next layer receives`;
  el.innerHTML=s}
function mSync(){for(let k=0;k<3;k++){$('#mx'+k).value=mX[k];$('#mv'+k).textContent=sgn(mX[k])}}
for(let k=0;k<3;k++)$('#mx'+k).addEventListener('input',e=>{mX[k]=+e.target.value;$('#mv'+k).textContent=sgn(mX[k]);clearInterval(mTimer);mFlow=0;mReveal=3;mRender();mDetail()});
$('#mAct').onchange=()=>{mRender();mDetail()};
$('#mNew').onclick=()=>{mSeed=Math.floor(Math.random()*1e6);mInit();mRender();mDetail()};
$('#mRun').onclick=()=>{clearInterval(mTimer);mSel=null;mDetail();mReveal=0;mFlow=1;mRender();
  mTimer=setInterval(()=>{mReveal=mFlow;mFlow++;if(mFlow>3){mFlow=0;clearInterval(mTimer)}mRender()},900)};


mInit();mSync();mRender();
