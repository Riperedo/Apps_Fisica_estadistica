document.addEventListener('DOMContentLoaded', () => {
    const numeroEspinesInput = document.getElementById('numero-espines');
    const generarBtn = document.getElementById('generar-btn');
    const visualizacionEspines = document.getElementById('visualizacion-espines');
    const canvas = document.getElementById('histograma-macroestados');
    const ctx = canvas.getContext('2d');

    let conteoMacroestados = {};

    generarBtn.addEventListener('click', () => {
        const N = parseInt(numeroEspinesInput.value);
        if (N > 0) {
            generarYVisualizarMicroestado(N);
        }
    });

    function generarYVisualizarMicroestado(N) {
        visualizacionEspines.innerHTML = '';
        let sumaEspines = 0;
        let microestado = [];

        for (let i = 0; i < N; i++) {
            const estado = Math.random() < 0.5 ? 1 : -1; // 1 para arriba, -1 para abajo
            microestado.push(estado);
            sumaEspines += estado;

            const spinDiv = document.createElement('div');
            spinDiv.classList.add('spin');
            if (estado === 1) {
                spinDiv.classList.add('arriba', 'flecha-arriba');
            } else {
                spinDiv.classList.add('abajo', 'flecha-abajo');
            }
            visualizacionEspines.appendChild(spinDiv);
        }

        // Actualizar conteo de macroestados
        if (conteoMacroestados[sumaEspines]) {
            conteoMacroestados[sumaEspines]++;
        } else {
            conteoMacroestados[sumaEspines] = 1;
        }

        dibujarHistograma(N);
    }

    function dibujarHistograma(N) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const macroestados = Object.keys(conteoMacroestados).map(Number).sort((a, b) => a - b);
        const frecuencias = Object.values(conteoMacroestados);
        const totalRealizaciones = frecuencias.reduce((acc, val) => acc + val, 0);

        if (totalRealizaciones === 0) return;

        const maxFrecuenciaNormalizada = Math.max(...frecuencias) / totalRealizaciones;
        const anchoBarra = canvas.width / (2 * N + 1);

        ctx.fillStyle = 'blue';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        for (let i = -N; i <= N; i += 2) {
            const frecuencia = conteoMacroestados[i] || 0;
            const densidadProbabilidad = frecuencia / totalRealizaciones;
            const alturaBarra = (densidadProbabilidad / maxFrecuenciaNormalizada) * (canvas.height - 30);
            const x = (i + N) / 2 * (canvas.width / (N + 1));


            ctx.fillRect(x, canvas.height - alturaBarra - 20, anchoBarra - 5, alturaBarra);
            ctx.fillText(i, x + (anchoBarra - 5) / 2, canvas.height - 5);
        }
    }
});