import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Ease in-out cubic helper
function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  uniform float uTime;
  uniform float uWobble;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    // Organic surface pulsation with gentle undulating waves
    float displacement = (
      sin(position.x * 2.2 + uTime * 1.2) * 0.04 +
      cos(position.y * 2.4 + uTime * 1.5) * 0.04 +
      sin(position.z * 2.0 + uTime * 0.9) * 0.03
    ) * uWobble;
    
    vec3 newPosition = position + normal * displacement;
    vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  uniform float uTime;
  uniform vec3 uColorCyan;
  uniform vec3 uColorLila;
  uniform vec3 uColorMint;
  uniform float uAlpha;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float NdotV = max(dot(vNormal, viewDir), 0.0);
    
    // Fresnel iridescence effect: grazing angles glow softly
    float fresnel = pow(1.0 - NdotV, 2.4);
    
    // Gradient between brand cyan (#00BCC8) and brand lila (#6857E4)
    float blend = sin(vPosition.y * 2.0 + uTime * 0.7) * 0.5 + 0.5;
    vec3 baseColor = mix(uColorCyan, uColorLila, blend);
    
    // Pearlescent highlights at edges
    vec3 rimHighlight = mix(uColorLila, uColorMint, sin(uTime * 0.9 + fresnel * 3.14159) * 0.5 + 0.5);
    vec3 finalColor = mix(baseColor, rimHighlight, fresnel * 0.75);
    
    // Translucency: softer in the center, denser at rim
    float alpha = uAlpha * (0.35 + fresnel * 0.58);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

function OrganicSphereMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWobble: { value: 0.5 },
      uAlpha: { value: 0.92 },
      uColorCyan: { value: new THREE.Color("#00BCC8") },
      uColorLila: { value: new THREE.Color("#6857E4") },
      uColorMint: { value: new THREE.Color("#A9DB1B") },
    }),
    [],
  );

  useFrame(({ clock }) => {
    const totalCycle = 19.0;
    const elapsed = clock.getElapsedTime();
    const t = elapsed % totalCycle;

    let targetScale = 0.85;
    let wobble = 0.4;

    if (t < 4.0) {
      // Inhale (0s to 4s: expands)
      const progress = easeInOutCubic(t / 4.0);
      targetScale = 0.85 + (1.32 - 0.85) * progress;
      wobble = 0.4 + 0.6 * progress;
    } else if (t < 11.0) {
      // Hold (4s to 11s: 7 seconds with living micro-oscillation)
      const holdTime = t - 4.0;
      // Micro-oscillation viva (subtle breathing tremor / heartbeat rhythm)
      const microPulse = Math.sin(holdTime * Math.PI * 2 * 0.85) * 0.022;
      targetScale = 1.32 + microPulse;
      wobble = 1.0 + Math.sin(holdTime * 2.8) * 0.22;
    } else {
      // Exhale (11s to 19s: 8 seconds contract)
      const progress = easeInOutCubic((t - 11.0) / 8.0);
      targetScale = 1.32 - (1.32 - 0.85) * progress;
      wobble = 1.0 - 0.6 * progress;
    }

    if (meshRef.current) {
      meshRef.current.scale.set(targetScale, targetScale, targetScale);
      meshRef.current.rotation.y = elapsed * 0.12;
      meshRef.current.rotation.x = elapsed * 0.08;
    }

    if (coreRef.current) {
      const coreScale = targetScale * 0.65;
      coreRef.current.scale.set(coreScale, coreScale, coreScale);
      coreRef.current.rotation.y = -elapsed * 0.16;
    }

    if (materialRef.current?.uniforms) {
      const uTime = materialRef.current.uniforms["uTime"];
      if (uTime) uTime.value = elapsed;
      const uWobble = materialRef.current.uniforms["uWobble"];
      if (uWobble) uWobble.value = wobble;
    }
  });

  return (
    <group>
      {/* Outer organic iridescent sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.15, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner luminous soft core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial
          color="#00BCC8"
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default function BreathingSphere3D() {
  return (
    <div className="relative size-44 sm:size-52 flex items-center justify-center">
      <Canvas
        camera={{ position: [0, 0, 3.6], fov: 45 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
        className="pointer-events-none"
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[2, 3, 2]} intensity={0.8} />
        <pointLight position={[-2, -2, -1]} color="#00BCC8" intensity={0.6} />
        <pointLight position={[2, -1, 1]} color="#6857E4" intensity={0.5} />
        <OrganicSphereMesh />
      </Canvas>
    </div>
  );
}
