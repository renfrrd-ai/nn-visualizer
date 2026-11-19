// =============== CONVOLUTION ===============
const PRESETS={
 seven:['..........','.########.','.########.','.......##.','......##..','.....##...','....##....','...##.....','...##.....','..........'],
 x:['#........#','.#......#.','..#....#..','...#..#...','....##....','....##....','...#..#...','..#....#..','.#......#.','#........#'],
 box:['..........','.########.','.#......#.','.#......#.','.#......#.','.#......#.','.#......#.','.#......#.','.########.','..........'],
 plus:['..........','....##....','....##....','....##....','.########.','.########.','....##....','....##....','....##....','..........'],
 blank:Array(10).fill('..........')
};
const KERNELS={
 vedge:{name:'Vertical edges (Sobel x)',k:[[-1,0,1],[-2,0,2],[-1,0,1]],d:'Left column negative, right column positive. Big output where brightness changes from left to right: vertical edges. Orange = dark→bright, blue = bright→dark.'},
 hedge:{name:'Horizontal edges (Sobel y)',k:[[-1,-2,-1],[0,0,0],[1,2,1]],d:'Top row negative, bottom row positive. Responds to brightness changing from top to bottom: horizontal edges.'},
 outline:{name:'Outline',k:[[-1,-1,-1],[-1,8,-1],[-1,-1,-1]],d:'The centre pixel minus its 8 neighbours. Flat regions cancel to 0; outlines and corners stand out.'},
 sharpen:{name:'Sharpen',k:[[0,-1,0],[-1,5,-1],[0,-1,0]],d:'Keeps the pixel but subtracts its neighbours, which exaggerates differences.'},
 blur:{name:'Blur (box average)',k:[[1/9,1/9,1/9],[1/9,1/9,1/9],[1/9,1/9,1/9]],d:'Every weight is 1/9, so each output is the average of the 3×3 patch. It smooths things out.'},
 identity:{name:'Identity',k:[[0,0,0],[0,1,0],[0,0,0]],d:'Only the centre weight is 1, so the output is just a copy of the input. A good sanity check.'},
 custom:{name:'Custom (edit the numbers)',k:null,d:'Your own kernel. Type any numbers into the 3×3 grid.'}
};
const fromStr=rows=>rows.map(r=>[...r].map(ch=>ch==='#'?1:0));
let cImg=fromStr(PRESETS.seven),cK=KERNELS.vedge.k.map(r=>r.slice()),cStride=1,cPad=0,cStepI=-1,cTimer=null,cP,cOut,cInG,cOutG,drawing=false,drawVal=1;
const kSel=$('#cKer');
for(const[key,v]of Object.entries(KERNELS)){const o=document.createElement('option');o.value=key;o.textContent=v.name;kSel.appendChild(o)}
const kInputs=[];
for(let i=0;i<9;i++){const inp=document.createElement('input');inp.type='number';inp.step='any';$('#cK').appendChild(inp);kInputs.push(inp);
  inp.addEventListener('input',()=>{const v=parseFloat(inp.value);if(isNaN(v))return;cK[Math.floor(i/3)][i%3]=v;kSel.value='custom';$('#cKerDesc').textContent=KERNELS.custom.d;convRecompute();kernelPaint(false);realConv()})}
function kernelPaint(setVals=true){const m=Math.max(...cK.flat().map(Math.abs))||1;kInputs.forEach((inp,i)=>{const w=cK[Math.floor(i/3)][i%3];if(setVals)inp.value=fmt(w,2);inp.style.background=div(w,m)})}
function pad2(A,p){const n=A.length,m=A[0].length,R=[];for(let i=0;i<n+2*p;i++){R.push([]);for(let j=0;j<m+2*p;j++){const a=i-p,b=j-p;R[i].push(a>=0&&a<n&&b>=0&&b<m?A[a][b]:0)}}return R}
function conv2d(P,K,s){const k=K.length,oh=Math.floor((P.length-k)/s)+1,ow=Math.floor((P[0].length-k)/s)+1,O=[];for(let i=0;i<oh;i++){O.push([]);for(let j=0;j<ow;j++){let sum=0;for(let a=0;a<k;a++)for(let b=0;b<k;b++)sum+=P[i*s+a][j*s+b]*K[a][b];O[i].push(sum)}}return O}
function convRecompute(){cP=pad2(cImg,cPad);cOut=conv2d(cP,cK,cStride);convPaint()}
function convBuild(){
  cP=pad2(cImg,cPad);cOut=conv2d(cP,cK,cStride);
  cInG=makeGrid($('#cIn'),cP.length,cP[0].length);
  cOutG=makeGrid($('#cOut'),cOut.length,cOut[0].length);
  $('#cInSize').textContent=`${cP.length}×${cP[0].length}`+(cPad?' (with padding)':'');
  $('#cOutSize').textContent=`${cOut.length}×${cOut[0].length}`;
  cInG.cells.forEach((row,i)=>row.forEach((d,j)=>{
    const a=i-cPad,b=j-cPad;
    if(a<0||b<0||a>=10||b>=10){d.classList.add('pad');return}
    d.addEventListener('pointerdown',e=>{e.preventDefault();d.releasePointerCapture&&d.releasePointerCapture(e.pointerId);drawing=true;drawVal=cImg[a][b]>0.5?0:1;cImg[a][b]=drawVal;convRecompute();realConvLightRefresh()});
    d.addEventListener('pointerenter',()=>{if(drawing&&cImg[a][b]!==drawVal){cImg[a][b]=drawVal;convRecompute()}});
  }));
  cOutG.cells.forEach((row,i)=>row.forEach((d,j)=>d.addEventListener('mouseenter',()=>{convStop();cStepI=Math.max(cStepI,i*cOut[0].length+j);convPaintAt(i*cOut[0].length+j)})));
  convPaint();
}
document.addEventListener('pointerup',()=>{drawing=false});
let cFocus=null;
function convPaint(){convPaintAt(cStepI)}
function convPaintAt(focus){
  const ow=cOut[0].length,total=cOut.length*ow,m=Math.max(1e-9,...cOut.flat().map(Math.abs));
  cP.forEach((row,i)=>row.forEach((v,j)=>{const d=cInG.cells[i][j];if(d.classList.contains('pad'))d.textContent='0';else paintCell(d,grayRGB(v),fmt(v))}));
  cOut.forEach((row,i)=>row.forEach((v,j)=>{const d=cOutG.cells[i][j],idx=i*ow+j;if(idx<=cStepI)paintCell(d,divRGB(v,m),fmt(v));else{d.classList.add('empty');d.textContent=''}}));
  if(focus<0||focus>=total){cInG.ov.style.display='none';cOutG.ov.style.display='none';$('#cCalc').innerHTML='Press <b style="color:var(--text)">Play</b> or <b style="color:var(--text)">Step</b> to slide the kernel.';return}
  const i=Math.floor(focus/ow),j=focus%ow,s=cStride;
  placeWin(cInG.ov,i*s,j*s,3,3);placeWin(cOutG.ov,i,j,1,1);
  let prods=[],html='<div class="cgrid">';
  for(let a=0;a<3;a++)for(let b=0;b<3;b++)prods.push([cP[i*s+a][j*s+b],cK[a][b]]);
  const pm=Math.max(1e-9,...prods.map(([v,w])=>Math.abs(v*w)));
  prods.forEach(([v,w])=>{html+=`<div style="background:${div(v*w,pm)}">${fmt(v)}×${fmt(w,2)}</div>`});
  html+=`</div><div class="sum">pixel × weight, summed<br>= <b>${fmt(cOut[i][j],2)}</b> → output (${i}, ${j})</div>`;
  $('#cCalc').innerHTML=html;
}
function convStop(){clearTimeout(cTimer);cTimer=null;$('#cPlay').textContent='▶ Play'}
function convTotal(){return cOut.length*cOut[0].length}
$('#cPlay').onclick=()=>{if(cTimer){convStop();return}if(cStepI>=convTotal()-1)cStepI=-1;$('#cPlay').textContent='❚❚ Pause';
  const tick=()=>{cStepI++;convPaint();if(cStepI>=convTotal()-1){convStop();return}cTimer=setTimeout(tick,780-+$('#cSpeed').value)};tick()};
$('#cStep').onclick=()=>{convStop();if(cStepI<convTotal()-1)cStepI++;convPaint()};
$('#cAll').onclick=()=>{convStop();cStepI=convTotal()-1;convPaint()};
$('#cReset').onclick=()=>{convStop();cStepI=-1;convPaint()};
$('#cImg').onchange=e=>{cImg=fromStr(PRESETS[e.target.value]);convRecompute()};
kSel.onchange=e=>{const K=KERNELS[e.target.value];if(K.k)cK=K.k.map(r=>r.slice());$('#cKerDesc').textContent=K.d;kernelPaint();convRecompute();realConv()};
$('#cStride').onchange=e=>{convStop();cStride=+e.target.value;cStepI=-1;convBuild()};
$('#cPad').onchange=e=>{convStop();cPad=+e.target.value;cStepI=-1;convBuild()};
function realConvLightRefresh(){}

// ---- real image ----
const S=160;let rGray=new Float32Array(S*S),rOut=new Float32Array(S*S),rP=S*S,rAnim=null,rLensPos=null;
const srcCtx=$('#rSrc').getContext('2d'),overCtx=$('#rOver').getContext('2d'),outCtx=$('#rOut').getContext('2d');
function setFromCanvas(c){const d=c.getContext('2d').getImageData(0,0,S,S).data;for(let i=0;i<S*S;i++)rGray[i]=(0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2])/255;
  const im=srcCtx.createImageData(S,S);for(let i=0;i<S*S;i++){const g=Math.round(rGray[i]*255);im.data.set([g,g,g,255],i*4)}srcCtx.putImageData(im,0,0);rP=S*S;realConv();if(typeof poolRealRender==='function')poolRealRender()}
function drawScene(){const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,S);g.addColorStop(0,'#33415c');g.addColorStop(1,'#a3afbf');x.fillStyle=g;x.fillRect(0,0,S,S);
  x.fillStyle='#f4f4f4';x.beginPath();x.arc(46,46,26,0,7);x.fill();
  x.fillStyle='#161616';x.fillRect(94,24,46,46);
  x.fillStyle='#4a4a4a';x.beginPath();x.moveTo(12,148);x.lineTo(54,92);x.lineTo(96,148);x.fill();
  x.fillStyle='#ffffff';x.font='bold 26px Inter, Arial, sans-serif';x.fillText('CNN',100,140);
  x.strokeStyle='#0b0b0b';x.lineWidth=3;for(let k=0;k<4;k++){x.beginPath();x.moveTo(104,84+k*9);x.lineTo(150,84+k*9);x.stroke()}
  setFromCanvas(c)}
const clampI=v=>v<0?0:v>=S?S-1:v;
function convAt(gray,y,x,K){let s=0;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)s+=gray[clampI(y+a)*S+clampI(x+b)]*K[a+1][b+1];return s}
function realConv(){for(let y=0;y<S;y++)for(let x=0;x<S;x++)rOut[y*S+x]=convAt(rGray,y,x,cK);realRender();if(rLensPos)lens(rLensPos[0],rLensPos[1])}
function realRender(){
  const mode=$('#rMode').value,im=outCtx.createImageData(S,S);let m=1e-9;
  const val=v=>mode==='abs'?Math.abs(v):mode==='relu'?Math.max(0,v):v;
  for(let i=0;i<S*S;i++)m=Math.max(m,Math.abs(val(rOut[i])));
  for(let i=0;i<S*S;i++){const c=i<rP?(mode==='signed'?divRGB(rOut[i],m):grayRGB(val(rOut[i])/m)):[22,27,37];im.data.set([c[0],c[1],c[2],255],i*4)}
  outCtx.putImageData(im,0,0)}
function drawBox(x,y){overCtx.clearRect(0,0,320,320);overCtx.strokeStyle='#f472b6';overCtx.lineWidth=2;overCtx.strokeRect((x-1)*2,(y-1)*2,6,6);overCtx.globalAlpha=.5;overCtx.beginPath();overCtx.arc(x*2+1,y*2+1,16,0,7);overCtx.stroke();overCtx.globalAlpha=1}
function lens(x,y){let html='<div class="cgrid">';for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const v=rGray[clampI(y+a)*S+clampI(x+b)],c=grayRGB(v);html+=`<div style="background:${css(c)};color:${ink(c)}">${v.toFixed(2)}×${fmt(cK[a+1][b+1],2)}</div>`}
  $('#rLens').innerHTML=html+`</div><div class="sum">pixel (${x}, ${y})<br>sum = <b>${fmt(convAt(rGray,y,x,cK),2)}</b></div>`}
$('#rOver').addEventListener('mousemove',e=>{if(rAnim)return;const r=e.target.getBoundingClientRect();const x=clampI(Math.floor((e.clientX-r.left)/r.width*S)),y=clampI(Math.floor((e.clientY-r.top)/r.height*S));rLensPos=[x,y];drawBox(x,y);lens(x,y)});
$('#rOver').addEventListener('mouseleave',()=>{if(!rAnim)overCtx.clearRect(0,0,320,320)});
$('#rSweep').onclick=()=>{if(rAnim){cancelAnimationFrame(rAnim);rAnim=null;rP=S*S;realRender();overCtx.clearRect(0,0,320,320);$('#rSweep').textContent='▶ Sweep kernel';return}
  rP=0;$('#rSweep').textContent='■ Stop';const step=S*S/(6*60);
  const f=()=>{rP=Math.min(S*S,rP+step);const p=Math.floor(rP)-1,x=p%S,y=Math.floor(p/S);drawBox(x,y);lens(x,y);realRender();
    if(rP>=S*S){rAnim=null;$('#rSweep').textContent='▶ Sweep kernel';setTimeout(()=>overCtx.clearRect(0,0,320,320),400);return}rAnim=requestAnimationFrame(f)};rAnim=requestAnimationFrame(f)};
$('#rMode').onchange=realRender;
$('#rScene').onclick=drawScene;
$('#rFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const url=URL.createObjectURL(f),img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');const s=Math.max(S/img.width,S/img.height),w=img.width*s,h=img.height*s;x.drawImage(img,(S-w)/2,(S-h)/2,w,h);setFromCanvas(c);URL.revokeObjectURL(url)};img.src=url};


// init
$('#cKerDesc').textContent=KERNELS.vedge.d;kernelPaint();convBuild();drawScene();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{drawScene()});
