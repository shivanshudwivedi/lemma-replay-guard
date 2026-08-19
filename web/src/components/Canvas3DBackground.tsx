import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Canvas3DBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080b11, 0.0018);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.z = 600;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 1. Particle Cloud
    const particleCount = 220;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];

    const emeraldColor = new THREE.Color(0x10b981);
    const cyanColor = new THREE.Color(0x06b6d4);
    const violetColor = new THREE.Color(0x8b5cf6);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1400;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 900;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 800;

      // Blend between emerald, cyan, and violet
      const mixedColor = new THREE.Color();
      const rand = Math.random();
      if (rand < 0.5) {
        mixedColor.lerpColors(emeraldColor, cyanColor, rand * 2);
      } else {
        mixedColor.lerpColors(cyanColor, violetColor, (rand - 0.5) * 2);
      }

      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;

      velocities.push({
        x: (Math.random() - 0.5) * 0.4,
        y: (Math.random() - 0.5) * 0.4,
        z: (Math.random() - 0.5) * 0.4,
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Material
    const pMaterial = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(geometry, pMaterial);
    scene.add(particleSystem);

    // 2. Dynamic Connection Lines
    const linesGeometry = new THREE.BufferGeometry();
    const maxLineSegments = particleCount * 6;
    const linePositions = new Float32Array(maxLineSegments * 6);
    const lineColors = new Float32Array(maxLineSegments * 6);

    linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    linesGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineSegments(
      linesGeometry,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(lineMaterial);

    // 3. Central Telemetry Core Mesh (Torus Knot Wireframe)
    const torusGeo = new THREE.TorusKnotGeometry(90, 26, 120, 16, 2, 3);
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const torusMesh = new THREE.Mesh(torusGeo, torusMat);
    torusMesh.position.set(280, 50, -100);
    scene.add(torusMesh);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onDocumentMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - windowHalfX) * 0.4;
      mouseY = (event.clientY - windowHalfY) * 0.4;
    };

    window.addEventListener('mousemove', onDocumentMouseMove);

    // Resize Handler
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onWindowResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Mouse parallax smooth lerp
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      camera.position.x = targetX * 0.8;
      camera.position.y = -targetY * 0.8;
      camera.lookAt(scene.position);

      // Rotate central telemetry torus
      torusMesh.rotation.x = time * 0.15;
      torusMesh.rotation.y = time * 0.22;

      // Update particles
      const posArray = geometry.attributes.position.array as Float32Array;
      let lineIndex = 0;

      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3] += velocities[i].x;
        posArray[i * 3 + 1] += velocities[i].y;
        posArray[i * 3 + 2] += velocities[i].z;

        // Bounce back within bounds
        if (Math.abs(posArray[i * 3]) > 700) velocities[i].x *= -1;
        if (Math.abs(posArray[i * 3 + 1]) > 450) velocities[i].y *= -1;
        if (Math.abs(posArray[i * 3 + 2]) > 400) velocities[i].z *= -1;

        // Connect nearby particles with glowing lines
        for (let j = i + 1; j < particleCount; j++) {
          const dx = posArray[i * 3] - posArray[j * 3];
          const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
          const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 130 && lineIndex < maxLineSegments) {
            const alpha = 1.0 - dist / 130;

            // Point A
            linePositions[lineIndex * 6] = posArray[i * 3];
            linePositions[lineIndex * 6 + 1] = posArray[i * 3 + 1];
            linePositions[lineIndex * 6 + 2] = posArray[i * 3 + 2];

            // Point B
            linePositions[lineIndex * 6 + 3] = posArray[j * 3];
            linePositions[lineIndex * 6 + 4] = posArray[j * 3 + 1];
            linePositions[lineIndex * 6 + 5] = posArray[j * 3 + 2];

            // Color gradient
            lineColors[lineIndex * 6] = 0.06;
            lineColors[lineIndex * 6 + 1] = 0.72 * alpha;
            lineColors[lineIndex * 6 + 2] = 0.83 * alpha;

            lineColors[lineIndex * 6 + 3] = 0.1 * alpha;
            lineColors[lineIndex * 6 + 4] = 0.8 * alpha;
            lineColors[lineIndex * 6 + 5] = 0.5 * alpha;

            lineIndex++;
          }
        }
      }

      geometry.attributes.position.needsUpdate = true;
      linesGeometry.setDrawRange(0, lineIndex * 2);
      linesGeometry.attributes.position.needsUpdate = true;
      linesGeometry.attributes.color.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onDocumentMouseMove);
      window.removeEventListener('resize', onWindowResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      linesGeometry.dispose();
      pMaterial.dispose();
      torusGeo.dispose();
      torusMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-70"
      style={{ background: 'radial-gradient(ellipse at 50% 20%, #0d1527 0%, #080b11 75%)' }}
    />
  );
};
