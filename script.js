// High-accuracy 1RM calculator using exponential fatigue model
// Mathematical model: 1RM = W * e^(k * R_eff / E) * CNS * V

class ORMCalculator {
    constructor() {
        // Lift-specific k values
        this.LIFT_CONSTANTS = {
            bench_press: 0.035,
            squat: 0.030,
            deadlift: 0.025
        };
        
        // Endurance factors
        this.ENDURANCE_FACTORS = {
            explosive_low: 0.9,
            average: 1.0,
            high: 1.1,
            very_high: 1.2
        };
        
        // Velocity multipliers
        this.VELOCITY_MULTIPLIERS = {
            very_slow: 0.98,
            normal: 1.00,
            fast_explosive: 1.03
        };
        
        // Calibrated k values storage
        this.calibratedKValues = {};
        
        // Rep limits for accuracy warnings
        this.REP_LIMITS = {
            bench_press: 12,
            squat: 10,
            deadlift: 8
        };
    }
    
    /**
     * Get k value for lift type, using calibrated value if available
     * @param {string} liftType - 'bench_press', 'squat', or 'deadlift'
     * @returns {number} k value
     */
    getKValue(liftType) {
        if (this.calibratedKValues[liftType]) {
            return this.calibratedKValues[liftType];
        }
        
        if (!this.LIFT_CONSTANTS[liftType]) {
            throw new Error(`Unknown lift type: ${liftType}`);
        }
        
        return this.LIFT_CONSTANTS[liftType];
    }
    
    /**
     * Get endurance factor based on user profile
     * @param {string} enduranceProfile - endurance profile
     * @returns {number} endurance factor
     */
    getEnduranceFactor(enduranceProfile) {
        if (!this.ENDURANCE_FACTORS[enduranceProfile]) {
            throw new Error(`Unknown endurance profile: ${enduranceProfile}`);
        }
        
        return this.ENDURANCE_FACTORS[enduranceProfile];
    }
    
    /**
     * Get velocity multiplier based on last rep speed
     * @param {string} repSpeed - rep speed
     * @returns {number} velocity multiplier
     */
    getVelocityMultiplier(repSpeed) {
        if (!this.VELOCITY_MULTIPLIERS[repSpeed]) {
            throw new Error(`Unknown rep speed: ${repSpeed}`);
        }
        
        return this.VELOCITY_MULTIPLIERS[repSpeed];
    }
    
    /**
     * Calculate CNS fatigue multiplier based on effective reps
     * @param {number} rEff - effective reps (reps + RIR)
     * @returns {number} CNS multiplier
     */
    calculateCNSMultiplier(rEff) {
        if (rEff <= 2) {
            return 1.05;
        } else if (rEff <= 5) {
            return 1.02;
        } else {
            return 1.00;
        }
    }
    
    /**
     * Get confidence percentage and error range based on reps and lift type
     * @param {number} reps - number of reps performed
     * @param {string} liftType - type of lift
     * @returns {object} confidence information
     */
    getConfidenceInfo(reps, liftType) {
        let confidencePct;
        
        if (reps <= 3) {
            confidencePct = 1.0; // ±1%
        } else if (reps <= 6) {
            confidencePct = 2.0; // ±2%
        } else if (reps <= 9) {
            confidencePct = 4.0; // ±4%
        } else {
            confidencePct = 7.0; // ±7%
        }
        
        return {
            percentage: confidencePct,
            lowerError: confidencePct / 100,
            upperError: confidencePct / 100
        };
    }
    
    /**
     * Calculate 1RM using exponential fatigue model
     * Formula: 1RM = W * e^(k * R_eff / E) * CNS * V
     * @param {number} weight - weight lifted in kg
     * @param {number} reps - number of reps performed
     * @param {number} rir - reps in reserve (0-5)
     * @param {string} liftType - type of lift
     * @param {string} enduranceProfile - endurance profile
     * @param {string} repSpeed - last rep speed
     * @returns {object} calculation results
     */
    calculate1RM(weight, reps, rir, liftType, enduranceProfile, repSpeed) {
        // Input validation
        if (weight <= 0) {
            throw new Error("Weight must be positive");
        }
        if (reps < 1) {
            throw new Error("Reps must be at least 1");
        }
        if (rir < 0 || rir > 5) {
            throw new Error("RIR must be between 0 and 5");
        }
        
        // Calculate effective reps
        const rEff = reps + rir;
        
        // Get multipliers and constants
        const k = this.getKValue(liftType);
        const eFactor = this.getEnduranceFactor(enduranceProfile);
        const vMultiplier = this.getVelocityMultiplier(repSpeed);
        const cnsMultiplier = this.calculateCNSMultiplier(rEff);
        
        // Exponential fatigue calculation: 1RM = W * e^(k * R_eff / E) * CNS * V
        const exponent = (k * rEff) / eFactor;
        const estimated1RM = weight * Math.exp(exponent) * cnsMultiplier * vMultiplier;
        
        // Calculate confidence information
        const confidenceInfo = this.getConfidenceInfo(reps, liftType);
        
        // Calculate confidence range
        const lowerBound = estimated1RM * (1 - confidenceInfo.lowerError);
        const upperBound = estimated1RM * (1 + confidenceInfo.upperError);
        
        // Generate warnings
        const warnings = [];
        const repLimit = this.REP_LIMITS[liftType];
        
        if (reps > repLimit) {
            warnings.push(`Accuracy may be low: ${reps} reps exceeds recommended limit for ${liftType.replace('_', ' ')}`);
        }
        
        // Round to nearest 0.5 kg
        const rounded1RM = Math.round(estimated1RM * 2) / 2;
        const roundedLower = Math.round(lowerBound * 2) / 2;
        const roundedUpper = Math.round(upperBound * 2) / 2;
        
        return {
            estimated1RM: rounded1RM,
            confidenceRange: [roundedLower, roundedUpper],
            confidencePercentage: confidenceInfo.percentage,
            warnings: warnings,
            details: {
                weight: weight,
                reps: reps,
                rir: rir,
                rEff: rEff,
                kValue: k,
                enduranceFactor: eFactor,
                cnsMultiplier: cnsMultiplier,
                velocityMultiplier: vMultiplier,
                exponent: exponent,
                liftType: liftType
            }
        };
    }
    
    /**
     * Calibrate personal k value using two known sets
     * Formula: k = ln(W2/W1) / (R1 - R2)
     * @param {string} liftType - type of lift
     * @param {number} w1 - weight for first set
     * @param {number} r1 - reps for first set
     * @param {number} w2 - weight for second set
     * @param {number} r2 - reps for second set
     * @returns {number} calibrated k value
     */
    calibrateKValue(liftType, w1, r1, w2, r2) {
        if (w1 <= 0 || w2 <= 0) {
            throw new Error("Weights must be positive");
        }
        if (r1 < 1 || r2 < 1) {
            throw new Error("Reps must be at least 1");
        }
        if (r1 === r2) {
            throw new Error("Reps must be different for calibration");
        }
        
        // Calculate personal k value using natural logarithm
        const k = Math.log(w2 / w1) / (r1 - r2);
        
        // Store calibrated value
        this.calibratedKValues[liftType] = k;
        
        return k;
    }
}

// DOM Elements
const calculator = new ORMCalculator();

// Input elements
const weightInput = document.getElementById('weight');
const repsInput = document.getElementById('reps');
const rirInput = document.getElementById('rir');
const liftTypeSelect = document.getElementById('lift-type');
const enduranceSelect = document.getElementById('endurance');
const repSpeedSelect = document.getElementById('rep-speed');

const calculateBtn = document.getElementById('calculate-btn');

// Calibration elements
const calW1Input = document.getElementById('cal-w1');
const calR1Input = document.getElementById('cal-r1');
const calW2Input = document.getElementById('cal-w2');
const calR2Input = document.getElementById('cal-r2');
const calibrateBtn = document.getElementById('calibrate-btn');
const calibrationResult = document.getElementById('calibration-result');
const themeToggle = document.getElementById('theme-toggle');

// Results elements
const resultsDiv = document.getElementById('results');

/**
 * Display calculation results
 * @param {object} result - calculation results
 */
function displayResults(result) {
    let html = `
        <div class="result-display fade-in">
            <div class="result-main">${result.estimated1RM} <small>kg</small></div>
            <div class="result-range">Range: ${result.confidenceRange[0]} - ${result.confidenceRange[1]} kg</div>
            <div class="result-confidence">Confidence: ±${result.confidencePercentage}%</div>
            
            <div class="result-details">
                <h4>Calculation Details</h4>
                <ul>
                    <li><strong>Weight:</strong> ${result.details.weight} kg</li>
                    <li><strong>Reps:</strong> ${result.details.reps}</li>
                    <li><strong>RIR:</strong> ${result.details.rir}</li>
                    <li><strong>Effective Reps:</strong> ${result.details.rEff}</li>
                    <li><strong>k Value:</strong> ${result.details.kValue.toFixed(6)}</li>
                    <li><strong>Endurance Factor:</strong> ${result.details.enduranceFactor}</li>
                    <li><strong>CNS Multiplier:</strong> ${result.details.cnsMultiplier.toFixed(3)}</li>
                    <li><strong>Velocity Multiplier:</strong> ${result.details.velocityMultiplier.toFixed(3)}</li>
                    <li><strong>Exponent:</strong> ${result.details.exponent.toFixed(6)}</li>
                </ul>
            </div>
    `;
    
    if (result.warnings.length > 0) {
        html += `
            <div class="warning">
                ⚠️ ${result.warnings.join('<br>⚠️ ')}
            </div>
        `;
    }
    
    html += '</div>';
    resultsDiv.innerHTML = html;
}

/**
 * Handle calculation
 */
function handleCalculation() {
    try {
        const weight = parseFloat(weightInput.value);
        const reps = parseInt(repsInput.value);
        const rir = parseInt(rirInput.value);
        const liftType = liftTypeSelect.value;
        const enduranceProfile = enduranceSelect.value;
        const repSpeed = repSpeedSelect.value;
        
        // Validate inputs
        if (!weight || weight <= 0) {
            throw new Error("Please enter a valid positive weight");
        }
        if (!reps || reps < 1) {
            throw new Error("Please enter valid reps (≥ 1)");
        }
        if (rir < 0 || rir > 5) {
            throw new Error("RIR must be between 0 and 5");
        }
        
        const result = calculator.calculate1RM(weight, reps, rir, liftType, enduranceProfile, repSpeed);
        displayResults(result);
        
    } catch (error) {
        resultsDiv.innerHTML = `
            <div class="result-display">
                <div class="calibration-result error">
                    Error: ${error.message}
                </div>
            </div>
        `;
    }
}

/**
 * Handle calibration
 */
function handleCalibration() {
    try {
        const w1 = parseFloat(calW1Input.value);
        const r1 = parseInt(calR1Input.value);
        const w2 = parseFloat(calW2Input.value);
        const r2 = parseInt(calR2Input.value);
        const liftType = liftTypeSelect.value;
        
        // Validate inputs
        if (!w1 || !w2 || w1 <= 0 || w2 <= 0) {
            throw new Error("Please enter valid positive weights");
        }
        if (!r1 || !r2 || r1 < 1 || r2 < 1) {
            throw new Error("Please enter valid reps (≥ 1)");
        }
        if (r1 === r2) {
            throw new Error("Reps must be different for calibration");
        }
        
        const kValue = calculator.calibrateKValue(liftType, w1, r1, w2, r2);
        
        calibrationResult.innerHTML = `
            <div class="calibration-result success">
                Calibrated k value for ${liftType.replace('_', ' ')}: ${kValue.toFixed(6)}<br>
                This value will be used for future calculations
            </div>
        `;
        
        // Recalculate if main inputs are filled
        if (weightInput.value && repsInput.value) {
            handleCalculation();
        }
        
    } catch (error) {
        calibrationResult.innerHTML = `
            <div class="calibration-result error">
                Error: ${error.message}
            </div>
        `;
    }
}

/**
 * Add input event listeners for real-time calculation
 */
function init() {
    calculateBtn.addEventListener('click', handleCalculation);
    calibrateBtn.addEventListener('click', handleCalibration);
    themeToggle.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-theme');
        try { localStorage.setItem('theme', isLight ? 'light' : 'dark'); } catch {}
    });
    try {
        const saved = localStorage.getItem('theme');
        if (saved === 'light') { document.body.classList.add('light-theme'); }
    } catch {}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
