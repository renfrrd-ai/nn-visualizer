// =============== RNN ===============
const HN=5,rr=rng(42),Whh=Array.from({length:HN},()=>Array.from({length:HN},()=>gauss(rr)*0.55)),bh=Array.from({length:HN},()=>gauss(rr)*0.15);
const colCache={};function charCol(ch){if(!colCache[ch]){const r=rng(ch.charCodeAt(0)*9973+11);colCache[ch]=Array.from({length:HN},()=>gauss(r)*0.9)}return colCache[ch]}
let rnnT=-1,rnnTimer=null,R;
function rnnCompute(){const w=($('#rnnWord').value||'a').slice(0,8),vocab=[...new Set(w)];const hs=[Array(HN).fill(0)],parts=[];
  for(let t=0;t<w.length;t++){const a=charCol(w[t]),hp=hs[t],b2=Whh.map(row=>row.reduce((s,v,j)=>s+v*hp[j],0)),z=a.map((v,i)=>v+b2[i]+bh[i]);parts.push({a,b2,z});hs.push(z.map(Math.tanh))}
  R={w,vocab,hs,parts}}
function rnnRender(){
  const{w,vocab,hs}=R,T=w.length,CW=120,X0=150,svg=$('#rnnSvg'),width=X0+T*CW+20;svg.setAttribute('width',width);svg.setAttribute('viewBox',`0 0 ${width} 430`);
  const hy=60,ch=24,xy=250,xc=20;let h=`<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#8b93a7"/></marker><marker id="arh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#f472b6"/></marker></defs>`;
  const vec=(x,y,v,on,lab)=>{let s=`<text x="${x}" y="${y-10}" fill="#8b93a7" font-size="12" text-anchor="middle">${lab}</text>`;v.forEach((val,i)=>{const c=on?divRGB(val,1):[29,35,48];s+=`<rect x="${x-24}" y="${y+i*ch}" width="48" height="${ch-2}" rx="4" fill="${css(c)}" stroke="#2a3242"/><text x="${x}" y="${y+i*ch+15}" fill="${ink(c)}" font-size="10.5" text-anchor="middle">${on?val.toFixed(2):'?'}</text>`});return s};
  h+=vec(70,hy,hs[0],true,'h₀ (start)');
  h+=`<text x="70" y="${hy+HN*ch+18}" fill="#8b93a7" font-size="10.5" text-anchor="middle">all zeros</text>`;
  for(let t=0;t<T;t++){const cx=X0+t*CW+CW/2-20,on=t<=rnnT,cur=t===rnnT;
    if(cur)h+=`<rect x="${cx-50}" y="${hy-36}" width="100" height="${xy+vocab.length*xc+70-hy}" rx="10" fill="rgba(34,211,238,.06)" stroke="#22d3ee" stroke-opacity=".5"/>`;
    h+=`<g opacity="${on?1:.35}">`;
    h+=vec(cx,hy,hs[t+1],on,`h${t+1}`);
    const px=t===0?70:X0+(t-1)*CW+CW/2-20,my=hy+HN*ch/2;
    h+=`<line x1="${px+27}" y1="${my}" x2="${cx-29}" y2="${my}" stroke="${cur?'#f472b6':'#8b93a7'}" stroke-width="${cur?2.5:1.5}" marker-end="url(#${cur?'arh':'ar'})"/><text x="${(px+cx)/2}" y="${my-6}" fill="#8b93a7" font-size="10" text-anchor="middle">W_hh</text>`;
    h+=`<line x1="${cx}" y1="${xy-16}" x2="${cx}" y2="${hy+HN*ch+6}" stroke="${cur?'#f472b6':'#8b93a7'}" stroke-width="${cur?2.5:1.5}" marker-end="url(#${cur?'arh':'ar'})"/><text x="${cx+6}" y="${(xy+hy+HN*ch)/2}" fill="#8b93a7" font-size="10">W_xh</text>`;
    vocab.forEach((c,k)=>{const one=c===w[t];h+=`<rect x="${cx-14}" y="${xy+k*xc}" width="28" height="${xc-3}" rx="3" fill="${one?'#22d3ee':'#1d2330'}" stroke="#2a3242"/><text x="${cx}" y="${xy+k*xc+12}" fill="${one?'#06222a':'#8b93a7'}" font-size="10" text-anchor="middle">${one?1:0}</text>`});
    h+=`<text x="${cx}" y="${xy+vocab.length*xc+24}" fill="#e6e9ef" font-size="20" font-weight="600" text-anchor="middle">'${w[t]===' '?'␣':w[t]}'</text><text x="${cx}" y="${xy+vocab.length*xc+42}" fill="#8b93a7" font-size="10.5" text-anchor="middle">x${t+1} · t=${t+1}</text></g>`}
  h+=`<text x="70" y="${xy+10}" fill="#8b93a7" font-size="10.5" text-anchor="middle">one-hot</text>`;
  vocab.forEach((c,k)=>{h+=`<text x="${X0-24}" y="${xy+k*xc+12}" fill="#8b93a7" font-size="10" text-anchor="end">'${c===' '?'␣':c}'</text>`});
  svg.innerHTML=h;rnnCalc()}
function rnnCalc(){const el=$('#rnnCalc'),t=rnnT;
  if(t<0){$('#rnnCalcTitle').textContent='Step calculation';el.innerHTML='<p class="hint" style="margin:0">Press Play or Step to feed the sequence in one character at a time.</p>';return}
  const{a,b2,z}=R.parts[t],ch=R.w[t],h=R.hs[t+1];$('#rnnCalcTitle').textContent=`Step t=${t+1}: reading '${ch}'`;
  const col=(v,title)=>`<div class="vec"><div class="t">${title}</div>${v.map(x=>{const c=divRGB(x,1);return`<div class="c" style="background:${css(c)};color:${ink(c)}">${x.toFixed(2)}</div>`}).join('')}</div>`;
  el.innerHTML=col(a,`W<sub>xh</sub>·x${t+1}<br>(column for '${ch}')`)+'<div class="op">+</div>'+col(b2,`W<sub>hh</sub>·h${t}<br>(memory)`)+'<div class="op">+</div>'+col(bh,'b<br>(bias)')+'<div class="op">=</div>'+col(z,'z')+'<div class="op">→</div>'+col(h,`h${t+1} = tanh(z)<br>(new memory)`)+
  `<p class="hint" style="flex-basis:100%;margin:8px 0 0">Since x${t+1} is one-hot, W<sub>xh</sub>·x${t+1} just picks out the one column of W<sub>xh</sub> that belongs to '${ch}'. tanh keeps every value between −1 and 1, so the memory can't blow up.</p>`}
function rnnStop(){clearTimeout(rnnTimer);rnnTimer=null;$('#rnnPlay').textContent='▶ Play'}
$('#rnnPlay').onclick=()=>{if(rnnTimer){rnnStop();return}if(rnnT>=R.w.length-1)rnnT=-1;$('#rnnPlay').textContent='❚❚ Pause';
  const tick=()=>{rnnT++;rnnRender();if(rnnT>=R.w.length-1){rnnStop();return}rnnTimer=setTimeout(tick,1800-+$('#rnnSpeed').value)};tick()};
$('#rnnStep').onclick=()=>{rnnStop();if(rnnT<R.w.length-1)rnnT++;rnnRender()};
$('#rnnAll').onclick=()=>{rnnStop();rnnT=R.w.length-1;rnnRender()};
$('#rnnReset').onclick=()=>{rnnStop();rnnT=-1;rnnRender()};
$('#rnnWord').addEventListener('input',()=>{rnnStop();rnnCompute();rnnT=R.w.length-1;rnnRender()});


rnnCompute();rnnRender();
