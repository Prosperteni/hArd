// ============================================================================
// CONTENT.JS - Runs on YouTube pages
// Handles ad detection and video muting/unmuting
// ============================================================================

let muteEnabled = false; 
const AD_CHECK_INTERVAL = 1200;
let extensionMutedIt = false; // ← NEW: Track if extension muted the video

// ============================================================================
// INITIALIZATION
// ============================================================================

// Get initial mute state from background script
chrome.runtime.sendMessage(
    { type: "GET_STATE" },
    (response) => {
        if (response && response.enabled !== undefined) {
            muteEnabled = response.enabled;
        } else {
            muteEnabled = false; 
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
        // If extension was just disabled, unmute only if WE muted it
        if (!muteEnabled && extensionMutedIt) {
            const mainVideo = getMainVideoElement();
            if (mainVideo && mainVideo.muted) {
                mainVideo.muted = false;
                extensionMutedIt = false;
            }
        }
        
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
 * CRITICAL FIX: Only unmute if WE muted it, not if user muted it
 */
function handleVideoMuting() {
    if (!muteEnabled) return;  // Extension is OFF - do nothing

    const isAd = isAdPlaying();
    const mainVideo = getMainVideoElement();
    if (!mainVideo) return;

    // CASE 1: Ad is playing and video is NOT muted → MUTE IT
    if (isAd && !mainVideo.muted) {
        mainVideo.muted = true;
        extensionMutedIt = true; // ← Mark that WE muted it
    }

    // CASE 2: Ad ended and WE muted it earlier → UNMUTE IT
    // Only unmute if extensionMutedIt is true (meaning we're the ones who muted it)
    if (!isAd && mainVideo.muted && extensionMutedIt) {
        mainVideo.muted = false;
        extensionMutedIt = false; // ← Reset flag
    }

    // CASE 3: Ad ended but user manually muted → DO NOTHING
    // If extensionMutedIt is false, user muted it manually, so leave it alone
    if (!isAd && mainVideo.muted && !extensionMutedIt) {
    }
}

// ============================================================================
// MAIN MONITORING LOOP
// ============================================================================

/**
 * Continuous monitoring of ad status
 * Checks every 1200ms and mutes/unmutes accordingly
 */
const monitoringInterval = setInterval(() => {
    try {
        handleVideoMuting();
    } catch (error) {
    }
}, AD_CHECK_INTERVAL);


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
            handleVideoMuting();
        }
    } catch (error) {
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
    });
} else {
    observer.observe(document.body, observerConfig);
}

// ============================================================================
// DETECT USER MANUAL MUTE/UNMUTE
// ============================================================================

/**
 * Listen for user clicking the mute button
 * Reset our flag if user manually changes mute state
 */
function setupUserMuteDetection() {
    const mainVideo = getMainVideoElement();
    if (!mainVideo) return;

    // Listen for volume/mute changes
    mainVideo.addEventListener('volumechange', () => {
        // If video gets unmuted and we had muted it, user is overriding us
        if (!mainVideo.muted && extensionMutedIt) {
            extensionMutedIt = false;
        }
        
        // If video gets muted while no ad is playing, user did it manually
        if (mainVideo.muted && !isAdPlaying() && !extensionMutedIt) {
        }
    });
}

// Set up detection after a short delay to ensure video element exists
setTimeout(setupUserMuteDetection, 1000);

// Also re-setup when navigating to new video
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        extensionMutedIt = false; // Reset flag on new video
        setTimeout(setupUserMuteDetection, 1000);
    }
}).observe(document, { subtree: true, childList: true });

// ============================================================================
// CLEANUP ON PAGE UNLOAD
// ============================================================================

window.addEventListener('beforeunload', () => {
    clearInterval(monitoringInterval);
    observer.disconnect();
    extensionMutedIt = false; // Reset flag
});

// ============================================================================
// FALLBACK: Force unmute if extension disabled
// ============================================================================

/**
 * Additional safety check - unmute if extension is disabled AND we muted it
 */
function ensureUnmutedIfDisabled() {
    if (!muteEnabled && extensionMutedIt) {
        const videos = getVideoElements();
        videos.forEach(video => {
            try {
                if (video.muted) {
                    video.muted = false;
                    extensionMutedIt = false;
                }
            } catch (e) {
                // Silently ignore
            }
        });
    }
}

// Run periodically as safety net
setInterval(ensureUnmutedIfDisabled, 2000);
