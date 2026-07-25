let isScraping = false;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const findScrollContainer = () => {
  const mainDiv = document.querySelector('#main');
  if (!mainDiv) return null;
  let msgList = mainDiv.querySelector('[role="application"]') || mainDiv.querySelector('[aria-label="Message list. Press right arrow key on a message to open message context menu."]');
  if (msgList) return msgList;

  const divs = mainDiv.querySelectorAll('div');
  for (let d of divs) {
    if (d.scrollHeight > d.clientHeight) {
      return d;
    }
  }
  return null;
};

const extractPollData = async () => {
  // WhatsApp changed "View votes" to open in a right sidebar, not a modal dialog!
  // We will wait for the Close/Back button to appear in the new sidebar.
  let closeBtn = null;
  for (let i = 0; i < 15; i++) {
    closeBtn = document.querySelector('div[aria-label="Close"], button[aria-label="Close"], div[aria-label="Back"], button[aria-label="Back"], span[data-icon="x"], span[data-icon="back"]');
    if (closeBtn) break;
    await wait(200);
  }
  
  if (!closeBtn) return null; // Sidebar didn't open
  
  await wait(800); // Give it time to load the voters list
  
  // Find the sidebar container by traversing up until we find a large box
  let panel = closeBtn;
  while (panel && panel.parentElement && panel.parentElement.id !== 'app') {
    panel = panel.parentElement;
    if (panel.clientWidth > 250 && panel.clientHeight > 400) {
      break;
    }
  }
  
  const text = panel ? (panel.innerText || panel.textContent) : '';
  
  // Click the close button
  const clickable = closeBtn.closest('div[role="button"], button') || closeBtn;
  clickable.click();
  
  // Wait for sidebar to close
  for (let i = 0; i < 10; i++) {
    const stillOpen = document.querySelector('div[aria-label="Close"], button[aria-label="Close"], div[aria-label="Back"], button[aria-label="Back"], span[data-icon="x"], span[data-icon="back"]');
    if (!stillOpen) break;
    await wait(200);
  }
  
  return text;
};

const processPolls = async () => {
  while (isScraping) {
    const allDivs = Array.from(document.querySelectorAll('div, span, button'));
    const buttons = allDivs.filter(b => {
      const text = (b.innerText || b.textContent || '').trim().toLowerCase();
      return text === 'view votes' && !b.closest('[data-scraped="true"]') && !b.hasAttribute('data-scraped');
    });
    
    if (buttons.length > 0) {
      for (const btn of buttons) {
        if (!isScraping) break;
        
        const clickable = btn.closest('div[role="button"], button') || btn;
        
        clickable.setAttribute('data-scraped', 'true');
        btn.setAttribute('data-scraped', 'true'); 
        
        clickable.scrollIntoView({ block: 'center', behavior: 'smooth' });
        await wait(500);
        
        clickable.click();
        
        const data = await extractPollData();
        if (data) {
          chrome.runtime.sendMessage({ action: 'POLL_SCRAPED', data });
        } 
      }
    } else {
      const scroller = findScrollContainer();
      if (scroller) {
        scroller.scrollBy({ top: -800, behavior: 'smooth' });
        await wait(1500); 
      } else {
        const main = document.querySelector('#main');
        if (main) {
          main.scrollBy({ top: -800, behavior: 'smooth' });
        }
        await wait(1500);
      }
    }
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'START_SCRAPING') {
    if (!isScraping) {
      isScraping = true;
      processPolls();
    }
  } else if (request.action === 'STOP_SCRAPING') {
    isScraping = false;
  }
});
