chrome.runtime.onInstalled.addListener(details => {
    console.log("Extension installed:", details.reason);
});



chrome.runtime.onMessage.addListener(data => { 
    switch (data.event) {
        case 'onStop':
            console.log("stopped");
            break;

        case 'onStart':
            console.log("started");
            break;

        default:
            console.log("unknown event:", data);
    }
});
