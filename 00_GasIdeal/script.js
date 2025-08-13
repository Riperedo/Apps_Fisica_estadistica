document.addEventListener('DOMContentLoaded', function () {
    const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

    // --- Elementos del DOM ---
    const particleCountInput = document.getElementById('particleCount');
    const temperatureInput = document.getElementById('temperature');
    const pistonPositionInput = document.getElementById('pistonPosition');
    const restartButton = document.getElementById('restartButton');
    const particleCountValue = document.getElementById('particleCountValue');
    const temperatureValue = document.getElementById('temperatureValue');
    const pistonPositionValue = document.getElementById('pistonPositionValue');
    // NUEVOS ELEMENTOS PARA ESTADÍSTICAS
    const meanValueSpan = document.getElementById('meanValue');
    const varianceValueSpan = document.getElementById('varianceValue');

    const simulationCanvas = document.getElementById('simulationCanvas');
    const pressureCanvas = document.getElementById('pressureChart');
    const width = 600, height = 500;
    simulationCanvas.width = width; simulationCanvas.height = height;

    // --- Variables Globales de Simulación ---
    let engine, render, runner, pressureChart;
    let pressureData = [], timeLabels = [];
    let momentumTransfer = 0, frameCounter = 0;
    // NUEVA VARIABLE PARA HISTORIAL DE ESTADÍSTICAS
    let pressureHistoryForStats = [];

    // --- FUNCIONES DE ESTADÍSTICAS ---
    function resetStats() {
        pressureHistoryForStats = [];
        meanValueSpan.textContent = 'N/A';
        varianceValueSpan.textContent = 'N/A';
    }

    function calculateAndDisplayStats() {
        const n = pressureHistoryForStats.length;
        if (n < 2) return; // Necesitamos al menos 2 puntos para calcular la varianza

        // Calcular Valor Medio (μ)
        const sum = pressureHistoryForStats.reduce((a, b) => a + b, 0);
        const mean = sum / n;

        // Calcular Varianza (σ²)
        const variance = pressureHistoryForStats.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;

        // Mostrar valores
        meanValueSpan.textContent = mean.toFixed(3);
        varianceValueSpan.textContent = variance.toFixed(3);
    }

    function initSimulation() {
        if (runner) {
            Runner.stop(runner); Events.off(runner, 'tick', updateChart);
            World.clear(engine.world); Engine.clear(engine);
            render.canvas.remove(); render.textures = {};
        }

        resetStats(); // Reiniciar estadísticas al iniciar una nueva simulación

        engine = Engine.create({ enableSleeping: false }); engine.world.gravity.y = 0;
        render = Render.create({ canvas: simulationCanvas, engine: engine, options: { width: width, height: height, wireframes: false, background: '#f8f9fa' } });
        
        const wallOptions = { isStatic: true, restitution: 1, friction: 0, frictionStatic: 0 };
        const piston = Bodies.rectangle(parseInt(pistonPositionInput.value), height / 2, 50, height, { ...wallOptions, label: 'piston' });
        const walls = [
            Bodies.rectangle(width / 2, 0, width, 50, { ...wallOptions, label: 'wall_top' }),
            Bodies.rectangle(width / 2, height, width, 50, { ...wallOptions, label: 'wall_bottom' }),
            Bodies.rectangle(0, height / 2, 50, height, { ...wallOptions, label: 'wall_left' })
        ];
        World.add(engine.world, [...walls, piston]);
        
        const numParticles = parseInt(particleCountInput.value);
        const targetSpeed = parseInt(temperatureInput.value);
        const particles = [];
        for (let i = 0; i < numParticles; i++) {
            const particle = Bodies.circle(Math.random() * (piston.position.x - 50) + 25, Math.random() * (height - 50) + 25, 5, {
                restitution: 1, friction: 0, frictionAir: 0, frictionStatic: 0, inertia: Infinity, collisionFilter: { group: -1 }, render: { fillStyle: '#007bff' }
            });
            let randomAngle = Math.random() * 2 * Math.PI;
            Body.setVelocity(particle, { x: Math.cos(randomAngle) * targetSpeed, y: Math.sin(randomAngle) * targetSpeed });
            particles.push(particle);
        }
        World.add(engine.world, particles);

        runner = Runner.create(); Runner.run(runner, engine); Render.run(render);
        resetAndInitChart();
        
        Events.on(engine, 'collisionStart', function(event) {
            const targetSpeed = parseInt(temperatureInput.value);
            if (targetSpeed <= 0) return;
            event.pairs.forEach(pair => {
                let staticBody, particle;
                if (pair.bodyA.isStatic) { staticBody = pair.bodyA; particle = pair.bodyB; }
                else if (pair.bodyB.isStatic) { staticBody = pair.bodyB; particle = pair.bodyA; }
                else { return; }
                let vx, vy;
                if (staticBody.label === 'piston') {
                    momentumTransfer += 2 * Math.abs(particle.velocity.x);
                    vx = -Math.random(); vy = (Math.random() - 0.5) * 2;
                } else if (staticBody.label.startsWith('wall')) {
                    if (staticBody.label === 'wall_left') { vx = Math.random(); vy = (Math.random() - 0.5) * 2; }
                    else if (staticBody.label === 'wall_top') { vx = (Math.random() - 0.5) * 2; vy = Math.random(); }
                    else if (staticBody.label === 'wall_bottom') { vx = (Math.random() - 0.5) * 2; vy = -Math.random(); }
                } else { return; }
                const magnitude = Math.sqrt(vx * vx + vy * vy);
                Body.setVelocity(particle, { x: (vx / magnitude) * targetSpeed, y: (vy / magnitude) * targetSpeed });
            });
        });
        
        Events.on(runner, 'tick', updateChart);
    }

    function resetAndInitChart() {
        if (pressureChart) pressureChart.destroy();
        pressureData = []; timeLabels = []; momentumTransfer = 0; frameCounter = 0;
        pressureChart = new Chart(pressureCanvas.getContext('2d'), {
            type: 'line', data: { labels: timeLabels, datasets: [{ label: 'Presión (Δp / Δt)', data: pressureData, borderColor: 'rgb(255, 99, 132)', borderWidth: 1.5, pointRadius: 0 }] },
            options: { scales: { y: { beginAtZero: true, title: { display: true, text: 'Unidades arbitrarias' } }, x: { title: { display: true, text: 'Tiempo (s)' } } }, animation: { duration: 0 } }
        });
    }

    function updateChart() {
        frameCounter++;
        if (frameCounter % 30 === 0) {
            const pistonArea = height; const deltaTime = 30 / 60;
            const pressure = momentumTransfer / (pistonArea * deltaTime);
            momentumTransfer = 0;
            timeLabels.push((frameCounter / 60).toFixed(1));
            pressureData.push(pressure);
            // ACUMULAR, CALCULAR Y MOSTRAR ESTADÍSTICAS
            pressureHistoryForStats.push(pressure);
            calculateAndDisplayStats();
            if (timeLabels.length > 100) { timeLabels.shift(); pressureData.shift(); }
            pressureChart.update();
        }
    }

    // --- Eventos de los Controles ---
    // AÑADIR resetStats() A CADA EVENTO DE USUARIO
    particleCountInput.addEventListener('input', e => { particleCountValue.textContent = e.target.value; resetStats(); });
    temperatureInput.addEventListener('input', e => { temperatureValue.textContent = e.target.value; resetStats(); });
    pistonPositionInput.addEventListener('input', e => {
        pistonPositionValue.textContent = e.target.value;
        resetStats();
        if (engine) {
            const piston = engine.world.bodies.find(body => body.label === 'piston');
            if (piston) Body.setPosition(piston, { x: parseInt(e.target.value), y: height / 2 });
        }
    });
    restartButton.addEventListener('click', initSimulation);

    initSimulation();
});
