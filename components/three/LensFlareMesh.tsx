"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { lensFlareFragment, lensFlareVertex } from "./lensFlareShader";
import type { DeviceTier } from "@/lib/motion/useDeviceTier";

type Props = {
  tier: Exclude<DeviceTier, "static">;
  warpRef: React.MutableRefObject<number>;
};

export function LensFlareMesh({ tier, warpRef }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uWarp: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size.width, size.height, uniforms.uResolution]);

  const fragment = useMemo(
    () => (tier === "low" ? `#define LOW_TIER\n${lensFlareFragment}` : lensFlareFragment),
    [tier],
  );

  useFrame(() => {
    uniforms.uWarp.value = warpRef.current;
  });

  return (
    <mesh frustumCulled={false} renderOrder={2}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={lensFlareVertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
