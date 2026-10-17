// Shaders du rendu HD-2D : GLSL partagé (échantillonnage « sharp bilinear », brouillard, éclairage par carte de lumière).
export const GLSL_COMMON = /* glsl */`
float hash11(float p){ p = fract(p*.1031); p *= p+33.33; p *= p+p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3 += dot(p3, p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x), mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for(int i=0;i<5;i++){ s += a*vnoise(p); p = p*2.02+vec2(17.1,9.2); a *= .5; } return s; }
// échantillonnage bilinéaire « net » : pixels francs au centre, bords lissés sur ~1 pixel écran
vec4 sharpTex(sampler2D t, vec2 uv, vec2 size){
  vec2 p = uv*size, fl = floor(p), d = p - fl;
  vec2 w = clamp(fwidth(p), 1e-3, 1.);
  vec2 up = clamp((d - (1. - .5*w))/w, 0., 1.), dn = clamp((.5*w - d)/w, 0., 1.);
  return texture2D(t, (fl + .5 + up - dn)/size);
}
`;

export const FOG_FRAG = /* glsl */`
uniform vec3 uFog; uniform float uFogD; uniform float uMist; uniform vec3 uCam;
vec3 applyFog(vec3 col, vec3 wpos){
  float d = length(wpos - uCam);
  float f = 1. - exp(-pow(d*uFogD, 2.));
  f = clamp(f + uMist*smoothstep(0.2, -3.2, wpos.y), 0., 1.);
  return mix(col, uFog, f);
}
`;

// ---------- terrain (sol, murs, portes) ----------
export const TERRAIN_VERT = /* glsl */`
varying vec3 vW; varying vec2 vUv; varying vec3 vN;
void main(){
  vec4 w = modelMatrix*vec4(position,1.);
  vW = w.xyz; vUv = uv; vN = normal;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;

export const TERRAIN_FRAG = /* glsl */`
uniform sampler2D uMap, uEmis, uLight, uOvN, uOvA;
uniform vec2 uMapSize, uEmisSize;
uniform vec4 uReg;       // x0, z0 (tuiles), 1/largeur, 1/hauteur
uniform float uTime, uGain, uMode, uEmisK, uPulse, uTopY;
uniform vec3 uEmisTint;
uniform vec3 uPl, uPlP, uCamF; uniform vec2 uResS, uCut;
varying vec3 vW; varying vec2 vUv; varying vec3 vN;
${GLSL_COMMON}
float bayer4(vec2 p){
  float m[16] = float[16](0.,8.,2.,10., 12.,4.,14.,6., 3.,11.,1.,9., 15.,7.,13.,5.);
  ivec2 q = ivec2(mod(p, 4.)); return (m[q.x + q.y*4] + .5)/16.;
}
${FOG_FRAG}
void main(){
  if(uMode > .5){
    // découpe (« cutaway ») : les murs qui masquent le chef se dissolvent en tramage autour de lui
    vec2 sc = gl_FragCoord.xy/uResS*2. - 1.;
    vec2 dd = (sc - uPl.xy)*vec2(uResS.x/uResS.y, 1.);
    // fragment réellement entre la caméra et le chef (distance au point de vue), dans une ellipse autour de lui
    if(length(vW - uCam) < length(uPlP - uCam) - .45){
      // l'ellipse est plus courte sous le chef : un mur situé juste devant ses pieds ne le masque pas, et ne doit pas se tramer en un petit rectangle pointillé
      vec2 cu = vec2(uCut.x, dd.y < 0. ? uCut.y*.34 : uCut.y);
      float k = smoothstep(1., .5, length(dd/cu)); if(k > bayer4(gl_FragCoord.xy)) discard; }
  }
  vec4 tex = sharpTex(uMap, vUv, uMapSize);
  vec3 col = tex.rgb;
  vec2 reg = (vW.xz - uReg.xy)*uReg.zw;
  vec3 emis = vec3(0.);
  float shade = 1.;
  if(uMode < .5){
    // sol : couche de décalques (ombres, télégraphes, effets au sol) + émission
    vec4 ov = texture2D(uOvN, reg);
    col = mix(col, ov.rgb, ov.a);
    vec3 e = texture2D(uEmis, vUv).rgb;
    float pulse = .75 + .25*sin(uTime*2.4 + vW.x*.7 + vW.z*.5);
    emis = e*uEmisTint*uEmisK*pulse;
  } else {
    vec3 n = normalize(vN);
    // lumière directionnelle douce : dessus clair, face sud (vers la caméra) moyenne, côtés sombres
    shade = n.y > .5 ? 1.05 : (n.z > .5 ? .8 : (n.z < -.5 ? .52 : .62));
    float y = vW.y;
    float ao = smoothstep(-.05, .75, y);                 // pied de mur sombre
    ao = mix(.55, 1., ao);
    float cap = smoothstep(uTopY - .14, uTopY, y)*step(.5, 1. - abs(n.y)); // liseré clair en haut des faces
    shade *= ao*mix(.3, 1., smoothstep(-3., -.1, y));   // les parois qui plongent dans l'abîme s'assombrissent
    col += cap*.07;
    vec3 e = texture2D(uEmis, vUv).rgb;
    float pulse = .8 + .2*sin(uTime*2. + floor(vW.x*3.)*1.7 + floor(vW.z*3.)*2.3);
    emis = e*uEmisTint*uEmisK*mix(1., pulse, uPulse);
  }
  vec3 L = texture2D(uLight, reg).rgb*uGain;
  vec3 lit = col*shade*L;
  lit += emis;
  if(uMode < .5){
    vec3 add = texture2D(uOvA, reg).rgb;
    lit += add*.9;
  }
  lit = applyFog(lit, vW);
  gl_FragColor = vec4(lit, 1.);
}`;

// ---------- billboards (sprites en 2D dans le décor 3D) ----------
export const BILL_VERT = /* glsl */`
attribute vec2 aFoot;
varying vec2 vUv; varying vec2 vFoot; varying vec3 vW;
uniform float uBias; uniform vec3 uCamF;
void main(){
  vUv = uv; vFoot = aFoot;
  vec4 w = modelMatrix*vec4(position,1.);
  vW = w.xyz;
  vec4 clip = projectionMatrix*viewMatrix*w;
  // profondeur : celle du plan vertical passant par les pieds (évite que le haut du sprite s'enfonce dans un mur)
  // le plan est perpendiculaire à la direction horizontale de la caméra (qui peut pivoter) : on retire l'inclinaison du billboard le long de cet axe
  vec2 aw = normalize(uCamF.xz + vec2(1e-5));
  vec2 wz = w.xz - aw*dot(w.xz - aFoot, aw);
  vec4 wf = vec4(wz.x, w.y, wz.y, 1.);
  vec4 cf = projectionMatrix*viewMatrix*wf;
  gl_Position = clip;
  gl_Position.z = (cf.z/cf.w)*clip.w - uBias*clip.w;
}`;

export const BILL_FRAG = /* glsl */`
uniform sampler2D uMap, uLight;
uniform vec2 uMapSize;
uniform vec4 uReg;
uniform float uGain, uTime;
varying vec2 vUv; varying vec2 vFoot; varying vec3 vW;
${GLSL_COMMON}
${FOG_FRAG}
void main(){
  vec4 t = sharpTex(uMap, vUv, uMapSize);
  if(t.a < .03) discard;
  vec2 reg = (vFoot - uReg.xy)*uReg.zw;
  vec3 L = texture2D(uLight, reg).rgb*uGain;
  vec3 col = t.rgb*L;
  // léger liseré de lumière chaude/froide selon la lumière locale (donne du relief aux sprites)
  col += t.rgb*max(L - .75, 0.)*.25;
  col = applyFog(col, vW);
  gl_FragColor = vec4(col, t.a);
}`;

// ---------- calques plein écran (effets aériens, texte) ----------
export const AIR_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
export const AIR_FRAG = /* glsl */`
uniform sampler2D uMap; uniform float uAdd;
varying vec2 vUv;
void main(){
  vec4 t = texture2D(uMap, vec2(vUv.x, 1. - vUv.y));
  if(uAdd > .5){ gl_FragColor = vec4(t.rgb*0.9, 1.); }
  else { gl_FragColor = vec4(t.rgb, t.a); }   // texture non prémultipliée
}`;

// ---------- abîme (fond thématique) ----------
export const ABYSS_VERT = /* glsl */`
varying vec3 vW;
void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
export const ABYSS_FRAG = /* glsl */`
uniform float uTime, uType; uniform vec3 uCol1, uCol2, uCol3;
varying vec3 vW;
${GLSL_COMMON}
${FOG_FRAG}
void main(){
  vec2 p = vW.xz; float t = uTime;
  vec3 col = uCol1; vec3 em = vec3(0.);
  if(uType < .5){            // laboratoire : vide violet, étoiles et nébuleuse
    float n = fbm(p*.07 + vec2(t*.01, 0.));
    col = mix(uCol1, uCol2, n*n*1.6);
    vec2 g = floor(p*1.6); float h = hash21(g);
    float star = step(.965, h)*smoothstep(.22, .0, length(fract(p*1.6)-.5))*(.6 + .4*sin(t*2.+h*40.));
    em += uCol3*star*2.;
    vec2 gl = abs(fract(p*.25) - .5); float grid = smoothstep(.02, .0, min(gl.x, gl.y));
    em += uCol3*grid*.12*(.5 + .5*sin(t*.8 + length(p)*.2));
  } else if(uType < 1.5){    // glace : abîme bleu nuit, aurores et paillettes
    float n = fbm(p*.06 + vec2(0., t*.02));
    col = mix(uCol1, uCol2, n);
    float band = sin(p.x*.12 + fbm(p*.05 + t*.03)*7.);
    float au = smoothstep(.6, 1., band)*fbm(p*.09 - t*.02);
    em += uCol3*au*.55;
    vec2 g = floor(p*2.2); float h = hash21(g);
    em += vec3(.7,.9,1.)*step(.975, h)*smoothstep(.45, 0., length(fract(p*2.2)-.5))*(.5+.5*sin(t*3.+h*50.));
  } else if(uType < 2.5){    // centrale : fosse métallique, grille et impulsions électriques
    col = uCol1*(.7 + .3*fbm(p*.5));
    vec2 gc = abs(fract(p*.5) - .5);
    float line = smoothstep(.06, .0, min(gc.x, gc.y));
    float pulse = smoothstep(.93, 1., sin((p.x + p.y)*.35 - t*2.4)*.5 + .5)
                + smoothstep(.95, 1., sin((p.x - p.y)*.27 + t*1.7)*.5 + .5);
    em += mix(uCol2, uCol3, step(.5, hash21(floor(p*.5))))*line*(.12 + pulse*1.4);
  } else if(uType < 3.5){    // volcan : lac de lave
    vec2 q = p*.11;
    vec2 w = vec2(fbm(q + vec2(t*.04, 0.)), fbm(q + vec2(5.2, 1.3) - t*.03));
    float n = fbm(q*1.6 + w*2.2 + vec2(0., t*.03));
    float crack = smoothstep(.1, .0, abs(n - .52));
    col = mix(uCol1, uCol2, smoothstep(.3, .7, n)*.5);
    em += mix(uCol2, uCol3, n)*(crack*1.7 + smoothstep(.55, .85, n)*.8);
  } else if(uType < 4.5){    // roche : brume poussiéreuse
    float n = fbm(p*.1 + vec2(t*.01, t*.006));
    col = mix(uCol1, uCol2, n);
    float d = fbm(p*.4 - vec2(t*.05, 0.));
    em += uCol3*smoothstep(.62, .9, d)*.12;
  } else if(uType > 8.5){     // forêt : sous-bois, fleurs et lucioles
    float n = fbm(p*.11), m = fbm(p*.85 + 3.);
    col = mix(uCol1, uCol2, n*.65 + m*.35);
    col *= .9 + .2*hash21(floor(p*4.));
    vec2 gf = p*2.2; float hf = hash21(floor(gf));
    em += mix(uCol3, vec3(1.,.55,.65), step(.5, hash21(floor(gf)+7.)))*step(.992, hf)*smoothstep(.22, .0, length(fract(gf)-.5))*.55;
  } else if(uType > 7.5){     // mer de tempête : houle, écume et tourbillons
    float n = fbm(p*.12 - vec2(t*.05, 0.));
    col = mix(uCol1, uCol2, n);
    float wv = sin(p.x*.7 + p.y*.35 + fbm(p*.2)*7. + t*1.3);
    em += uCol3*smoothstep(.86, 1., wv)*fbm(p*.5 + t*.1)*.28;
    vec2 cell = floor(p/34.); float hc = hash21(cell);
    if(hc > .4){
      vec2 ctr = (cell + .25 + vec2(hash21(cell + 3.1), hash21(cell + 7.7))*.5)*34.;
      vec2 dd = p - ctr; float d = length(dd), a = atan(dd.y, dd.x);
      float mask = smoothstep(11., 2., d), sp = sin(a*3. + d*.6 - t*1.8);
      col = mix(col, uCol1*.45, mask*.7);
      em += uCol3*smoothstep(.55, 1., sp)*mask*.55;
    }
  } else if(uType > 6.5){     // lac miroir : eau claire, ondulations et éclats d'aurore
    float n = fbm(p*.08 + vec2(t*.01, 0.));
    col = mix(uCol1, uCol2, n);
    float rp = fbm(p*.55 + vec2(t*.12, t*.08));
    col += (rp - .5)*.1;
    float au = smoothstep(.45, 1., sin((p.x + p.y)*.05 + fbm(p*.04 + t*.02)*5.));
    em += mix(vec3(.6,.9,1.), uCol3, au)*au*.1;
    em += uCol3*step(.988, hash21(floor(p*3.)))*smoothstep(.3, 0., length(fract(p*3.) - .5))*(.5 + .5*sin(t*2.5 + p.x*3.))*.6;
  } else if(uType > 5.5){     // plein air : terre battue d'une ville d'Edo
    float n = fbm(p*.13), m = fbm(p*.9 + 3.);
    col = mix(uCol1, uCol2, n*.65 + m*.35);
    col *= .9 + .2*hash21(floor(p*4.));
    em += uCol3*step(.995, hash21(floor(p*2.4)))*smoothstep(.3, 0., length(fract(p*2.4) - .5))*.35;
  } else {                    // mystique : brume bioluminescente
    float n = fbm(p*.09 + vec2(t*.015, -t*.01));
    col = mix(uCol1, uCol2, n);
    float s = fbm(p*.5 + t*.04);
    em += uCol3*smoothstep(.6, .85, s)*.35;
    vec2 g = floor(p*1.8); float h = hash21(g);
    em += uCol3*step(.97, h)*smoothstep(.4, 0., length(fract(p*1.8) - .5))*(.5+.5*sin(t*1.5+h*30.))*1.4;
  }
  vec3 outc = applyFog(col + em, vW);
  gl_FragColor = vec4(outc, 1.);
}`;

// ---------- accessoires de décor lointain (instanciés) ----------
export const PROP_VERT = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying float vH;
uniform float uTime, uBob;
void main(){
  mat4 im = instanceMatrix;
  vec4 lp = im*vec4(position, 1.);
  vec4 w = modelMatrix*lp;
  w.y += sin(uTime*.6 + im[3].x*1.7 + im[3].z*2.3)*.28*uBob;
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix*im)*normal);
  vCol = instanceColor;
  vH = position.y;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
export const PROP_FRAG = /* glsl */`
uniform float uTime, uType, uWinT; uniform vec3 uEmisCol, uLightCol, uRoofA, uRoofB;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying float vH;
${GLSL_COMMON}
${FOG_FRAG}
void main(){
  vec3 n = normalize(vN);
  float dif = max(dot(n, normalize(vec3(-.35, .8, .5))), 0.);
  vec3 col = vCol*(.32 + .75*dif)*uLightCol;
  vec3 em = vec3(0.);
  float up = smoothstep(-3.2, 4., vW.y);
  if(uType > 5.5 && uType < 7.5){
    float q = vW.x + vW.z;
    if(uType < 6.5){          // maison de ville (corps y<.5, toit au-dessus)
      if(vH > .505){          // toit de tuiles : rangées sombres, faîtage clair
        float row = smoothstep(.1, .55, abs(fract(vW.y*5.) - .5)*2.);
        vec3 roof = mix(uRoofA, uRoofB, row);
        roof = mix(roof, uRoofB*1.4, smoothstep(.93, 1., vH));
        col = roof*(.32 + .85*dif)*uLightCol;
      } else {
        vec3 base = vCol;
        float post = step(.9, fract(q*1.3)), beam = step(abs(vH - .27), .018) + step(abs(vH - .47), .02);
        base = mix(base, vec3(.12, .08, .06), clamp(post + beam, 0., 1.)*step(.1, vH));
        base = mix(base, vec3(.13, .12, .11), step(vH, .1));                  // soubassement de pierre
        col = base*(.32 + .75*dif)*uLightCol;
        vec2 wc = floor(vec2(q*1.3, vW.y*3.4));
        float win = step(uWinT, hash21(wc))*step(abs(n.y), .5)*step(.14, vH)*step(vH, .46)*(1. - post)*(1. - beam);
        em += uEmisCol*win*(.7 + .3*sin(uTime*.9 + hash21(wc)*20.))*.9;
      }
    } else {                  // muret de torchis : namako (losanges blancs sur noir) et chapeau de tuiles
      if(vH > .82){ col = uRoofA*1.2*(.32 + .85*dif)*uLightCol*(.8 + .5*step(.5, fract(q*3.))); }
      else {
        vec2 g2 = vec2(q*2.2, vW.y*2.6);
        float lat = step(.84, max(fract(g2.x + g2.y), fract(g2.x - g2.y)));
        vec3 base = mix(vCol, vec3(.08, .08, .09), step(vH, .55));            // moitié basse noire
        base = mix(base, vec3(.88, .86, .8), lat*step(vH, .55)*step(.08, vH));
        col = base*(.32 + .75*dif)*uLightCol;
      }
    }
  } else
  if(uType < .5){            // monolithes flottants
    float stripe = smoothstep(.45, .5, abs(fract(vW.y*1.3 + vW.x*.1) - .5));
    em += uEmisCol*stripe*.9*(.6 + .4*sin(uTime*1.5 + vW.x));
  } else if(uType < 1.5){    // cristaux de glace : pointe lumineuse
    em += uEmisCol*smoothstep(.3, 1., vH)*(.5 + .25*sin(uTime*1.8 + vW.x*2.))*1.3 + uEmisCol*pow(1. - abs(n.y), 2.)*.12;
  } else if(uType < 2.5){    // tours de la centrale : fenêtres allumées
    vec3 c = floor(vec3(vW.x*2.4, vW.y*2.1, vW.z*2.4));
    float h = hash21(c.xz + c.y*7.3);
    float win = step(.78, h)*step(abs(n.y), .5)*(.6 + .4*sin(uTime*.7 + h*30.));
    em += mix(uEmisCol, vec3(1., .85, .4), step(.5, hash21(c.xz)))*win*1.2;
  } else if(uType < 3.5){    // colonnes de basalte : lueur de lave à la base
    float base = smoothstep(.8, -3.2, vW.y);
    em += uEmisCol*base*1.4*(.7 + .3*sin(uTime*2. + vW.x*3.)) + uEmisCol*smoothstep(.85, 1., vH)*.3;
  } else if(uType < 4.5){    // stalagmites : reflets chauds
    em += uEmisCol*smoothstep(.75, 1., vH)*.18;
  } else if(uType > 5.5){     // arbres de plein air : aucune émission
    em += uEmisCol*step(.985, hash21(floor(vW.xz*3.1) + floor(vW.y*3.1)*5.))*.35*step(.6, vH);
  } else {                    // arbres mystiques : spores lumineuses
    float s = step(.93, hash21(floor(vW.xz*3.1) + floor(vW.y*3.1)*5.));
    em += uEmisCol*s*(.5 + .5*sin(uTime*2. + vW.x*5.))*1.4;
  }
  vec3 outc = applyFog(col + em, vW);
  gl_FragColor = vec4(outc, 1.);
}`;

// ---------- particules d'ambiance ----------
export const PART_VERT = /* glsl */`
attribute vec4 aSeed;   // x,y,z : position initiale [0,1], w : taille/phase
uniform float uTime, uScale, uSize; uniform vec3 uCenter, uBox, uVel; uniform float uSway;
varying float vA; varying float vTw;
void main(){
  vec3 p = aSeed.xyz*uBox + uVel*uTime + vec3(sin(uTime*.7 + aSeed.w*40.), 0., cos(uTime*.6 + aSeed.w*31.))*uSway;
  p = mod(p, uBox) - uBox*.5;
  vec3 wp = uCenter + p;
  vec4 mv = viewMatrix*vec4(wp, 1.);
  gl_Position = projectionMatrix*mv;
  float dist = max(.1, -mv.z);
  gl_PointSize = clamp(uSize*.0016*(.5 + aSeed.w)*uScale/dist, 1.5, 24.);
  vA = smoothstep(0., .12, 1. - abs(p.y/(uBox.y*.5)))*clamp(1.2 - dist*.03, 0., 1.);
  vTw = .6 + .4*sin(uTime*(2. + aSeed.w*4.) + aSeed.w*50.);
}`;
export const PART_FRAG = /* glsl */`
uniform vec3 uColor; uniform float uAdd;
varying float vA; varying float vTw;
void main(){
  vec2 c = gl_PointCoord - .5; float d = length(c);
  float a = smoothstep(.5, .0, d);
  a *= a;
  gl_FragColor = vec4(uColor*vTw, a*vA);
}`;

// ---------- brume des portes de boss ----------
export const MIST_VERT = /* glsl */`
varying vec2 vUv; varying vec3 vW;
void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
export const MIST_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uColor;
varying vec2 vUv; varying vec3 vW;
${GLSL_COMMON}
${FOG_FRAG}
void main(){
  vec2 p = vW.xz*1.3 + vec2(0., vW.y*1.2);
  float n = fbm(p*1.7 + vec2(uTime*.35, -uTime*.6));
  float m = fbm(p*2.9 - vec2(uTime*.5, uTime*.2));
  float edge = smoothstep(0., .25, vUv.y)*smoothstep(1., .55, vUv.y)*smoothstep(0., .2, vUv.x)*smoothstep(1., .8, vUv.x);
  float a = smoothstep(.25, .75, n*.7 + m*.5)*edge;
  vec3 col = uColor*(.6 + .8*m);
  gl_FragColor = vec4(applyFog(col, vW), a*.85);
}`;

// ---------- post-traitement ----------
export const FULL_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

export const BRIGHT_FRAG = /* glsl */`
uniform sampler2D tMap; uniform float uThr; varying vec2 vUv;
void main(){
  vec3 c = texture2D(tMap, vUv).rgb;
  float l = max(c.r, max(c.g, c.b));
  float k = smoothstep(uThr, uThr + .45, l);
  gl_FragColor = vec4(c*k, 1.);
}`;
export const BLUR_FRAG = /* glsl */`
uniform sampler2D tMap; uniform vec2 uDir; varying vec2 vUv;
void main(){
  vec3 s = texture2D(tMap, vUv).rgb*.2270270270;
  s += texture2D(tMap, vUv + uDir*1.3846153846).rgb*.3162162162;
  s += texture2D(tMap, vUv - uDir*1.3846153846).rgb*.3162162162;
  s += texture2D(tMap, vUv + uDir*3.2307692308).rgb*.0702702703;
  s += texture2D(tMap, vUv - uDir*3.2307692308).rgb*.0702702703;
  gl_FragColor = vec4(s, 1.);
}`;
export const FINAL_FRAG = /* glsl */`
uniform sampler2D tScene, tBloomA, tBloomB;
uniform vec2 uRes;
uniform float uFocus, uBand, uBlur, uBloom, uSat, uCon, uVig, uTime, uGrain, uFlash, uDark;
uniform vec3 uTintS, uTintH;
varying vec2 vUv;
${GLSL_COMMON}
float shoulder(float x){ return x < .8 ? x : .8 + .2*(1. - exp(-(x - .8)/.2)); }
void main(){
  // tilt-shift : flou croissant au-dessus et en dessous de la bande de netteté
  float d = abs(vUv.y - uFocus);
  float k = smoothstep(uBand, uBand + .32, d);
  float rad = k*uBlur;
  vec3 col = texture2D(tScene, vUv).rgb;
  if(rad > .35){
    vec3 acc = col; float wsum = 1.;
    float ang = hash21(gl_FragCoord.xy)*6.2831;
    for(int i = 1; i <= 14; i++){
      float fi = float(i);
      float r = sqrt(fi/14.)*rad;
      float a = ang + fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r/uRes;
      acc += texture2D(tScene, vUv + o).rgb; wsum += 1.;
    }
    col = acc/wsum;
  }
  vec3 bloom = texture2D(tBloomA, vUv).rgb*.65 + texture2D(tBloomB, vUv).rgb*.9;
  col += bloom*uBloom;
  // étalonnage
  float lum = dot(col, vec3(.299, .587, .114));
  col = mix(vec3(lum), col, uSat);
  col = (col - .5)*uCon + .5;
  col *= mix(uTintS, uTintH, smoothstep(.05, .85, lum));
  vec2 q = vUv - .5; q.x *= uRes.x/uRes.y;
  float v = smoothstep(.95, .3, length(q));
  col *= mix(1. - uVig, 1., v);
  col += (hash21(gl_FragCoord.xy + fract(uTime)*91.) - .5)*uGrain;
  col = max(col, 0.);
  col = vec3(shoulder(col.r), shoulder(col.g), shoulder(col.b));
  col = mix(col, vec3(1.), uFlash)*(1. - uDark);
  gl_FragColor = vec4(col, 1.);
}`;
