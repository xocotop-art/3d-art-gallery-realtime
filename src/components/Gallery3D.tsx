import { Suspense, useEffect, Component, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, PerspectiveCamera, KeyboardControls, useKeyboardControls, ContactShadows, Sparkles, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { Player3D } from './Player3D';
import { Artwork3D } from './Artwork3D';

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'shift', keys: ['ShiftLeft', 'ShiftRight'] },
];

class CanvasErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { if (this.state.hasError) return this.props.fallback ?? null; return this.props.children; }
}

function MovementController() {
  const { camera, gl } = useThree();
  const [, getKeys] = useKeyboardControls();
  const updatePosition = useStore(state => state.updatePosition);
  const currentUser = useStore(state => state.currentUser);
  const rotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const [zoom, setZoom] = useState(60);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.buttons === 1) {
        rotation.current.y -= e.movementX * 0.003;
        rotation.current.x -= e.movementY * 0.003;
        rotation.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotation.current.x));
      }
    };
    gl.domElement.addEventListener('mousemove', handleMouseMove);
    return () => gl.domElement.removeEventListener('mousemove', handleMouseMove);
  }, [gl]);

  useFrame((state, delta) => {
    const targetZoom = currentUser.artwork_id ? 45 : zoom;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetZoom, 0.08);
      camera.updateProjectionMatrix();
    }
    const keys = getKeys();
    const direction = new THREE.Vector3();
    if (keys.forward) direction.z -= 1;
    if (keys.backward) direction.z += 1;
    if (keys.left) direction.x -= 1;
    if (keys.right) direction.x += 1;
    if (direction.length() > 0) {
      const speed = keys.shift ? 8 : 4;
      const moveVector = direction.normalize().multiplyScalar(speed * delta).applyEuler(new THREE.Euler(0, rotation.current.y, 0));
      camera.position.add(moveVector);
    }
    camera.quaternion.setFromEuler(rotation.current);
    state.raycaster.setFromCamera({ x: 0, y: 0 }, state.camera);
    camera.position.x = Math.max(-14, Math.min(14, camera.position.x));
    camera.position.z = Math.max(-4.5, Math.min(24, camera.position.z));
    camera.position.y = 1.7;
    if (currentUser.id) updatePosition(camera.position.x, camera.position.y, camera.position.z, rotation.current.y);
  });
  return null;
}

function GalleryScene() {
  const artworks = useStore(state => state.artworks);
  const players = useStore(state => state.players);
  const currentUser = useStore(state => state.currentUser);
  const setViewingArtwork = useStore(state => state.setViewingArtwork);
  const currentArtwork = artworks.find(a => a.id === currentUser.artwork_id);
  const leaveTimer = useRef<any>(null);
  const handleView = (id: string) => { if (leaveTimer.current) clearTimeout(leaveTimer.current); setViewingArtwork(id); };
  const handleLeave = () => { if (leaveTimer.current) clearTimeout(leaveTimer.current); leaveTimer.current = setTimeout(() => setViewingArtwork(null), 1000); };

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.6, 5]} fov={60} />
      <MovementController />
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 10, 0]} intensity={0.5} distance={50} castShadow />
      <directionalLight position={[5, 10, 5]} intensity={0.5} castShadow />
      {currentArtwork && (
        <spotLight position={[currentArtwork.x, 8, currentArtwork.z + 4]} target-position={[currentArtwork.x, currentArtwork.y, currentArtwork.z]} intensity={50} angle={0.4} penumbra={1} distance={15} castShadow />
      )}
      <Suspense fallback={null}><Environment preset="city" blur={1} /></Suspense>
      <Sparkles count={200} scale={[30, 10, 30]} size={2} speed={0.3} opacity={0.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <MeshReflectorMaterial blur={[300, 100]} resolution={1024} mixBlur={1} mixStrength={40} roughness={1} depthScale={1.2} color="#151515" metalness={0.5} mirror={1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 12, 0]} receiveShadow><planeGeometry args={[100, 100]} /><meshStandardMaterial color="#ffffff" /></mesh>
      <mesh position={[0, 6, -5.1]} receiveShadow><boxGeometry args={[60, 12, 0.2]} /><meshStandardMaterial color="#f5f5f5" /></mesh>
      {artworks.map(art => <Artwork3D key={art.id} artwork={art} onView={handleView} onLeave={handleLeave} />)}
      {Object.values(players).map(player => <Player3D key={player.id} player={player} />)}
    </>
  );
}

export function Gallery3D() {
  const fetchArtworks = useStore(state => state.fetchArtworks);
  useEffect(() => { fetchArtworks(); }, [fetchArtworks]);
  return (
    <KeyboardControls map={keyboardMap}>
      <CanvasErrorBoundary fallback={<div className="loading">Cargando galería...</div>}>
        <Canvas shadows gl={{ antialias: true, alpha: false }}><GalleryScene /></Canvas>
      </CanvasErrorBoundary>
    </KeyboardControls>
  );
}
