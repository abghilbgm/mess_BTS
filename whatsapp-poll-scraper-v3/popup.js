let scrapedData = [];

document.getElementById('startBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('downloadBtn').disabled = true;
  document.getElementById('status').innerText = 'Scraping...';
  
  chrome.tabs.sendMessage(tab.id, { action: 'START_SCRAPING' });
});

document.getElementById('stopBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'STOP_SCRAPING' });
  
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
  document.getElementById('downloadBtn').disabled = false;
  document.getElementById('status').innerText = 'Stopped.';
});

document.getElementById('downloadBtn').addEventListener('click', () => {
  if (scrapedData.length === 0) {
    alert('No data to download yet.');
    return;
  }

  let fileContent = '';
  scrapedData.forEach(pollData => {
    fileContent += '===POLL_START===\n';
    fileContent += pollData + '\n';
    fileContent += '===POLL_END===\n\n';
  });

  const blob = new Blob([fileContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'whatsapp_polls.txt';
  a.click();
  URL.revokeObjectURL(url);
});

// Listen for updates from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'POLL_SCRAPED') {
    scrapedData.push(request.data);
    document.getElementById('count').innerText = scrapedData.length;
  }
  if (request.action === 'SCRAPING_FINISHED') {
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('downloadBtn').disabled = false;
    document.getElementById('status').innerText = 'Done!';
  }
});
