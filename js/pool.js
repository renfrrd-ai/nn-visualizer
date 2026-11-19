// =============== POOLING ===============
let pIn,pOut,pArg,pStepI=-1,pTimer=null,pInG,pOutG;
function randMap(n){const r=Math.random;return Array.from({length:n},()=>Array.from({length:n},()=>Math.floor(r()*10)))}
pIn=randMap(8);
function pool(A,k,s,mode){const oh=Math.floor((A.length-k)/s)+1,ow=Math.floor((A[0].length-k)/s)+1,O=[],G=[];
  for(let i=0;i<oh;i++){O.push([]);G.push([]);for(let j=0;j<ow;j++){let best=-Infinity,arg=null,sum=0;for(let a=0;a<k;a++)for(let b=0;b<k;b++){const v=A[i*s+a][j*s+b];sum+=v;if(v>best){best=v;arg=[i*s+a,j*s+b]}}O[i].push(mode==='max'?best:sum/(k*k));G[i].push(arg)}}return[O,G]}
const pK=()=>+$('#pSize').value,pS=()=>+$('#pStride').value,pM=()=>$('#pMode').value;
function poolBuild(){
  if(pIn.length<pK()){pIn=randMap(8)}
  [pOut,pArg]=pool(pIn,pK(),pS(),pM());
  pInG=makeGrid($('#pIn'),pIn.length,pIn[0].length);pOutG=makeGrid($('#pOut'),pOut.length,pOut[0].length);
  $('#pInSize').textContent=`${pIn.length}×${pIn[0].length}`;$('#pOutSize').textContent=`${pOut.length}×${pOut[0].length}`;
  pOutG.cells.forEach((row,i)=>row.forEach((d,j)=>d.addEventListener('mouseenter',()=>{poolStop();pStepI=Math.max(pStepI,i*pOut[0].length+j);poolPaintAt(i*pOut[0].length+j)})));
  poolPaintAt(pStepI)}
function poolPaintAt(focus){
  const m=Math.max(1e-9,...pIn.flat().map(Math.abs)),ow=pOut[0].length,total=pOut.length*ow,k=pK(),s=pS();
  pIn.forEach((row,i)=>row.forEach((v,j)=>{const d=pInG.cells[i][j];d.classList.remove('pick');paintCell(d,divRGB(v,m),fmt(v))}));
  pOut.forEach((row,i)=>row.forEach((v,j)=>{const d=pOutG.cells[i][j];if(i*ow+j<=pStepI)paintCell(d,divRGB(v,m),fmt(v));else{d.classList.add('empty');d.textContent=''}}));
  if(focus<0||focus>=total){pInG.ov.style.display='none';pOutG.ov.style.display='none';$('#pCalc').innerHTML='Press Play or Step to slide the window.';return}
  const i=Math.floor(focus/ow),j=focus%ow;placeWin(pInG.ov,i*s,j*s,k,k);placeWin(pOutG.ov,i,j,1,1);
  const vals=[];for(let a=0;a<k;a++)for(let b=0;b<k;b++)vals.push(fmt(pIn[i*s+a][j*s+b]));
  if(pM()==='max'){const[a,b]=pArg[i][j];pInG.cells[a][b].classList.add('pick');$('#pCalc').innerHTML=`<div class="sum">max(${vals.join(', ')})<br>= <b>${fmt(pOut[i][j],2)}</b></div><p style="margin-top:10px">The boxed cell wins. Only it passes through; the rest are dropped.</p>`}
  else $('#pCalc').innerHTML=`<div class="sum">(${vals.join(' + ')}) / ${k*k}<br>= <b>${fmt(pOut[i][j],2)}</b></div><p style="margin-top:10px">Every cell in the window contributes equally.</p>`;
}
function poolStop(){clearTimeout(pTimer);pTimer=null;$('#pPlay').textContent='Play'}
const pTotal=()=>pOut.length*pOut[0].length;
$('#pPlay').onclick=()=>{if(pTimer){poolStop();return}if(pStepI>=pTotal()-1)pStepI=-1;$('#pPlay').textContent='Pause';
  const tick=()=>{pStepI++;poolPaintAt(pStepI);if(pStepI>=pTotal()-1){poolStop();return}pTimer=setTimeout(tick,780-+$('#pSpeed').value)};tick()};
$('#pStep').onclick=()=>{poolStop();if(pStepI<pTotal()-1)pStepI++;poolPaintAt(pStepI)};
$('#pAll').onclick=()=>{poolStop();pStepI=pTotal()-1;poolPaintAt(pStepI)};
$('#pReset').onclick=()=>{poolStop();pStepI=-1;poolPaintAt(-1)};
['#pMode','#pSize','#pStride'].forEach(id=>$(id).onchange=()=>{poolStop();pStepI=-1;poolBuild();poolRealRender()});
$('#pRand').onclick=()=>{poolStop();pIn=randMap(8);pStepI=-1;poolBuild()};
$('#pFromConv').onclick=()=>{poolStop();pIn=cOut.map(r=>r.map(v=>Math.round(Math.max(0,v)*100)/100));pStepI=-1;poolBuild()};

function poolRealRender(){
  const wrap=$('#pReal');wrap.innerHTML='';
  let n=S,A=new Float32Array(S*S);for(let i=0;i<S*S;i++)A[i]=Math.max(0,rOut[i]);
  const mode=pM();
  const show=(arr,n,label)=>{const box=document.createElement('div');box.innerHTML=`<div class="lbl">${label}</div>`;const c=document.createElement('canvas');c.width=c.height=n;c.className='pix small';const x=c.getContext('2d'),im=x.createImageData(n,n);let m=1e-9;for(const v of arr)m=Math.max(m,v);
    for(let i=0;i<n*n;i++){const g=inkRGB(arr[i]/m);im.data.set([g[0],g[1],g[2],255],i*4)}x.putImageData(im,0,0);box.appendChild(c);wrap.appendChild(box)};
  show(A,n,`After ReLU, ${n}×${n}`);
  for(let r=0;r<3;r++){const h=n/2,B=new Float32Array(h*h);for(let i=0;i<h;i++)for(let j=0;j<h;j++){const q=[A[2*i*n+2*j],A[2*i*n+2*j+1],A[(2*i+1)*n+2*j],A[(2*i+1)*n+2*j+1]];B[i*h+j]=mode==='max'?Math.max(...q):(q[0]+q[1]+q[2]+q[3])/4}
    A=B;n=h;show(A,n,`${mode==='max'?'Max':'Average'} pooled, ${n}×${n}`)}
}


poolBuild();poolRealRender();
