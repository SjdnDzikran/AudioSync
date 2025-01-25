# AudioSync 🔊⏱️🖥️  
[![License: GPLv2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)  

**Sync Bluetooth audio seamlessly without breaking video quality.**  
AudioSync eliminates audio-video latency *without* altering video frames, ensuring compatibility with DRM platforms (Netflix, Disney+) and preserving HDR/GPU enhancements.  

---

## Features ✨  
- 🎧 **Audio-first sync** – Adjusts audio speed, not video frames.  
- 🚫 **No DRM conflicts** – Works flawlessly on Netflix, Disney+, and more.  
- 🎨 **Retains HDR/GPU optimizations** – No visual downgrades.  
- ⚙️ **Custom latency tuning** – Input your Bluetooth delay (e.g., 300ms).  

---

## Why AudioSync? 🤔  

### The Problem with Frame-Delay Tools  
Most sync solutions delay video frames, which:  
- 🖥️ **Break premium platforms** (trigger black screens on Netflix/Disney+).  
- 🎨 **Disable visual enhancements** (HDR, dynamic contrast, GPU optimizations).  

### AudioSync’s Solution  
By syncing **audio playback speed** instead of video:  
- ✅ **Works everywhere** – Free and DRM-protected platforms.  
- ✅ **Preserves video quality** – No interference with HDR/GPU features.  
- ✅ **Zero visual artifacts** – No black screens or blocks.  

---

## Installation 🛠️  

### For Users  
1. **Download** the latest release (`.zip` file) from [Releases](https://github.com/SjdnDzikran/AudioSync/releases).  
2. **Extract** the ZIP file to a folder.  
3. **Load the extension**:  
   - Open Chrome/Edge and go to `chrome://extensions`.  
   - Enable **Developer mode** (top-right toggle).  
   - Click **Load unpacked** and select the extracted folder.  

### For Developers  
1. **Clone the repo** (see [Contributing](#contributing-)).  

---

## Usage 🚀  
1. Click the AudioSync icon in your browser toolbar.  
2. Enter your Bluetooth latency (e.g., `300` ms).  
3. Click **Save** and reload your video tab.  

---

## Contributing 🤝  
1. **Fork the repo**.  
2. **Open an issue** to discuss changes.  
3. **Submit a PR** with clear documentation.  

---

## Credits 🙌  
AudioSync is a modified version of [FrameSync](https://github.com/maggch97/Frame-Sync.git), licensed under [GPLv2](LICENSE). Key changes include:  
- Replaced frame delays with audio speed adjustment.  
- Added Web Audio API for pitch correction.  
- Refactored UI for latency tuning.  

---

## License 📜  
Licensed under **GPLv2**. See [LICENSE](LICENSE) for details.  

---

*Built with ❤️ and ☕ by Dzikran – because synced audio and vibrant visuals should coexist.*  