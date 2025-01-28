document.addEventListener('DOMContentLoaded', () => {
    // Load saved frame delay
    chrome.storage.sync.get('frameDelay', ({ frameDelay }) => {
        if (frameDelay) {
            document.getElementById('frameDelay').value = frameDelay;
        }
    });

    // Initialize pause state
    refreshPauseResumeButton();
});

// Handle frame delay input changes
const onFrameDelayChange = (event) => {
    const frameDelay = event.target.value;
    try {
        const frameDelayNum = parseInt(frameDelay);
        if (isNaN(frameDelayNum)) {
            throw new Error('Invalid frame delay');
        }
        chrome.storage.sync.set({ frameDelay: frameDelayNum });
    } catch {
        chrome.storage.sync.set({ frameDelay: '' });
    }
}

// Pause/Resume button functionality
const button = document.getElementById('pauseResumeButton');
button.addEventListener('click', async () => {
    const { pauseDelay } = await chrome.storage.sync.get('pauseDelay');
    const newValue = !pauseDelay;
    await chrome.storage.sync.set({ pauseDelay: newValue });
    refreshPauseResumeButton();
});

// Update UI based on pause state
const refreshPauseResumeButton = async () => {
    const { pauseDelay } = await chrome.storage.sync.get('pauseDelay');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const buttonIcon = document.querySelector('#pauseResumeButton .material-icons');
    const buttonLabel = document.querySelector('#pauseResumeButton');

    if (pauseDelay) {
        statusDot.classList.add('paused');
        statusText.textContent = 'Paused';
        buttonIcon.textContent = 'play_arrow';
        buttonLabel.innerHTML = '<span class="material-icons">play_arrow</span> Resume';
    } else {
        statusDot.classList.remove('paused');
        statusText.textContent = 'Active';
        buttonIcon.textContent = 'pause';
        buttonLabel.innerHTML = '<span class="material-icons">pause</span> Pause';
    }
}

// Input field listener
const frameDelayInput = document.getElementById('frameDelay');
frameDelayInput.addEventListener('input', onFrameDelayChange);

// Add hover effects to buttons
document.querySelectorAll('.md-button').forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-1px)';
    });
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'none';
    });
});