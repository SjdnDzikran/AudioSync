document.getElementById('startButton').addEventListener('click', startTest);
const useThisDelayButton = document.getElementById('useThisDelayButton');
const beepDuration = 0.2;

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

async function startTest() {
    useThisDelayButton.style.display = 'none';
    const resultElement = document.getElementById('result');
    const canvas = document.getElementById('waveform');
    const canvasCtx = canvas.getContext('2d');

    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    resultElement.textContent = 'Initializing...';
    resultElement.style.color = getComputedStyle(document.documentElement).getPropertyValue('--md-ref-palette-on-surface');

    let audioContext;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
        } catch (e) {
            resultElement.textContent = 'Microphone access required';
            resultElement.style.color = '#EA4335';
            return;
        }
        
        resultElement.textContent = 'Recording...';
        resultElement.style.color = getComputedStyle(document.documentElement).getPropertyValue('--md-ref-palette-primary');

        const source = audioContext.createMediaStreamSource(stream);
        const bufferSize = 4096;
        const recorder = audioContext.createScriptProcessor(bufferSize, 1, 1);
        const audioData = [];

        // Configure audio processing chain
        source.connect(recorder);
        recorder.connect(audioContext.destination);
        const recordingStartTime = audioContext.currentTime;

        recorder.onaudioprocess = function (e) {
            const channelData = e.inputBuffer.getChannelData(0);
            audioData.push(new Float32Array(channelData));
        };

        // Add pre-recording silence to account for initialization
        await new Promise(resolve => setTimeout(resolve, 100));

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Use lower frequency for better microphone compatibility
        oscillator.frequency.value = 1000;
        oscillator.type = 'square';
        gainNode.gain.value = 0.5;

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const beepPlayTime = audioContext.currentTime + 0.1; // Add small delay
        oscillator.start(beepPlayTime);
        oscillator.stop(beepPlayTime + beepDuration);

        // Record for sufficient time (beep duration + safety margin)
        await new Promise(resolve => setTimeout(resolve, (beepDuration + 0.5) * 1000));

        // Cleanup
        recorder.disconnect();
        source.disconnect();
        stream.getTracks().forEach(track => track.stop());
        oscillator.disconnect();
        gainNode.disconnect();

        // Process audio
        const recordedAudio = new Float32Array(audioData.reduce((acc, val) => acc + val.length, 0));
        let offset = 0;
        audioData.forEach(chunk => {
            recordedAudio.set(chunk, offset);
            offset += chunk.length;
        });

        const sampleRate = audioContext.sampleRate;
        const beepStartIndex = findBeepStart(recordedAudio, sampleRate);

        drawWaveform(recordedAudio, canvasCtx, canvas.width, canvas.height, {
            beepPlayTime,
            beepHeardTime: beepStartIndex !== -1 ? recordingStartTime + (beepStartIndex / sampleRate) : null,
            recordingStartTime,
            duration: recordedAudio.length / sampleRate
        }, sampleRate);

        if (beepStartIndex === -1) {
            resultElement.textContent = 'No beep detected - try increasing volume';
            resultElement.style.color = '#EA4335';
        } else {
            const delay = ((recordingStartTime + (beepStartIndex / sampleRate)) - beepPlayTime) * 1000;
            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--md-ref-palette-primary');
            resultElement.innerHTML = `<span style="color: ${primaryColor}">Measured delay: <b>${delay.toFixed(2)}ms</b></span>`;
            useThisDelayButton.style.display = 'flex';
        }

    } catch (e) {
        console.error('Measurement error:', e);
        resultElement.textContent = 'Measurement failed: ' + e.message;
        resultElement.style.color = '#EA4335';
    } finally {
        if (audioContext) {
            await audioContext.close();
        }
    }
}

function findBeepStart(audioBuffer, sampleRate) {
    const windowSize = Math.floor(beepDuration * sampleRate);
    let maxEnergy = 0;
    let beepStart = -1;
    const threshold = 0.02; // Lowered threshold

    // Normalize audio data first
    const maxAmplitude = Math.max(...audioBuffer.map(Math.abs));
    const normalizedData = audioBuffer.map(x => x / (maxAmplitude || 1));

    for (let i = 0; i < normalizedData.length - windowSize; i++) {
        let energy = 0;
        for (let j = 0; j < windowSize; j++) {
            energy += Math.abs(normalizedData[i + j]);
        }
        
        if (energy > maxEnergy && normalizedData[i] > threshold) {
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