const statusBox = document.getElementById("statusBox");
const onBtn = document.getElementById("onBtn");
const offBtn = document.getElementById("offBtn");

// Load saved state when popup opens
chrome.runtime.sendMessage({ type: "GET_STATE" }, response => {
    updateUI(response.enabled);
});

function updateUI(isOn) {
    if (isOn) {
        statusBox.textContent = "🎬 Ads will be muted";
        statusBox.classList.remove("bg-danger");
        statusBox.classList.add("bg-success");
    } else {
        statusBox.textContent = "⏸️ Ads muting paused";
        statusBox.classList.remove("bg-success");
        statusBox.classList.add("bg-danger");
    }
}

// Button actions
onBtn.onclick = () => {
    chrome.runtime.sendMessage({ type: "SET_STATE", value: true });
    updateUI(true);
};

offBtn.onclick = () => {
    chrome.runtime.sendMessage({ type: "SET_STATE", value: false });
    updateUI(false);
};
