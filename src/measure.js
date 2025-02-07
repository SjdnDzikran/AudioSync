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
        
        // Load audio worklet processor
        await audioContext.audioWorklet.addModule('./audio-processor.js');

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
        const recorder = new AudioWorkletNode(audioContext, 'audio-recorder-processor');

        // Setup audio processing chain
        source.connect(recorder);
        recorder.connect(audioContext.destination);
        
        // Start recording
        recorder.port.postMessage('start');
        const recordingStartTime = audioContext.currentTime;

        // Add pre-recording silence to account for initialization
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create and play beep
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.frequency.value = 1000;
        oscillator.type = 'square';
        gainNode.gain.value = 0.5;

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const beepPlayTime = audioContext.currentTime + 0.1;
        oscillator.start(beepPlayTime);
        oscillator.stop(beepPlayTime + beepDuration);

        // Record for sufficient time
        await new Promise(resolve => setTimeout(resolve, (beepDuration + 0.5) * 1000));

        // Stop recording and get audio data
        recorder.port.postMessage('stop');
        const audioChunks = await new Promise(resolve => {
            recorder.port.onmessage = (event) => resolve(event.data);
        });

        // Cleanup
        source.disconnect();
        stream.getTracks().forEach(track => track.stop());
        oscillator.disconnect();
        gainNode.disconnect();

        // Process audio
        const recordedAudio = new Float32Array(audioChunks.reduce((acc, val) => acc + val.length, 0));
        let offset = 0;
        audioChunks.forEach(chunk => {
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
    const threshold = 0.02;

    // Normalize audio data
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

function drawWaveform(data, canvasCtx, width, height, times, sampleRate) {
    canvasCtx.clearRect(0, 0, width, height);

    // Draw background
    canvasCtx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    canvasCtx.fillRect(0, 0, width, height);

    // Set up for waveform drawing
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
    canvasCtx.beginPath();

    const sliceWidth = width / data.length;
    let x = 0;
    const centerY = height / 2;

    // Draw waveform with center at centerY
    for (let i = 0; i < data.length; i++) {
        // Map the data so that when data[i] is 0, y is at centerY
        const y = centerY - data[i] * centerY;

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
    }
    canvasCtx.stroke();

    // Remaining marker drawing
    if (times.beepPlayTime) {
        const playTimeOffset = times.beepPlayTime - times.recordingStartTime;
        const playtimeX = (playTimeOffset / times.duration) * width;

        canvasCtx.strokeStyle = 'red';
        canvasCtx.lineWidth = 2;
        canvasCtx.beginPath();
        canvasCtx.moveTo(playtimeX, 0);
        canvasCtx.lineTo(playtimeX, height);
        canvasCtx.stroke();

        canvasCtx.fillStyle = 'red';
        canvasCtx.font = '12px Arial';
        canvasCtx.fillText('Audio play', playtimeX + 5, 15);
    }

    if (times.beepHeardTime) {
        const heardTimeOffset = times.beepHeardTime - times.recordingStartTime;
        const heardTimeX = (heardTimeOffset / times.duration) * width;

        canvasCtx.strokeStyle = 'blue';
        canvasCtx.lineWidth = 2;
        canvasCtx.beginPath();
        canvasCtx.moveTo(heardTimeX, 0);
        canvasCtx.lineTo(heardTimeX, height);
        canvasCtx.stroke();

        const endTimeX = ((heardTimeOffset + beepDuration) / times.duration) * width;
        canvasCtx.strokeStyle = 'blue';
        canvasCtx.lineWidth = 2;
        canvasCtx.beginPath();
        canvasCtx.moveTo(endTimeX, 0);
        canvasCtx.lineTo(endTimeX, height);
        canvasCtx.stroke();

        canvasCtx.fillStyle = 'blue';
        canvasCtx.font = '12px Arial';
        canvasCtx.fillText('Audio heard', heardTimeX + 5, 30);
    }
}