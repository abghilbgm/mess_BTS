// Month Helper
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Application State
let appState = {
  voters: [], // Array of { id, name, option, monthYear, rawDate, isManual }
  optionsMapping: {}, // Map of optionName -> { breakfast: 0, lunchVeg: 0, lunchNonVeg: 0, dinnerVeg: 0, dinnerNonVeg: 0 }
  costs: {
    breakfast: 0,
    lunchVeg: 0,
    lunchNonVeg: 0,
    dinnerVeg: 0,
    dinnerNonVeg: 0
  },
  pollQuestion: "WhatsApp Meal Poll",
  searchQuery: "",
  selectedMonth: "all", // "all" or specific month like "July 2026"
  editingVoterId: null
};

// DOM Elements
const elements = {
  rawTextInput: document.getElementById('raw-text-input'),
  fileInput: document.getElementById('file-input'),
  dropZone: document.getElementById('drop-zone'),
  fileInfo: document.getElementById('file-info'),
  fileName: document.getElementById('file-name'),
  removeFileBtn: document.getElementById('remove-file-btn'),
  parseBtn: document.getElementById('parse-btn'),
  resultsContainer: document.getElementById('results-container'),
  mappingContainer: document.getElementById('mapping-container'),
  votersTableBody: document.getElementById('voters-table-body'),
  searchBar: document.getElementById('search-bar'),
  searchInput: document.getElementById('search-input'),
  addPersonBtn: document.getElementById('add-person-btn'),
  monthFilter: document.getElementById('month-filter'),
  
  // Stats
  totalBreakfastCount: document.getElementById('total-breakfast-count'),
  totalLunchVegCount: document.getElementById('total-lunchveg-count'),
  totalLunchNonVegCount: document.getElementById('total-lunchnonveg-count'),
  totalDinnerVegCount: document.getElementById('total-dinnerveg-count'),
  totalDinnerNonVegCount: document.getElementById('total-dinnernonveg-count'),
  totalMealsCount: document.getElementById('total-meals-count'),
  totalCostVal: document.getElementById('total-cost-val'),
  
  // Cost inputs
  breakfastCostInput: document.getElementById('breakfast-cost-input'),
  lunchVegCostInput: document.getElementById('lunch-veg-cost-input'),
  lunchNonVegCostInput: document.getElementById('lunch-nonveg-cost-input'),
  dinnerVegCostInput: document.getElementById('dinner-veg-cost-input'),
  dinnerNonVegCostInput: document.getElementById('dinner-nonveg-cost-input'),
  
  // Copy box
  whatsappSummary: document.getElementById('whatsapp-summary'),
  copyBtn: document.getElementById('copy-btn'),
  exportCsvBtn: document.getElementById('export-csv-btn'),
  
  // Toast
  toast: document.getElementById('toast'),
  toastText: document.getElementById('toast-text'),
  
  // Modal
  editModal: document.getElementById('edit-modal'),
  modalTitle: document.getElementById('modal-title'),
  editName: document.getElementById('edit-name'),
  editOption: document.getElementById('edit-option'),
  editMonth: document.getElementById('edit-month'),
  modalCancel: document.getElementById('modal-cancel'),
  modalSave: document.getElementById('modal-save'),
  
  // Tabs
  tabPaste: document.getElementById('tab-paste'),
  tabUpload: document.getElementById('tab-upload'),
  tabPublish: document.getElementById('tab-publish'),
  contentPaste: document.getElementById('content-paste'),
  contentUpload: document.getElementById('content-upload'),
  contentPublish: document.getElementById('content-publish')
};

// Global variables for tracking uploaded file
let uploadedFileContent = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initDefaults();
});

function initDefaults() {
  appState.costs.breakfast = parseFloat(localStorage.getItem('breakfastCost') || '0');
  appState.costs.lunchVeg = parseFloat(localStorage.getItem('lunchVegCost') || '0');
  appState.costs.lunchNonVeg = parseFloat(localStorage.getItem('lunchNonVegCost') || '0');
  appState.costs.dinnerVeg = parseFloat(localStorage.getItem('dinnerVegCost') || '0');
  appState.costs.dinnerNonVeg = parseFloat(localStorage.getItem('dinnerNonVegCost') || '0');
  
  elements.breakfastCostInput.value = appState.costs.breakfast || '';
  elements.lunchVegCostInput.value = appState.costs.lunchVeg || '';
  elements.lunchNonVegCostInput.value = appState.costs.lunchNonVeg || '';
  elements.dinnerVegCostInput.value = appState.costs.dinnerVeg || '';
  elements.dinnerNonVegCostInput.value = appState.costs.dinnerNonVeg || '';
}

// Set up event listeners
function setupEventListeners() {
  // Tab Swapping
  elements.tabPaste.addEventListener('click', () => switchTab('paste'));
  elements.tabUpload.addEventListener('click', () => switchTab('upload'));
  elements.tabPublish.addEventListener('click', () => switchTab('publish'));
  
  // Drag and Drop
  elements.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.dropZone.classList.add('dragover');
  });
  
  elements.dropZone.addEventListener('dragleave', () => {
    elements.dropZone.classList.remove('dragover');
  });
  
  elements.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
  
  elements.dropZone.addEventListener('click', () => {
    elements.fileInput.click();
  });
  
  elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });
  
  elements.removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetFileInput();
  });
  
  // Actions
  elements.parseBtn.addEventListener('click', handleParse);
  elements.copyBtn.addEventListener('click', copySummaryToClipboard);
  elements.exportCsvBtn.addEventListener('click', exportToCSV);
  elements.addPersonBtn.addEventListener('click', openAddPersonModal);
  
  // Month filter change
  elements.monthFilter.addEventListener('change', (e) => {
    appState.selectedMonth = e.target.value;
    updateCalculations();
  });
  
  // Live Cost Updates
  elements.breakfastCostInput.addEventListener('input', (e) => {
    appState.costs.breakfast = parseFloat(e.target.value) || 0;
    localStorage.setItem('breakfastCost', appState.costs.breakfast);
    updateCalculations();
  });
  elements.lunchVegCostInput.addEventListener('input', (e) => {
    appState.costs.lunchVeg = parseFloat(e.target.value) || 0;
    localStorage.setItem('lunchVegCost', appState.costs.lunchVeg);
    updateCalculations();
  });
  elements.lunchNonVegCostInput.addEventListener('input', (e) => {
    appState.costs.lunchNonVeg = parseFloat(e.target.value) || 0;
    localStorage.setItem('lunchNonVegCost', appState.costs.lunchNonVeg);
    updateCalculations();
  });
  elements.dinnerVegCostInput.addEventListener('input', (e) => {
    appState.costs.dinnerVeg = parseFloat(e.target.value) || 0;
    localStorage.setItem('dinnerVegCost', appState.costs.dinnerVeg);
    updateCalculations();
  });
  elements.dinnerNonVegCostInput.addEventListener('input', (e) => {
    appState.costs.dinnerNonVeg = parseFloat(e.target.value) || 0;
    localStorage.setItem('dinnerNonVegCost', appState.costs.dinnerNonVeg);
    updateCalculations();
  });
  
  // Search
  elements.searchInput.addEventListener('input', (e) => {
    appState.searchQuery = e.target.value.toLowerCase().trim();
    renderVotersTable();
  });
  
  // Modal events
  elements.modalCancel.addEventListener('click', closeModal);
  elements.modalSave.addEventListener('click', saveVoterEdit);
  elements.editModal.addEventListener('click', (e) => {
    if (e.target === elements.editModal) closeModal();
  });
}

// Tab switcher
function switchTab(tabType) {
  elements.tabPaste.classList.remove('active');
  elements.tabUpload.classList.remove('active');
  elements.tabPublish.classList.remove('active');
  
  elements.contentPaste.classList.remove('active');
  elements.contentUpload.classList.remove('active');
  elements.contentPublish.classList.remove('active');
  
  if (tabType === 'paste') {
    elements.tabPaste.classList.add('active');
    elements.contentPaste.classList.add('active');
  } else if (tabType === 'upload') {
    elements.tabUpload.classList.add('active');
    elements.contentUpload.classList.add('active');
  } else if (tabType === 'publish') {
    elements.tabPublish.classList.add('active');
    elements.contentPublish.classList.add('active');
  }
}

// File Handler
function handleFile(file) {
  if (!file.name.endsWith('.txt')) {
    showToast('❌ Only text (.txt) chat exports are supported.', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedFileContent = e.target.result;
    elements.fileName.textContent = `${file.name} (${formatBytes(file.size)})`;
    elements.fileInfo.style.display = 'flex';
    elements.dropZone.style.display = 'none';
    showToast('📄 File loaded successfully!', 'success');
  };
  reader.readAsText(file);
}

function resetFileInput() {
  uploadedFileContent = null;
  elements.fileInput.value = '';
  elements.fileInfo.style.display = 'none';
  elements.dropZone.style.display = 'flex';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Chronological sorting for month-year strings (e.g., "June 2026", "July 2026")
function sortMonthYearStrings(arr) {
  const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return arr.sort((a, b) => {
    const [m1, y1] = a.split(' ');
    const [m2, y2] = b.split(' ');
    
    const yearDiff = parseInt(y1) - parseInt(y2);
    if (yearDiff !== 0) return yearDiff;
    
    return monthOrder.indexOf(m1) - monthOrder.indexOf(m2);
  });
}

// Smart Parser Logic for Copied votes text
function parseCopiedVotesText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let parsedQuestion = "WhatsApp Poll Results";
  const votes = [];
  const optionsDetected = new Set();
  
  if (lines.length === 0) return null;
  
  let startIndex = 0;
  if (lines[0].toLowerCase().includes('poll results') || lines[0].toLowerCase().includes('poll info')) {
    startIndex = 1;
  }
  
  if (startIndex < lines.length) {
    const isVoteCount = lines[startIndex].match(/^(\d+|no)\s+votes?$/i);
    const isNextVoteCount = lines[startIndex + 1] && lines[startIndex + 1].match(/^(\d+|no)\s+votes?$/i);
    
    if (!isVoteCount && !isNextVoteCount) {
      parsedQuestion = lines[startIndex];
      startIndex++;
    }
  }
  
  const d = new Date();
  const currentMonthYear = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  let currentOption = null;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const voteCountMatch = line.match(/^(\d+|no)\s+votes?$/i);
    
    if (voteCountMatch) {
      if (i > startIndex) {
        const possibleOption = lines[i - 1];
        if (!possibleOption.startsWith('•') && !possibleOption.startsWith('-')) {
          currentOption = possibleOption;
          optionsDetected.add(currentOption);
          continue;
        }
      }
    }
    
    const nextLine = lines[i + 1];
    if (nextLine && nextLine.match(/^(\d+|no)\s+votes?$/i)) {
      continue;
    }
    
    if (currentOption && !line.match(/^(\d+|no)\s+votes?$/i)) {
      let voterName = line.replace(/^[•\-\*\s\d]+\.?\s*/, '').trim();
      const lowerName = voterName.toLowerCase();
      if (
        lowerName === 'poll results' ||
        lowerName === 'view votes' ||
        lowerName === 'back' ||
        lowerName === 'poll info' ||
        voterName.match(/^\d+:\d+(\s*(am|pm))?$/i) ||
        voterName === ''
      ) {
        continue;
      }
      
      votes.push({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        name: voterName,
        option: currentOption,
        monthYear: currentMonthYear,
        rawDate: "current",
        isManual: false
      });
    }
  }
  
  return {
    question: parsedQuestion,
    votes,
    options: Array.from(optionsDetected)
  };
}

// Highly robust and flexible chat message parser
function parseChatExportText(text) {
  const lines = text.split('\n');
  const messages = [];
  
  const androidRegex = /^(\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[a-zA-Z]{2})?)\s*-\s*([^:]+):\s*(.*)$/i;
  const iosRegex = /^\[(\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[a-zA-Z]{2})?)\]\s*([^:]+):\s*(.*)$/i;
  
  const rawDates = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const match = line.match(iosRegex) || line.match(androidRegex);
    if (match) {
      const rawDateStr = match[1];
      const timeStr = match[2];
      const sender = match[3].trim();
      const messageText = match[4].trim();
      
      if (
        sender.toLowerCase() === 'system' ||
        messageText.includes('Messages and calls are end-to-end encrypted') ||
        messageText.includes('<Media omitted>') ||
        messageText.includes('changed the subject') ||
        messageText.includes('created group') ||
        messageText.includes('added') ||
        messageText.includes('joined') ||
        messageText.includes('left')
      ) {
        continue;
      }
      
      messages.push({
        rawDate: rawDateStr,
        time: timeStr,
        sender,
        text: messageText
      });
      rawDates.push(rawDateStr);
    } else {
      if (messages.length > 0) {
        messages[messages.length - 1].text += ' ' + line;
      }
    }
  }
  
  if (messages.length === 0) return null;
  
  let format = 'DMY'; 
  let p1Max = 0;
  let p2Max = 0;
  
  for (const dateStr of rawDates) {
    const parts = dateStr.split(/[/\-.]/);
    if (parts.length >= 2) {
      const p1 = parseInt(parts[0]);
      const p2 = parseInt(parts[1]);
      if (!isNaN(p1) && p1 > p1Max) p1Max = p1;
      if (!isNaN(p2) && p2 > p2Max) p2Max = p2;
    }
  }
  
  if (p1Max > 12 && p2Max <= 12) {
    format = 'DMY'; 
  } else if (p2Max > 12 && p1Max <= 12) {
    format = 'MDY'; 
  }
  
  const votes = [];
  const optionsDetected = new Set();
  
  messages.forEach(msg => {
    const parts = msg.rawDate.split(/[/\-.]/);
    let day = 1, month = 0, year = 2026;
    
    if (parts.length >= 3) {
      let p1 = parseInt(parts[0]);
      let p2 = parseInt(parts[1]);
      let p3 = parseInt(parts[2]);
      
      if (p3 < 100) {
        year = 2000 + p3;
      } else if (p3 >= 100) {
        year = p3;
      } else if (p1 > 1000) {
        year = p1;
        p1 = p2;
        p2 = p3;
      }
      
      if (format === 'DMY') {
        day = p1;
        month = p2 - 1;
      } else {
        day = p2;
        month = p1 - 1;
      }
    }
    
    if (month < 0 || month > 11) month = 0;
    const monthYear = `${monthNames[month]} ${year}`;
    
    let cleanText = msg.text.trim();
    const voteMatch = cleanText.match(/^voted for\s+["']?([^"'\n]+)["']?$/i);
    if (voteMatch) {
      cleanText = voteMatch[1];
    }
    
    if (cleanText.length > 0 && cleanText.length <= 40) {
      votes.push({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        name: msg.sender,
        option: cleanText,
        monthYear,
        rawDate: msg.rawDate,
        isManual: false
      });
      optionsDetected.add(cleanText);
    }
  });
  
  return {
    question: "WhatsApp Chat Export",
    votes,
    options: Array.from(optionsDetected)
  };
}

// Auto-detect meal type based on option text
function getInitialMealMapping(option) {
  const text = option.toLowerCase();
  const mapping = {
    breakfast: 0,
    lunchVeg: 0,
    lunchNonVeg: 0,
    dinnerVeg: 0,
    dinnerNonVeg: 0
  };
  
  // Guess Breakfast
  if (text.includes('breakfast') || text.includes('bf') || text.includes('morning')) {
    mapping.breakfast = 1;
  }
  
  // Guess Lunch Veg or Non-Veg
  if (text.includes('lunch') || text.includes('noon') || text.includes('afternoon')) {
    if (
      text.includes('non-veg') || 
      text.includes('nonveg') || 
      text.includes('nv') || 
      text.includes('chicken') || 
      text.includes('mutton') || 
      text.includes('fish') || 
      text.includes('meat')
    ) {
      mapping.lunchNonVeg = 1;
    } else {
      mapping.lunchVeg = 1; // Default lunch to Veg
    }
  }
  
  // Guess Dinner Veg or Non-Veg
  if (text.includes('dinner') || text.includes('night')) {
    if (
      text.includes('non-veg') || 
      text.includes('nonveg') || 
      text.includes('nv') || 
      text.includes('chicken') || 
      text.includes('mutton') || 
      text.includes('fish') || 
      text.includes('meat')
    ) {
      mapping.dinnerNonVeg = 1;
    } else {
      mapping.dinnerVeg = 1; // Default dinner to Veg
    }
  }
  
  // Fallbacks if no key meal type matched
  if (mapping.breakfast === 0 && mapping.lunchVeg === 0 && mapping.lunchNonVeg === 0 && mapping.dinnerVeg === 0 && mapping.dinnerNonVeg === 0) {
    if (text.includes('non-veg') || text.includes('nonveg') || text.includes('nv') || text.includes('chicken')) {
      mapping.lunchNonVeg = 1;
    } else if (text.includes('veg')) {
      mapping.lunchVeg = 1;
    } else if (text.includes('bf') || text.includes('breakfast')) {
      mapping.breakfast = 1;
    } else if (text.includes('no') || text.includes('not') || text.includes('none') || text.includes('out') || text.includes('cancel')) {
      // Keep all at 0
    } else {
      mapping.lunchVeg = 1; // absolute fallback
    }
  }
  
  return mapping;
}

// Master Parse Trigger
function handleParse() {
  let results = null;
  const isPasteTab = elements.tabPaste.classList.contains('active');
  
  if (isPasteTab) {
    const text = elements.rawTextInput.value.trim();
    if (!text) {
      showToast('⚠️ Please paste WhatsApp Poll results text first.', 'error');
      return;
    }
    // Auto-detect if pasted text is actually a chat export (starts with Date or [Date)
    if (text.match(/^\[?\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4}/)) {
      results = parseChatExportText(text);
    } else {
      results = parseCopiedVotesText(text);
    }
  } else {
    if (!uploadedFileContent) {
      showToast('⚠️ Please upload a chat export .txt file first.', 'error');
      return;
    }
    results = parseChatExportText(uploadedFileContent);
  }
  
  if (!results || results.votes.length === 0) {
    showToast('❌ No votes could be parsed. Check your format and try again.', 'error');
    return;
  }
  
  // Load to global state
  appState.pollQuestion = results.question;
  appState.voters = results.votes;
  appState.selectedMonth = "all"; // Reset to show all initially
  
  // Initialize Options Mapping for newly detected options
  results.options.forEach(option => {
    if (!appState.optionsMapping[option]) {
      appState.optionsMapping[option] = getInitialMealMapping(option);
    }
  });
  
  // Populate Month Filter Dropdown
  populateMonthFilter();
  
  // Display Results
  elements.resultsContainer.style.display = 'block';
  elements.resultsContainer.classList.add('fade-in');
  
  renderMappingConfig();
  updateCalculations();
  showToast('🎉 Chat data analyzed successfully!', 'success');
}

// Populates the Month Filter dropdown from parsed data
function populateMonthFilter() {
  const months = getUniqueMonths();
  
  elements.monthFilter.innerHTML = '<option value="all">All Months (Cumulative)</option>';
  months.forEach(m => {
    elements.monthFilter.innerHTML += `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`;
  });
  
  elements.monthFilter.value = "all";
}

function getUniqueMonths() {
  const monthsSet = new Set();
  appState.voters.forEach(v => {
    if (v.monthYear) monthsSet.add(v.monthYear);
  });
  return sortMonthYearStrings(Array.from(monthsSet));
}

// Render Mapping Controls
function renderMappingConfig() {
  elements.mappingContainer.innerHTML = '';
  
  const options = Object.keys(appState.optionsMapping);
  if (options.length === 0) {
    elements.mappingContainer.innerHTML = '<p class="text-muted">No options configured.</p>';
    return;
  }
  
  options.forEach(option => {
    const config = appState.optionsMapping[option];
    const item = document.createElement('div');
    item.className = 'mapping-item';
    
    const label = document.createElement('span');
    label.className = 'mapping-label';
    label.textContent = option;
    label.title = option;
    
    const inputsContainer = document.createElement('div');
    inputsContainer.className = 'mapping-inputs-container';
    
    const createInputGroup = (name, key) => {
      const group = document.createElement('div');
      group.className = 'mapping-input-group';
      
      const lbl = document.createElement('label');
      lbl.textContent = name;
      
      const valInput = document.createElement('input');
      valInput.type = 'number';
      valInput.min = '0';
      valInput.max = '10';
      valInput.value = config[key];
      valInput.addEventListener('change', (e) => {
        appState.optionsMapping[option][key] = parseInt(e.target.value) || 0;
        updateCalculations();
      });
      
      group.appendChild(lbl);
      group.appendChild(valInput);
      return group;
    };
    
    inputsContainer.appendChild(createInputGroup('B', 'breakfast'));
    inputsContainer.appendChild(createInputGroup('L-Veg', 'lunchVeg'));
    inputsContainer.appendChild(createInputGroup('L-NV', 'lunchNonVeg'));
    inputsContainer.appendChild(createInputGroup('D-Veg', 'dinnerVeg'));
    inputsContainer.appendChild(createInputGroup('D-NV', 'dinnerNonVeg'));
    
    item.appendChild(label);
    item.appendChild(inputsContainer);
    elements.mappingContainer.appendChild(item);
  });
}

// Calculate totals and updates UI based on selected month filter
function updateCalculations() {
  let breakfastCount = 0;
  let lunchVegCount = 0;
  let lunchNonVegCount = 0;
  let dinnerVegCount = 0;
  let dinnerNonVegCount = 0;
  
  // Filter voters by selected month
  const filteredVoters = appState.voters.filter(v => {
    return appState.selectedMonth === 'all' || v.monthYear === appState.selectedMonth;
  });
  
  filteredVoters.forEach(voter => {
    const config = appState.optionsMapping[voter.option];
    if (config) {
      breakfastCount += config.breakfast || 0;
      lunchVegCount += config.lunchVeg || 0;
      lunchNonVegCount += config.lunchNonVeg || 0;
      dinnerVegCount += config.dinnerVeg || 0;
      dinnerNonVegCount += config.dinnerNonVeg || 0;
    }
  });
  
  const totalMeals = breakfastCount + lunchVegCount + lunchNonVegCount + dinnerVegCount + dinnerNonVegCount;
  const totalCost = (breakfastCount * appState.costs.breakfast) + 
                    (lunchVegCount * appState.costs.lunchVeg) + 
                    (lunchNonVegCount * appState.costs.lunchNonVeg) + 
                    (dinnerVegCount * appState.costs.dinnerVeg) + 
                    (dinnerNonVegCount * appState.costs.dinnerNonVeg);
  
  // Update Stats UI
  elements.totalBreakfastCount.textContent = breakfastCount;
  elements.totalLunchVegCount.textContent = lunchVegCount;
  elements.totalLunchNonVegCount.textContent = lunchNonVegCount;
  elements.totalDinnerVegCount.textContent = dinnerVegCount;
  elements.totalDinnerNonVegCount.textContent = dinnerNonVegCount;
  elements.totalMealsCount.textContent = totalMeals;
  elements.totalCostVal.textContent = `₹${totalCost.toLocaleString('en-IN')}`;
  
  // Refresh Voter Table & Output text
  renderVotersTable();
  generateWhatsAppSummary(filteredVoters, breakfastCount, lunchVegCount, lunchNonVegCount, dinnerVegCount, dinnerNonVegCount, totalMeals, totalCost);
}

// Render Voters Table
function renderVotersTable() {
  elements.votersTableBody.innerHTML = '';
  
  // Filter based on search query AND month filter
  const filteredVoters = appState.voters.filter(voter => {
    const matchesMonth = appState.selectedMonth === 'all' || voter.monthYear === appState.selectedMonth;
    const matchesSearch = voter.name.toLowerCase().includes(appState.searchQuery) ||
                          voter.option.toLowerCase().includes(appState.searchQuery);
    return matchesMonth && matchesSearch;
  });
  
  if (filteredVoters.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="9" style="text-align: center; color: var(--text-muted);">No voter entries found.</td>`;
    elements.votersTableBody.appendChild(row);
    return;
  }
  
  filteredVoters.forEach(voter => {
    const row = document.createElement('tr');
    
    const config = appState.optionsMapping[voter.option] || { breakfast: 0, lunchVeg: 0, lunchNonVeg: 0, dinnerVeg: 0, dinnerNonVeg: 0 };
    
    const voterTotalMeals = config.breakfast + config.lunchVeg + config.lunchNonVeg + config.dinnerVeg + config.dinnerNonVeg;
    const cost = (config.breakfast * appState.costs.breakfast) + 
                 (config.lunchVeg * appState.costs.lunchVeg) + 
                 (config.lunchNonVeg * appState.costs.lunchNonVeg) + 
                 (config.dinnerVeg * appState.costs.dinnerVeg) + 
                 (config.dinnerNonVeg * appState.costs.dinnerNonVeg);
    
    row.innerHTML = `
      <td>
        <strong>${escapeHtml(voter.name)}</strong> 
        ${voter.isManual ? '<span style="font-size:0.7rem; color:var(--accent-blue);">(manual)</span>' : ''}
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">${voter.monthYear}</div>
      </td>
      <td class="num-cell">${config.breakfast || '-'}</td>
      <td class="num-cell">${config.lunchVeg || '-'}</td>
      <td class="num-cell">${config.lunchNonVeg || '-'}</td>
      <td class="num-cell">${config.dinnerVeg || '-'}</td>
      <td class="num-cell">${config.dinnerNonVeg || '-'}</td>
      <td class="num-cell"><strong>${voterTotalMeals}</strong></td>
      <td class="price-cell">₹${cost}</td>
      <td style="text-align: center;">
        <div class="action-icons" style="justify-content: center;">
          <button class="btn-icon" onclick="openEditVoterModal('${voter.id}')" title="Edit">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>
          </button>
          <button class="btn-icon delete" onclick="deleteVoter('${voter.id}')" title="Delete">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>
          </button>
        </div>
      </td>
    `;
    elements.votersTableBody.appendChild(row);
  });
}

// Generate WhatsApp Formatted Copy Message
function generateWhatsAppSummary(filteredVoters, breakfast, lunchVeg, lunchNonVeg, dinnerVeg, dinnerNonVeg, total, cost) {
  let summary = `🍽️ *MEAL BILL SUMMARY* 🍽️\n`;
  summary += `*Period:* ${appState.selectedMonth === 'all' ? 'All Months (Cumulative)' : appState.selectedMonth}\n\n`;
  
  summary += `🍳 *Breakfasts:* ${breakfast}\n`;
  summary += `🟢 *Lunch Veg:* ${lunchVeg}\n`;
  summary += `🟠 *Lunch Non-Veg:* ${lunchNonVeg}\n`;
  summary += `🟢 *Dinner Veg:* ${dinnerVeg}\n`;
  summary += `🟠 *Dinner Non-Veg:* ${dinnerNonVeg}\n`;
  summary += `📊 *Total Meals:* ${total}\n`;
  
  const hasCosts = appState.costs.breakfast > 0 || appState.costs.lunchVeg > 0 || 
                   appState.costs.lunchNonVeg > 0 || appState.costs.dinnerVeg > 0 || 
                   appState.costs.dinnerNonVeg > 0;
                   
  if (hasCosts) {
    summary += `💰 *Grand Total Cost:* ₹${cost.toLocaleString('en-IN')}\n`;
    if (appState.costs.breakfast > 0) summary += `   (BF: ₹${appState.costs.breakfast})\n`;
    if (appState.costs.lunchVeg > 0) summary += `   (L-Veg: ₹${appState.costs.lunchVeg})\n`;
    if (appState.costs.lunchNonVeg > 0) summary += `   (L-NV: ₹${appState.costs.lunchNonVeg})\n`;
    if (appState.costs.dinnerVeg > 0) summary += `   (D-Veg: ₹${appState.costs.dinnerVeg})\n`;
    if (appState.costs.dinnerNonVeg > 0) summary += `   (D-NV: ₹${appState.costs.dinnerNonVeg})\n`;
  }
  
  summary += `\n*Individual Meal Bill Breakdown:*\n`;
  
  const personVotes = {};
  filteredVoters.forEach(voter => {
    if (!personVotes[voter.name]) {
      personVotes[voter.name] = [];
    }
    personVotes[voter.name].push(voter.option);
  });
  
  Object.keys(personVotes).sort().forEach(name => {
    const votes = personVotes[name];
    let pBreakfast = 0;
    let pLunchVeg = 0;
    let pLunchNonVeg = 0;
    let pDinnerVeg = 0;
    let pDinnerNonVeg = 0;
    
    votes.forEach(opt => {
      const config = appState.optionsMapping[opt];
      if (config) {
        pBreakfast += config.breakfast || 0;
        pLunchVeg += config.lunchVeg || 0;
        pLunchNonVeg += config.lunchNonVeg || 0;
        pDinnerVeg += config.dinnerVeg || 0;
        pDinnerNonVeg += config.dinnerNonVeg || 0;
      }
    });
    
    const pTotal = pBreakfast + pLunchVeg + pLunchNonVeg + pDinnerVeg + pDinnerNonVeg;
    const pCost = (pBreakfast * appState.costs.breakfast) + 
                  (pLunchVeg * appState.costs.lunchVeg) + 
                  (pLunchNonVeg * appState.costs.lunchNonVeg) + 
                  (pDinnerVeg * appState.costs.dinnerVeg) + 
                  (pDinnerNonVeg * appState.costs.dinnerNonVeg);
                  
    if (pTotal > 0) {
      let breakdownParts = [];
      if (pBreakfast > 0) breakdownParts.push(`B: ${pBreakfast}`);
      if (pLunchVeg > 0) breakdownParts.push(`LV: ${pLunchVeg}`);
      if (pLunchNonVeg > 0) breakdownParts.push(`LNV: ${pLunchNonVeg}`);
      if (pDinnerVeg > 0) breakdownParts.push(`DV: ${pDinnerVeg}`);
      if (pDinnerNonVeg > 0) breakdownParts.push(`DNV: ${pDinnerNonVeg}`);
      
      summary += `- *${name}:* ${breakdownParts.join(', ')} (Total: ${pTotal})`;
      if (hasCosts) {
        summary += ` -> *₹${pCost}*`;
      }
      summary += `\n`;
    } else {
      summary += `- *${name}:* No Meals\n`;
    }
  });
  
  elements.whatsappSummary.textContent = summary;
}

// Copy to clipboard helper
function copySummaryToClipboard() {
  const text = elements.whatsappSummary.textContent;
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Copied summary to clipboard!', 'success');
  }).catch(err => {
    console.error('Failed to copy text: ', err);
    showToast('❌ Copy failed. Please select and copy manually.', 'error');
  });
}

// CSV Export
function exportToCSV() {
  let csv = 'Name,Voted Option,Month,Breakfast,Lunch Veg,Lunch NV,Dinner Veg,Dinner NV,Total Meals,Cost\n';
  
  const filteredVoters = appState.voters.filter(v => {
    return appState.selectedMonth === 'all' || v.monthYear === appState.selectedMonth;
  });
  
  filteredVoters.forEach(v => {
    const config = appState.optionsMapping[v.option] || { breakfast: 0, lunchVeg: 0, lunchNonVeg: 0, dinnerVeg: 0, dinnerNonVeg: 0 };
    const voterTotalMeals = config.breakfast + config.lunchVeg + config.lunchNonVeg + config.dinnerVeg + config.dinnerNonVeg;
    const cost = (config.breakfast * appState.costs.breakfast) + 
                 (config.lunchVeg * appState.costs.lunchVeg) + 
                 (config.lunchNonVeg * appState.costs.lunchNonVeg) + 
                 (config.dinnerVeg * appState.costs.dinnerVeg) + 
                 (config.dinnerNonVeg * appState.costs.dinnerNonVeg);
                 
    csv += `"${v.name.replace(/"/g, '""')}","${v.option.replace(/"/g, '""')}","${v.monthYear}",${config.breakfast},${config.lunchVeg},${config.lunchNonVeg},${config.dinnerVeg},${config.dinnerNonVeg},${voterTotalMeals},${cost}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `meals_${appState.selectedMonth.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('📊 CSV file exported!', 'success');
}

// Modal Handlers
function populateModalMonths(selectedVal) {
  const months = getUniqueMonths();
  const d = new Date();
  const currentMonthYear = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  
  if (!months.includes(currentMonthYear)) {
    months.push(currentMonthYear);
  }
  sortMonthYearStrings(months);
  
  elements.editMonth.innerHTML = '';
  months.forEach(m => {
    elements.editMonth.innerHTML += `<option value="${escapeHtml(m)}" ${m === selectedVal ? 'selected' : ''}>${escapeHtml(m)}</option>`;
  });
}

function openEditVoterModal(id) {
  const voter = appState.voters.find(v => v.id === id);
  if (!voter) return;
  
  appState.editingVoterId = id;
  elements.modalTitle.textContent = "Edit Person's Vote";
  elements.editName.value = voter.name;
  
  elements.editOption.innerHTML = '';
  Object.keys(appState.optionsMapping).forEach(opt => {
    elements.editOption.innerHTML += `<option value="${escapeHtml(opt)}" ${opt === voter.option ? 'selected' : ''}>${escapeHtml(opt)}</option>`;
  });
  
  populateModalMonths(voter.monthYear);
  elements.editModal.classList.add('show');
}

function openAddPersonModal() {
  appState.editingVoterId = null;
  elements.modalTitle.textContent = "Add Person Manually";
  elements.editName.value = '';
  
  elements.editOption.innerHTML = '';
  Object.keys(appState.optionsMapping).forEach(opt => {
    elements.editOption.innerHTML += `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`;
  });
  
  const defaultMonth = appState.selectedMonth === 'all' ? 
    `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}` : 
    appState.selectedMonth;
  populateModalMonths(defaultMonth);
  
  elements.editModal.classList.add('show');
}

function closeModal() {
  elements.editModal.classList.remove('show');
  appState.editingVoterId = null;
}

function saveVoterEdit() {
  const name = elements.editName.value.trim();
  const option = elements.editOption.value;
  const monthYear = elements.editMonth.value;
  
  if (!name) {
    showToast('⚠️ Please enter a name.', 'error');
    return;
  }
  
  if (appState.editingVoterId) {
    const idx = appState.voters.findIndex(v => v.id === appState.editingVoterId);
    if (idx !== -1) {
      appState.voters[idx].name = name;
      appState.voters[idx].option = option;
      appState.voters[idx].monthYear = monthYear;
      appState.voters[idx].isManual = true;
    }
  } else {
    appState.voters.push({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      name,
      option,
      monthYear,
      rawDate: "manual",
      isManual: true
    });
  }
  
  closeModal();
  
  const currentFilterVal = elements.monthFilter.value;
  populateMonthFilter();
  if (getUniqueMonths().includes(currentFilterVal)) {
    elements.monthFilter.value = currentFilterVal;
    appState.selectedMonth = currentFilterVal;
  } else {
    elements.monthFilter.value = "all";
    appState.selectedMonth = "all";
  }
  
  updateCalculations();
  showToast('💾 Vote updated successfully!', 'success');
}

function deleteVoter(id) {
  if (confirm('Are you sure you want to remove this vote?')) {
    appState.voters = appState.voters.filter(v => v.id !== id);
    updateCalculations();
    showToast('🗑️ Vote removed.', 'success');
  }
}

// Global functions for inline HTML events
window.openEditVoterModal = openEditVoterModal;
window.deleteVoter = deleteVoter;
window.closeModal = closeModal;

// Toast Helper
function showToast(message, type = 'success') {
  elements.toastText.textContent = message;
  elements.toast.className = 'toast show';
  
  if (type === 'error') {
    elements.toast.style.background = 'var(--accent-red)';
  } else {
    elements.toast.style.background = 'var(--whatsapp-green)';
  }
  
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

// HTML Escaper
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}
