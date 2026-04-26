import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Player } from '../lib/supabase';

interface Player3DProps { player: Player; }

export function Player3D({ player }: Player3DProps) {
  const group = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(player?.x || 0, player?.y || 1.6, player?.z || 0));

  useEffect(() => {
    if (player) targetPos.current.set(player.x, player.y, player.z);
  }, [player?.x, player?.y, player?.z]);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.position.lerp(targetPos.current, Math.min(1, delta * 10));
      group.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.001;
      group.current.rotation.y += delta * 0.5;
    }
  });

  if (!player) return null;

  return (
    <group ref={group}>
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <capsuleGeometry args={[0.3, 0.6, 16, 16]} />
        <meshStandardMaterial color={player.color || '#ffffff'} roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.3, 0.2]}>
        <boxGeometry args={[0.4, 0.1, 0.1]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>
      <Text position={[0, 1.3, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="rgba(0,0,0,0.5)">
        {player.name}
        <meshBasicMaterial attach="material" depthTest={false} />
      </Text>
      {player.reaction && (
        <Text position={[0, 1.8, 0]} fontSize={0.5} anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="black">
          {player.reaction}
          <meshBasicMaterial attach="material" depthTest={false} />
        </Text>
      )}
    </group>
  );
}
