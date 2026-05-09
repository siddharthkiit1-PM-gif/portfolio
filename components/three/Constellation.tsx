"use client";

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { DeviceTier } from "@/lib/motion/useDeviceTier";

// Normalized canvas-space points (-1..1 horizontal, -1..1 vertical).
// Peak at (0, +0.20) sits just above the chrome silhouette.
export const CONSTELLATION_POINTS_HIGH: ReadonlyArray<readonly [number, number]> = [
  [-0.55, -0.20],
  [-0.35, -0.05],
  [-0.15, -0.18],
  [ 0.00, +0.20],
  [+0.18, +0.05],
  [+0.38, +0.12],
  [+0.58,  0.00],
];

// Low tier drops the two innermost points to reduce vertices.
export const CONSTELLATION_POINTS_LOW: ReadonlyArray<readonly [number, number]> = [
  [-0.55, -0.20],
  [-0.15, -0.18],
  [ 0.00, +0.20],
  [+0.38, +0.12],
  [+0.58,  0.00],
];

// 0 below 0.85, ramps via smoothstep to 1 at 0.95, holds.
export function drawProgress(uWarp: number): number {
  const t = (uWarp - 0.85) / 0.10;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * (3 - 2 * t); // smoothstep
}

const COLOR = "#cfe1ff";
const VIEW_WIDTH_NDC = 1.6;
const VIEW_HEIGHT_NDC = 1.0;

type Props = {
  tier: Exclude<DeviceTier, "static">;
  warpRef: React.MutableRefObject<number>;
};

function pointsToWorld(
  pts: ReadonlyArray<readonly [number, number]>,
  viewW: number,
  viewH: number,
): THREE.Vector3[] {
  const halfW = viewW / 2;
  const halfH = viewH / 2;
  return pts.map(([x, y]) => new THREE.Vector3(x * halfW, y * halfH, 0));
}

export function Constellation({ tier, warpRef }: Props) {
  const points = tier === "low" ? CONSTELLATION_POINTS_LOW : CONSTELLATION_POINTS_HIGH;
  const { viewport } = useThree();

  const worldPoints = useMemo(
    () => pointsToWorld(points, VIEW_WIDTH_NDC * viewport.width, VIEW_HEIGHT_NDC * viewport.height),
    [points, viewport.width, viewport.height],
  );

  const drawLineRef = useRef<THREE.Group>(null);
  const pulseLineRef = useRef<THREE.Group>(null);
  const spritesRef = useRef<THREE.Group>(null);
  const pulseTimeRef = useRef(0);

  useFrame((_, dt) => {
    const w = warpRef.current;
    const p = drawProgress(w);

    // Draw-in line: dashOffset moves from 1 → 0 as p goes 0 → 1.
    if (drawLineRef.current) {
      const mat = (drawLineRef.current.children[0] as THREE.Mesh | undefined)
        ?.material as THREE.ShaderMaterial | undefined;
      if (mat?.uniforms?.dashOffset) {
        mat.uniforms.dashOffset.value = 1 - p;
      }
    }

    // Endpoint sprite brightness: 0.35 + 0.65 * smoothstep(flareGain).
    const flareGainRaw = Math.max(0, Math.min(1, (w - 0.85) / 0.10));
    const flareGain = flareGainRaw * flareGainRaw * (3 - 2 * flareGainRaw);
    if (spritesRef.current) {
      for (const child of spritesRef.current.children) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.35 + 0.65 * flareGain;
      }
    }

    // Traveling pulse: high tier only; advance dashOffset on a 3s loop.
    if (tier === "high" && pulseLineRef.current) {
      pulseTimeRef.current += dt;
      const phase = (pulseTimeRef.current % 3) / 3;
      const mat = (pulseLineRef.current.children[0] as THREE.Mesh | undefined)
        ?.material as THREE.ShaderMaterial | undefined;
      if (mat?.uniforms?.dashOffset) {
        mat.uniforms.dashOffset.value = -phase;
      }
      pulseLineRef.current.visible = p >= 1;
    }
  });

  return (
    <group position={[0, 0, 0.5]} renderOrder={3}>
      {/* Draw-in stroke. */}
      <group ref={drawLineRef}>
        <Line
          points={worldPoints}
          color={COLOR}
          lineWidth={1.4}
          dashed
          dashScale={1}
          dashSize={1}
          gapSize={0}
          dashOffset={1}
          transparent
          opacity={0.85}
        />
      </group>

      {/* Traveling pulse (high tier). */}
      {tier === "high" && (
        <group ref={pulseLineRef} visible={false}>
          <Line
            points={worldPoints}
            color={COLOR}
            lineWidth={2.0}
            dashed
            dashScale={20}
            dashSize={0.05}
            gapSize={0.95}
            dashOffset={0}
            transparent
            opacity={0.35}
          />
        </group>
      )}

      {/* Endpoint sprites — small dots. */}
      <group ref={spritesRef}>
        {worldPoints.map((pt, i) => (
          <mesh key={i} position={pt}>
            <circleGeometry args={[0.04, 12]} />
            <meshBasicMaterial color={COLOR} transparent opacity={0.35} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
