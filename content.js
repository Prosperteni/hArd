// ============================================================================
// CONTENT.JS - Runs on YouTube pages
// Handles ad detection and video muting/unmuting
// ============================================================================

console.log("[Content] Script injected into YouTube");

let muteEnabled = false;  // ✅ DEFAULT STATE: OFF
const AD_CHECK_INTERVAL = 500; // Check every 500ms for ads

// ============================================================================
// INITIALIZATION
// ============================================================================

// Get initial mute state from background script
chrome.runtime.sendMessage(
    { type: "GET_STATE" },
    (response) => {
        if (response && response.enabled !== undefined) {
            muteEnabled = response.enabled;
            console.log("[Content] Initial mute state loaded:", muteEnabled);
        } else {
            console.log("[Content] Using default state (OFF)");  // ✅ CHANGED
            muteEnabled = false;  // ✅ DEFAULT STATE: OFF
        }
    }
);

// ============================================================================
// MESSAGE LISTENERS
// ============================================================================

// Listen for state changes from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "STATE_UPDATE") {
        muteEnabled = message.enabled;
        console.log("[Content] State updated from background:", muteEnabled);
        sendResponse({ status: "ok", currentState: muteEnabled });
    }
    return true;
});

// ============================================================================
// AD DETECTION FUNCTIONS
// ============================================================================

/**
 * Check if YouTube ad is currently playing
 * Uses multiple detection methods for reliability
 */
function isAdPlaying() {
    try {
        // Method 1: YouTube ad message container
        const adMessage = document.querySelector('.ytp-ad-message-container');
        if (adMessage && adMessage.offsetParent !== null) {
            return true;
        }

        // Method 2: Video element with data-is-ad attribute
        const adVideo = document.querySelector('[data-is-ad="true"]');
        if (adVideo) {
            return true;
        }

        // Method 3: Skip ad button (visible during ads)
        const skipButton = document.querySelector('.ytp-ad-skip-button');
        if (skipButton && skipButton.offsetParent !== null) {
            return true;
        }

        // Method 4: Ad player div
        const adPlayer = document.querySelector('.video-ads');
        if (adPlayer && adPlayer.offsetParent !== null) {
            return true;
        }

        // Method 5: Check for "Ad" text in video title area
        const adIndicator = document.querySelector('.ytp-ad-preview-container');
        if (adIndicator && adIndicator.offsetParent !== null) {
            return true;
        }

        return false;
    } catch (error) {
        console.error("[Content] Error checking if ad is playing:", error);
        return false;
    }
}

/**
 * Get all video elements on the page
 */
function getVideoElements() {
    try {
        return document.querySelectorAll('video');
    } catch (error) {
        console.error("[Content] Error getting video elements:", error);
        return [];
    }
}

/**
 * Get the main YouTube player video element
 */
function getMainVideoElement() {
    try {
        // YouTube's main video player
        const mainVideo = document.querySelector('video.html5-main-video');
        return mainVideo || getVideoElements()[0];
    } catch (error) {
        console.error("[Content] Error getting main video:", error);
        return null;
    }
}

// ============================================================================
// MUTING FUNCTIONS
// ============================================================================

/**
 * Handle muting/unmuting based on ad status
 */
function handleVideoMuting() {
    if (!muteEnabled) {
        // If extension is disabled, unmute everything
        const videos = getVideoElements();
        videos.forEach(video => {
            try {
                if (video.muted) {
                    video.muted = false;
                }
            } catch (error) {
                console.error("[Content] Error unmuting video:", error);
            }
        });
        return;
    }

    // Extension is enabled - mute ads, unmute content
    const isAd = isAdPlaying();
    const videos = getVideoElements();

    videos.forEach(video => {
        try {
            if (!video || !video.parentElement) return;

            // Check if this is the main player
            const isMainPlayer = video.classList.contains('html5-main-video');

            if (isMainPlayer || videos.length === 1) {
                if (isAd) {
                    // Ad is playing - mute
                    if (!video.muted) {
                        video.muted = true;
                        console.log("[Content] ✓ Video muted (ad detected)");
                    }
                } else {
                    // Content is playing - unmute
                    if (video.muted) {
                        video.muted = false;
                        console.log("[Content] ✓ Video unmuted (ad ended)");
                    }
                }
            }
        } catch (error) {
            console.error("[Content] Error handling video muting:", error);
        }
    });
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Listen for play events to catch ads immediately
 */
document.addEventListener('play', (e) => {
    if (e.target && e.target.tagName === 'VIDEO' && muteEnabled) {
        // Small delay to let the page update
        setTimeout(() => {
            if (isAdPlaying()) {
                e.target.muted = true;
                console.log("[Content] ✓ Auto-muted on play event (ad detected)");
            }
        }, 100);
    }
}, true); // Use capture phase

/**
 * Listen for pause events
 */
document.addEventListener('pause', (e) => {
    if (e.target && e.target.tagName === 'VIDEO' && muteEnabled) {
        setTimeout(() => {
            if (!isAdPlaying() && e.target.muted) {
                e.target.muted = false;
                console.log("[Content] ✓ Auto-unmuted on pause event");
            }
        }, 100);
    }
}, true);

/**
 * Listen for timeupdate events (muting changes)
 */
document.addEventListener('timeupdate', (e) => {
    if (e.target && e.target.tagName === 'VIDEO' && muteEnabled) {
        const isAd = isAdPlaying();
        const shouldBeMuted = isAd;
        
        if (e.target.muted !== shouldBeMuted) {
            e.target.muted = shouldBeMuted;
            if (shouldBeMuted) {
                console.log("[Content] ✓ Muted during timeupdate");
            } else {
                console.log("[Content] ✓ Unmuted during timeupdate");
            }
        }
    }
}, true);

// ============================================================================
// MAIN MONITORING LOOP
// ============================================================================

/**
 * Continuous monitoring of ad status
 * Checks every 500ms and mutes/unmutes accordingly
 */
const monitoringInterval = setInterval(() => {
    try {
        handleVideoMuting();
    } catch (error) {
        console.error("[Content] Error in monitoring loop:", error);
    }
}, AD_CHECK_INTERVAL);

console.log("[Content] ✓ YouTube Smart Mute monitoring active (interval: " + AD_CHECK_INTERVAL + "ms)");

// ============================================================================
// PAGE MUTATION OBSERVER
// ============================================================================

/**
 * Watch for DOM changes that might indicate new ads or content
 */
const observer = new MutationObserver((mutations) => {
    try {
        // Only check on significant mutations
        let shouldCheck = false;

        for (const mutation of mutations) {
            // Check if ad-related elements were added/removed
            if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // Element node
                        const text = node.textContent || '';
                        if (text.includes('Ad') || node.classList.contains('ytp-ad')) {
                            shouldCheck = true;
                            break;
                        }
                    }
                }
            }
        }

        if (shouldCheck) {
            console.log("[Content] DOM change detected, checking for ads...");
            handleVideoMuting();
        }
    } catch (error) {
        console.error("[Content] Error in mutation observer:", error);
    }
});

/**
 * Start observing the document for changes
 */
const observerConfig = {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'data-is-ad'],
    attributeOldValue: false,
    characterData: false
};

// Only start observer after page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, observerConfig);
        console.log("[Content] Mutation observer started");
    });
} else {
    observer.observe(document.body, observerConfig);
    console.log("[Content] Mutation observer started");
}

// ============================================================================
// CLEANUP ON PAGE UNLOAD
// ============================================================================

window.addEventListener('beforeunload', () => {
    console.log("[Content] Page unloading, cleaning up...");
    clearInterval(monitoringInterval);
    observer.disconnect();
});

// ============================================================================
// FALLBACK: Force unmute if muting is disabled
// ============================================================================

/**
 * Additional safety check - unmute all videos if extension is disabled
 */
function ensureUnmutedIfDisabled() {
    if (!muteEnabled) {
        const videos = getVideoElements();
        videos.forEach(video => {
            try {
                if (video.muted) {
                    video.muted = false;
                }
            } catch (e) {
                // Silently ignore
            }
        });
    }
}

// Run periodically
setInterval(ensureUnmutedIfDisabled, 2000);

// ============================================================================
// INITIAL STATUS
// ============================================================================

console.log("[Content] Setup complete");
console.log("[Content] - Ad detection: ACTIVE");
console.log("[Content] - Auto-muting: " + (muteEnabled ? "ENABLED" : "DISABLED"));
console.log("[Content] - Monitor interval: " + AD_CHECK_INTERVAL + "ms");
console.log("[Content] ✓ Ready to mute YouTube ads");