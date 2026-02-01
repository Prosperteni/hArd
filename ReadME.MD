# hArd — YouTube automatic Ad mute extension?`

**hArd** is a Chrome extension that automatically detects YouTube ads and mutes them in real time and then restores audio for normal video playback.

It runs entirely on the client side and requires no external servers.

---

## Features?:

- ✅ Automatically mutes YouTube ads  
- ✅ Restores audio when the ad ends  
- ✅ Works across multiple YouTube tabs  
- ✅ Persists ON/OFF state across browser sessions  
- ✅ Real-time detection using DOM monitoring  
- ✅ Robust ad detection using multiple conditions  
- ✅ Lightweight and fast (runs every 500ms)

---

## How It Works?!

### Message Flow
1. User clicks **Enable/Disable** in the popup  
2. `popup.js` sends a message to `background.js`  
3. Background updates Chrome storage  
4. Background notifies all open YouTube tabs  
5. `content.js` reacts and starts/stops muting ads  

---

## Project Structure?>
hArd/
│
├── manifest.json
├── background.js
├── content.js
│
├── popup/
│ └── popup.html
│ └── popup.js
│
└── icons/
├── icon16.png
├── icon32.png
├── icon48.png
└── icon128.png

---

## Installation (Developer Mode)?&

1. Open **Chrome**
2. Go to:  chrome://extensions/
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select this project folder

---

## Permissions Used?@

- `activeTab` – communicate with current tab  
- `scripting` – content script injection  
- `storage` – save ON/OFF state  

---

## Limitations?~

- YouTube UI changes may break selectors temporarily  
- Does not block ads visually — only mutes them  
- Requires a refresh if YouTube changes major structure  

---

## 🤝 Contributing

Pull requests are welcome.

If you improve ad detection logic or UI, feel free to submit a PR.

---

**Built for smarter YouTube viewing.**

