(async function () {
    'use strict';

    // ========================
    // Configuration
    // ========================
    let delayMs = 300;
    let isPaused = false;

    // Load settings synchronously
    chrome.storage.sync.get(['frameDelay', 'pauseDelay'], (result) => {
        delayMs = result.frameDelay ?? 300;
        isPaused = result.pauseDelay ?? false;
    });

    // ========================
    // DRM Detection (Fixed regex)
    // ========================
    const isDRMVideo = (video) => {
        return video.mediaKeys || 
               video.webkitKeys ||
               (video.mediaSession?.type === 'protected') ||
               /\.(m3u8|mpd|manifest)/i.test(video.src);
    };

    // ========================
    // Audio Synchronization (Fixed cleanup)
    // ========================
    const createAudioSync = (video, delay) => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaElementSource(video);
            const delayNode = audioContext.createDelay(5);
            
            source.connect(delayNode).connect(audioContext.destination);
            delayNode.delayTime.value = Math.abs(delay) / 1000;

            const cleanup = () => {
                try {
                    source.disconnect();
                    delayNode.disconnect();
                    audioContext.close();
                } catch(e) { /* Ignore cleanup errors */ }
            };

            // Proper cleanup listener
            const onRemoved = () => {
                cleanup();
                video.removeEventListener('removed', onRemoved);
            };
            
            video.addEventListener('removed', onRemoved);
            return cleanup;

        } catch (e) {
            console.debug('Audio sync failed:', e);
            return null;
        }
    };

    // ========================
    // Video Delay (DRM Content - Fixed race condition)
    // ========================
    const createDRMDelay = (video, delay) => {
        const originalPlay = video.play.bind(video);
        let timeoutId = null;

        video.play = async function() {
            clearTimeout(timeoutId);
            await originalPlay().catch(() => {});
            video.currentTime = Math.max(0, video.currentTime - (delay/1000));
        };

        const cleanup = () => {
            video.play = originalPlay;
            clearTimeout(timeoutId);
        };

        // Add visibility change handler
        const onVisibilityChange = () => {
            if (document.hidden) cleanup();
        };
        
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            cleanup();
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    };

    // ========================
    // Video Processor (Fixed mutation observer)
    // ========================
    const processVideo = (video) => {
        if (video.dataset.synced || isPaused) return;
        
        const cleanup = isDRMVideo(video) 
            ? createDRMDelay(video, delayMs)
            : createAudioSync(video, delayMs);

        if (!cleanup) return;
        video.dataset.synced = 'true';

        // Improved cleanup observer
        const observer = new MutationObserver(() => {
            if (!video.isConnected) {
                cleanup();
                observer.disconnect();
            }
        });

        observer.observe(video.parentNode || document, {
            childList: true,
            subtree: true
        });
    };

    // ========================
    // DOM Observers (Optimized)
    // ========================
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeName === 'VIDEO') processVideo(node);
                if (node.querySelectorAll) {
                    node.querySelectorAll('video').forEach(processVideo);
                }
            }
        }
    });

    observer.observe(document, {
        subtree: true,
        childList: true
    });

    // Initialize existing videos
    document.querySelectorAll('video').forEach(processVideo);

    // ========================
    // Settings Updates (Debounced)
    // ========================
    let updateTimeout;
    chrome.storage.onChanged.addListener((changes) => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            if (changes.frameDelay) {
                delayMs = changes.frameDelay.newValue;
                document.querySelectorAll('video').forEach(video => {
                    delete video.dataset.synced;
                    processVideo(video);
                });
            }
            if (changes.pauseDelay) {
                isPaused = changes.pauseDelay.newValue;
            }
        }, 100);
    });
})();