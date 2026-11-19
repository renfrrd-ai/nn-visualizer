// =============== CONVOLUTION ===============
const PRESETS={
 seven:['..........','.########.','.########.','.......##.','......##..','.....##...','....##....','...##.....','...##.....','..........'],
 x:['#........#','.#......#.','..#....#..','...#..#...','....##....','....##....','...#..#...','..#....#..','.#......#.','#........#'],
 box:['..........','.########.','.#......#.','.#......#.','.#......#.','.#......#.','.#......#.','.#......#.','.########.','..........'],
 plus:['..........','....##....','....##....','....##....','.########.','.########.','....##....','....##....','....##....','..........'],
 blank:Array(10).fill('..........')
};
// Each filter = a 3x3 spatial kernel (k) + how it mixes the red, green and blue
// channels (ch). Grayscale filters use standard luminance weights, so they
// respond to brightness; colour filters weight the channels differently.
const LUM=[0.299,0.587,0.114];
const B9=1/9;
const KERNELS={
 identity:{g:'Basic',name:'Identity',k:[[0,0,0],[0,1,0],[0,0,0]],d:'Only the centre weight is 1, so the output is a copy of the input. A good sanity check.'},
 blur:{g:'Basic',name:'Box blur',k:[[B9,B9,B9],[B9,B9,B9],[B9,B9,B9]],d:'Every weight is 1/9, so each output is the average of the 3×3 patch. It smooths things out.'},
 gauss:{g:'Basic',name:'Gaussian blur',k:[[1/16,2/16,1/16],[2/16,4/16,2/16],[1/16,2/16,1/16]],d:'Like a box blur, but nearer pixels count more, so the result is softer and less blocky.'},
 sharpen:{g:'Basic',name:'Sharpen',k:[[0,-1,0],[-1,5,-1],[0,-1,0]],d:'Keeps the pixel but subtracts its neighbours, which exaggerates differences.'},
 vedge:{g:'Edges',name:'Vertical edges (Sobel x)',k:[[-1,0,1],[-2,0,2],[-1,0,1]],d:'Left column negative, right column positive. Big output where brightness changes from left to right: vertical edges. Ochre marks dark-to-bright, blue marks bright-to-dark.'},
 hedge:{g:'Edges',name:'Horizontal edges (Sobel y)',k:[[-1,-2,-1],[0,0,0],[1,2,1]],d:'Top row negative, bottom row positive. Responds to brightness changing from top to bottom: horizontal edges.'},
 dedge:{g:'Edges',name:'Diagonal edges (Sobel 45°)',k:[[0,1,2],[-1,0,1],[-2,-1,0]],d:'Sobel rotated by 45°. Responds to edges running from bottom-left to top-right.'},
 prewitt:{g:'Edges',name:'Vertical edges (Prewitt)',k:[[-1,0,1],[-1,0,1],[-1,0,1]],d:'Sobel\'s simpler cousin: every row weighted equally. Slightly noisier, same idea.'},
 laplace:{g:'Edges',name:'Laplacian (all directions)',k:[[0,1,0],[1,-4,1],[0,1,0]],d:'The four neighbours minus four times the centre. Zero on flat areas and smooth gradients; non-zero on edges in any direction.'},
 outline:{g:'Edges',name:'Outline',k:[[-1,-1,-1],[-1,8,-1],[-1,-1,-1]],d:'The centre pixel minus its 8 neighbours. Flat regions cancel to 0; outlines and corners stand out.'},
 emboss:{g:'Edges',name:'Emboss',k:[[-2,-1,0],[-1,1,1],[0,1,2]],d:'Positive towards the bottom-right, negative towards the top-left, so edges look raised as if lit from one side.'},
 red:{g:'Colour',name:'Red detector',k:[[B9,B9,B9],[B9,B9,B9],[B9,B9,B9]],ch:[1,-1,-0.5],d:'Channel weights R +1, G −1, B −0.5: positive only where red clearly beats green and blue. White and yellow mostly cancel out, because their green is high too.'},
 green:{g:'Colour',name:'Green detector',k:[[B9,B9,B9],[B9,B9,B9],[B9,B9,B9]],ch:[-0.5,1,-0.5],d:'Channel weights R −0.5, G +1, B −0.5: lights up green regions.'},
 blue:{g:'Colour',name:'Blue detector',k:[[B9,B9,B9],[B9,B9,B9],[B9,B9,B9]],ch:[-0.5,-0.5,1],d:'Channel weights R −0.5, G −0.5, B +1: lights up blue regions, like the sky.'},
 yellow:{g:'Colour',name:'Yellow detector',k:[[B9,B9,B9],[B9,B9,B9],[B9,B9,B9]],ch:[0.5,0.5,-1],d:'Yellow is red plus green with no blue, so the weights are R +0.5, G +0.5, B −1.'},
 rgedge:{g:'Colour',name:'Red–green colour edges',k:[[-1,0,1],[-2,0,2],[-1,0,1]],ch:[1,-1,0],d:'A Sobel kernel applied to red minus green. It finds edges where the colour changes, even when the brightness doesn\'t.'},
 custom:{g:'Custom',name:'Custom (edit the numbers)',k:null,d:'Your own filter. Type any numbers into the 3×3 grid, and set how much each colour channel counts.'}
};
const fromStr=rows=>rows.map(r=>[...r].map(ch=>ch==='#'?1:0));
let cImg=fromStr(PRESETS.seven),cK=KERNELS.vedge.k.map(r=>r.slice()),cCh=LUM.slice(),cStride=1,cPad=0,cStepI=-1,cTimer=null,cP,cOut,cInG,cOutG,drawing=false,drawVal=1;
const kSel=$('#cKer');
{const groups={};for(const[key,v]of Object.entries(KERNELS)){if(!groups[v.g]){groups[v.g]=document.createElement('optgroup');groups[v.g].label=v.g;kSel.appendChild(groups[v.g])}const o=document.createElement('option');o.value=key;o.textContent=v.name;groups[v.g].appendChild(o)}kSel.value='vedge'}
const kInputs=[];
for(let i=0;i<9;i++){const inp=document.createElement('input');inp.type='number';inp.step='any';$('#cK').appendChild(inp);kInputs.push(inp);
  inp.addEventListener('input',()=>{const v=parseFloat(inp.value);if(isNaN(v))return;cK[Math.floor(i/3)][i%3]=v;toCustom();convRecompute();kernelPaint(false);realConv()})}
function toCustom(){kSel.value='custom';$('#cKerDesc').textContent=KERNELS.custom.d}
const chInputs=[...document.querySelectorAll('#cCh input')];
chInputs.forEach((inp,c)=>inp.addEventListener('input',()=>{const v=parseFloat(inp.value);if(isNaN(v))return;cCh[c]=v;toCustom();chPaint(false);realConv()}));
function chPaint(setVals=true){chInputs.forEach((inp,c)=>{if(setVals)inp.value=fmt(cCh[c],2);inp.style.background=div(cCh[c],1)});$('#cColorNote').style.display=cCh.every((v,c)=>Math.abs(v-LUM[c])<1e-9)?'none':'block'}
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
  cP.forEach((row,i)=>row.forEach((v,j)=>{const d=cInG.cells[i][j];if(d.classList.contains('pad'))d.textContent='0';else paintCell(d,paperGray(v),fmt(v))}));
  cOut.forEach((row,i)=>row.forEach((v,j)=>{const d=cOutG.cells[i][j],idx=i*ow+j;if(idx<=cStepI)paintCell(d,divRGB(v,m),fmt(v));else{d.classList.add('empty');d.textContent=''}}));
  if(focus<0||focus>=total){cInG.ov.style.display='none';cOutG.ov.style.display='none';$('#cCalc').innerHTML='Press Play or Step to slide the kernel.';return}
  const i=Math.floor(focus/ow),j=focus%ow,s=cStride;
  placeWin(cInG.ov,i*s,j*s,3,3);placeWin(cOutG.ov,i,j,1,1);
  let prods=[],html='<div class="cgrid">';
  for(let a=0;a<3;a++)for(let b=0;b<3;b++)prods.push([cP[i*s+a][j*s+b],cK[a][b]]);
  const pm=Math.max(1e-9,...prods.map(([v,w])=>Math.abs(v*w)));
  prods.forEach(([v,w])=>{const c=divRGB(v*w,pm);html+=`<div style="background:${css(c)};color:${ink(c)}">${fmt(v)}×${fmt(w,2)}</div>`});
  html+=`</div><div class="sum">Sum of the nine products: <b>${fmt(cOut[i][j],2)}</b><br>written to row ${i+1}, column ${j+1}</div>`;
  $('#cCalc').innerHTML=html;
}
function convStop(){clearTimeout(cTimer);cTimer=null;$('#cPlay').textContent='Play'}
function convTotal(){return cOut.length*cOut[0].length}
$('#cPlay').onclick=()=>{if(cTimer){convStop();return}if(cStepI>=convTotal()-1)cStepI=-1;$('#cPlay').textContent='Pause';
  const tick=()=>{cStepI++;convPaint();if(cStepI>=convTotal()-1){convStop();return}cTimer=setTimeout(tick,780-+$('#cSpeed').value)};tick()};
$('#cStep').onclick=()=>{convStop();if(cStepI<convTotal()-1)cStepI++;convPaint()};
$('#cAll').onclick=()=>{convStop();cStepI=convTotal()-1;convPaint()};
$('#cReset').onclick=()=>{convStop();cStepI=-1;convPaint()};
$('#cImg').onchange=e=>{cImg=fromStr(PRESETS[e.target.value]);convRecompute()};
kSel.onchange=e=>{const K=KERNELS[e.target.value];if(K.k){cK=K.k.map(r=>r.slice());cCh=(K.ch||LUM).slice();$('#rMode').value=K.g==='Colour'?'relu':'abs'}$('#cKerDesc').textContent=K.d;kernelPaint();chPaint();convRecompute();realConv()};
$('#cStride').onchange=e=>{convStop();cStride=+e.target.value;cStepI=-1;convBuild()};
$('#cPad').onchange=e=>{convStop();cPad=+e.target.value;cStepI=-1;convBuild()};
function realConvLightRefresh(){}

// ---- real image ----
const S=160;let rRGB=new Float32Array(S*S*3),rGray=new Float32Array(S*S),rOut=new Float32Array(S*S),rP=S*S,rAnim=null,rLensPos=null;
const srcCtx=$('#rSrc').getContext('2d'),overCtx=$('#rOver').getContext('2d'),outCtx=$('#rOut').getContext('2d');
function setFromCanvas(c){const d=c.getContext('2d').getImageData(0,0,S,S).data;for(let i=0;i<S*S;i++)for(let k=0;k<3;k++)rRGB[i*3+k]=d[i*4+k]/255;
  srcCtx.putImageData(c.getContext('2d').getImageData(0,0,S,S),0,0);rP=S*S;realConv();if(typeof poolRealRender==='function')poolRealRender()}
function drawScene(){const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,S);g.addColorStop(0,'#3d7cc9');g.addColorStop(0.62,'#b9d4ee');g.addColorStop(0.62,'#6a9a4a');g.addColorStop(1,'#4f7a35');x.fillStyle=g;x.fillRect(0,0,S,S);
  x.fillStyle='#d62828';x.beginPath();x.arc(44,42,24,0,7);x.fill();
  x.fillStyle='#f2c230';x.fillRect(96,22,44,44);
  x.fillStyle='#2f5d1e';x.beginPath();x.moveTo(10,150);x.lineTo(52,90);x.lineTo(94,150);x.fill();
  x.fillStyle='#ffffff';x.font='bold 26px Inter, Arial, sans-serif';x.fillText('CNN',100,146);
  x.strokeStyle='#161616';x.lineWidth=3;for(let k=0;k<3;k++){x.beginPath();x.moveTo(104,80+k*9);x.lineTo(150,80+k*9);x.stroke()}
  setFromCanvas(c)}
const clampI=v=>v<0?0:v>=S?S-1:v;
function convAt(gray,y,x,K){let s=0;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)s+=gray[clampI(y+a)*S+clampI(x+b)]*K[a+1][b+1];return s}
// Collapse the three colour channels into one number per pixel using the filter's channel weights.
function project(){for(let i=0;i<S*S;i++)rGray[i]=cCh[0]*rRGB[i*3]+cCh[1]*rRGB[i*3+1]+cCh[2]*rRGB[i*3+2]}
function realConv(){project();for(let y=0;y<S;y++)for(let x=0;x<S;x++)rOut[y*S+x]=convAt(rGray,y,x,cK);realRender();if(rLensPos)lens(rLensPos[0],rLensPos[1]);if(typeof poolRealRender==='function')poolRealRender()}
function realRender(){
  const mode=$('#rMode').value,im=outCtx.createImageData(S,S);let m=1e-9;
  const val=v=>mode==='abs'?Math.abs(v):mode==='relu'?Math.max(0,v):v;
  for(let i=0;i<S*S;i++)m=Math.max(m,Math.abs(val(rOut[i])));
  for(let i=0;i<S*S;i++){const c=i<rP?(mode==='signed'?divRGB(rOut[i],m):inkRGB(val(rOut[i])/m)):[251,251,248];im.data.set([c[0],c[1],c[2],255],i*4)}
  outCtx.putImageData(im,0,0)}
function drawBox(x,y){overCtx.clearRect(0,0,320,320);overCtx.strokeStyle='#c1121f';overCtx.lineWidth=2;overCtx.strokeRect((x-1)*2,(y-1)*2,6,6);overCtx.globalAlpha=.5;overCtx.beginPath();overCtx.arc(x*2+1,y*2+1,16,0,7);overCtx.stroke();overCtx.globalAlpha=1}
function lens(x,y){let html='<div class="cgrid">';for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const idx=clampI(y+a)*S+clampI(x+b),v=rGray[idx],c=[0,1,2].map(k=>Math.round(rRGB[idx*3+k]*255));html+=`<div style="background:${css(c)};color:${ink(c)}">${v.toFixed(2)}×${fmt(cK[a+1][b+1],2)}</div>`}
  $('#rLens').innerHTML=html+`</div><div class="sum">At pixel (${x}, ${y})<br>sum: <b>${fmt(convAt(rGray,y,x,cK),2)}</b></div>`}
$('#rOver').addEventListener('mousemove',e=>{if(rAnim)return;const r=e.target.getBoundingClientRect();const x=clampI(Math.floor((e.clientX-r.left)/r.width*S)),y=clampI(Math.floor((e.clientY-r.top)/r.height*S));rLensPos=[x,y];drawBox(x,y);lens(x,y)});
$('#rOver').addEventListener('mouseleave',()=>{if(!rAnim)overCtx.clearRect(0,0,320,320)});
$('#rSweep').onclick=()=>{if(rAnim){cancelAnimationFrame(rAnim);rAnim=null;rP=S*S;realRender();overCtx.clearRect(0,0,320,320);$('#rSweep').textContent='Sweep kernel';return}
  rP=0;$('#rSweep').textContent='Stop';const step=S*S/(6*60);
  const f=()=>{rP=Math.min(S*S,rP+step);const p=Math.floor(rP)-1,x=p%S,y=Math.floor(p/S);drawBox(x,y);lens(x,y);realRender();
    if(rP>=S*S){rAnim=null;$('#rSweep').textContent='Sweep kernel';setTimeout(()=>overCtx.clearRect(0,0,320,320),400);return}rAnim=requestAnimationFrame(f)};rAnim=requestAnimationFrame(f)};
$('#rMode').onchange=realRender;
$('#rScene').onclick=drawScene;
$('#rFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const url=URL.createObjectURL(f),img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');const s=Math.max(S/img.width,S/img.height),w=img.width*s,h=img.height*s;x.drawImage(img,(S-w)/2,(S-h)/2,w,h);setFromCanvas(c);URL.revokeObjectURL(url)};img.src=url};


// init
rLensPos=[21,42]; // start the lens on the circle's left edge so the panel isn't empty
$('#cKerDesc').textContent=KERNELS.vedge.d;kernelPaint();chPaint();convBuild();drawScene();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{drawScene()});
