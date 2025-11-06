in vec2 vTextureCoord;

out vec4 finalColor;

struct LightData {
    vec2 pos;
    float radius;
    float brightness;
    vec3 color;
};

uniform vec2 lightPos;
uniform vec2 playerPos;
uniform sampler2D uTexture;
uniform float dpr;
uniform vec2 screen;
uniform float brightness;
uniform float radius;

vec4 col;
vec2 n;

float falloff(float d, float r) {
    float t = clamp(d / r, 0.0, 1.0);

    return pow(1.0 - t, 2.0);
}

void main() {
    col = texture(uTexture, vTextureCoord);

    vec2 tilePos = gl_FragCoord.xy - screen.xy / 2.0;

    float dist = distance(playerPos.xy, lightPos.xy - tilePos);
    float att = falloff(dist, radius) * brightness;

    vec3 outColor = col.rgb * att;

    finalColor = vec4(outColor.rgb, col.a);
}