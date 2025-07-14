import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedStars() {
  const ref = useRef<THREE.Points>(null);
  
  const [sphere] = useMemo(() => {
    const sphere = new Float32Array(5000);
    for (let i = 0; i < 5000; i++) {
      // Use more conservative random values to avoid edge cases
      const radius = 4 + Math.random() * 16; // Reduced from 20 to 16
      const theta = Math.random() * Math.PI * 2;
      
      // Ensure phi is in valid range for acos
      const randomValue = Math.max(-1, Math.min(1, Math.random() * 2 - 1));
      const phi = Math.acos(randomValue);
      
      let x = radius * Math.sin(phi) * Math.cos(theta);
      let y = radius * Math.sin(phi) * Math.sin(theta);
      let z = radius * Math.cos(phi);
      
      // Additional validation and fallbacks
      if (!isFinite(x) || isNaN(x)) x = (Math.random() - 0.5) * 10;
      if (!isFinite(y) || isNaN(y)) y = (Math.random() - 0.5) * 10;
      if (!isFinite(z) || isNaN(z)) z = (Math.random() - 0.5) * 10;
      
      sphere[i * 3] = x;
      sphere[i * 3 + 1] = y;
      sphere[i * 3 + 2] = z;
    }
    return [sphere];
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#ffffff"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.8}
        />
      </Points>
    </group>
  );
}

function FloatingOrbs() {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
    }
  });

  return (
    <group ref={ref}>
      {Array.from({ length: 8 }, (_, i) => {
        const angle1 = (i / 8) * Math.PI * 2;
        const angle2 = (i / 8) * Math.PI * 4;
        
        let x = Math.sin(angle1) * 5;
        let y = Math.cos(angle1) * 2;
        let z = Math.sin(angle2) * 3;
        
        // Ensure all position values are finite
        if (!isFinite(x)) x = 0;
        if (!isFinite(y)) y = 0;
        if (!isFinite(z)) z = 0;
        
        return (
          <FloatingOrb key={i} position={[x, y, z]} />
        );
      })}
    </group>
  );
}

function FloatingOrb({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);
  
  useFrame((state) => {
    if (ref.current && state.clock && isFinite(state.clock.elapsedTime)) {
      const timeOffset = isFinite(position[0]) ? position[0] : 0;
      const yOffset = Math.sin(state.clock.elapsedTime + timeOffset) * 0.01;
      
      if (isFinite(yOffset)) {
        ref.current.position.y += yOffset;
      }
      
      ref.current.rotation.x += 0.01;
      ref.current.rotation.y += 0.01;
      
      const scaleValue = hovered ? 1.2 : 1;
      if (isFinite(scaleValue)) {
        ref.current.scale.setScalar(scaleValue);
      }
    }
  });

  return (
    <Sphere
      ref={ref}
      position={position}
      args={[0.2, 32, 32]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial
        color={hovered ? "#60a5fa" : "#3b82f6"}
        transparent
        opacity={0.3}
        emissive={hovered ? "#60a5fa" : "#1e40af"}
        emissiveIntensity={0.2}
      />
    </Sphere>
  );
}

function NetworkNodes() {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const nodes = useMemo(() => {
    const nodePositions = [];
    for (let i = 0; i < 15; i++) {
      nodePositions.push([
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      ]);
    }
    return nodePositions;
  }, []);

  return (
    <group ref={ref}>
      {nodes.map((position, index) => (
        <Sphere key={index} position={position as [number, number, number]} args={[0.08, 16, 16]}>
          <meshBasicMaterial color="#64ffda" transparent opacity={0.4} />
        </Sphere>
      ))}
    </group>
  );
}

function PulsatingRings() {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current && state.clock && isFinite(state.clock.elapsedTime)) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      const rotation = state.clock.elapsedTime * 0.5;
      
      if (isFinite(scale)) {
        ref.current.scale.setScalar(scale);
      }
      
      if (isFinite(rotation)) {
        ref.current.rotation.z = rotation;
      }
    }
  });

  return (
    <group ref={ref}>
      {[1, 2, 3].map((ring, index) => (
        <mesh key={index} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[ring * 2, ring * 2.1, 64]} />
          <meshBasicMaterial
            color="#7c3aed"
            transparent
            opacity={0.1 - index * 0.02}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export function ThreeBackground() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#7c3aed" />
        
        <AnimatedStars />
        <FloatingOrbs />
        <NetworkNodes />
        <PulsatingRings />
      </Canvas>
    </div>
  );
} 