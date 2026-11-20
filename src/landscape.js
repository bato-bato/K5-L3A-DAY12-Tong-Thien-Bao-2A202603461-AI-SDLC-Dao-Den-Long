import * as T from 'three';

const noise = `
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise2(vec2 p){
 vec2 i=floor(p), f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
}
`;
const moon = new T.Vector3(-.19,.118,-1).normalize();

export function grassTuft(){
 const vertices=[];
 for(let i=0;i<7;i++){
  const a=i*2.4, x=Math.cos(a), z=Math.sin(a), h=.50+.43*(i%3)/2;
  vertices.push(x*.35-.17,-.5,z*.35, x*.35+.17,-.5,z*.35, x*.72,h,z*.75);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeVertexNormals();return g;
}

export function foliageMaterial(base,clock,strength,bough){
 const material=base.clone();
 material.onBeforeCompile=shader=>{
  shader.uniforms.windTime=clock;shader.uniforms.windStrength=strength;
  shader.vertexShader='uniform float windTime;uniform float windStrength;\n'+shader.vertexShader.replace('#include <begin_vertex>',`
   #include <begin_vertex>
   vec3 root=instanceMatrix[3].xyz;
   float phase=windTime*1.5+dot(root.xz,vec2(.21,.14));
   float gust=sin(phase)+.26*sin(phase*2.7+.5);
   ${bough?'transformed.y+=windStrength*gust*.085*max(0.,position.z);':'transformed.x+=windStrength*gust*.52*pow(max(0.,position.y+.5),2.);'}
  `);
 };
 material.customProgramCacheKey=()=>bough?'wind-bough':'wind-grass';
 return material;
}

export function nightLandscape(scene,clock){
 const group=new T.Group();scene.add(group);
 const uniforms={time:clock,moonDir:{value:moon}};
 const sky=new T.Mesh(new T.SphereGeometry(185,48,20),new T.ShaderMaterial({
  side:T.BackSide,depthWrite:false,uniforms,
  vertexShader:`varying vec3 ray;void main(){ray=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec3 ray;uniform vec3 moonDir;uniform float time;${noise}
  void main(){
   vec3 d=normalize(ray);float elevation=max(0.,d.y);
   vec3 color=mix(vec3(.070,.097,.19),vec3(.009,.015,.052),smoothstep(0.,.55,elevation));
   float dist=length(d-moonDir);
   color+=vec3(.26,.27,.32)*exp(-dist*12.)+vec3(.25,.20,.10)*exp(-dist*35.);
   vec2 lunar=(d.xy-moonDir.xy)*95.;
   float maria=noise2(lunar)*.65+noise2(lunar*3.)*.35;
   color=mix(color,vec3(.99,.91,.75)*(.78+.22*maria),1.-smoothstep(.044,.046,dist));
   vec2 p=d.xz/max(.09,d.y+.12);p=p*vec2(1.45,3.1)+vec2(time*.014,0.);
   float cloud=smoothstep(.48,.79,.60*noise2(p)+.28*noise2(2.*p)+.12*noise2(4.*p));
   color=mix(color,vec3(.18,.21,.31)+.12*exp(-dist*7.),cloud*.67*smoothstep(-.03,.10,d.y));
   gl_FragColor=vec4(color,1.);
   #include <colorspace_fragment>
  }`
 }));
 sky.renderOrder=-10;group.add(sky);
 const water=new T.Mesh(new T.PlaneGeometry(470,470),new T.ShaderMaterial({
  uniforms,vertexShader:`varying vec3 waterPos;void main(){vec4 p=modelMatrix*vec4(position,1.);waterPos=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
  fragmentShader:`uniform float time;uniform vec3 moonDir;varying vec3 waterPos;
  void main(){
   vec2 p=waterPos.xz;float t=time*.85;
   float a=sin(dot(p,vec2(.34,.79))-t),b=sin(dot(p,vec2(-.52,1.47))+t*1.3+.7*a);
   float c=sin(p.y*2.63+p.x*.17+1.8*b-t);
   vec3 normal=normalize(vec3(.045*a+.028*b,1.,.072*b+.06*c));
   vec3 eye=normalize(cameraPosition-waterPos);
   float align=max(0.,dot(normal,normalize(eye+moonDir)));
   float ripple=.5+.5*(a*.3+b*.4+c*.3);
   vec3 water=mix(vec3(.009,.035,.068),vec3(.022,.10,.135),ripple);
   water+=vec3(.90,.75,.47)*(pow(align,150.)*.48+pow(align,760.)*.68);
   gl_FragColor=vec4(mix(water,vec3(.065,.092,.17),smoothstep(65.,190.,distance(cameraPosition,waterPos))*.76),1.);
   #include <colorspace_fragment>
  }`
 }));
 water.rotation.x=-Math.PI/2;water.position.set(30,-3.95,0);group.add(water);
 return {group,sky};
}
