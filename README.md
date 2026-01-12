# High-Accuracy 1RM Calculator

A sophisticated one-rep max (1RM) calculator built with HTML, CSS, and vanilla JavaScript, implementing an exponential fatigue model with personalization features.

## Features

- **Exponential Fatigue Model**: Uses the exact mathematical formula: `1RM = W × e^(k × R_eff / E) × CNS × V`
- **Lift-Specific Constants**: Optimized k values for Bench Press (0.035), Squat (0.030), and Deadlift (0.025)
- **Personal Calibration**: Optional calibration mode to determine your personal fatigue constant
- **Neural Fatigue**: Automatic CNS multiplier based on effective reps
- **Endurance Profiles**: Four endurance levels with appropriate multipliers
- **Velocity Factors**: Three rep speed categories with velocity multipliers
- **Confidence Intervals**: Accuracy ranges based on rep count
- **Input Validation**: Comprehensive validation with user-friendly error messages
- **Dark Mode**: Clean, minimalist dark theme
- **Responsive Design**: Works on desktop and mobile devices

## Usage

1. **Basic Calculation**:
   - Enter weight lifted (kg)
   - Enter number of reps performed
   - Enter reps in reserve (RIR, 0-5)
   - Select lift type
   - Select endurance profile
   - Select last rep speed
   - Results update automatically

2. **Calibration Mode** (Optional):
   - Enter two known sets for the same lift
   - Click "Calibrate k Value"
   - Your personal k value will be calculated and used for future calculations

3. **Understanding Results**:
   - **Estimated 1RM**: Your calculated one-rep max (rounded to nearest 0.5 kg)
   - **Range**: Confidence interval based on rep count
   - **Confidence**: Percentage error margin
   - **Details**: Complete breakdown of all calculation parameters

## Mathematical Model

The calculator uses a true exponential function (Math.exp) as required:

```
1RM = W × e^(k × R_eff / E) × CNS × V

Where:
- W: Weight lifted
- R_eff: Reps + RIR (effective reps)
- k: Fatigue constant (lift-specific or calibrated)
- E: Endurance factor
- CNS: Neural fatigue multiplier
- V: Velocity multiplier
```

## File Structure

- `index.html` - Main HTML structure
- `style.css` - Dark mode styling and responsive design
- `script.js` - Exponential fatigue model implementation

## Browser Compatibility

Works in all modern browsers supporting ES6+ features.

## Accuracy Notes

- Rep limits: Bench ≤ 12, Squat ≤ 10, Deadlift ≤ 8
- Confidence decreases with higher rep ranges
- Calibration provides maximum accuracy for individual lifters