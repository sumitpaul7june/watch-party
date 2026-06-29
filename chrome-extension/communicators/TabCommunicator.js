// Tab Communicator: Responsible strictly for communicating with Netflix

export function forwardToActiveTab(data) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, data);
        }
    })
}