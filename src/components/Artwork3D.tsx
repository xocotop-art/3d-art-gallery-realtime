import { useRef, Suspense, useState, useEffect } from 'react';
import { useTexture, Text, useVideoTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import type { Artwork } from '../lib/supabase';

function MediaContent({ artwork, onAspect }: { artwork: Artwork, onAspect: (a: number) => void }) {
  const isVideo = artwork.image_url.toLowerCase().endsWith('.mp4');
  const isGif = artwork.image_url.toLowerCase().endsWith('.gif');
  if (isVideo) {
    const videoTexture = useVideoTexture(artwork.image_url, { unsuspend: 'canplay', loop: true, muted: true, start: true });
    useEffect(() => {
      if (videoTexture) { videoTexture.minFilter = videoTexture.magFilter = THREE.LinearFilter; videoTexture.generateMipmaps = false; }
      const video = videoTexture.image as HTMLVideoElement;
      if (video?.videoWidth) onAspect(video.videoWidth / video.videoHeight);
    }, [videoTexture, onAspect]);
    return <meshStandardMaterial map={videoTexture} roughness={0.3} metalness={0.1} />;
  }
  if (isGif) {
    return <Html transform distanceFactor={3} position={[0, 0, 0.02]} pointerEvents="none"><img src={artwork.image_url} style={{ width: '300px', height: 'auto' }} alt={artwork.title} /></Html>;
  }
  const texture = useTexture(artwork.image_url, (t) => { if (t.image) onAspect(t.image.width / t.image.height); });
  return <meshStandardMaterial map={texture} roughness={0.4} />;
}

function ArtworkMesh({ artwork, onView, onLeave }: { artwork: Artwork, onView: (id: string) => void, onLeave: () => void }) {
  const [hovered, setHovered] = useState(false);
  const teleportTo = useStore(state => state.teleportTo);
  const [aspect, setAspect] = useState(1.5);
  const width = 3;
  const height = width / aspect;

  return (
    <group position={[artwork.x, artwork.y + 1.2, artwork.z]} rotation={[0, artwork.rotation_y || 0, 0]}>
      <group position={[0, 0, 0.15]} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onView(artwork.id); }} onPointerOut={() => { setHovered(false); onLeave(); }} onClick={(e) => { e.stopPropagation(); teleportTo(artwork.x, 1.7, artwork.z + 5); }}>
        <mesh position={[0, 0, -0.06]} castShadow><boxGeometry args={[width + 0.3, height + 0.3, 0.12]} /><meshStandardMaterial color={hovered ? "#3b82f6" : "#111"} metalness={0.9} roughness={0.1} /></mesh>
        <mesh position={[0, 0, 0.01]} receiveShadow><planeGeometry args={[width, height]} /><MediaContent artwork={artwork} onAspect={setAspect} /></mesh>
      </group>
      <Text position={[0, -height / 2 - 0.5, 0.05]} fontSize={0.18} color="white" textAlign="center">{`${artwork.title}\n${artwork.artist}`}</Text>
    </group>
  );
}

export function Artwork3D(props: any) {
  return <Suspense fallback={null}><ArtworkMesh {...props} /></Suspense>;
}
