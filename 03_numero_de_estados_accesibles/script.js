document.addEventListener('DOMContentLoaded', () => {
    // --- Constantes Físicas (normalizadas para la visualización) ---
    const hbar = 1;
    const m = 1;
    const pi = Math.PI;

    // --- Configuración de la Escena 3D ---
    const canvas = document.getElementById('quantum-canvas');
    const viewer = document.getElementById('viewer');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(75, viewer.clientWidth / viewer.clientHeight, 0.1, 5000);
    camera.position.set(40, 40, 40);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(viewer.clientWidth, viewer.clientHeight);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // --- Elementos de la UI ---
    const energySlider = document.getElementById('energy-slider');
    const lengthSlider = document.getElementById('length-slider');
    const energyShellSlider = document.getElementById('energy-shell-slider');
    const energyValueSpan = document.getElementById('energy-value');
    const lengthValueSpan = document.getElementById('length-value');
    const energyShellValueSpan = document.getElementById('energy-shell-value');
    const accessibleStatesSpan = document.getElementById('accessible-states');
    const analyticalStatesSpan = document.getElementById('analytical-states');
    const differencePercentageSpan = document.getElementById('difference-percentage');

    // --- Objetos de la Escena ---
    let outerShell, innerShell, visiblePoints;
    const axesHelper = new THREE.AxesHelper(200);
    scene.add(axesHelper);

    let masterPointPositions;
    function generateMasterPointGrid(maxN) {
        console.log(`Generando una cuadrícula maestra de ${maxN}x${maxN}x${maxN} puntos...`);
        const positions = [];
        for (let nx = 1; nx <= maxN; nx++) {
            for (let ny = 1; ny <= maxN; ny++) {
                for (let nz = 1; nz <= maxN; nz++) {
                    positions.push(nx, ny, nz);
                }
            }
        }
        masterPointPositions = new Float32Array(positions);
        console.log("Cuadrícula generada.");
    }

    function updateVisualization() {
        const E = parseFloat(energySlider.value);
        const L = parseFloat(lengthSlider.value);
        const dE = parseFloat(energyShellSlider.value);
        const E_inner = Math.max(0, E - dE);

        energyValueSpan.textContent = E.toFixed(0);
        lengthValueSpan.textContent = L.toFixed(0);
        energyShellValueSpan.textContent = dE.toFixed(0);
        
        const energyToRSquared = (energy) => (2 * m * L * L * energy) / (hbar * hbar * pi * pi);
        
        const R = Math.sqrt(energyToRSquared(E));
        const R_inner = Math.sqrt(energyToRSquared(E_inner));

        if (outerShell) scene.remove(outerShell);
        if (innerShell) scene.remove(innerShell);
        if (visiblePoints) scene.remove(visiblePoints);

        const shellMaterialOuter = new THREE.MeshBasicMaterial({ color: 0xd9534f, wireframe: true, transparent: true, opacity: 0.7 });
        const shellMaterialInner = new THREE.MeshBasicMaterial({ color: 0x0056b3, wireframe: true, transparent: true, opacity: 0.5 });
        
        const outerGeometry = new THREE.SphereGeometry(R, 32, 32, 0, Math.PI / 2, 0, Math.PI / 2);
        outerShell = new THREE.Mesh(outerGeometry, shellMaterialOuter);
        scene.add(outerShell);
        
        if (R_inner > 0) {
            const innerGeometry = new THREE.SphereGeometry(R_inner, 32, 32, 0, Math.PI / 2, 0, Math.PI / 2);
            innerShell = new THREE.Mesh(innerGeometry, shellMaterialInner);
            scene.add(innerShell);
        }

        const pointsToShow = [];
        let omegaCount = 0;
        for (let i = 0; i < masterPointPositions.length; i += 3) {
            const nx = masterPointPositions[i];
            const ny = masterPointPositions[i + 1];
            const nz = masterPointPositions[i + 2];
            const r_state_sq = nx * nx + ny * ny + nz * nz;

            if (r_state_sq <= R * R && r_state_sq > R_inner * R_inner) {
                pointsToShow.push(nx, ny, nz);
                omegaCount++;
            }
        }

        if (pointsToShow.length > 0) {
            const pointsGeometry = new THREE.BufferGeometry();
            pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsToShow, 3));
            const pointsMaterial = new THREE.PointsMaterial({ color: 0x000000, size: 0.5 });
            
            // --- ¡AQUÍ ESTABA EL ERROR! ---
            // Se usaba `material` en lugar de `pointsMaterial`.
            // visiblePoints = new THREE.Points(pointsGeometry, material); // Incorrecto
            visiblePoints = new THREE.Points(pointsGeometry, pointsMaterial); // Correcto
            
            scene.add(visiblePoints);
        }

        const constantFactor = (Math.pow(2 * m, 1.5) * Math.pow(L, 3)) / (4 * Math.pow(hbar, 3) * pi * pi);
        const g_E = constantFactor * Math.sqrt(E);
        const omegaAnalytical = g_E * dE;
        
        let differenceString = "N/A";
        if (omegaAnalytical > 0.01) {
            const difference = ((omegaCount - omegaAnalytical) / omegaAnalytical) * 100;
            differenceString = `${difference.toFixed(1)}%`;
        }
        
        accessibleStatesSpan.textContent = omegaCount;
        analyticalStatesSpan.textContent = omegaAnalytical.toFixed(1);
        differencePercentageSpan.textContent = differenceString;

        controls.target.set(R / 2, R / 2, R / 2);
    }

    energySlider.addEventListener('input', updateVisualization);
    lengthSlider.addEventListener('input', updateVisualization);
    energyShellSlider.addEventListener('input', updateVisualization);

    window.addEventListener('resize', () => {
        camera.aspect = viewer.clientWidth / viewer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(viewer.clientWidth, viewer.clientHeight);
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    
    generateMasterPointGrid(150);
    updateVisualization();
    camera.lookAt(controls.target);
    animate();
});