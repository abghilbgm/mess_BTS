export const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getInitialMealMapping(option) {
  const text = option.toLowerCase();
  const mapping = {
    breakfast: 0,
    lunchVeg: 0,
    lunchNonVeg: 0,
    dinnerVeg: 0,
    dinnerNonVeg: 0
  };
  
  let qty = 1;
  const numMatch = text.match(/\d+/);
  if (numMatch) {
    qty = parseInt(numMatch[0], 10);
  }
  
  // Guess Breakfast
  if (text.includes('breakfast') || text.includes('bf') || text.includes('morning')) {
    mapping.breakfast = qty;
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
      mapping.lunchNonVeg = qty;
    } else {
      mapping.lunchVeg = qty;
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
      mapping.dinnerNonVeg = qty;
    } else {
      mapping.dinnerVeg = qty;
    }
  }
  
  // Fallbacks if no key meal type matched
  if (mapping.breakfast === 0 && mapping.lunchVeg === 0 && mapping.lunchNonVeg === 0 && mapping.dinnerVeg === 0 && mapping.dinnerNonVeg === 0) {
    if (text.includes('non-veg') || text.includes('nonveg') || text.includes('nv') || text.includes('chicken')) {
      mapping.lunchNonVeg = qty;
    } else if (text.includes('veg')) {
      mapping.lunchVeg = qty;
    } else if (text.includes('bf') || text.includes('breakfast')) {
      mapping.breakfast = qty;
    } else if (text.includes('no') || text.includes('not') || text.includes('none') || text.includes('out') || text.includes('cancel')) {
      // Keep all at 0
    } else {
      mapping.lunchVeg = qty; // absolute fallback
    }
  }
  
  return mapping;
}

export function parseChatExportText(text) {
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
  let lastDetectedMeal = 'Lunch Veg';
  
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
    const standardizedDate = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
    
    let cleanText = msg.text.trim();
    const lowerMsg = cleanText.toLowerCase();
    
    const voteMatch = cleanText.match(/^voted for\s+["']?([^"'\n]+)["']?$/i);
    if (voteMatch) {
      cleanText = voteMatch[1];
      const lowerVote = cleanText.toLowerCase();
      if (lowerVote.includes('breakfast') || lowerVote.includes('bf')) {
        lastDetectedMeal = 'Breakfast';
      } else if (lowerVote.includes('lunch')) {
        lastDetectedMeal = (lowerVote.includes('non-veg') || lowerVote.includes('nv') || lowerVote.includes('chicken')) ? 'Lunch Non-Veg' : 'Lunch Veg';
      } else if (lowerVote.includes('dinner')) {
        lastDetectedMeal = (lowerVote.includes('non-veg') || lowerVote.includes('nv') || lowerVote.includes('chicken')) ? 'Dinner Non-Veg' : 'Dinner Veg';
      }
    }
    
    if (lowerMsg.includes('poll:')) {
      if (lowerMsg.includes('breakfast') || lowerMsg.includes('bf')) {
        lastDetectedMeal = 'Breakfast';
      } else if (lowerMsg.includes('lunch')) {
        lastDetectedMeal = (lowerMsg.includes('non-veg') || lowerMsg.includes('nv') || lowerMsg.includes('chicken') || lowerMsg.includes('mutton') || lowerMsg.includes('fish') || lowerMsg.includes('egg')) ? 'Lunch Non-Veg' : 'Lunch Veg';
      } else if (lowerMsg.includes('dinner')) {
        lastDetectedMeal = (lowerMsg.includes('non-veg') || lowerMsg.includes('nv') || lowerMsg.includes('chicken') || lowerMsg.includes('mutton') || lowerMsg.includes('fish') || lowerMsg.includes('egg')) ? 'Dinner Non-Veg' : 'Dinner Veg';
      }
      return; // skip poll message
    }

    if (cleanText.length > 0 && cleanText.length <= 40) {
      if (lowerMsg.includes('ready')) {
        return; // skip announcements
      }
      
      if (lowerMsg === 'no' || lowerMsg === 'no.' || lowerMsg.includes('no meal') || lowerMsg.includes('no need')) {
        return; // User request: dont select No meals text from chat
      }
      
      const hasMealKeyword = (
        lowerMsg.includes('breakfast') || 
        lowerMsg.includes('bf') || 
        lowerMsg.includes('lunch') || 
        lowerMsg.includes('dinner') || 
        lowerMsg.includes('veg') || 
        lowerMsg.includes('nv') || 
        lowerMsg.includes('chicken') || 
        lowerMsg.includes('meal') || 
        lowerMsg.includes('mutton') || 
        lowerMsg.includes('egg') || 
        lowerMsg.includes('fish')
      );
      
      const isVoteLike = hasMealKeyword || cleanText.match(/^[+\d]/);
      
      if (isVoteLike) {
        // If it's a short vote-like message with numbers but NO meal keywords (like "+2", "+4"), append context
        if (!hasMealKeyword && cleanText.match(/\d/)) {
          cleanText = `${cleanText} (${lastDetectedMeal})`;
        }
        
        votes.push({
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          name: msg.sender,
          option: cleanText,
          monthYear,
          rawDate: standardizedDate,
          isManual: false
        });
        optionsDetected.add(cleanText);
      }
    }
  });
  
  return {
    question: "WhatsApp Chat Export",
    votes,
    options: Array.from(optionsDetected)
  };
}

export function parseCopiedVotesText(text, targetDate = new Date()) {
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
  
  const currentMonthYear = `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
  const currentDate = `${String(targetDate.getDate()).padStart(2, '0')}/${String(targetDate.getMonth() + 1).padStart(2, '0')}/${targetDate.getFullYear()}`;
  
  let currentOption = parsedQuestion;
  
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
        voterName.match(/at\s+\d+:\d+\s*(am|pm)?/i) ||
        voterName === ''
      ) {
        continue;
      }
      
      votes.push({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        name: voterName,
        option: `${currentOption} (${parsedQuestion})`,
        monthYear: currentMonthYear,
        rawDate: currentDate,
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

export function parseScrapedPollsText(text, fallbackDate = new Date()) {
  const polls = text.split('===POLL_START===').map(p => p.trim()).filter(Boolean);
  const votes = [];
  const optionsDetected = new Set();
  
  polls.forEach((poll, index) => {
    let cleanPoll = poll.replace('===POLL_END===', '').trim();
    let lines = cleanPoll.split('\n').map(l => l.trim()).filter(Boolean);
    
    if (lines.length < 3) return;
    
    let mealName = "Unknown Meal";
    let startIndex = 0;
    if (lines[0].toLowerCase().includes('poll details')) {
      mealName = lines[1];
      startIndex = 2;
    } else {
      mealName = lines[0];
      startIndex = 1;
    }
    
    let currentOption = mealName;
    
    for (let i = startIndex; i < lines.length; i++) {
      let line = lines[i];
      
      if (line.match(/\d+\s+of\s+\d+\s+members\s+voted/i)) continue;
      if (line.match(/^See all\s*\(\d+\s*more\)/i)) continue;
      
      if (lines[i+1] && lines[i+1].match(/^(\d+|no)\s+votes?$/i)) {
        currentOption = line;
        optionsDetected.add(currentOption);
        i++; 
        continue;
      }
      
      if (line.match(/^(\d+|no)\s+votes?$/i)) continue;
      
      const dateMatch = line.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+at\s+(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/);
      if (dateMatch) {
         let name = "";
         let phone = "";
         let month = parseInt(dateMatch[1]);
         let day = parseInt(dateMatch[2]);
         let year = parseInt(dateMatch[3]);
         
         if (month < 1 || month > 12) month = fallbackDate.getMonth() + 1;
         
         const rawDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
         const monthYear = `${monthNames[month - 1]} ${year}`;
         
         if (i - 1 >= 0) {
            let prev1 = lines[i-1];
            if (prev1.match(/^\+\d+/)) {
               if (i - 2 >= 0) {
                  name = lines[i-2];
                  phone = prev1;
               }
            } else {
               name = prev1;
            }
         }
         
         if (name) {
             name = name.replace(/^~ ?/, '').trim();
             votes.push({
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                name: name,
                option: `${currentOption} (${mealName})`,
                monthYear: monthYear,
                rawDate: rawDate,
                isManual: false
             });
         }
      }
    }
  });
  
  return {
    question: "Scraped Polls",
    votes,
    options: Array.from(optionsDetected)
  };
}
