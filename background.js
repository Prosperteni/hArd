chrome.runtime.onMessage.addListner(data => {
    switch(data.event) {
        case 'onStop':
            break;
        case 'onStart':
            break;
        default:
            break;
    }
})