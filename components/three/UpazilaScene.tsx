"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

// Stylized low-poly terrain + river + market stalls, per DESIGN.md's "3D Language":
// simplified geometry, warm daylight lighting, slow ambient camera orbit — no
// photorealism, no fast cuts.

function Terrain() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20, 1, 1]} />
      <meshStandardMaterial color="#1a685e" />
    </mesh>
  );
}

function River() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0.35]} position={[0, 0.01, 0]}>
      <planeGeometry args={[3, 22]} />
      <meshStandardMaterial color="#83d7b4" transparent opacity={0.85} />
    </mesh>
  );
}

function Building({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={[position[0], position[1] + size[1] / 2, position[2]]} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function MarketStall({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.5, 0.6, 0.5]} />
        <meshStandardMaterial color="#fdbc13" />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <coneGeometry args={[0.5, 0.3, 4]} />
        <meshStandardMaterial color="#00503a" />
      </mesh>
    </group>
  );
}

function OrbitingScene() {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Slow, gentle ambient rotation — ~48s per revolution, never a fast cut.
      groupRef.current.rotation.y += delta * 0.13;
    }
  });

  return (
    <group ref={groupRef}>
      <Terrain />
      <River />
      <Building position={[-2.5, 0, -1]} size={[1, 1.2, 1]} color="#f8f9ff" />
      <Building position={[-1.2, 0, -2]} size={[0.8, 0.8, 0.8]} color="#e5eeff" />
      <Building position={[2.2, 0, 1.5]} size={[1.1, 1.6, 1.1]} color="#f8f9ff" />
      <Building position={[3.3, 0, 0.3]} size={[0.7, 1, 0.7]} color="#dce9ff" />
      <MarketStall position={[0.8, 0, 2.2]} />
      <MarketStall position={[1.6, 0, 2.6]} />
    </group>
  );
}

export function UpazilaScene() {
  return (
    <Canvas
      shadows="basic"
      dpr={[1, 1.5]}
      camera={{ position: [6, 5, 8], fov: 40 }}
      gl={{ antialias: true }}
    >
      {/* Warm daylight lighting, per DESIGN.md — avoid cold/blue "sci-fi" tones. */}
      <ambientLight intensity={0.7} color="#fff4d6" />
      <directionalLight position={[5, 8, 3]} intensity={1.2} color="#ffe8b0" castShadow />
      <OrbitingScene />
    </Canvas>
  );
}
