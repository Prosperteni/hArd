const statusBox = document.getElementById('active');
const onButton = document.getElementById('on');
const offButton = document.getElementById('off');

// Function to update the status text + color
function updateStatus(isOn) {
    if (isOn) {
        statusBox.textContent = '🎬 Automatically minimize Ads on YouTube';
        statusBox.classList.remove('bg-danger', 'text-light');
        statusBox.classList.add('bg-success', 'text-light');
    } else {
        statusBox.textContent = '⏸️ Ads minimization is paused';
        statusBox.classList.remove('bg-success', 'text-light');
        statusBox.classList.add('bg-danger', 'text-light');
    }
}

// Default state (ON)
updateStatus(true);

onButton.onclick = function() {
    chrome.runtime.sendMessage({ event: 'started' });
    updateStatus(true);
};

offButton.onclick = function() {
    chrome.runtime.sendMessage({ event: 'stopped' });
    updateStatus(false);
};


