document.addEventListener('DOMContentLoaded', () => {
    const nxInput = document.getElementById('nx');
    const nyInput = document.getElementById('ny');
    const magneticFieldInput = document.getElementById('magneticField');
    const kbtInput = document.getElementById('kbt');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const resetButton = document.getElementById('resetButton');
    const spinGridDiv = document.getElementById('spinGrid');
    const theoreticalMagnetizationSpan = document.getElementById('theoreticalMagnetization');
    const magnetizationChartCanvas = document.getElementById('magnetizationChart');
    // Nuevo canvas para el segundo gráfico
    const magnetizationVsBkBTChartCanvas = document.getElementById('magnetizationVsBkBTChart');


    let nx = parseInt(nxInput.value);
    let ny = parseInt(nyInput.value);
    let B = parseFloat(magneticFieldInput.value);
    let kBT = parseFloat(kbtInput.value);
    let spins = [];
    let intervalId = null;
    let chart; // Primer gráfico (Magnetización vs Pasos)
let magnetizationVsBkBTChart; // Segundo gráfico (Magnetización vs B/kBT)
let magnetizationHistory = [];
let stepCount = 0;
let isSimulating = false;

// Función para crear la cuadrícula de espines
function createSpinGrid() {
    nx = parseInt(nxInput.value);
    ny = parseInt(nyInput.value);
    B = parseFloat(magneticFieldInput.value);
    kBT = parseFloat(kbtInput.value);

    spinGridDiv.innerHTML = '';
    spinGridDiv.style.gridTemplateColumns = `repeat(${nx}, 1fr)`;
    spinGridDiv.style.gridTemplateRows = `repeat(${ny}, 1fr)`;

    spins = Array(nx * ny).fill(0).map(() => Math.random() < 0.5 ? 1 : -1); // 1 para arriba, -1 para abajo

    spins.forEach((spin, index) => {
        const spinDiv = document.createElement('div');
        spinDiv.classList.add('spin');
        spinDiv.id = `spin-${index}`;
        updateSpinDisplay(spinDiv, spin);
        spinGridDiv.appendChild(spinDiv);
    });
    updateTheoreticalMagnetization();
}

// Función para actualizar la visualización de un espín
function updateSpinDisplay(spinDiv, spinValue) {
    spinDiv.textContent = spinValue === 1 ? '↑' : '↓';
    spinDiv.classList.remove('up', 'down');
    if (spinValue === 1) {
        spinDiv.classList.add('up');
    } else {
        spinDiv.classList.add('down');
    }
}

// Función para calcular la magnetización total
function calculateTotalMagnetization() {
    return spins.reduce((sum, spin) => sum + spin, 0) / (nx * ny);
}

// Función para calcular la magnetización teórica
function updateTheoreticalMagnetization() {
    const mu = 1; // Momento magnético del espín (se asume 1)
if (kBT === 0) return 1; // Manejar kBT=0 para evitar división por cero
const beta = 1 / kBT;
const theoreticalM = mu * Math.tanh(beta * mu * B);
theoreticalMagnetizationSpan.textContent = theoreticalM.toFixed(4);
return theoreticalM;
}

// Inicializar el primer gráfico (Magnetización vs Pasos)
function initializeChart() {
    const ctx = magnetizationChartCanvas.getContext('2d');
    if (chart) {
        chart.destroy();
    }
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Magnetización Simulada',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                      tension: 0.1,
                      fill: false
                },
                {
                    label: 'Magnetización Teórica',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                      borderDash: [5, 5],
                      tension: 0,
                      fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                      text: 'Pasos de Monte Carlo'
                    }
                },
                y: {
                    title: {
                        display: true,
                      text: 'Magnetización Total'
                    },
                    min: -1,
                    max: 1
                }
            },
            animation: false
        }
    });
}

// Función para inicializar el segundo gráfico (Magnetización vs B/kBT)
function initializeMagnetizationVsBkBTChart() {
    const ctx = magnetizationVsBkBTChartCanvas.getContext('2d');
    if (magnetizationVsBkBTChart) {
        magnetizationVsBkBTChart.destroy();
    }

    const mu = 1;
    const bkBTValues = Array.from({ length: 101 }, (_, i) => i * (5 / 100)); // Rango de B/kBT de 0 a 5
    const analyticalPoints = bkBTValues.map(x => ({
        x: x,
        y: mu * Math.tanh(mu * x)
    }));

    magnetizationVsBkBTChart = new Chart(ctx, {
        type: 'scatter', // Usamos scatter para la curva analítica y el punto de la simulación
        data: {
            datasets: [
                {
                    label: 'Analítico (M vs B/kBT)',
                                         data: analyticalPoints,
                                         borderColor: 'rgb(54, 162, 235)',
                                         backgroundColor: 'rgba(54, 162, 235, 0.5)',
                                         showLine: true,
                                         pointRadius: 0, // No mostrar puntos individuales para la línea analítica
                                         tension: 0.2,
                                         fill: false
                },
                {
                    label: 'Simulación Actual',
                    data: [], // Se actualizará con un solo punto
                    borderColor: 'rgb(255, 99, 132)',
                                         backgroundColor: 'rgb(255, 99, 132)',
                                         pointRadius: 8, // Hacer el punto de la simulación más visible
                                         pointStyle: 'circle'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'B/kBT'
                    },
                    min: 0,
                    max: 5 // Ajusta el rango según sea necesario
                },
                y: {
                    title: {
                        display: true,
                        text: 'Magnetización Total'
                    },
                    min: -1,
                    max: 1
                }
            },
            animation: false
        }
    });
}

// Función para actualizar el primer gráfico
function updateChart(currentMagnetization) {
    const theoreticalM = parseFloat(theoreticalMagnetizationSpan.textContent);
    chart.data.labels.push(stepCount);
    chart.data.datasets[0].data.push(currentMagnetization);
    chart.data.datasets[1].data.push(theoreticalM);
    chart.update();
}

// Función para actualizar el segundo gráfico
function updateMagnetizationVsBkBTChart(currentMagnetization) {
    const mu = 1;
    if (kBT === 0) return; // Evitar división por cero
    const bkBT = B / kBT;

    // Eliminar el punto anterior y añadir el nuevo
    magnetizationVsBkBTChart.data.datasets[1].data = [{ x: bkBT, y: currentMagnetization }];
    magnetizationVsBkBTChart.update();
}

// Paso de Monte Carlo
function monteCarloStep() {
    if (!isSimulating) return;

    // Seleccionar un espín aleatorio
    const randomIndex = Math.floor(Math.random() * (nx * ny));
    const currentSpin = spins[randomIndex];
    const proposedSpin = -currentSpin; // Invertir el espín

    const mu = 1; // Momento magnético del espín
    if (kBT === 0) { // Comportamiento a kBT = 0 (todos los espines se alinean con B)
        if (B > 0) spins[randomIndex] = 1;
        else if (B < 0) spins[randomIndex] = -1;
        // Si B = 0, los espines permanecen como están (no hay fuerza para alinearlos)
    } else {
        const energyChange = 2 * mu * B * currentSpin; // Cambio de energía si el espín cambia (de currentSpin a -currentSpin)

// Criterio de aceptación de Metropolis
if (energyChange < 0 || Math.random() < Math.exp(-energyChange / kBT)) {
    spins[randomIndex] = proposedSpin;
}
    }

    const spinDiv = document.getElementById(`spin-${randomIndex}`);
    updateSpinDisplay(spinDiv, spins[randomIndex]);


    stepCount++;
    const currentMagnetization = calculateTotalMagnetization();
    magnetizationHistory.push(currentMagnetization);
    updateChart(currentMagnetization);
    updateMagnetizationVsBkBTChart(currentMagnetization); // Actualizar el segundo gráfico
}

// Iniciar simulación
startButton.addEventListener('click', () => {
    if (!isSimulating) {
        startButton.disabled = true;
        stopButton.disabled = false;
        resetButton.disabled = true;
        isSimulating = true;
        // Reiniciar simulación si los parámetros cambian
        const currentNx = parseInt(nxInput.value);
        const currentNy = parseInt(nyInput.value);
        const currentB = parseFloat(magneticFieldInput.value);
        const currentKBT = parseFloat(kbtInput.value);

        if (nx !== currentNx || ny !== currentNy || B !== currentB || kBT !== currentKBT) {
            resetSimulation();
            createSpinGrid();
            initializeChart();
            initializeMagnetizationVsBkBTChart(); // Inicializar el nuevo gráfico
        } else if (spins.length === 0) { // Si es la primera vez que se inicia o se ha reseteado
            createSpinGrid();
            initializeChart();
            initializeMagnetizationVsBkBTChart(); // Inicializar el nuevo gráfico
        }
        // Actualizar B y kBT para la simulación
        B = currentB;
        kBT = currentKBT;
        intervalId = setInterval(monteCarloStep, 10); // Ejecutar cada 10ms
    }
});

// Detener simulación
stopButton.addEventListener('click', () => {
    if (isSimulating) {
        clearInterval(intervalId);
        isSimulating = false;
        startButton.disabled = false;
        stopButton.disabled = true;
        resetButton.disabled = false;
    }
});

// Reiniciar simulación
resetButton.addEventListener('click', () => {
    resetSimulation();
    createSpinGrid();
    initializeChart();
    initializeMagnetizationVsBkBTChart(); // Reinicializar el nuevo gráfico
});

function resetSimulation() {
    clearInterval(intervalId);
    isSimulating = false;
    startButton.disabled = false;
    stopButton.disabled = true;
    resetButton.disabled = false;
    spins = [];
    magnetizationHistory = [];
    stepCount = 0;
    if (chart) {
        chart.destroy();
    }
    if (magnetizationVsBkBTChart) { // Destruir el nuevo gráfico también
        magnetizationVsBkBTChart.destroy();
    }
    theoreticalMagnetizationSpan.textContent = '';
    spinGridDiv.innerHTML = '';
    nx = parseInt(nxInput.value);
    ny = parseInt(nyInput.value);
    B = parseFloat(magneticFieldInput.value);
    kBT = parseFloat(kbtInput.value);
}

// Inicializar la simulación al cargar la página
createSpinGrid();
initializeChart();
initializeMagnetizationVsBkBTChart(); // Inicializar el nuevo gráfico al cargar
});
