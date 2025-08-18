document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const numRealizationsInput = document.getElementById('num-realizations');
    const startTimeBtn = document.getElementById('start-time-average');
    const startEnsembleBtn = document.getElementById('start-ensemble-average');
    const dice1 = document.getElementById('dice-1');
    const dice2 = document.getElementById('dice-2');
    const ctx = document.getElementById('comparison-histogram').getContext('2d');
    
    let comparisonChart;
    let timeAverageInterval;

    // Función para crear el histograma comparativo
    function createComparisonHistogram() {
        if (comparisonChart) {
            comparisonChart.destroy();
        }
        comparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
                datasets: [
                    {
                        label: 'Promedio Temporal (1 individuo, N lanzamientos)',
                        data: Array(11).fill(0),
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Promedio de Ensamble (N individuos, 1 lanzamiento)',
                        data: Array(11).fill(0),
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 0.25, // Fija el eje Y para una comparación estable
                        title: {
                            display: true,
                            text: 'Probabilidad (Frecuencia Relativa)'
                        }
                    },
                    x: {
                         title: {
                            display: true,
                            text: 'Suma de los Dados'
                        }
                    }
                }
            }
        });
    }

    // Simulación del Promedio Temporal
    function simulateTimeAverage(rolls, interval) {
        clearInterval(timeAverageInterval); // Detiene cualquier simulación anterior
        let counts = Array(11).fill(0);
        let currentRoll = 0;

        timeAverageInterval = setInterval(() => {
            if (currentRoll >= rolls) {
                clearInterval(timeAverageInterval);
                dice1.textContent = '';
                dice2.textContent = '';
                return;
            }

            const roll1 = Math.floor(Math.random() * 6) + 1;
            const roll2 = Math.floor(Math.random() * 6) + 1;
            const sum = roll1 + roll2;

            dice1.textContent = roll1;
            dice2.textContent = roll2;
            
            counts[sum - 2]++;
            currentRoll++;

            // Normaliza los datos en cada paso para ver la probabilidad converger
            const normalizedData = counts.map(count => count / currentRoll);
            comparisonChart.data.datasets[0].data = normalizedData;
            comparisonChart.update('none'); // 'none' para una actualización más fluida

        }, interval);
    }

    // Simulación del Promedio de Ensamble
    function simulateEnsembleAverage(individuals) {
        clearInterval(timeAverageInterval); // Detiene la otra simulación si está corriendo
        let counts = Array(11).fill(0);
        for (let i = 0; i < individuals; i++) {
            const roll1 = Math.floor(Math.random() * 6) + 1;
            const roll2 = Math.floor(Math.random() * 6) + 1;
            const sum = roll1 + roll2;
            counts[sum - 2]++;
        }
        
        // Normaliza el resultado final
        const normalizedResults = counts.map(count => count / individuals);

        dice1.textContent = 'N';
        dice2.textContent = 'N';
        comparisonChart.data.datasets[1].data = normalizedResults;
        comparisonChart.update();
    }

    // Event Listeners para los botones
    startTimeBtn.addEventListener('click', () => {
        const n = parseInt(numRealizationsInput.value);
        if (n > 0) {
            // Limpia los datos anteriores para una nueva simulación
            comparisonChart.data.datasets[0].data = Array(11).fill(0);
            simulateTimeAverage(n, 10);
        }
    });

    startEnsembleBtn.addEventListener('click', () => {
        const n = parseInt(numRealizationsInput.value);
        if (n > 0) {
            simulateEnsembleAverage(n);
        }
    });

    // Crear el gráfico inicial al cargar la página
    createComparisonHistogram();
});
