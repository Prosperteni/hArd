/**
     * YouTube Smart Mute - Enhanced Background Service Worker
     * Handles state management, messaging, and cross-tab communication
     */

    // Store configuration
    const CONFIG = {
        storage: {
            enabled: 'youtubeMute_enabled',
            statistics: 'youtubeMute_stats',
            settings: 'youtubeMute_settings'
        },
        defaults: {
            enabled: false,  // ✅ DEFAULT STATE: OFF
            muteAds: true,
            muteOtherVideos: false,
            logStats: true
        }
    };

    // Initialize extension on install
    chrome.runtime.onInstalled.addListener(async () => {
        try {
            const storage = await chrome.storage.local.get(null);
            
            // Set defaults if not already set
            if (!storage[CONFIG.storage.enabled]) {
                await chrome.storage.local.set({
                    [CONFIG.storage.enabled]: CONFIG.defaults.enabled,  // ✅ DEFAULT: false (OFF)
                    [CONFIG.storage.settings]: {
                        muteAds: CONFIG.defaults.muteAds,
                        muteOtherVideos: CONFIG.defaults.muteOtherVideos,
                        logStats: CONFIG.defaults.logStats
                    },
                    [CONFIG.storage.statistics]: {
                        adsMuted: 0,
                        sessionStartTime: Date.now(),
                        totalSessionTime: 0
                    }
                });
            }
            
            console.log('YouTube Smart Mute initialized - Default state: OFF');
        } catch (error) {
            console.error('Error initializing extension:', error);
        }
    });

    // Handle messages from popup and content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        (async () => {
            try {
                switch (message.type) {
                    case "GET_STATE":
                        await handleGetState(sendResponse);
                        break;
                        
                    case "SET_STATE":
                        await handleSetState(message.value, sendResponse);
                        break;
                        
                    case "GET_STATS":
                        await handleGetStats(sendResponse);
                        break;
                        
                    case "RESET_STATS":
                        await handleResetStats(sendResponse);
                        break;
                        
                    case "UPDATE_SETTINGS":
                        await handleUpdateSettings(message.settings, sendResponse);
                        break;
                        
                    case "GET_SETTINGS":
                        await handleGetSettings(sendResponse);
                        break;
                        
                    case "LOG_AD_MUTED":
                        await handleLogAdMuted(sender.url, sendResponse);
                        break;
                        
                    default:
                        sendResponse({ error: 'Unknown message type' });
                }
            } catch (error) {
                console.error('Error handling message:', error);
                sendResponse({ error: error.message });
            }
        })();
        
        return true; // Keep channel open for async response
    });

    // Handler functions
    async function handleGetState(sendResponse) {
        const storage = await chrome.storage.local.get(CONFIG.storage.enabled);
        const enabled = storage[CONFIG.storage.enabled] ?? CONFIG.defaults.enabled;  // ✅ DEFAULT: false (OFF)
        sendResponse({ 
            enabled: enabled,
            timestamp: Date.now()
        });
    }

    async function handleSetState(value, sendResponse) {
        await chrome.storage.local.set({ [CONFIG.storage.enabled]: value });
        
        // Notify all YouTube tabs
        const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: "STATE_UPDATE",
                    enabled: value
                });
            } catch (error) {
                console.warn(`Could not update tab ${tab.id}:`, error);
            }
        }
        
        sendResponse({ status: "ok", enabled: value });
    }

    async function handleGetStats(sendResponse) {
        const storage = await chrome.storage.local.get(CONFIG.storage.statistics);
        const stats = storage[CONFIG.storage.statistics] || {
            adsMuted: 0,
            sessionStartTime: Date.now(),
            totalSessionTime: 0
        };
        
        sendResponse(stats);
    }

    async function handleResetStats(sendResponse) {
        await chrome.storage.local.set({
            [CONFIG.storage.statistics]: {
                adsMuted: 0,
                sessionStartTime: Date.now(),
                totalSessionTime: 0
            }
        });
        
        sendResponse({ status: "ok", message: "Statistics reset" });
    }

    async function handleUpdateSettings(settings, sendResponse) {
        const storage = await chrome.storage.local.get(CONFIG.storage.settings);
        const currentSettings = storage[CONFIG.storage.settings] || CONFIG.defaults;
        
        const updatedSettings = { ...currentSettings, ...settings };
        
        await chrome.storage.local.set({
            [CONFIG.storage.settings]: updatedSettings
        });
        
        sendResponse({ status: "ok", settings: updatedSettings });
    }

    async function handleGetSettings(sendResponse) {
        const storage = await chrome.storage.local.get(CONFIG.storage.settings);
        const settings = storage[CONFIG.storage.settings] || CONFIG.defaults;
        sendResponse(settings);
    }

    async function handleLogAdMuted(url, sendResponse) {
        const storage = await chrome.storage.local.get(CONFIG.storage.statistics);
        let stats = storage[CONFIG.storage.statistics] || {
            adsMuted: 0,
            sessionStartTime: Date.now(),
            totalSessionTime: 0
        };
        
        stats.adsMuted = (stats.adsMuted || 0) + 1;
        stats.lastAdMuteTime = Date.now();
        
        await chrome.storage.local.set({
            [CONFIG.storage.statistics]: stats
        });
        
        sendResponse({ status: "ok", totalMuted: stats.adsMuted });
    }

    // Listen for tab updates to inject content script if needed
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url?.includes('youtube.com')) {
            // Verify content script is loaded
            chrome.tabs.sendMessage(tabId, { type: "PING" }).catch(() => {
                // Content script might not be loaded yet, will inject on manifest reload
            });
        }
    });

    // Handle extension icon click - toggle state
    chrome.action.onClicked.addListener(async (tab) => {
        if (!tab.url?.includes('youtube.com')) return;
        
        const storage = await chrome.storage.local.get(CONFIG.storage.enabled);
        const currentState = storage[CONFIG.storage.enabled] ?? CONFIG.defaults.enabled;  // ✅ DEFAULT: false (OFF)
        const newState = !currentState;
        
        await chrome.storage.local.set({ [CONFIG.storage.enabled]: newState });
        
        // Update the tab
        try {
            await chrome.tabs.sendMessage(tab.id, {
                type: "STATE_UPDATE",
                enabled: newState
            });
        } catch (error) {
            console.warn('Could not update tab:', error);
        }
    });

    console.log('YouTube Smart Mute background service worker loaded - Default state: OFF');