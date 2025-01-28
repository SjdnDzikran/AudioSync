document.getElementById('startButton').addEventListener('click', startTest);
const useThisDelayButton = document.getElementById('useThisDelayButton');
const beepDuration = 0.2;
let lastMeasuredDelay = 0; // Store the measured delay

// Add button hover effects
document.querySelectorAll('.md-button').forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    });
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'none';
        button.style.boxShadow = 'none';
    });
});

// Handle "Use This Delay" button click
useThisDelayButton.addEventListener('click', () => {
    chrome.storage.sync.set({ frameDelay: lastMeasuredDelay }, () => {
        console.log('Delay saved:', lastMeasuredDelay);
        window.close(); // Close measurement window after saving
    });
});

async function startTest() {
    useThisDelayButton.style.display = 'none';
    const resultElement = document.getElementById('result');
    const canvas = document.getElementById('waveform');
    const canvasCtx = canvas.getContext('2d');

    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    resultElement.textContent = 'Initializing...';
    resultElement.style.color = getComputedStyle(document.documentElement).getPropertyValue('--md-ref-palette-on-surface');

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    try {
        // ... [keep existing audio recording code] ...

        if (beepStartIndex === -1) {
            resultElement.textContent = 'No beep detected';
            resultElement.style.color = '#EA4335';
        } else {
            const delay = ((recordingStartTime + (beepStartIndex / sampleRate)) - beepPlayTime) * 1000;
            lastMeasuredDelay = delay; // Store the measured value
            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--md-ref-palette-primary');
            resultElement.innerHTML = `<span style="color: ${primaryColor}">Measured delay: <b>${delay.toFixed(2)}ms</b></span>`;
            useThisDelayButton.style.display = 'flex';
        }

    } catch (e) {
        console.error(e);
        resultElement.textContent = 'Measurement failed';
        resultElement.style.color = '#EA4335';
    }
}

function findBeepStart(audioBuffer, sampleRate) {
    const windowSize = Math.floor(beepDuration * sampleRate);
    let maxEnergy = 0;
    let beepStart = -1;
    const threshold = 0.05;

    for (let i = 0; i < audioBuffer.length - windowSize; i++) {
        let energy = 0;
        for (let j = 0; j < windowSize; j++) {
            energy += Math.abs(audioBuffer[i + j]);
        }
        
        if (energy > maxEnergy && audioBuffer[i] > threshold) {
            maxEnergy = energy;
            beepStart = i;
        }
    }
    return beepStart;
}

function drawWaveform(data, ctx, width, height, times, sampleRate) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#2D2E30';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    ctx.lineWidth = 1;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--md-ref-palette-on-surface');
    ctx.beginPath();

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
        const y = (data[i] * 0.5 + 0.5) * height;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceWidth;
    }
    ctx.stroke();

    // Draw markers
    const drawMarker = (time, color, label) => {
        if (!time) return;
        const xPos = ((time - times.recordingStartTime) / times.duration) * width;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, height);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = '14px Roboto';
        ctx.fillText(label, xPos + 5, 20);
    };

    drawMarker(times.beepPlayTime, '#EA4335', 'Played');
    drawMarker(times.beepHeardTime, '#34A853', 'Heard');
}