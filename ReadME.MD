# 🎬 hArd — YouTube automatic Ad Mute

**hArd** is a Chrome extension that automatically detects YouTube ads and mutes them in real time while restoring audio for normal video playback.

It runs entirely on the client side and requires no external servers.

---

## 🚀 Features

- ✅ Automatically mutes YouTube ads  
- ✅ Restores audio when the ad ends  
- ✅ Works across multiple YouTube tabs  
- ✅ Persists ON/OFF state across browser sessions  
- ✅ Real-time detection using DOM monitoring  
- ✅ Robust ad detection using multiple signals  
- ✅ Lightweight and fast (runs every 500ms)

---

## 🧠 How It Works (Architecture)

The extension follows a three-layer design:

| Layer | File | Responsibility |
|------|------|----------------|
| **UI Layer** | `popup.html` + `popup.js` | User controls and status display |
| **Controller Layer** | `background.js` | Central state management and messaging |
| **Execution Layer** | `content.js` | Runs inside YouTube and mutes ads |

### Message Flow
1. User clicks **Enable/Disable** in the popup  
2. `popup.js` sends a message to `background.js`  
3. Background updates Chrome storage  
4. Background notifies all open YouTube tabs  
5. `content.js` reacts and starts/stops muting ads  

---

## 📂 Project Structure

