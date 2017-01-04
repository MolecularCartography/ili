chrome.browserAction.onClicked.addListener(function(activeTab) {
  chrome.tabs.create({ url: 'index.html' });
});
