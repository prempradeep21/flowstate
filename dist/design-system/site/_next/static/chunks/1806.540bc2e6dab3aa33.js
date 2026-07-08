"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1806],{81806:(e,t,i)=>{i.d(t,{NeatGradient:()=>p});let r=`void main() {
vUv = uv;
vPosition = position;
float waveOffset = -u_y_offset * u_y_offset_wave_multiplier;
float colorOffset = -u_y_offset * u_y_offset_color_multiplier;
float flowOffset = -u_y_offset * u_y_offset_flow_multiplier;
v_displacement_amount = cnoise( vec3(
u_wave_frequency_x * position.x + u_time,
u_wave_frequency_y * (position.y + waveOffset) + u_time,
u_time
));
vec2 baseUv = vUv;
baseUv.y += flowOffset / u_plane_height;
vec2 flowUv = baseUv;
if (u_flow_enabled > 0.5) {
if (u_flow_ease > 0.0 || u_flow_distortion_a > 0.0) {
vec2 ppp = -1.0 + 2.0 * baseUv;
ppp += 0.1 * cos((1.5 * u_flow_scale) * ppp.yx + 1.1 * u_time + vec2(0.1, 1.1));
ppp += 0.1 * cos((2.3 * u_flow_scale) * ppp.yx + 1.3 * u_time + vec2(3.2, 3.4));
ppp += 0.1 * cos((2.2 * u_flow_scale) * ppp.yx + 1.7 * u_time + vec2(1.8, 5.2));
ppp += u_flow_distortion_a * cos((u_flow_distortion_b * u_flow_scale) * ppp.yx + 1.4 * u_time + vec2(6.3, 3.9));
float r = length(ppp);
flowUv = mix(baseUv, vec2(baseUv.x * (1.0 - u_flow_ease) + r * u_flow_ease, baseUv.y), u_flow_ease);
}
}
vFlowUv = flowUv;
vec3 color = u_colors[0].color;
vec3 distortedPos = position;
if (u_shape_type > 0.5) {
if (u_flow_enabled > 0.5) {
if (u_flow_ease > 0.0 || u_flow_distortion_a > 0.0) {
vec3 ppp = position / 25.0;
ppp.xyz += 0.1 * cos((1.5 * u_flow_scale) * ppp.yxz + 1.1 * u_time + vec3(0.1, 1.1, 2.1));
ppp.xyz += 0.1 * cos((2.3 * u_flow_scale) * ppp.zxy + 1.3 * u_time + vec3(3.2, 3.4, 1.2));
ppp.xyz += 0.1 * cos((2.2 * u_flow_scale) * ppp.yxz + 1.7 * u_time + vec3(1.8, 5.2, 3.1));
ppp.xyz += u_flow_distortion_a * cos((u_flow_distortion_b * u_flow_scale) * ppp.zxy + 1.4 * u_time + vec3(6.3, 3.9, 4.5));
float r = length(ppp);
distortedPos = mix(position, vec3(
position.x * (1.0 - u_flow_ease) + r * u_flow_ease * 25.0,
position.y,
position.z * (1.0 - u_flow_ease) + r * u_flow_ease * 25.0
), u_flow_ease);
}
}
}
vec3 noise_cord;
if (u_shape_type > 0.5) {
noise_cord = vec3(distortedPos.x / 50.0, (distortedPos.y + colorOffset) / 50.0, distortedPos.z / 50.0);
} else {
vec2 adjustedUv = flowUv;
adjustedUv.y += colorOffset / u_plane_height;
noise_cord = vec3(adjustedUv, 0.0);
}
const float minNoise = .0;
const float maxNoise = .9;
for (int i = 1; i < 6; i++) {
if (i < u_colors_count) {
if (u_colors[i].is_active > 0.5) {
float noiseFlow = (1. + float(i)) / 30.;
float noiseSpeed = (1. + float(i)) * 0.11;
float noiseSeed = 13. + float(i) * 7.;
float noise_z = u_time * noiseSpeed;
if (u_shape_type > 0.5) {
noise_z = noise_cord.z * u_color_pressure.x * u_color_pressure.x + u_time * noiseSpeed;
}
float noise = snoise(
vec3(
noise_cord.x * u_color_pressure.x * u_color_pressure.x + u_time * noiseFlow * 2.,
noise_cord.y * u_color_pressure.y * u_color_pressure.y,
noise_z
) + noiseSeed
) - (.1 * float(i)) + (.5 * u_color_blending);
noise = clamp(noise, minNoise, maxNoise + float(i) * 0.02);
color = mix(color, u_colors[i].color, smoothstep(0.0, u_color_blending, noise));
}
}
}
v_color = color;
vec3 newPosition = position + normal * v_displacement_amount * u_wave_amplitude;
vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
vViewPosition = mvPosition.xyz;
vNormal = normalize((modelViewMatrix * vec4(normal, 0.0)).xyz);
gl_Position = projectionMatrix * mvPosition;
v_new_position = gl_Position;
}`,o=`float random(vec2 p) {
return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
}
float fbm(vec3 x) {
float value = 0.0;
float amplitude = 0.5;
float frequency = 1.0;
for (int i = 0; i < 4; i++) {
value += amplitude * snoise(x * frequency);
frequency *= 2.0;
amplitude *= 0.5;
}
return value;
}
vec3 hsl2rgb(float h, float s, float l) {
vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
}
void main() {
vec2 finalUv = vFlowUv;
vec3 baseColor;
float texAlpha = 1.0;
if (u_enable_procedural_texture > 0.5) {
if (u_shape_type > 0.5) {
float parallaxFactor = 0.25;
float scrollOffset = (u_y_offset * u_y_offset_color_multiplier) * parallaxFactor;
vec3 scrolledPos = vPosition;
scrolledPos.y -= scrollOffset;
vec3 p = (scrolledPos * 1.5) / 50.0;
vec2 uvX = p.yz + vec2(0.5);
vec2 uvY = p.zx + vec2(0.5);
vec2 uvZ = p.xy + vec2(0.5);
vec4 colX = texture2D(u_procedural_texture, fract(uvX));
vec4 colY = texture2D(u_procedural_texture, fract(uvY));
vec4 colZ = texture2D(u_procedural_texture, fract(uvZ));
vec3 n = normalize(vNormal);
vec3 blendWeights = abs(n);
blendWeights = blendWeights / (blendWeights.x + blendWeights.y + blendWeights.z + 0.0001);
vec4 texSample = colX * blendWeights.x + colY * blendWeights.y + colZ * blendWeights.z;
baseColor = texSample.rgb;
if (u_transparent_texture_void > 0.5) {
texAlpha = texSample.a;
}
} else {
vec2 ppp = -1.0 + 2.0 * finalUv;
ppp += 0.1 * cos((1.5 * u_flow_scale) * ppp.yx + 1.1 * u_time + vec2(0.1, 1.1));
ppp += 0.1 * cos((2.3 * u_flow_scale) * ppp.yx + 1.3 * u_time + vec2(3.2, 3.4));
ppp += 0.1 * cos((2.2 * u_flow_scale) * ppp.yx + 1.7 * u_time + vec2(1.8, 5.2));
ppp += u_flow_distortion_a * cos((u_flow_distortion_b * u_flow_scale) * ppp.yx + 1.4 * u_time + vec2(6.3, 3.9));
float r = length(ppp);
float vx = (finalUv.x * u_texture_ease) + (r * (1.0 - u_texture_ease));
float vy = (finalUv.y * u_texture_ease) + (0.0 * (1.0 - u_texture_ease));
vec2 texUv = vec2(vx, vy);
float parallaxFactor = 0.25;
texUv.y -= (u_y_offset * u_y_offset_color_multiplier / u_plane_height) * parallaxFactor;
texUv *= 1.5;
vec4 texSample = texture2D(u_procedural_texture, fract(texUv));
baseColor = texSample.rgb;
if (u_transparent_texture_void > 0.5) {
texAlpha = texSample.a;
}
}
} else {
baseColor = v_color;
}
vec3 color = baseColor;
if (u_domain_warp_enabled > 0.5) {
vec3 p;
if (u_shape_type > 0.5) {
p = vec3((vPosition / 50.0 + vec3(0.5)) * u_domain_warp_scale);
p.z += u_time * 0.15;
} else {
p = vec3(finalUv * u_domain_warp_scale, u_time * 0.15);
}
vec2 q = vec2(fbm(p), fbm(p + vec3(5.2, 1.3, 0.0)));
float f = fbm(p + vec3(4.0 * q, 0.0));
vec3 warpColor = color * (1.0 + f * 0.8 * u_domain_warp_intensity);
float pattern = clamp(f * f * f + 0.6 * f * f + 0.5 * f, 0.0, 1.0);
color = mix(color, warpColor * (0.6 + pattern * 0.8), u_domain_warp_intensity * 0.7);
}
vec3 normal = normalize(vNormal);
vec3 viewDir = vec3(0.0, 0.0, 1.0);
float ndotv = dot(normal, viewDir);
if (u_shape_type > 0.5 && u_shape_type < 3.5) {
if (ndotv < 0.0) {
discard;
}
} else {
if (ndotv < 0.0) {
normal = -normal;
ndotv = -ndotv;
}
}
vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
float diffuse = max(dot(normal, lightDir), 0.0);
vec3 halfDir = normalize(lightDir + viewDir);
float specular = pow(max(dot(normal, halfDir), 0.0), 32.0);
if (u_shape_type <= 0.5) {
color += v_displacement_amount * u_highlights;
float heightShadow = 1.0 - v_displacement_amount;
color -= heightShadow * heightShadow * u_shadows;
} else {
color += specular * u_highlights;
color += v_displacement_amount * u_highlights * 0.5;
float heightShadow = 1.0 - v_displacement_amount;
color -= heightShadow * heightShadow * u_shadows * 0.5;
color -= (1.0 - diffuse) * u_shadows * 0.5;
}
color = saturation(color, 1.0 + u_saturation);
color = color * u_brightness;
if (u_iridescence_enabled > 0.5) {
float hue = fract(v_displacement_amount * 0.5 + 0.5 + u_time * u_iridescence_speed * 0.05);
vec3 iriColor = hsl2rgb(hue, 0.8, 0.6);
color = mix(color, iriColor, u_iridescence_intensity * abs(v_displacement_amount) * 0.6);
}
if (u_fresnel_enabled > 0.5) {
float slope = 1.0 - abs(v_displacement_amount);
float fresnel = pow(max(slope, 0.0), u_fresnel_power);
color += u_fresnel_color * fresnel * u_fresnel_intensity;
}
if (u_vignette_intensity > 0.0) {
vec2 vigUv = vUv;
if (u_shape_type > 0.5) {
vigUv = (v_new_position.xy / v_new_position.w) * 0.5 + vec2(0.5);
}
float dist = length(vigUv - vec2(0.5));
float vig = smoothstep(u_vignette_radius, u_vignette_radius * 0.3, dist);
color *= mix(1.0, vig, u_vignette_intensity);
}
if (u_bloom_intensity > 0.0) {
float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
float bloomMask = smoothstep(u_bloom_threshold, 1.0, luma);
color += color * bloomMask * u_bloom_intensity;
}
if (u_chromatic_aberration > 0.0) {
float caAmount = u_chromatic_aberration * 0.008;
vec2 caUv = vUv;
if (u_shape_type > 0.5) {
caUv = (v_new_position.xy / v_new_position.w) * 0.5 + vec2(0.5);
}
float dist = length(caUv - vec2(0.5));
float rShift = v_displacement_amount + caAmount * dist;
float bShift = v_displacement_amount - caAmount * dist;
color.r *= 1.0 + rShift * caAmount * 10.0;
color.b *= 1.0 - bShift * caAmount * 10.0;
}
float grain = 0.0;
if (u_grain_intensity > 0.0) {
vec2 noiseCoords = gl_FragCoord.xy / u_grain_scale;
if (u_grain_speed != 0.0 || u_shape_type <= 0.5) {
grain = fbm(vec3(noiseCoords, u_time * u_grain_speed));
} else {
grain = random(noiseCoords) - 0.5;
}
grain = grain * 0.5 + 0.5;
grain -= 0.5;
grain = (grain > u_grain_sparsity) ? grain : 0.0;
grain *= u_grain_intensity;
}
color += vec3(grain);
float edgeAlpha = 1.0;
if (u_shape_type > 0.5) {
edgeAlpha = smoothstep(0.0, u_silhouette_fade, ndotv);
}
if (u_shape_type == 3.0) {
float vFade = smoothstep(0.0, u_cylinder_fade, vUv.y) * smoothstep(1.0, 1.0 - u_cylinder_fade, vUv.y);
edgeAlpha *= vFade;
} else if (u_shape_type == 4.0) {
float uFade = smoothstep(0.0, u_ribbon_fade, vUv.x) * smoothstep(1.0, 1.0 - u_ribbon_fade, vUv.x);
float vFade = smoothstep(0.0, u_ribbon_fade, vUv.y) * smoothstep(1.0, 1.0 - u_ribbon_fade, vUv.y);
edgeAlpha *= uFade * vFade;
}
edgeAlpha *= texAlpha;
gl_FragColor = vec4(color, edgeAlpha);
}`;function s(){return`vec4 permute(vec4 x) {
return floor(fract(sin(x) * 43758.5453123) * 289.0);
}
vec4 taylorInvSqrt(vec4 r) {
return 1.79284291400159 - 0.85373472095314 * r;
}
vec3 fade(vec3 t) {
return t*t*t*(t*(t*6.0-15.0)+10.0);
}
float snoise(vec3 v) {
const vec2 C = vec2(1.0/6.0, 1.0/3.0) ;
const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
vec3 i = floor(v + dot(v, C.yyy) );
vec3 x0 = v - i + dot(i, C.xxx) ;
vec3 g = step(x0.yzx, x0.xyz);
vec3 l = 1.0 - g;
vec3 i1 = min( g.xyz, l.zxy );
vec3 i2 = max( g.xyz, l.zxy );
vec3 x1 = x0 - i1 + C.xxx;
vec3 x2 = x0 - i2 + C.yyy;
vec3 x3 = x0 - D.yyy;
vec4 p = permute( permute( permute(
i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
+ i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
+ i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
float n_ = 0.142857142857;
vec3 ns = n_ * D.wyz - D.xzx;
vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
vec4 x_ = floor(j * ns.z);
vec4 y_ = floor(j - 7.0 * x_ );
vec4 x = x_ *ns.x + ns.yyyy;
vec4 y = y_ *ns.x + ns.yyyy;
vec4 h = 1.0 - abs(x) - abs(y);
vec4 b0 = vec4( x.xy, y.xy );
vec4 b1 = vec4( x.zw, y.zw );
vec4 s0 = floor(b0)*2.0 + 1.0;
vec4 s1 = floor(b1)*2.0 + 1.0;
vec4 sh = -step(h, vec4(0.0));
vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
vec3 p0 = vec3(a0.xy,h.x);
vec3 p1 = vec3(a0.zw,h.y);
vec3 p2 = vec3(a1.xy,h.z);
vec3 p3 = vec3(a1.zw,h.w);
vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
p0 *= norm.x;
p1 *= norm.y;
p2 *= norm.z;
p3 *= norm.w;
vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
m = m * m;
return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
dot(p2,x2), dot(p3,x3) ) );
}
float cnoise(vec3 P)
{
vec3 Pi0 = floor(P);
vec3 Pi1 = Pi0 + vec3(1.0);
vec3 Pf0 = fract(P);
vec3 Pf1 = Pf0 - vec3(1.0);
vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
vec4 iy = vec4(Pi0.yy, Pi1.yy);
vec4 iz0 = Pi0.zzzz;
vec4 iz1 = Pi1.zzzz;
vec4 ixy = permute(permute(ix) + iy);
vec4 ixy0 = permute(ixy + iz0);
vec4 ixy1 = permute(ixy + iz1);
vec4 gx0 = ixy0 * (1.0 / 7.0);
vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
gx0 = fract(gx0);
vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
vec4 sz0 = step(gz0, vec4(0.0));
gx0 -= sz0 * (step(0.0, gx0) - 0.5);
gy0 -= sz0 * (step(0.0, gy0) - 0.5);
vec4 gx1 = ixy1 * (1.0 / 7.0);
vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
gx1 = fract(gx1);
vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
vec4 sz1 = step(gz1, vec4(0.0));
gx1 -= sz1 * (step(0.0, gx1) - 0.5);
gy1 -= sz1 * (step(0.0, gy1) - 0.5);
vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
g000 *= norm0.x;
g010 *= norm0.y;
g100 *= norm0.z;
g110 *= norm0.w;
vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
g001 *= norm1.x;
g011 *= norm1.y;
g101 *= norm1.z;
g111 *= norm1.w;
float n000 = dot(g000, Pf0);
float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
float n111 = dot(g111, Pf1);
vec3 fade_xyz = fade(Pf0);
vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
return 2.2 * n_xyz;
}`}function n(){return`vec3 saturation(vec3 rgb, float adjustment) {
const vec3 W = vec3(0.2125, 0.7154, 0.0721);
vec3 intensity = vec3(dot(rgb, W));
return mix(intensity, rgb, adjustment);
}`}class a{elements;constructor(){this.elements=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}translate(e,t,i){return this.elements[12]+=this.elements[0]*e+this.elements[4]*t+this.elements[8]*i,this.elements[13]+=this.elements[1]*e+this.elements[5]*t+this.elements[9]*i,this.elements[14]+=this.elements[2]*e+this.elements[6]*t+this.elements[10]*i,this.elements[15]+=this.elements[3]*e+this.elements[7]*t+this.elements[11]*i,this}rotateX(e){let t=Math.cos(e),i=Math.sin(e),r=this.elements[4],o=this.elements[5],s=this.elements[6],n=this.elements[7],a=this.elements[8],l=this.elements[9],u=this.elements[10],_=this.elements[11];return this.elements[4]=t*r+i*a,this.elements[5]=t*o+i*l,this.elements[6]=t*s+i*u,this.elements[7]=t*n+i*_,this.elements[8]=t*a-i*r,this.elements[9]=t*l-i*o,this.elements[10]=t*u-i*s,this.elements[11]=t*_-i*n,this}rotateY(e){let t=Math.cos(e),i=Math.sin(e),r=this.elements[0],o=this.elements[1],s=this.elements[2],n=this.elements[3],a=this.elements[8],l=this.elements[9],u=this.elements[10],_=this.elements[11];return this.elements[0]=t*r-i*a,this.elements[1]=t*o-i*l,this.elements[2]=t*s-i*u,this.elements[3]=t*n-i*_,this.elements[8]=i*r+t*a,this.elements[9]=i*o+t*l,this.elements[10]=i*s+t*u,this.elements[11]=i*n+t*_,this}rotateZ(e){let t=Math.cos(e),i=Math.sin(e),r=this.elements[0],o=this.elements[1],s=this.elements[2],n=this.elements[3],a=this.elements[4],l=this.elements[5],u=this.elements[6],_=this.elements[7];return this.elements[0]=t*r+i*a,this.elements[1]=t*o+i*l,this.elements[2]=t*s+i*u,this.elements[3]=t*n+i*_,this.elements[4]=-i*r+t*a,this.elements[5]=-i*o+t*l,this.elements[6]=-i*s+t*u,this.elements[7]=-i*n+t*_,this}}class l{left;right;top;bottom;near;far;position;projectionMatrix;zoom;constructor(e,t,i,r,o,s){this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=o,this.far=s,this.position=[0,0,0],this.zoom=1,this.projectionMatrix=new a,this.updateProjectionMatrix()}updateProjectionMatrix(){let e=1/(this.right-this.left),t=1/(this.top-this.bottom),i=1/(this.far-this.near),r=(this.right+this.left)*e,o=(this.top+this.bottom)*t,s=(this.far+this.near)*i;this.projectionMatrix.elements=new Float32Array([2*e,0,0,0,0,2*t,0,0,0,0,-2*i,0,-r,-o,-s,1])}}function u(e,t,i,r=50,o=50,s="plane",n=1){e.zoom=n;let a=t/i;if("plane"===s){let s=t*i/1e6*r*o/1.5,n=Math.sqrt(s*a),l=-r/2,u=Math.min((l+n)/1.5,r/2),_=o/4,h=Math.max((_-s/n)/2,-o/4);a<1&&(l*=a,l*=1.05,u*=1.05*a,_*=1.05,h*=1.05),e.left=l,e.right=u,e.top=_,e.bottom=h}else{let t=25;("sphere"===s?t=30:"torus"===s?t=35:"cylinder"===s&&(t=30),a>=1)?(e.left=-t*a,e.right=t*a,e.top=t,e.bottom=-t):(e.left=-t,e.right=t,e.top=t/a,e.bottom=-t/a,e.left*=1.05,e.right*=1.05,e.top*=1.05,e.bottom*=1.05)}e.left/=n,e.right/=n,e.top/=n,e.bottom/=n,e.near=-100,e.far=1e3,e.updateProjectionMatrix()}function _(e,t,i,r){let o=e/2,s=t/2,n=Math.floor(i),a=Math.floor(r),l=n+1,u=a+1,_=e/n,h=t/a,f=[],c=[],d=[],m=[];for(let e=0;e<u;e++){let t=e*h-s;for(let i=0;i<l;i++){let r=i*_-o;c.push(r,-t,0),d.push(0,0,1),m.push(i/n),m.push(1-e/a)}}for(let e=0;e<a;e++)for(let t=0;t<n;t++){let i=t+l*e,r=t+l*(e+1),o=t+1+l*(e+1),s=t+1+l*e;f.push(i,r,s),f.push(r,o,s)}let p=c.length/3>65535,g=[];for(let e=0;e<f.length;e+=3){let t=f[e],i=f[e+1],r=f[e+2];g.push(t,i,i,r,r,t)}return{position:new Float32Array(c),normal:new Float32Array(d),uv:new Float32Array(m),index:p?new Uint32Array(f):new Uint16Array(f),wireframeIndex:p?new Uint32Array(g):new Uint16Array(g)}}function h(e,t,i){let r=[],o=[],s=[],n=[],a=Math.floor(t),l=Math.floor(i);for(let t=0;t<=l;t++){let i=t/l,n=i*Math.PI;for(let t=0;t<=a;t++){let l=t/a,u=l*Math.PI*2,_=-e*Math.sin(n)*Math.cos(u),h=e*Math.cos(n),f=e*Math.sin(n)*Math.sin(u);r.push(_,h,f);let c=Math.sqrt(_*_+h*h+f*f);o.push(_/c,h/c,f/c),s.push(l,1-i)}}for(let e=0;e<l;e++)for(let t=0;t<a;t++){let i=t+(a+1)*e,r=t+(a+1)*(e+1),o=t+1+(a+1)*(e+1),s=t+1+(a+1)*e;n.push(i,r,s),n.push(r,o,s)}let u=r.length/3>65535,_=[];for(let e=0;e<n.length;e+=3){let t=n[e],i=n[e+1],r=n[e+2];_.push(t,i,i,r,r,t)}return{position:new Float32Array(r),normal:new Float32Array(o),uv:new Float32Array(s),index:u?new Uint32Array(n):new Uint16Array(n),wireframeIndex:u?new Uint32Array(_):new Uint16Array(_)}}function f(e,t,i,r){let o=[],s=[],n=[],a=[],l=Math.floor(i),u=Math.floor(r);for(let i=0;i<=l;i++){let r=i/l*Math.PI*2;for(let a=0;a<=u;a++){let _=a/u*Math.PI*2,h=(e+t*Math.cos(r))*Math.cos(_),f=(e+t*Math.cos(r))*Math.sin(_),c=t*Math.sin(r);o.push(h,f,c);let d=h-e*Math.cos(_),m=f-e*Math.sin(_),p=Math.sqrt(d*d+m*m+c*c);s.push(d/p,m/p,c/p),n.push(a/u,i/l)}}for(let e=1;e<=l;e++)for(let t=1;t<=u;t++){let i=(u+1)*e+t-1,r=(u+1)*(e-1)+t-1,o=(u+1)*(e-1)+t,s=(u+1)*e+t;a.push(i,r,s),a.push(r,o,s)}let _=o.length/3>65535,h=[];for(let e=0;e<a.length;e+=3){let t=a[e],i=a[e+1],r=a[e+2];h.push(t,i,i,r,r,t)}return{position:new Float32Array(o),normal:new Float32Array(s),uv:new Float32Array(n),index:_?new Uint32Array(a):new Uint16Array(a),wireframeIndex:_?new Uint32Array(h):new Uint16Array(h)}}function c(e,t,i,r,o){let s=[],n=[],a=[],l=[],u=Math.floor(r),_=Math.floor(o),h=i/2;for(let r=0;r<=_;r++){let o=r/_,l=o*i-h,f=o*(t-e)+e;for(let e=0;e<=u;e++){let t=e/u,i=t*Math.PI*2,r=Math.sin(i),_=Math.cos(i);s.push(f*r,-l,f*_),n.push(r,0,_),a.push(t,1-o)}}for(let e=0;e<_;e++)for(let t=0;t<u;t++){let i=t+(u+1)*e,r=t+(u+1)*(e+1),o=t+1+(u+1)*(e+1),s=t+1+(u+1)*e;l.push(i,r,s),l.push(r,o,s)}let f=s.length/3>65535,c=[];for(let e=0;e<l.length;e+=3){let t=l[e],i=l[e+1],r=l[e+2];c.push(t,i,i,r,r,t)}return{position:new Float32Array(s),normal:new Float32Array(n),uv:new Float32Array(a),index:f?new Uint32Array(l):new Uint16Array(l),wireframeIndex:f?new Uint32Array(c):new Uint16Array(c)}}function d(e,t,i,r,o,s){let n=e/2,a=t/2,l=Math.floor(i),u=Math.floor(r),_=l+1,h=u+1,f=e/l,c=t/u,d=[],m=[],p=[],g=[];for(let i=0;i<h;i++){let r=i*c-a;for(let a=0;a<_;a++){let _=a*f-n,h=_,c=0,g=0,y=1;if(Math.abs(o)>.001){let t=e/o,i=_/t;h=t*Math.sin(i),c=t*(1-Math.cos(i)),g=Math.sin(i),y=Math.cos(i)}if(Math.abs(s)>.001){let e=r/t*s,i=Math.cos(e),o=Math.sin(e),n=h*i-c*o,a=h*o+c*i;h=n,c=a;let l=g*i-y*o,u=g*o+y*i;g=l,y=u}d.push(h,-r,c),m.push(g,0,y),p.push(a/l),p.push(1-i/u)}}for(let e=0;e<u;e++)for(let t=0;t<l;t++){let i=t+_*e,r=t+_*(e+1),o=t+1+_*(e+1),s=t+1+_*e;g.push(i,r,s),g.push(r,o,s)}let y=d.length/3>65535,v=[];for(let e=0;e<g.length;e+=3){let t=g[e],i=g[e+1],r=g[e+2];v.push(t,i,i,r,r,t)}return{position:new Float32Array(d),normal:new Float32Array(m),uv:new Float32Array(p),index:y?new Uint32Array(g):new Uint16Array(g),wireframeIndex:y?new Uint32Array(v):new Uint16Array(v)}}console.info(`%c\u{1F308} Neat Gradients%c

Licensed under MIT + The Commons Clause.
Free for personal and commercial use.
Selling this software or its derivatives is strictly prohibited.
https://neat.firecms.co`,"font-weight: bold; font-size: 14px; color: #FF5772;","color: inherit;");let m=function(e=6){let t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",i="";for(let r=0;r<e;r++){let e=Math.floor(Math.random()*t.length);i+=t.charAt(e)}return i}();class p{_ref;_speed=-1;_horizontalPressure=-1;_verticalPressure=-1;_waveFrequencyX=-1;_waveFrequencyY=-1;_waveAmplitude=-1;_shadows=-1;_highlights=-1;_saturation=-1;_brightness=-1;_grainScale=-1;_grainIntensity=-1;_grainSparsity=-1;_grainSpeed=-1;_colorBlending=-1;_resolution=1;_colors=[];_wireframe=!1;_backgroundColor="#FFFFFF";_backgroundColorRgb=[1,1,1];_backgroundAlpha=1;_flowDistortionA=0;_flowDistortionB=0;_flowScale=1;_flowEase=0;_flowEnabled=!0;glState;_enableProceduralTexture=!1;_textureVoidLikelihood=.45;_textureVoidWidthMin=200;_textureVoidWidthMax=486;_textureBandDensity=2.15;_textureColorBlending=.01;_textureSeed=333;_textureEase=.5;_transparentTextureVoid=!1;_domainWarpEnabled=!1;_domainWarpIntensity=.5;_domainWarpScale=1;_vignetteIntensity=.5;_vignetteRadius=.8;_fresnelEnabled=!1;_fresnelPower=2;_fresnelIntensity=.5;_fresnelColor="#FFFFFF";_fresnelColorRgb=[1,1,1];_iridescenceEnabled=!1;_iridescenceIntensity=.5;_iridescenceSpeed=1;_bloomIntensity=0;_bloomThreshold=.7;_chromaticAberration=0;_silhouetteFade=.25;_cylinderFade=.08;_ribbonFade=.05;_shapeType="plane";_shapeRotationX=0;_shapeRotationY=0;_shapeRotationZ=0;_shapeAutoRotateSpeedX=0;_shapeAutoRotateSpeedY=0;_sphereRadius=15;_torusRadius=15;_torusTube=5;_cylinderRadius=10;_cylinderHeight=40;_planeBend=0;_planeTwist=0;_cameraLock=!1;_cameraX=0;_cameraY=0;_cameraZ=0;_cameraRotationX=0;_cameraRotationY=0;_cameraRotationZ=0;_cameraZoom=1;_proceduralTexture=null;_proceduralBackgroundColor="#000000";_textureShapeTriangles=20;_textureShapeCircles=15;_textureShapeBars=15;_textureShapeSquiggles=10;requestRef=-1;sizeObserver;_initialized=!1;_linkElement=null;_cachedColorRgb=[];_yOffset=0;_yOffsetWaveMultiplier=.004;_yOffsetColorMultiplier=.004;_yOffsetFlowMultiplier=.004;_sourceCanvas=null;_sourceCtx=null;_maskedCanvas=null;_maskedCtx=null;_resizeTimeoutId=null;_textureNeedsUpdate=!1;_linkCheckCounter=0;_colorsChanged=!0;_uniformsDirty=!0;_textureDirty=!0;constructor(e){let{ref:t,speed:i=4,horizontalPressure:r=3,verticalPressure:o=3,waveFrequencyX:s=5,waveFrequencyY:n=5,waveAmplitude:l=3,colors:_,highlights:h=4,shadows:f=4,colorSaturation:c=0,colorBrightness:d=1,colorBlending:m=5,grainScale:p=2,grainIntensity:g=.55,grainSparsity:v=0,grainSpeed:x=.1,wireframe:b=!1,backgroundColor:w="#FFFFFF",backgroundAlpha:R=1,resolution:S=1,seed:T,yOffset:E=0,yOffsetWaveMultiplier:A=4,yOffsetColorMultiplier:F=4,yOffsetFlowMultiplier:D=4,flowDistortionA:M=0,flowDistortionB:C=0,flowScale:P=1,flowEase:U=0,flowEnabled:z=!0,enableProceduralTexture:B=!1,textureVoidLikelihood:I=.45,textureVoidWidthMin:W=200,textureVoidWidthMax:k=486,textureBandDensity:Y=2.15,textureColorBlending:N=.01,textureSeed:O=333,textureEase:X=.5,proceduralBackgroundColor:L="#000000",transparentTextureVoid:q=!1,textureShapeTriangles:V=20,textureShapeCircles:Z=15,textureShapeBars:G=15,textureShapeSquiggles:j=10,domainWarpEnabled:H=!1,domainWarpIntensity:$=.5,domainWarpScale:K=1,vignetteIntensity:J=0,vignetteRadius:Q=.8,fresnelEnabled:ee=!1,fresnelPower:et=2,fresnelIntensity:ei=.5,fresnelColor:er="#FFFFFF",iridescenceEnabled:eo=!1,iridescenceIntensity:es=.5,iridescenceSpeed:en=1,bloomIntensity:ea=0,bloomThreshold:el=.7,chromaticAberration:eu=0,silhouetteFade:e_=.25,cylinderFade:eh=.08,ribbonFade:ef=.05,cameraLock:ec=!1,cameraX:ed=0,cameraY:em=0,cameraZ:ep=0,cameraRotationX:eg=0,cameraRotationY:ey=0,cameraRotationZ:ev=0,cameraZoom:ex=1,shapeType:eb="plane",shapeRotationX:ew=0,shapeRotationY:eR=0,shapeRotationZ:eS=0,shapeAutoRotateSpeedX:eT=0,shapeAutoRotateSpeedY:eE=0,sphereRadius:eA=15,torusRadius:eF=15,torusTube:eD=5,cylinderRadius:eM=10,cylinderHeight:eC=40,planeBend:eP=0,planeTwist:eU=0}=e;this._ref=t,this.destroy=this.destroy.bind(this),this._initScene=this._initScene.bind(this),this.speed=i,this.horizontalPressure=r,this.verticalPressure=o,this.waveFrequencyX=s,this.waveFrequencyY=n,this.waveAmplitude=l,this.colorBlending=m,this._resolution=S,this.grainScale=p,this.grainIntensity=g,this.grainSparsity=v,this.grainSpeed=x,this.colors=_,this.shadows=f,this.highlights=h,this.colorSaturation=c,this.colorBrightness=d,this.wireframe=b,this.backgroundColor=w,this.backgroundAlpha=R,this.yOffset=E,this.yOffsetWaveMultiplier=A,this.yOffsetColorMultiplier=F,this.yOffsetFlowMultiplier=D,this.flowDistortionA=M,this.flowDistortionB=C,this.flowScale=P,this.flowEase=U,this.flowEnabled=z,this.enableProceduralTexture=B,this.textureVoidLikelihood=I,this.textureVoidWidthMin=W,this.textureVoidWidthMax=k,this.textureBandDensity=Y,this.textureColorBlending=N,this.textureSeed=O,this.textureEase=X,this._proceduralBackgroundColor=L,this.transparentTextureVoid=q,this._textureShapeTriangles=V,this._textureShapeCircles=Z,this._textureShapeBars=G,this._textureShapeSquiggles=j,this.domainWarpEnabled=H,this.domainWarpIntensity=$,this.domainWarpScale=K,this.vignetteIntensity=J,this.vignetteRadius=Q,this.fresnelEnabled=ee,this.fresnelPower=et,this.fresnelIntensity=ei,this.fresnelColor=er,this.iridescenceEnabled=eo,this.iridescenceIntensity=es,this.iridescenceSpeed=en,this.bloomIntensity=ea,this.bloomThreshold=el,this.chromaticAberration=eu,this.silhouetteFade=e_,this.cylinderFade=eh,this.ribbonFade=ef,this._cameraLock=ec,this._cameraX=ed,this._cameraY=em,this._cameraZ=ep,this._cameraRotationX=eg,this._cameraRotationY=ey,this._cameraRotationZ=ev,this._cameraZoom=ex,this._shapeType=eb,this._shapeRotationX=ew,this._shapeRotationY=eR,this._shapeRotationZ=eS,this._shapeAutoRotateSpeedX=eT,this._shapeAutoRotateSpeedY=eE,this._sphereRadius=eA,this._torusRadius=eF,this._torusTube=eD,this._cylinderRadius=eM,this._cylinderHeight=eC,this._planeBend=eP,this._planeTwist=eU,this.glState=this._initScene(S),function(){if(document.getElementById("neat-seo-schema"))return;let e=document.createElement("script");e.id="neat-seo-schema",e.type="application/ld+json",e.text=JSON.stringify({"@context":"https://schema.org","@type":"WebSite",name:"NEAT Gradient",url:"https://neat.firecms.co",author:{"@type":"Organization",name:"FireCMS",url:"https://firecms.co"},description:"Beautiful, fast, heavily customizable, WebGL based gradients."}),document.head.appendChild(e);let t=document.createElement("div");t.style.position="absolute",t.style.width="1px",t.style.height="1px",t.style.padding="0",t.style.margin="-1px",t.style.overflow="hidden",t.style.clip="rect(0, 0, 0, 0)",t.style.whiteSpace="nowrap",t.style.borderWidth="0";try{let e=t.attachShadow({mode:"closed"}),i=document.createElement("a");i.href="https://firecms.co",i.textContent="FireCMS",e.appendChild(i)}catch{let e=document.createElement("a");e.href="https://firecms.co",e.textContent="FireCMS",t.appendChild(e)}document.body.appendChild(t)}();let ez=void 0!==T?T:function(){let e=new Date;return 60*e.getMinutes()+e.getSeconds()}(),eB=performance.now(),eI=()=>{let{gl:e,program:i,locations:r,indexCount:o,indexType:s}=this.glState;if(this._linkCheckCounter++,this._linkCheckCounter>=300&&(this._linkCheckCounter=0,this._linkElement&&document.contains(this._linkElement)||(this._linkElement=y(t))),this._initialized){let t=performance.now();ez+=(t-eB)/1e3*this._speed,eB=t,e.useProgram(i),e.uniform1f(r.uniforms.u_time,ez);let o=this.glState.camera,s=new a;s.translate(-o.position[0]-this._cameraX,-o.position[1]-this._cameraY,-o.position[2]-this._cameraZ),s.translate(0,0,-1),s.rotateX(-this._cameraRotationX),s.rotateY(-this._cameraRotationY),s.rotateZ(-this._cameraRotationZ);let n=this._shapeRotationX,l=this._shapeRotationY,u=this._shapeRotationZ;0!==this._shapeAutoRotateSpeedX&&(n+=ez*this._shapeAutoRotateSpeedX*.1),0!==this._shapeAutoRotateSpeedY&&(l+=ez*this._shapeAutoRotateSpeedY*.1),"plane"===this._shapeType||"ribbon"===this._shapeType?s.rotateX(n-Math.PI/3.5):s.rotateX(n),s.rotateY(l),s.rotateZ(u);let _=r.uniforms.modelViewMatrix;if(_&&e.uniformMatrix4fv(_,!1,s.elements),this._uniformsDirty){e.uniform2f(r.uniforms.u_resolution,this._ref.clientWidth,this._ref.clientHeight),e.uniform2f(r.uniforms.u_color_pressure,this._horizontalPressure,this._verticalPressure),e.uniform1f(r.uniforms.u_wave_frequency_x,this._waveFrequencyX),e.uniform1f(r.uniforms.u_wave_frequency_y,this._waveFrequencyY),e.uniform1f(r.uniforms.u_wave_amplitude,this._waveAmplitude),e.uniform1f(r.uniforms.u_color_blending,this._colorBlending),e.uniform1f(r.uniforms.u_shadows,this._shadows),e.uniform1f(r.uniforms.u_highlights,this._highlights),e.uniform1f(r.uniforms.u_saturation,this._saturation),e.uniform1f(r.uniforms.u_brightness,this._brightness),e.uniform1f(r.uniforms.u_grain_intensity,this._grainIntensity),e.uniform1f(r.uniforms.u_grain_sparsity,this._grainSparsity),e.uniform1f(r.uniforms.u_grain_speed,this._grainSpeed),e.uniform1f(r.uniforms.u_grain_scale,this._grainScale),e.uniform1f(r.uniforms.u_y_offset,this._yOffset),e.uniform1f(r.uniforms.u_y_offset_wave_multiplier,this._yOffsetWaveMultiplier),e.uniform1f(r.uniforms.u_y_offset_color_multiplier,this._yOffsetColorMultiplier),e.uniform1f(r.uniforms.u_y_offset_flow_multiplier,this._yOffsetFlowMultiplier),e.uniform1f(r.uniforms.u_flow_distortion_a,this._flowDistortionA),e.uniform1f(r.uniforms.u_flow_distortion_b,this._flowDistortionB),e.uniform1f(r.uniforms.u_flow_scale,this._flowScale),e.uniform1f(r.uniforms.u_flow_ease,this._flowEase),e.uniform1f(r.uniforms.u_flow_enabled,+!!this._flowEnabled);let t=0;"sphere"===this._shapeType?t=1:"torus"===this._shapeType?t=2:"cylinder"===this._shapeType?t=3:"ribbon"===this._shapeType&&(t=4),e.uniform1f(r.uniforms.u_shape_type,t),e.uniform1f(r.uniforms.u_enable_procedural_texture,+!!this._enableProceduralTexture),e.uniform1f(r.uniforms.u_texture_ease,this._textureEase),e.uniform1f(r.uniforms.u_transparent_texture_void,+!!this._transparentTextureVoid),e.uniform1f(r.uniforms.u_domain_warp_enabled,+!!this._domainWarpEnabled),e.uniform1f(r.uniforms.u_domain_warp_intensity,this._domainWarpIntensity),e.uniform1f(r.uniforms.u_domain_warp_scale,this._domainWarpScale),e.uniform1f(r.uniforms.u_vignette_intensity,this._vignetteIntensity),e.uniform1f(r.uniforms.u_vignette_radius,this._vignetteRadius),e.uniform1f(r.uniforms.u_fresnel_enabled,+!!this._fresnelEnabled),e.uniform1f(r.uniforms.u_fresnel_power,this._fresnelPower),e.uniform1f(r.uniforms.u_fresnel_intensity,this._fresnelIntensity),e.uniform3fv(r.uniforms.u_fresnel_color,this._fresnelColorRgb),e.uniform1f(r.uniforms.u_iridescence_enabled,+!!this._iridescenceEnabled),e.uniform1f(r.uniforms.u_iridescence_intensity,this._iridescenceIntensity),e.uniform1f(r.uniforms.u_iridescence_speed,this._iridescenceSpeed),e.uniform1f(r.uniforms.u_bloom_intensity,this._bloomIntensity),e.uniform1f(r.uniforms.u_bloom_threshold,this._bloomThreshold),e.uniform1f(r.uniforms.u_chromatic_aberration,this._chromaticAberration),e.uniform1f(r.uniforms.u_silhouette_fade,this._silhouetteFade),e.uniform1f(r.uniforms.u_cylinder_fade,this._cylinderFade),e.uniform1f(r.uniforms.u_ribbon_fade,this._ribbonFade),this._uniformsDirty=!1}if(this._textureNeedsUpdate&&this._enableProceduralTexture&&(this._proceduralTexture&&e.deleteTexture(this._proceduralTexture),this._proceduralTexture=this._createProceduralTexture(e),this._textureNeedsUpdate=!1,this._textureDirty=!0),this._textureDirty&&this._proceduralTexture&&(e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,this._proceduralTexture),e.uniform1i(r.uniforms.u_procedural_texture,1),this._textureDirty=!1),this._colorsChanged){this._colorsChanged=!1;for(let t=0;t<6;t++)if(t<this._colors.length){let i=this._colors[t],o=this._cachedColorRgb[t]||[0,0,0];e.uniform1f(r.uniforms[`u_colors[${t}].is_active`],+!!i.enabled),e.uniform3fv(r.uniforms[`u_colors[${t}].color`],o),e.uniform1f(r.uniforms[`u_colors[${t}].influence`],i.influence||0)}else e.uniform1f(r.uniforms[`u_colors[${t}].is_active`],0);e.uniform1i(r.uniforms.u_colors_count,6)}}e.clearColor(this._backgroundColorRgb[0],this._backgroundColorRgb[1],this._backgroundColorRgb[2],this._backgroundAlpha),e.clear(e.COLOR_BUFFER_BIT|e.DEPTH_BUFFER_BIT),this._wireframe?(e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,this.glState.buffers.wireframeIndex),e.drawElements(e.LINES,this.glState.wireframeIndexCount,s,0),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,this.glState.buffers.index)):e.drawElements(e.TRIANGLES,o,s,0),this.requestRef=requestAnimationFrame(eI)},eW=()=>{let{gl:e,camera:t}=this.glState,i=this._ref.clientWidth,r=this._ref.clientHeight;this._ref.width=i,this._ref.height=r,e.viewport(0,0,i,r),u(t,i,r,50,80,this._shapeType,this._cameraZoom);let o=this.glState.locations.uniforms.projectionMatrix;e.useProgram(this.glState.program),o&&e.uniformMatrix4fv(o,!1,t.projectionMatrix.elements)};this.sizeObserver=new ResizeObserver(()=>{null!==this._resizeTimeoutId&&clearTimeout(this._resizeTimeoutId),this._resizeTimeoutId=window.setTimeout(()=>{eW(),this._resizeTimeoutId=null},100)}),this.sizeObserver.observe(t),eI()}destroy(){if(cancelAnimationFrame(this.requestRef),this.sizeObserver.disconnect(),null!==this._resizeTimeoutId&&(clearTimeout(this._resizeTimeoutId),this._resizeTimeoutId=null),this._linkElement&&this._linkElement.parentElement&&(this._linkElement.parentElement.removeChild(this._linkElement),this._linkElement=null),this.glState){let e=this.glState.gl;e.deleteProgram(this.glState.program),e.deleteBuffer(this.glState.buffers.position),e.deleteBuffer(this.glState.buffers.normal),e.deleteBuffer(this.glState.buffers.uv),e.deleteBuffer(this.glState.buffers.index),e.deleteBuffer(this.glState.buffers.wireframeIndex)}this._proceduralTexture&&this.glState&&this.glState.gl.deleteTexture(this._proceduralTexture)}downloadAsPNG(e="neat.png"){v(this._ref.toDataURL("image/png"),e)}recordVideo(e={}){let{durationMs:t=5e3,filename:i="neat.firecms.co",format:r,onProgress:o,onComplete:s}=e,n=this._ref,a=e.width||n.width||n.clientWidth,l=e.height||n.height||n.clientHeight,u=document.createElement("canvas");u.width=a,u.height=l;let _=u.getContext("2d"),h=u.captureStream(0),f=h.getVideoTracks()[0],c=["video/mp4;codecs=avc1","video/mp4;codecs=avc1,opus","video/mp4"],d=["video/webm;codecs=vp9,opus","video/webm;codecs=vp9","video/webm;codecs=vp8,opus","video/webm"],m="video/webm";for(let e of"mp4"===r?[...c,...d]:"webm"===r?[...d,...c]:[...c,...d])if(MediaRecorder.isTypeSupported(e)){m=e;break}let p=new MediaRecorder(h,{mimeType:m,videoBitsPerSecond:Math.round(8e6*Math.max(1,a*l/921600))}),g=[];p.ondataavailable=e=>{e.data.size>0&&g.push(e.data)};let y=!1,x,b=performance.now(),w=0,R=()=>{if(y)return;_.clearRect(0,0,a,l),_.drawImage(n,0,0,a,l);let e=Math.max(14,Math.round(.025*l));if(_.font=`bold ${e}px "Sofia Sans", sans-serif`,_.textAlign="right",_.textBaseline="bottom",_.shadowColor="rgba(0,0,0,0.5)",_.shadowBlur=4,_.shadowOffsetX=1,_.shadowOffsetY=1,_.fillStyle="rgba(255,255,255,0.7)",_.fillText("NEAT",a-.8*e,l-.5*e),_.shadowColor="transparent",_.shadowBlur=0,_.shadowOffsetX=0,_.shadowOffsetY=0,f.requestFrame&&f.requestFrame(),o){let e=performance.now();e-w>250&&(w=e,o(Math.min(.99,(e-b)/t)))}x=requestAnimationFrame(R)};p.onstop=()=>{y=!0,cancelAnimationFrame(x);let e=m.startsWith("video/mp4"),t=new Blob(g,{type:e?"video/mp4":"video/webm"}),r=URL.createObjectURL(t);v(r,i+(e?".mp4":".webm")),setTimeout(()=>URL.revokeObjectURL(r),3e4),o?.(1),s?.()},R(),p.start(100);let S=window.setTimeout(()=>{"recording"===p.state&&p.stop()},t);return()=>{clearTimeout(S),"recording"===p.state&&p.stop()}}get speed(){return 20*this._speed}set speed(e){this._uniformsDirty=!0,this._speed=e/20}get horizontalPressure(){return 4*this._horizontalPressure}set horizontalPressure(e){this._uniformsDirty=!0,this._horizontalPressure=e/4}get verticalPressure(){return 4*this._verticalPressure}set verticalPressure(e){this._uniformsDirty=!0,this._verticalPressure=e/4}get waveFrequencyX(){return this._waveFrequencyX/.04}set waveFrequencyX(e){this._uniformsDirty=!0,this._waveFrequencyX=.04*e}get waveFrequencyY(){return this._waveFrequencyY/.04}set waveFrequencyY(e){this._uniformsDirty=!0,this._waveFrequencyY=.04*e}get waveAmplitude(){return this._waveAmplitude/.75}set waveAmplitude(e){this._uniformsDirty=!0,this._waveAmplitude=.75*e}get colors(){return this._colors}set colors(e){this._uniformsDirty=!0,this._colors=e,this._cachedColorRgb=e.map(e=>this._hexToRgb(e.color)),this._colorsChanged=!0}get highlights(){return 100*this._highlights}set highlights(e){this._uniformsDirty=!0,this._highlights=e/100}get shadows(){return 100*this._shadows}set shadows(e){this._uniformsDirty=!0,this._shadows=e/100}get colorSaturation(){return 10*this._saturation}set colorSaturation(e){this._uniformsDirty=!0,this._saturation=e/10}get colorBrightness(){return this._brightness}set colorBrightness(e){this._uniformsDirty=!0,this._brightness=e}get colorBlending(){return 10*this._colorBlending}set colorBlending(e){this._uniformsDirty=!0,this._colorBlending=e/10}get grainScale(){return this._grainScale}set grainScale(e){this._uniformsDirty=!0,this._grainScale=0==e?1:e}get grainIntensity(){return this._grainIntensity}set grainIntensity(e){this._uniformsDirty=!0,this._grainIntensity=e}get grainSparsity(){return this._grainSparsity}set grainSparsity(e){this._uniformsDirty=!0,this._grainSparsity=e}get grainSpeed(){return this._grainSpeed}set grainSpeed(e){this._uniformsDirty=!0,this._grainSpeed=e}get wireframe(){return this._wireframe}set wireframe(e){this._uniformsDirty=!0,this._wireframe=e}get resolution(){return this._resolution}set resolution(e){this._resolution!==e&&(this._resolution=e,this._updateGeometry())}get backgroundColor(){return this._backgroundColor}set backgroundColor(e){this._uniformsDirty=!0,this._backgroundColor=e,this._backgroundColorRgb=this._hexToRgb(e)}get backgroundAlpha(){return this._backgroundAlpha}set backgroundAlpha(e){this._uniformsDirty=!0,this._backgroundAlpha=e}get yOffset(){return this._yOffset}set yOffset(e){this._uniformsDirty=!0,this._yOffset=e}get yOffsetWaveMultiplier(){return 1e3*this._yOffsetWaveMultiplier}set yOffsetWaveMultiplier(e){this._uniformsDirty=!0,this._yOffsetWaveMultiplier=e/1e3}get yOffsetColorMultiplier(){return 1e3*this._yOffsetColorMultiplier}set yOffsetColorMultiplier(e){this._uniformsDirty=!0,this._yOffsetColorMultiplier=e/1e3}get yOffsetFlowMultiplier(){return 1e3*this._yOffsetFlowMultiplier}set yOffsetFlowMultiplier(e){this._uniformsDirty=!0,this._yOffsetFlowMultiplier=e/1e3}get flowDistortionA(){return this._flowDistortionA}set flowDistortionA(e){this._uniformsDirty=!0,this._flowDistortionA=e}get flowDistortionB(){return this._flowDistortionB}set flowDistortionB(e){this._uniformsDirty=!0,this._flowDistortionB=e}get flowScale(){return this._flowScale}set flowScale(e){this._uniformsDirty=!0,this._flowScale=e}get flowEase(){return this._flowEase}set flowEase(e){this._uniformsDirty=!0,this._flowEase=e}set flowEnabled(e){this._uniformsDirty=!0,this._flowEnabled=e}get flowEnabled(){return this._flowEnabled}get enableProceduralTexture(){return this._enableProceduralTexture}set enableProceduralTexture(e){this._uniformsDirty=!0,this._enableProceduralTexture=e,e&&!this._proceduralTexture&&(this._textureNeedsUpdate=!0)}get textureVoidLikelihood(){return this._textureVoidLikelihood}set textureVoidLikelihood(e){this._uniformsDirty=!0,this._textureVoidLikelihood=e,this._enableProceduralTexture&&(this._textureNeedsUpdate=!0)}get textureVoidWidthMin(){return this._textureVoidWidthMin}set textureVoidWidthMin(e){this._uniformsDirty=!0,this._textureVoidWidthMin=e,this._enableProceduralTexture&&(this._textureNeedsUpdate=!0)}get textureVoidWidthMax(){return this._textureVoidWidthMax}set textureVoidWidthMax(e){this._uniformsDirty=!0,this._textureVoidWidthMax=e,this._enableProceduralTexture&&(this._textureNeedsUpdate=!0)}get textureBandDensity(){return this._textureBandDensity}set textureBandDensity(e){this._uniformsDirty=!0,this._textureBandDensity=e,this._enableProceduralTexture&&(this._textureNeedsUpdate=!0)}get textureColorBlending(){return this._textureColorBlending}set textureColorBlending(e){this._uniformsDirty=!0,this._textureColorBlending=e,this._enableProceduralTexture&&(this._textureNeedsUpdate=!0)}get textureSeed(){return this._textureSeed}set textureSeed(e){this._uniformsDirty=!0,this._textureSeed=e,this._enableProceduralTexture&&(this._textureNeedsUpdate=!0)}get textureEase(){return this._textureEase}set textureEase(e){this._uniformsDirty=!0,this._textureEase=e}get transparentTextureVoid(){return this._transparentTextureVoid}set transparentTextureVoid(e){this._uniformsDirty=!0,this._transparentTextureVoid=e,this._enableProceduralTexture&&(this._textureNeedsUpdate=!0)}get proceduralBackgroundColor(){return this._proceduralBackgroundColor}set proceduralBackgroundColor(e){this._uniformsDirty=!0,this._proceduralBackgroundColor=e,this._enableProceduralTexture&&(this._textureNeedsUpdate=!0)}get textureShapeTriangles(){return this._textureShapeTriangles}set textureShapeTriangles(e){this._uniformsDirty=!0,this._textureShapeTriangles=e,this._enableProceduralTexture&&(this._textureNeedsUpdate=!0)}get textureShapeCircles(){return this._textureShapeCircles}set textureShapeCircles(e){this._uniformsDirty=!0,this._textureShapeCircles=e,this._enableProceduralTexture&&(this._textureNeedsUpdate=!0)}get textureShapeBars(){return this._textureShapeBars}set textureShapeBars(e){this._uniformsDirty=!0,this._textureShapeBars=e,this._enableProceduralTexture&&(this._textureNeedsUpdate=!0)}get textureShapeSquiggles(){return this._textureShapeSquiggles}set textureShapeSquiggles(e){this._uniformsDirty=!0,this._textureShapeSquiggles=e,this._enableProceduralTexture&&(this._textureNeedsUpdate=!0)}_updateGeometry(){if(!this.glState)return;let e=this.glState.gl,t=this._resolution||1,{position:i,normal:r,uv:o,index:s,wireframeIndex:n}="sphere"===this._shapeType?h(this._sphereRadius,120*t,120*t):"torus"===this._shapeType?f(this._torusRadius,this._torusTube,120*t,120*t):"cylinder"===this._shapeType?c(this._cylinderRadius,this._cylinderRadius,this._cylinderHeight,120*t,120*t):"ribbon"===this._shapeType?d(50,80,240*t,240*t,this._planeBend,this._planeTwist):_(50,80,240*t,240*t);e.bindBuffer(e.ARRAY_BUFFER,this.glState.buffers.position),e.bufferData(e.ARRAY_BUFFER,i,e.STATIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,this.glState.buffers.normal),e.bufferData(e.ARRAY_BUFFER,r,e.STATIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,this.glState.buffers.uv),e.bufferData(e.ARRAY_BUFFER,o,e.STATIC_DRAW),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,this.glState.buffers.index),e.bufferData(e.ELEMENT_ARRAY_BUFFER,s,e.STATIC_DRAW),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,this.glState.buffers.wireframeIndex),e.bufferData(e.ELEMENT_ARRAY_BUFFER,n,e.STATIC_DRAW),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,this.glState.buffers.index),this.glState.indexCount=s.length,this.glState.wireframeIndexCount=n.length,this.glState.indexType=s instanceof Uint32Array?e.UNSIGNED_INT:e.UNSIGNED_SHORT;let a=this._ref.clientWidth,l=this._ref.clientHeight;u(this.glState.camera,a,l,50,80,this._shapeType,this._cameraZoom);let m=this.glState.locations.uniforms.projectionMatrix;e.useProgram(this.glState.program),m&&e.uniformMatrix4fv(m,!1,this.glState.camera.projectionMatrix.elements),this._uniformsDirty=!0}_hexToRgb(e){let t=parseInt(e.replace("#",""),16);return[(t>>16&255)/255,(t>>8&255)/255,(255&t)/255]}_initScene(e){let t=this._ref.clientWidth,i=this._ref.clientHeight,a=this._ref.getContext("webgl2",{alpha:!0,preserveDrawingBuffer:!0,antialias:!0})||this._ref.getContext("webgl",{alpha:!0,preserveDrawingBuffer:!0,antialias:!0});if(!a)throw Error("WebGL not supported");a.getExtension("OES_standard_derivatives"),a.getExtension("OES_element_index_uint"),a.viewport(0,0,t,i);let{position:m,normal:p,uv:g,index:y,wireframeIndex:v}="sphere"===this._shapeType?h(this._sphereRadius,120*e,120*e):"torus"===this._shapeType?f(this._torusRadius,this._torusTube,120*e,120*e):"cylinder"===this._shapeType?c(this._cylinderRadius,this._cylinderRadius,this._cylinderHeight,120*e,120*e):"ribbon"===this._shapeType?d(50,80,240*e,240*e,this._planeBend,this._planeTwist):_(50,80,240*e,240*e),x=a.createBuffer();a.bindBuffer(a.ARRAY_BUFFER,x),a.bufferData(a.ARRAY_BUFFER,m,a.STATIC_DRAW);let b=a.createBuffer();a.bindBuffer(a.ARRAY_BUFFER,b),a.bufferData(a.ARRAY_BUFFER,p,a.STATIC_DRAW);let w=a.createBuffer();a.bindBuffer(a.ARRAY_BUFFER,w),a.bufferData(a.ARRAY_BUFFER,g,a.STATIC_DRAW);let R=a.createBuffer();a.bindBuffer(a.ELEMENT_ARRAY_BUFFER,R),a.bufferData(a.ELEMENT_ARRAY_BUFFER,y,a.STATIC_DRAW);let S=a.createBuffer();a.bindBuffer(a.ELEMENT_ARRAY_BUFFER,S),a.bufferData(a.ELEMENT_ARRAY_BUFFER,v,a.STATIC_DRAW),a.bindBuffer(a.ELEMENT_ARRAY_BUFFER,R);let T=`precision highp float;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec2 vUv;
varying vec2 vFlowUv;
varying vec4 v_new_position;
varying vec3 v_color;
varying float v_displacement_amount;
varying vec3 vViewPosition;
varying vec3 vNormal;
varying vec3 vPosition;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_color_pressure;
uniform float u_wave_frequency_x;
uniform float u_wave_frequency_y;
uniform float u_wave_amplitude;
uniform float u_plane_width;
uniform float u_plane_height;
uniform float u_color_blending;
uniform int u_colors_count;
struct ColorStop {
float is_active;
vec3 color;
float influence;
};
uniform ColorStop u_colors[6];
uniform float u_y_offset;
uniform float u_y_offset_wave_multiplier;
uniform float u_y_offset_color_multiplier;
uniform float u_y_offset_flow_multiplier;
uniform float u_flow_distortion_a;
uniform float u_flow_distortion_b;
uniform float u_flow_scale;
uniform float u_flow_ease;
uniform float u_flow_enabled;
uniform float u_fresnel_enabled;
uniform float u_fresnel_power;
uniform float u_fresnel_intensity;
uniform vec3 u_fresnel_color;
uniform float u_shape_type;
`+s()+`
`+n()+`
`+r,E=a.createShader(a.VERTEX_SHADER);a.shaderSource(E,T),a.compileShader(E),a.getShaderParameter(E,a.COMPILE_STATUS)||(console.log("VERTEX_SHADER_ERROR_START"),console.log("Vertex shader error: ",a.getShaderInfoLog(E)),console.log("GL Error Code:",a.getError()),console.log("Vertex Shader Source Dump:"),console.log(T.split(`
`).map((e,t)=>`${t+1}: ${e}`).join(`
`)),console.log("VERTEX_SHADER_ERROR_END"));let A=`precision highp float;
varying vec2 vUv;
varying vec2 vFlowUv;
varying vec4 v_new_position;
varying vec3 v_color;
varying float v_displacement_amount;
varying vec3 vViewPosition;
varying vec3 vNormal;
varying vec3 vPosition;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_plane_height;
uniform float u_shadows;
uniform float u_highlights;
uniform float u_saturation;
uniform float u_brightness;
uniform float u_grain_intensity;
uniform float u_grain_sparsity;
uniform float u_grain_scale;
uniform float u_grain_speed;
uniform float u_y_offset;
uniform float u_y_offset_color_multiplier;
uniform float u_flow_distortion_a;
uniform float u_flow_distortion_b;
uniform float u_flow_scale;
uniform sampler2D u_procedural_texture;
uniform float u_enable_procedural_texture;
uniform float u_texture_ease;
uniform float u_domain_warp_enabled;
uniform float u_domain_warp_intensity;
uniform float u_domain_warp_scale;
uniform float u_vignette_intensity;
uniform float u_vignette_radius;
uniform float u_fresnel_enabled;
uniform float u_fresnel_power;
uniform float u_fresnel_intensity;
uniform vec3 u_fresnel_color;
uniform float u_iridescence_enabled;
uniform float u_iridescence_intensity;
uniform float u_iridescence_speed;
uniform float u_bloom_intensity;
uniform float u_bloom_threshold;
uniform float u_chromatic_aberration;
uniform float u_shape_type;
uniform float u_transparent_texture_void;
uniform float u_silhouette_fade;
uniform float u_cylinder_fade;
uniform float u_ribbon_fade;
`+n()+`
`+s()+`
`+o,F=a.createShader(a.FRAGMENT_SHADER);a.shaderSource(F,A),a.compileShader(F),a.getShaderParameter(F,a.COMPILE_STATUS)||(console.log("FRAGMENT_SHADER_ERROR_START"),console.log("Fragment shader error: ",a.getShaderInfoLog(F)),console.log("GL Error Code:",a.getError()),console.log("Fragment Shader Source Dump:"),console.log(A.split(`
`).map((e,t)=>`${t+1}: ${e}`).join(`
`)),console.log("FRAGMENT_SHADER_ERROR_END"));let D=a.createProgram();a.attachShader(D,E),a.attachShader(D,F),a.linkProgram(D),a.getProgramParameter(D,a.LINK_STATUS)||(console.log("PROGRAM_LINK_ERROR_START"),console.log("Program linking error: ",a.getProgramInfoLog(D)),console.log("GL Error Code:",a.getError()),console.log("PROGRAM_LINK_ERROR_END")),a.useProgram(D);let M=new l(0,0,0,0,0,1e3);M.position=[0,0,5],u(M,t,i,50,80,this._shapeType,this._cameraZoom);let C=a.getAttribLocation(D,"position"),P=a.getAttribLocation(D,"normal"),U=a.getAttribLocation(D,"uv");a.enableVertexAttribArray(C),a.bindBuffer(a.ARRAY_BUFFER,x),a.vertexAttribPointer(C,3,a.FLOAT,!1,0,0),a.enableVertexAttribArray(P),a.bindBuffer(a.ARRAY_BUFFER,b),a.vertexAttribPointer(P,3,a.FLOAT,!1,0,0),a.enableVertexAttribArray(U),a.bindBuffer(a.ARRAY_BUFFER,w),a.vertexAttribPointer(U,2,a.FLOAT,!1,0,0),a.bindBuffer(a.ELEMENT_ARRAY_BUFFER,R);let z=a.getUniformLocation(D,"projectionMatrix");a.uniformMatrix4fv(z,!1,M.projectionMatrix.elements);let B=a.getUniformLocation(D,"u_plane_width");a.uniform1f(B,50);let I=a.getUniformLocation(D,"u_plane_height");a.uniform1f(I,80);let W=a.getUniformLocation(D,"u_colors_count");a.uniform1i(W,6);let k={attributes:{position:C,normal:P,uv:U},uniforms:{}};["projectionMatrix","modelViewMatrix","u_time","u_resolution","u_color_pressure","u_wave_frequency_x","u_wave_frequency_y","u_wave_amplitude","u_colors_count","u_plane_width","u_plane_height","u_shadows","u_highlights","u_grain_intensity","u_grain_sparsity","u_grain_scale","u_grain_speed","u_flow_distortion_a","u_flow_distortion_b","u_flow_scale","u_flow_ease","u_flow_enabled","u_y_offset","u_y_offset_wave_multiplier","u_y_offset_color_multiplier","u_y_offset_flow_multiplier","u_procedural_texture","u_enable_procedural_texture","u_texture_ease","u_transparent_texture_void","u_saturation","u_brightness","u_color_blending","u_domain_warp_enabled","u_domain_warp_intensity","u_domain_warp_scale","u_vignette_intensity","u_vignette_radius","u_fresnel_enabled","u_fresnel_power","u_fresnel_intensity","u_fresnel_color","u_iridescence_enabled","u_iridescence_intensity","u_iridescence_speed","u_bloom_intensity","u_bloom_threshold","u_chromatic_aberration","u_shape_type","u_silhouette_fade","u_cylinder_fade","u_ribbon_fade"].forEach(e=>{k.uniforms[e]=a.getUniformLocation(D,e)});for(let e=0;e<6;e++)k.uniforms[`u_colors[${e}].is_active`]=a.getUniformLocation(D,`u_colors[${e}].is_active`),k.uniforms[`u_colors[${e}].color`]=a.getUniformLocation(D,`u_colors[${e}].color`),k.uniforms[`u_colors[${e}].influence`]=a.getUniformLocation(D,`u_colors[${e}].influence`);return this._initialized=!0,this._uniformsDirty=!0,this._colorsChanged=!0,this._textureDirty=!0,a.enable(a.BLEND),a.blendFunc(a.SRC_ALPHA,a.ONE_MINUS_SRC_ALPHA),a.enable(a.DEPTH_TEST),{gl:a,program:D,buffers:{position:x,normal:b,uv:w,index:R,wireframeIndex:S},locations:k,camera:M,indexCount:y.length,wireframeIndexCount:v.length,indexType:y instanceof Uint32Array?a.UNSIGNED_INT:a.UNSIGNED_SHORT}}_createProceduralTexture(e){this._sourceCanvas||(this._sourceCanvas=document.createElement("canvas"),this._sourceCanvas.width=1024,this._sourceCanvas.height=1024,this._sourceCtx=this._sourceCanvas.getContext("2d"));let t=this._sourceCanvas,i=this._sourceCtx;if(!i)return null;let r=this._textureSeed,o=this._textureSeed;function s(){let e=1e4*Math.sin(r++);return e-Math.floor(e)}let n=this._colors.filter(e=>e.enabled).map(e=>e.color);if(0===n.length)return null;let a="plane"!==this._shapeType,l=a?[-1,0,1]:[0],u=a?[-1,0,1]:[0];function _(e){let t=parseInt(e.replace("#",""),16);return{r:t>>16&255,g:t>>8&255,b:255&t}}let h=()=>{let e=n[Math.floor(s()*n.length)],t=n[Math.floor(s()*n.length)],i=s()*this._textureColorBlending,r=_(e),o=_(t),a=r.r+(o.r-r.r)*i;return"#"+(0x1000000+(Math.round(a)<<16)+(Math.round(r.g+(o.g-r.g)*i)<<8)+Math.round(r.b+(o.b-r.b)*i)).toString(16).slice(1).padStart(6,"0")},f=this._proceduralBackgroundColor||"#000000";i.fillStyle=f,i.fillRect(0,0,1024,1024);let c=i.createLinearGradient(0,0,0,1024);c.addColorStop(0,h()),c.addColorStop(1,h()),i.fillStyle=c,i.fillRect(0,0,1024,1024);for(let e=0;e<this._textureShapeTriangles;e++){let e=h(),t=1024*s(),r=1024*s(),o=100+300*s(),n=(s()-.5)*o,a=(s()-.5)*o,_=(s()-.5)*o,f=(s()-.5)*o;for(let o of l)for(let s of u){i.fillStyle=e,i.beginPath();let l=t+1024*o,u=r+1024*s;i.moveTo(l,u),i.lineTo(l+n,u+a),i.lineTo(l+_,u+f),i.fill()}}for(let e=0;e<this._textureShapeCircles;e++){let e=h(),t=10+50*s(),r=1024*s(),o=1024*s(),n=50+150*s();for(let s of l)for(let a of u)i.strokeStyle=e,i.lineWidth=t,i.beginPath(),i.arc(r+1024*s,o+1024*a,n,0,2*Math.PI),i.stroke()}for(let e=0;e<this._textureShapeBars;e++){let e=h(),t=1024*s(),r=1024*s(),o=s()*Math.PI;for(let s of l)for(let n of u)i.fillStyle=e,i.save(),i.translate(t+1024*s,r+1024*n),i.rotate(o),i.fillRect(-150,-25,300,50),i.restore()}i.lineWidth=15,i.lineCap="round";for(let e=0;e<this._textureShapeSquiggles;e++){let e=h(),t=1024*s(),r=1024*s(),o=[],n=0,a=0;for(let e=0;e<4;e++){let e=n+(s()-.5)*300,t=a+(s()-.5)*300;o.push({cx1:n+(s()-.5)*300,cy1:a+(s()-.5)*300,cx2:n+(s()-.5)*300,cy2:a+(s()-.5)*300,ex:e,ey:t}),n=e,a=t}for(let s of l)for(let n of u){i.strokeStyle=e,i.beginPath();let a=t+1024*s,l=r+1024*n;for(let e of(i.moveTo(a,l),o))i.bezierCurveTo(a+e.cx1,l+e.cy1,a+e.cx2,l+e.cy2,a+e.ex,l+e.ey);i.stroke()}}r=o+5e4,this._maskedCanvas||(this._maskedCanvas=document.createElement("canvas"),this._maskedCanvas.width=1024,this._maskedCanvas.height=1024,this._maskedCtx=this._maskedCanvas.getContext("2d"));let d=this._maskedCanvas,m=this._maskedCtx;if(!m)return null;this._transparentTextureVoid?m.clearRect(0,0,1024,1024):(m.fillStyle=f,m.fillRect(0,0,1024,1024));let p=0,g=[];for(;p<1024;)if(s()<this._textureVoidLikelihood){let e=this._textureVoidWidthMin+s()*(this._textureVoidWidthMax-this._textureVoidWidthMin);g.push({type:"void",x:p,width:e}),p+=e}else{let e=50+200*s();g.push({type:"matter",x:p,width:e}),p+=e}for(let e of g)if("matter"===e.type){let i=e.x,r=Math.min(e.x+e.width,1024),o=i;for(;o<r;){let e=(2+20*s())/this._textureBandDensity,i=Math.floor(1024*s());m.drawImage(t,i,0,e,1024,o,0,e,1024),o+=e}}let y=e.createTexture();e.bindTexture(e.TEXTURE_2D,y),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,d),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.generateMipmap(e.TEXTURE_2D);let v=e.getExtension("EXT_texture_filter_anisotropic")||e.getExtension("MOZ_EXT_texture_filter_anisotropic")||e.getExtension("WEBKIT_EXT_texture_filter_anisotropic");if(v){let t=e.getParameter(v.MAX_TEXTURE_MAX_ANISOTROPY_EXT);e.texParameterf(e.TEXTURE_2D,v.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(16,t))}return y}get silhouetteFade(){return this._silhouetteFade}set silhouetteFade(e){this._silhouetteFade!==e&&(this._silhouetteFade=e,this._uniformsDirty=!0)}get cylinderFade(){return this._cylinderFade}set cylinderFade(e){this._cylinderFade!==e&&(this._cylinderFade=e,this._uniformsDirty=!0)}get ribbonFade(){return this._ribbonFade}set ribbonFade(e){this._ribbonFade!==e&&(this._ribbonFade=e,this._uniformsDirty=!0)}get domainWarpEnabled(){return this._domainWarpEnabled}set domainWarpEnabled(e){this._domainWarpEnabled!==e&&(this._domainWarpEnabled=e,this._uniformsDirty=!0)}get domainWarpIntensity(){return this._domainWarpIntensity}set domainWarpIntensity(e){this._domainWarpIntensity!==e&&(this._domainWarpIntensity=e,this._uniformsDirty=!0)}get domainWarpScale(){return this._domainWarpScale}set domainWarpScale(e){this._domainWarpScale!==e&&(this._domainWarpScale=e,this._uniformsDirty=!0)}get vignetteIntensity(){return this._vignetteIntensity}set vignetteIntensity(e){this._vignetteIntensity!==e&&(this._vignetteIntensity=e,this._uniformsDirty=!0)}get vignetteRadius(){return this._vignetteRadius}set vignetteRadius(e){this._vignetteRadius!==e&&(this._vignetteRadius=e,this._uniformsDirty=!0)}get fresnelEnabled(){return this._fresnelEnabled}set fresnelEnabled(e){this._fresnelEnabled!==e&&(this._fresnelEnabled=e,this._uniformsDirty=!0)}get fresnelPower(){return this._fresnelPower}set fresnelPower(e){this._fresnelPower!==e&&(this._fresnelPower=e,this._uniformsDirty=!0)}get fresnelIntensity(){return this._fresnelIntensity}set fresnelIntensity(e){this._fresnelIntensity!==e&&(this._fresnelIntensity=e,this._uniformsDirty=!0)}get fresnelColor(){return this._fresnelColor}set fresnelColor(e){this._fresnelColor!==e&&(this._fresnelColor=e,this._fresnelColorRgb=this._hexToRgb(e),this._uniformsDirty=!0)}get iridescenceEnabled(){return this._iridescenceEnabled}set iridescenceEnabled(e){this._iridescenceEnabled!==e&&(this._iridescenceEnabled=e,this._uniformsDirty=!0)}get iridescenceIntensity(){return this._iridescenceIntensity}set iridescenceIntensity(e){this._iridescenceIntensity!==e&&(this._iridescenceIntensity=e,this._uniformsDirty=!0)}get iridescenceSpeed(){return this._iridescenceSpeed}set iridescenceSpeed(e){this._iridescenceSpeed!==e&&(this._iridescenceSpeed=e,this._uniformsDirty=!0)}get bloomIntensity(){return this._bloomIntensity}set bloomIntensity(e){this._bloomIntensity!==e&&(this._bloomIntensity=e,this._uniformsDirty=!0)}get bloomThreshold(){return this._bloomThreshold}set bloomThreshold(e){this._bloomThreshold!==e&&(this._bloomThreshold=e,this._uniformsDirty=!0)}get chromaticAberration(){return this._chromaticAberration}set chromaticAberration(e){this._chromaticAberration!==e&&(this._chromaticAberration=e,this._uniformsDirty=!0)}get shapeType(){return this._shapeType}set shapeType(e){this._shapeType!==e&&(this._shapeType=e,this._updateGeometry())}get shapeRotationX(){return this._shapeRotationX}set shapeRotationX(e){this._shapeRotationX=e,this._uniformsDirty=!0}get shapeRotationY(){return this._shapeRotationY}set shapeRotationY(e){this._shapeRotationY=e,this._uniformsDirty=!0}get shapeRotationZ(){return this._shapeRotationZ}set shapeRotationZ(e){this._shapeRotationZ=e,this._uniformsDirty=!0}get shapeAutoRotateSpeedX(){return this._shapeAutoRotateSpeedX}set shapeAutoRotateSpeedX(e){this._shapeAutoRotateSpeedX=e,this._uniformsDirty=!0}get shapeAutoRotateSpeedY(){return this._shapeAutoRotateSpeedY}set shapeAutoRotateSpeedY(e){this._shapeAutoRotateSpeedY=e,this._uniformsDirty=!0}get sphereRadius(){return this._sphereRadius}set sphereRadius(e){this._sphereRadius!==e&&(this._sphereRadius=e,this._updateGeometry())}get torusRadius(){return this._torusRadius}set torusRadius(e){this._torusRadius!==e&&(this._torusRadius=e,this._updateGeometry())}get torusTube(){return this._torusTube}set torusTube(e){this._torusTube!==e&&(this._torusTube=e,this._updateGeometry())}get cylinderRadius(){return this._cylinderRadius}set cylinderRadius(e){this._cylinderRadius!==e&&(this._cylinderRadius=e,this._updateGeometry())}get cylinderHeight(){return this._cylinderHeight}set cylinderHeight(e){this._cylinderHeight!==e&&(this._cylinderHeight=e,this._updateGeometry())}get planeBend(){return this._planeBend}set planeBend(e){this._planeBend!==e&&(this._planeBend=e,this._updateGeometry())}get planeTwist(){return this._planeTwist}set planeTwist(e){this._planeTwist!==e&&(this._planeTwist=e,this._updateGeometry())}get cameraLock(){return this._cameraLock}set cameraLock(e){this._cameraLock=e}get cameraX(){return this._cameraX}set cameraX(e){this._cameraX=e,this._uniformsDirty=!0}get cameraY(){return this._cameraY}set cameraY(e){this._cameraY=e,this._uniformsDirty=!0}get cameraZ(){return this._cameraZ}set cameraZ(e){this._cameraZ=e,this._uniformsDirty=!0}get cameraRotationX(){return this._cameraRotationX}set cameraRotationX(e){this._cameraRotationX=e,this._uniformsDirty=!0}get cameraRotationY(){return this._cameraRotationY}set cameraRotationY(e){this._cameraRotationY=e,this._uniformsDirty=!0}get cameraRotationZ(){return this._cameraRotationZ}set cameraRotationZ(e){this._cameraRotationZ=e,this._uniformsDirty=!0}get cameraZoom(){return this._cameraZoom}set cameraZoom(e){this._cameraZoom!==e&&(this._cameraZoom=e,this._updateCameraFrustum())}_updateCameraFrustum(){if(!this.glState)return;let e=this.glState.gl,t=this._ref.clientWidth,i=this._ref.clientHeight;u(this.glState.camera,t,i,50,80,this._shapeType,this._cameraZoom);let r=this.glState.locations.uniforms.projectionMatrix;e.useProgram(this.glState.program),r&&e.uniformMatrix4fv(r,!1,this.glState.camera.projectionMatrix.elements),this._uniformsDirty=!0}}let g=e=>{e.id=m,e.href="https://neat.firecms.co",e.target="_blank",e.style.position="absolute",e.style.display="block",e.style.bottom="0",e.style.right="0",e.style.padding="10px",e.style.color="#dcdcdc",e.style.opacity="0.8",e.style.fontFamily="sans-serif",e.style.fontSize="16px",e.style.fontWeight="bold",e.style.textDecoration="none",e.style.zIndex="10000",e.style.pointerEvents="auto",e.setAttribute("data-n","1"),e.innerHTML="NEAT"},y=e=>{let t=e.parentElement;if(t&&"static"===getComputedStyle(t).position&&(t.style.position="relative"),t){let e=t.querySelector("a[data-n]");if(e)return g(e),e}let i=document.createElement("a");return g(i),t?.appendChild(i),i};function v(e,t){let i=document.createElement("a");i.download=t,i.href=e,document.body.appendChild(i),i.click(),document.body.removeChild(i)}}}]);