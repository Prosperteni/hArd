// ============================================================================
// POPUP.JS - Popup window script
// Handles popup UI and communication with background service worker
// ============================================================================

console.log("[Popup] Script loaded");

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Popup] DOM loaded, initializing...");

    // Get DOM elements
    const statusBox = document.getElementById("statusBox");
    const onBtn = document.getElementById("on");
    const offBtn = document.getElementById("off");

    // Validate elements exist
    if (!statusBox) {
        console.error("[Popup] ERROR: statusBox element not found!");
        return;
    }
    if (!onBtn) {
        console.error("[Popup] ERROR: onBtn element not found!");
        return;
    }
    if (!offBtn) {
        console.error("[Popup] ERROR: offBtn element not found!");
        return;
    }

    console.log("[Popup] All elements found successfully");

    /**
     * Update the popup UI based on current state
     * @param {boolean} isOn - Whether the extension is enabled
     */
    function updateUI(isOn) {
        console.log("[Popup] updateUI called with:", isOn);

        try {
            // Update status message and color
            if (isOn) {
                statusBox.textContent = "🎬 Ads will be muted";
                statusBox.classList.remove("bg-danger");
                statusBox.classList.add("bg-success");
                
                // Update button states
                onBtn.classList.add("active");
                onBtn.style.opacity = "1";
                offBtn.classList.remove("active");
                offBtn.style.opacity = "0.7";
                
                console.log("[Popup] UI updated to ON state");
            } else {
                statusBox.textContent = "⏸️ Ads muting paused";
                statusBox.classList.remove("bg-success");
                statusBox.classList.add("bg-danger");
                
                // Update button states
                offBtn.classList.add("active");
                offBtn.style.opacity = "1";
                onBtn.classList.remove("active");
                onBtn.style.opacity = "0.7";
                
                console.log("[Popup] UI updated to OFF state");
            }
        } catch (error) {
            console.error("[Popup] Error updating UI:", error);
        }
    }

    /**
     * Load current state from background when popup opens
     */
    function loadCurrentState() {
        console.log("[Popup] Loading current state from background...");

        chrome.runtime.sendMessage(
            { type: "GET_STATE" },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error("[Popup] Communication error:", chrome.runtime.lastError);
                    // Default to ON if error
                    updateUI(true);
                    return;
                }

                if (response && response.enabled !== undefined) {
                    console.log("[Popup] State response:", response);
                    updateUI(response.enabled);
                } else {
                    console.warn("[Popup] Invalid response structure:", response);
                    // Default to ON
                    updateUI(true);
                }
            }
        );
    }

    // Load initial state when popup opens
    loadCurrentState();

    /**
     * ON Button Click Handler
     */
    onBtn.addEventListener('click', () => {
        console.log("[Popup] ON button clicked");

        chrome.runtime.sendMessage(
            { type: "SET_STATE", value: true },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error("[Popup] Error setting state:", chrome.runtime.lastError);
                    return;
                }

                console.log("[Popup] SET_STATE response:", response);
                
                if (response && response.status === "ok") {
                    updateUI(true);
                    console.log("[Popup] Extension turned ON");
                } else {
                    console.warn("[Popup] Unexpected response:", response);
                }
            }
        );
    });

    /**
     * OFF Button Click Handler
     */
    offBtn.addEventListener('click', () => {
        console.log("[Popup] OFF button clicked");

        chrome.runtime.sendMessage(
            { type: "SET_STATE", value: false },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error("[Popup] Error setting state:", chrome.runtime.lastError);
                    return;
                }

                console.log("[Popup] SET_STATE response:", response);
                
                if (response && response.status === "ok") {
                    updateUI(false);
                    console.log("[Popup] Extension turned OFF");
                } else {
                    console.warn("[Popup] Unexpected response:", response);
                }
            }
        );
    });

    console.log("[Popup] ✓ Event listeners attached");
    console.log("[Popup] ✓ Popup fully initialized");
});

console.log("[Popup] Script execution completed");