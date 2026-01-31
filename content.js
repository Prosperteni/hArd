let isEnabled = true;

function isAdPlaying() {
    return document.body.classList.contains("ad-showing");
}

function handleAudio() {
    const video = document.querySelector("video");
    if (!video) return;

    if (!isEnabled) return; // <-- KEY: do nothing if OFF

    if (isAdPlaying()) {
        video.muted = true;
        console.log("Ad detected → MUTED");
    } else {
        video.muted = false;
        console.log("Main video → SOUND ON");
    }
}

// Listen for toggle from popup
chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === "STATE_UPDATE") {
        isEnabled = msg.enabled;
        console.log("Mute feature:", isEnabled ? "ON" : "OFF");
    }
});

// Run every 500ms
setInterval(handleAudio, 500);
