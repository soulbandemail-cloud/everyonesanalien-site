import {fallbackSurface} from './surfaceFallback';
import {lens,project,radians,type DomeConfig,type Viewport,type Vec3} from './domeGeometry';
/** Immutable world-space vertices: x,y,z,shade,u,v. Camera motion never changes these. */
export type WorldMesh={vertices:Float32Array;bounds:Vec3[];points:Vec3[]};
export function worldMesh(vertices:number[]):WorldMesh{
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<vertices.length;i+=6)for(let k=0;k<3;k++){min[k]=Math.min(min[k],vertices[i+k]);max[k]=Math.max(max[k],vertices[i+k]);}
 const unique=new Map<string,Vec3>();
 for(let i=0;i<vertices.length;i+=6){const p={x:vertices[i],y:vertices[i+1],z:vertices[i+2]};unique.set(`${p.x},${p.y},${p.z}`,p);}
 return {vertices:new Float32Array(vertices),points:[...unique.values()],bounds:Array.from({length:8},(_,i)=>({x:i&1?max[0]:min[0],y:i&2?max[1]:min[1],z:i&4?max[2]:min[2]}))};
}
export function surfaceBounds(mesh:WorldMesh,c:DomeConfig,v:Viewport){
 const p=mesh.bounds.map(p=>project(p,c,v));
 if(p.every(p=>!p.visible))return {x:0,y:0,width:1,height:1,visible:false};
 const crosses=p.some(p=>!p.visible);
 const x=crosses?0:Math.max(0,Math.floor(Math.min(...p.map(p=>p.x)))-2),y=crosses?0:Math.max(0,Math.floor(Math.min(...p.map(p=>p.y)))-2);
 const right=crosses?v.width:Math.min(v.width,Math.ceil(Math.max(...p.map(p=>p.x)))+2),bottom=crosses?v.height:Math.min(v.height,Math.ceil(Math.max(...p.map(p=>p.y)))+2);
 return {x,y,width:Math.max(1,right-x),height:Math.max(1,bottom-y),visible:right>x&&bottom>y};
}
const sources=new Map<string,Promise<HTMLImageElement>>();
export function surfaceImage(src:string){
 let pending=sources.get(src);if(!pending){pending=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});sources.set(src,pending);}return pending;
}
type Renderer={canvas:HTMLCanvasElement;gl:WebGLRenderingContext;program:WebGLProgram;buffers:WeakMap<WorldMesh,WebGLBuffer>;textures:WeakMap<HTMLImageElement,WebGLTexture>;white:WebGLTexture};
let renderer:Renderer|undefined;
let unsupported=false;
export const surfaceStats={meshUploads:0,textureUploads:0,draws:0,drawMs:0};
function getRenderer(){
 if(renderer&&!renderer.gl.isContextLost())return renderer;
 const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true});
 if(!gl)throw new Error('WebGL unavailable for world surfaces');
 const shader=(type:number,source:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)??'Shader compilation failed');return s;};
 const program=gl.createProgram()!;
 gl.attachShader(program,shader(gl.VERTEX_SHADER,`attribute vec3 position;attribute float shade;attribute vec2 uv;
 uniform vec3 eye;uniform vec2 pitch;uniform vec4 frame;uniform vec4 crop;varying float lighting;varying vec2 tex;
 void main(){vec3 p=position-eye;float depth=pitch.x*p.y+pitch.y*p.z;float up=pitch.y*p.y-pitch.x*p.z;
 gl_Position=vec4((2.0*(frame.x*.5-crop.x)/crop.z-1.0)*depth+2.0*frame.z*p.x/crop.z,(1.0-2.0*(frame.w-crop.y)/crop.w)*depth+2.0*frame.z*up/crop.w,1.0001*depth-.100005,depth);lighting=shade;tex=uv;}`));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision mediump float;varying float lighting;varying vec2 tex;uniform sampler2D image;uniform bool textured;uniform vec3 baseColor;uniform vec3 colorBias;void main(){gl_FragColor=textured?texture2D(image,tex):vec4(baseColor*lighting+colorBias,1.0);}`));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Surface program link failed');
 const white=gl.createTexture()!;gl.bindTexture(gl.TEXTURE_2D,white);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 renderer={canvas,gl,program,white,buffers:new WeakMap(),textures:new WeakMap()};return renderer;
}
/** One shared GPU context, persistent buffers/textures, small 2D output canvases.
 * No camera-specific image encoding, readback or async projection results. */
export function drawSurface(output:HTMLCanvasElement,mesh:WorldMesh,c:DomeConfig,v:Viewport,image?:HTMLImageElement,material?:{color:readonly number[];bias:readonly number[]}){
 const start=performance.now();
 const bounds=surfaceBounds(mesh,c,v);
 let r:Renderer|undefined;
 if(!unsupported)try{r=getRenderer();}catch{unsupported=true;}
 if(!r){fallbackSurface(output,mesh,c,v,bounds,image,material);return bounds;}
 const {gl,canvas,program}=r;
 const ratio=Math.min(2,devicePixelRatio||1),w=Math.ceil(bounds.width*ratio),h=Math.ceil(bounds.height*ratio);
 // Bucket allocation avoids reallocating the shared framebuffer for every small camera step.
 const bw=Math.ceil(w/64)*64,bh=Math.ceil(h/64)*64;
 if(canvas.width<bw)canvas.width=bw;if(canvas.height<bh)canvas.height=bh;
 if(output.width<bw)output.width=bw;if(output.height<bh)output.height=bh;
 output.style.width=`${output.width/ratio}px`;output.style.height=`${output.height/ratio}px`;
 gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.useProgram(program);
 let buffer=r.buffers.get(mesh);if(!buffer){buffer=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW);r.buffers.set(mesh,buffer);surfaceStats.meshUploads++;}else gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 for(const [name,size,offset] of [['position',3,0],['shade',1,12],['uv',2,16]] as const){const at=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,size,gl.FLOAT,false,24,offset);}
 const uniform=(name:string)=>gl.getUniformLocation(program,name);const l=lens(c,v),p=radians(c.pitch);
 gl.uniform3f(uniform('eye'),c.camera.x,c.camera.y,c.camera.z);gl.uniform2f(uniform('pitch'),Math.sin(p),Math.cos(p));gl.uniform4f(uniform('frame'),v.width,v.height,l.focal,l.horizon);gl.uniform4f(uniform('crop'),bounds.x,bounds.y,bounds.width,bounds.height);gl.uniform1i(uniform('textured'),image?1:0);
 const color=material?.color??[76/255,86/255,55/255],bias=material?.bias??[0,0,0];gl.uniform3f(uniform('baseColor'),color[0],color[1],color[2]);gl.uniform3f(uniform('colorBias'),bias[0],bias[1],bias[2]);
 gl.bindTexture(gl.TEXTURE_2D,r.white);
 if(image){let texture=r.textures.get(image);if(!texture){texture=gl.createTexture()!;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);r.textures.set(image,texture);surfaceStats.textureUploads++;}else gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(uniform('image'),0);}
 if(bounds.visible)gl.drawArrays(gl.TRIANGLES,0,mesh.vertices.length/6);
 const ctx=output.getContext('2d')!;ctx.clearRect(0,0,output.width,output.height);ctx.drawImage(canvas,0,canvas.height-h,w,h,0,0,w,h);surfaceStats.draws++;surfaceStats.drawMs+=performance.now()-start;
 return bounds;
}

export function releaseSurface(mesh:WorldMesh){
 const buffer=renderer?.buffers.get(mesh);
 if(buffer){renderer!.gl.deleteBuffer(buffer);renderer!.buffers.delete(mesh);}
}
