# AudioSync 🔊⏱️🖥️  
[![License: GPLv2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)  

**Sync Bluetooth audio seamlessly without breaking video quality.**  
AudioSync eliminates audio-video latency *without* altering video frames, ensuring compatibility with DRM platforms (Netflix, Disney+) and preserving HDR/GPU enhancements.  

---

## Features ✨  
- ⏱️ **Simple latency tuning** – Set your Bluetooth delay (e.g., 300ms).  
- 🌐 **Works globally** – YouTube, Netflix, Twitch, Disney+, and more. 

---

## Why AudioSync? 🤔   
- ✅ **DRM-safe** – Works on Netflix, Disney+, and other premium platforms.  
- ✅ **Full visual fidelity** – Any HDR or video enhancements remain untouched.  
- ✅ **Simple & lightweight** – No complex frame processing.

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
- Replaced frame delays with playback initialization delays.  
- Removed canvas-based rendering to preserve DRM/HDR.

---

## License 📜  
Licensed under **GPLv2**. See [LICENSE](LICENSE) for details.  

---

*Built with ❤️ and ☕ by Dzikran – because synced audio and vibrant visuals should coexist.*  