// Dados base do Gunbound Mobile ICE
const gunboundIceData = {
    "1_tela": {
        "distancias": [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0],
        "angulos": {
            50: [0.73, 1.05, 1.30, 1.51, 1.70, 1.86, 2.02, 2.16],
            60: [0.84, 1.18, 1.45, 1.68, 1.87, 2.05, 2.22, 2.37],
            70: [0.97, 1.38, 1.68, 1.95, 2.17, 2.38, 2.57, 2.75],
            80: [1.33, 1.89, 2.31, 2.67, 2.98, 3.27, 3.53, 3.77]
        }
    },
    "2_telas": {
        "distancias": [1.125, 1.25, 1.375, 1.5, 1.625, 1.75, 1.875, 2.0],
        "angulos": {
            40: [2.30, 2.42, 2.55, 2.66, 2.77, 2.88, 2.98, 3.08],
            50: [2.30, 2.42, 2.55, 2.66, 2.77, 2.88, 2.98, 3.08],
            60: [2.51, 2.65, 2.78, 2.90, 3.02, 3.14, 3.25, 3.35],
            70: [2.92, 3.08, 3.23, 3.37, 3.51, 3.64, 3.77, 3.89]
        }
    }
};

// Direções de vento
const windDirections = {
    "Cima": 0,
    "Cima-Direita": 45,
    "Direita": 90,
    "Baixo-Direita": 135,
    "Baixo": 180,
    "Baixo-Esquerda": 225,
    "Esquerda": 270,
    "Cima-Esquerda": 315
};

// Função de cálculo de ajuste de vento
function calculateWindAdjustment(windStrength, windDirectionDegrees, currentAngle, currentPower) {
    let adjustedAngle = currentAngle;
    let adjustedPower = currentPower;

    // Normaliza a direção do vento para 0-360
    windDirectionDegrees = windDirectionDegrees % 360;

    // --- Vento Vertical ---
    const isWindUp = (windDirectionDegrees >= 337.5 || windDirectionDegrees < 22.5);
    const isWindDown = (windDirectionDegrees >= 157.5 && windDirectionDegrees < 202.5);

    if (isWindUp || isWindDown) {
        // Ajuste de força para vento vertical: 0.1 barras para cada 7 de vento
        const powerAdjustment = Math.floor(windStrength / 7) * 0.1;
        if (isWindUp) {
            adjustedPower -= powerAdjustment; // Vento para cima reduz a força
        } else { // isWindDown
            adjustedPower += powerAdjustment; // Vento para baixo aumenta a força
        }
        return { angle: adjustedAngle, power: adjustedPower };
    }

    // --- Determinar tipo de vento ---
    const isWindAgainst = (windDirectionDegrees > 202.5 && windDirectionDegrees < 337.5); // Vento contra (esquerda)
    const isWindFavor = (windDirectionDegrees > 22.5 && windDirectionDegrees < 157.5); // Vento a favor (direita)

    let angleChange = 0;

    if (isWindAgainst) {
        // --- VENTO CONTRA (Esquerda) ---
        // Regra: Use wind/2, but if wind is stronger than 7, alter 1 angle more; stronger than 18 alter 2 angles.
        angleChange = windStrength / 2;
        
        if (windStrength > 7) {
            angleChange += 1;
        }
        if (windStrength > 18) {
            angleChange += 1; // Total de +2 ângulos se > 18
        }
        
        adjustedAngle += angleChange; // Vento contra aumenta o ângulo
        
    } else if (isWindFavor) {
        // --- VENTO A FAVOR (Direita) ---
        // Múltiplas regras baseadas na força do vento
        
        if (windStrength <= 10) {
            // Regra: Use wind/2 up to 10 wind. For 11+ wind, lower 1 more angle.
            angleChange = windStrength / 2;
        } else if (windStrength <= 12) {
            // Regra: Use wind/3 up to 12 wind. For 13+ lower 1 more angle.
            angleChange = windStrength / 3;
            if (windStrength >= 11) {
                angleChange += 1; // Para 11+ vento, baixa 1 ângulo a mais
            }
        } else if (windStrength <= 21) {
            // Regra: Use wind/3 up to 12 wind. For 13+ lower 1 more angle.
            angleChange = windStrength / 3;
            angleChange += 1; // Para 13+ vento, baixa 1 ângulo a mais
        } else {
            // Regra: Raise wind/2, then lower 1 angle. If wind is 22 or more, lower 2 angles.
            angleChange = windStrength / 2;
            angleChange += 1; // Baixa 1 ângulo base
            if (windStrength >= 22) {
                angleChange += 1; // Se 22+, baixa mais 1 ângulo (total 2)
            }
        }
        
        // Para vento de 25/26, regra especial
        if (windStrength >= 25) {
            // Regra: For 25/26 lower 2 more angles.
            angleChange = windStrength / 3;
            angleChange += 2; // Baixa 2 ângulos a mais
        }
        
        adjustedAngle -= angleChange; // Vento a favor diminui o ângulo
    }

    return { angle: adjustedAngle, power: adjustedPower };
}

// Elementos DOM
const screenTypeSelect = document.getElementById('screen-type');
const baseAngleSelect = document.getElementById('base-angle');
const distanceSelect = document.getElementById('distance');
const windStrengthInput = document.getElementById('wind-strength');
const windDirectionSelect = document.getElementById('wind-direction');

// Elementos de exibição
const baseAngleDisplay = document.getElementById('base-angle-display');
const basePowerDisplay = document.getElementById('base-power-display');
const adjustedAngleDisplay = document.getElementById('adjusted-angle-display');
const adjustedPowerDisplay = document.getElementById('adjusted-power-display');
const angleChangeDisplay = document.getElementById('angle-change');
const powerChangeDisplay = document.getElementById('power-change');
const windStrengthDisplay = document.getElementById('wind-strength-display');
const windDirectionDisplay = document.getElementById('wind-direction-display');

// Função para atualizar as opções de ângulo baseado no tipo de tela
function updateAngleOptions() {
    const screenType = screenTypeSelect.value;
    const availableAngles = Object.keys(gunboundIceData[screenType].angulos);
    
    // Limpar opções atuais
    baseAngleSelect.innerHTML = '';
    
    // Adicionar novas opções
    availableAngles.forEach(angle => {
        const option = document.createElement('option');
        option.value = angle;
        option.textContent = angle + '°';
        baseAngleSelect.appendChild(option);
    });
    
    // Selecionar o primeiro ângulo disponível
    baseAngleSelect.value = availableAngles[0];
}

// Função para atualizar as opções de distância baseado no tipo de tela
function updateDistanceOptions() {
    const screenType = screenTypeSelect.value;
    const distances = gunboundIceData[screenType].distancias;
    
    // Limpar opções atuais
    distanceSelect.innerHTML = '';
    
    // Adicionar novas opções
    distances.forEach(dist => {
        const option = document.createElement('option');
        option.value = dist;
        
        // Formatação das distâncias
        if (screenType === '1_tela') {
            const fractionMap = {
                0.125: '1/8 SD',
                0.25: '1/4 SD',
                0.375: '3/8 SD',
                0.5: '1/2 SD',
                0.625: '5/8 SD',
                0.75: '3/4 SD',
                0.875: '7/8 SD',
                1.0: '1 SD'
            };
            option.textContent = fractionMap[dist];
        } else {
            const fractionMap = {
                1.125: '1 1/8 SD',
                1.25: '1 1/4 SD',
                1.375: '1 3/8 SD',
                1.5: '1 1/2 SD',
                1.625: '1 5/8 SD',
                1.75: '1 3/4 SD',
                1.875: '1 7/8 SD',
                2.0: '2 SD'
            };
            option.textContent = fractionMap[dist];
        }
        
        distanceSelect.appendChild(option);
    });
    
    // Selecionar uma distância padrão (meio da lista)
    const middleIndex = Math.floor(distances.length / 2);
    distanceSelect.value = distances[middleIndex];
}

// Função para obter a força base
function getBasePower() {
    const screenType = screenTypeSelect.value;
    const baseAngle = parseInt(baseAngleSelect.value);
    const distance = parseFloat(distanceSelect.value);
    
    const screenData = gunboundIceData[screenType];
    const distanceIndex = screenData.distancias.findIndex(d => Math.abs(d - distance) < 0.001);
    
    if (distanceIndex !== -1 && screenData.angulos[baseAngle]) {
        return screenData.angulos[baseAngle][distanceIndex];
    }
    return 0;
}

// Função para atualizar os resultados
function updateResults() {
    const baseAngle = parseInt(baseAngleSelect.value);
    const basePower = getBasePower();
    const windStrength = parseInt(windStrengthInput.value) || 0;
    const windDirection = windDirectionSelect.value;
    const windDirectionDegrees = windDirections[windDirection];
    
    // Calcular ajustes
    const result = calculateWindAdjustment(windStrength, windDirectionDegrees, baseAngle, basePower);
    
    // Atualizar displays
    baseAngleDisplay.textContent = baseAngle + '°';
    basePowerDisplay.textContent = basePower.toFixed(2);
    adjustedAngleDisplay.textContent = result.angle.toFixed(1) + '°';
    adjustedPowerDisplay.textContent = result.power.toFixed(2);
    windStrengthDisplay.textContent = windStrength;
    windDirectionDisplay.textContent = windDirection;
    
    // Atualizar tipo de vento se o elemento existir
    const windTypeDisplay = document.getElementById('wind-type-display');
    if (windTypeDisplay) {
        windTypeDisplay.textContent = getWindTypeInfo(windDirectionDegrees, windStrength);
    }
    
    // Calcular e exibir mudanças
    const angleChange = result.angle - baseAngle;
    const powerChange = result.power - basePower;
    
    // Atualizar badges de mudança
    updateChangeBadge(angleChangeDisplay, angleChange, '°');
    updateChangeBadge(powerChangeDisplay, powerChange, '');
}

// Função para atualizar badges de mudança
function updateChangeBadge(element, change, unit) {
    element.textContent = '';
    element.className = 'change-badge';
    
    if (Math.abs(change) < 0.01) {
        element.classList.add('neutral');
        return;
    }
    
    const sign = change > 0 ? '+' : '';
    element.textContent = sign + change.toFixed(change % 1 === 0 ? 0 : 1) + unit;
    
    if (change > 0) {
        element.classList.add('positive');
    } else {
        element.classList.add('negative');
    }
}

// Event listeners
screenTypeSelect.addEventListener('change', () => {
    updateAngleOptions();
    updateDistanceOptions();
    updateResults();
});

baseAngleSelect.addEventListener('change', updateResults);
distanceSelect.addEventListener('change', updateResults);
windStrengthInput.addEventListener('input', updateResults);
windDirectionSelect.addEventListener('change', updateResults);

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    updateAngleOptions();
    updateDistanceOptions();
    updateResults();
});

// Validação do input de vento
windStrengthInput.addEventListener('input', (e) => {
    let value = parseInt(e.target.value);
    if (value < 0) e.target.value = 0;
    if (value > 26) e.target.value = 26;
});


// Função para mostrar informações sobre o tipo de vento
function getWindTypeInfo(windDirectionDegrees, windStrength) {
    const isWindUp = (windDirectionDegrees >= 337.5 || windDirectionDegrees < 22.5);
    const isWindDown = (windDirectionDegrees >= 157.5 && windDirectionDegrees < 202.5);
    const isWindAgainst = (windDirectionDegrees > 202.5 && windDirectionDegrees < 337.5);
    const isWindFavor = (windDirectionDegrees > 22.5 && windDirectionDegrees < 157.5);
    
    if (isWindUp) return "Vento Vertical (Cima) - Reduz força";
    if (isWindDown) return "Vento Vertical (Baixo) - Aumenta força";
    if (isWindAgainst) return "Vento Contra - Aumenta ângulo";
    if (isWindFavor) return "Vento A Favor - Diminui ângulo";
    return "Vento Diagonal";
}

// Adicionar indicador de tipo de vento na interface
function addWindTypeIndicator() {
    const windConditionsSection = document.querySelector('.wind-conditions .values-grid');
    
    // Criar novo elemento para mostrar o tipo de vento
    const windTypeDiv = document.createElement('div');
    windTypeDiv.className = 'value-item wind-type-info';
    windTypeDiv.innerHTML = `
        <div class="value" id="wind-type-display">-</div>
        <div class="label">Tipo</div>
    `;
    
    windConditionsSection.appendChild(windTypeDiv);
}

// Atualizar CSS para acomodar 3 colunas na seção de vento
const style = document.createElement('style');
style.textContent = `
    .wind-conditions .values-grid {
        grid-template-columns: 1fr 1fr 1fr;
    }
    
    @media (max-width: 768px) {
        .wind-conditions .values-grid {
            grid-template-columns: 1fr;
        }
    }
    
    .wind-type-info .value {
        font-size: 0.9rem !important;
        line-height: 1.2;
    }
`;
document.head.appendChild(style);

