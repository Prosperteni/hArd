let isEnabled = true; // default ON

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ youtubeMute: true });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SET_STATE") {
        isEnabled = message.value;
        chrome.storage.local.set({ youtubeMute: isEnabled });

        // Tell active tab to update behavior
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: "STATE_UPDATE",
                    enabled: isEnabled
                });
            }
        });

        sendResponse({ status: "ok" });
    }

    if (message.type === "GET_STATE") {
        sendResponse({ enabled: isEnabled });
    }

    return true;
});
