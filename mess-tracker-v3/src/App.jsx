import React, { useState, useEffect, useRef } from 'react';
import { Upload, Settings, Table, Download, Copy, Trash2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { parseChatExportText, getInitialMealMapping, parseCopiedVotesText } from './utils/parser';
import { generateMonthlyCSV, generateDayWiseCSV, downloadCSV } from './utils/csv';
import { parseScrapedPollsText } from './utils/parser';

function App() {
  const [rawVotes, setRawVotes] = useState([]);
  const [optionsMapping, setOptionsMapping] = useState({});
  const [costs, setCosts] = useState({
    breakfast: 0,
    lunchVeg: 0,
    lunchNonVeg: 0,
    dinnerVeg: 0,
    dinnerNonVeg: 0
  });
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [fileName, setFileName] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteDate, setPasteDate] = useState(new Date().toISOString().split('T')[0]);
  const [excludedUsers, setExcludedUsers] = useState(new Set());
  
  const fileInputRef = useRef(null);
  const scrapedFileInputRef = useRef(null);

  // Derive unique months and users
  const uniqueMonths = Array.from(new Set(rawVotes.map(v => v.monthYear))).sort();
  const uniqueUsers = Array.from(new Set(rawVotes.map(v => v.name))).sort((a,b) => a.localeCompare(b));

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const result = parseChatExportText(text);
      if (result && result.votes) {
        setRawVotes(prev => [...prev, ...result.votes]);
        
        const newMapping = { ...optionsMapping };
        result.options.forEach(opt => {
          if (!newMapping[opt]) {
            newMapping[opt] = getInitialMealMapping(opt);
          }
        });
        setOptionsMapping(newMapping);
      } else {
        alert("Could not parse votes from this file.");
      }
    };
    reader.readAsText(file);
  };

  const handleScrapedFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      
      const [year, month, day] = pasteDate.split('-');
      const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const result = parseScrapedPollsText(text, targetDate);
      if (result && result.votes) {
        setRawVotes(prev => [...prev, ...result.votes]);
        
        const newMapping = { ...optionsMapping };
        result.options.forEach(opt => {
          if (!newMapping[opt]) {
            newMapping[opt] = getInitialMealMapping(opt);
          }
        });
        setOptionsMapping(newMapping);
        alert(`Successfully imported ${result.options.length} scraped polls! You can now map them in the Phrase Mapping Engine below.`);
      } else {
        alert("Could not parse scraped polls from this file.");
      }
    };
    reader.readAsText(file);
  };

  const handlePasteAnalyze = () => {
    if (!pasteText.trim()) return;
    
    // Convert YYYY-MM-DD to Date object
    const [year, month, day] = pasteDate.split('-');
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const parsed = parseCopiedVotesText(pasteText, targetDate);
    if (parsed && parsed.votes) {
      setRawVotes(prev => [...prev, ...parsed.votes]);
      
      const newMapping = { ...optionsMapping };
      parsed.options.forEach(opt => {
        if (!newMapping[opt]) {
          newMapping[opt] = getInitialMealMapping(opt);
        }
      });
      setOptionsMapping(newMapping);
      setPasteText('');
    } else {
      alert("Could not parse pasted poll text.");
    }
  };

  const clearData = () => {
    setRawVotes([]);
    setOptionsMapping({});
    setExcludedUsers(new Set());
    setFileName('');
    setPasteText('');
  };

  const handleCostChange = (meal, value) => {
    setCosts(prev => ({ ...prev, [meal]: parseFloat(value) || 0 }));
  };

  const handleMappingChange = (option, meal, value) => {
    setOptionsMapping(prev => ({
      ...prev,
      [option]: {
        ...prev[option],
        [meal]: parseInt(value, 10) || 0
      }
    }));
  };

  // Aggregation Logic
  const filteredVotes = rawVotes.filter(v => (selectedMonth === 'all' || v.monthYear === selectedMonth) && !excludedUsers.has(v.name));
  
  const personAgg = {};
  let totalBreakfast = 0, totalLunchVeg = 0, totalLunchNV = 0, totalDinnerVeg = 0, totalDinnerNV = 0;

  filteredVotes.forEach(v => {
    const name = v.name;
    if (!personAgg[name]) {
      personAgg[name] = { name, breakfast: 0, lunchVeg: 0, lunchNonVeg: 0, dinnerVeg: 0, dinnerNonVeg: 0 };
    }
    
    const config = optionsMapping[v.option] || { breakfast: 0, lunchVeg: 0, lunchNonVeg: 0, dinnerVeg: 0, dinnerNonVeg: 0 };
    
    personAgg[name].breakfast += config.breakfast || 0;
    personAgg[name].lunchVeg += config.lunchVeg || 0;
    personAgg[name].lunchNonVeg += config.lunchNonVeg || 0;
    personAgg[name].dinnerVeg += config.dinnerVeg || 0;
    personAgg[name].dinnerNonVeg += config.dinnerNonVeg || 0;
  });

  const aggregatedData = Object.values(personAgg)
    .filter(agg => (agg.breakfast + agg.lunchVeg + agg.lunchNonVeg + agg.dinnerVeg + agg.dinnerNonVeg) > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  aggregatedData.forEach(agg => {
    totalBreakfast += agg.breakfast;
    totalLunchVeg += agg.lunchVeg;
    totalLunchNV += agg.lunchNonVeg;
    totalDinnerVeg += agg.dinnerVeg;
    totalDinnerNV += agg.dinnerNonVeg;
  });

  const grandTotalMeals = totalBreakfast + totalLunchVeg + totalLunchNV + totalDinnerVeg + totalDinnerNV;
  const grandTotalCost = 
    (totalBreakfast * costs.breakfast) +
    (totalLunchVeg * costs.lunchVeg) +
    (totalLunchNV * costs.lunchNonVeg) +
    (totalDinnerVeg * costs.dinnerVeg) +
    (totalDinnerNV * costs.dinnerNonVeg);

  const handleCopySummary = () => {
    let summary = `🍽️ *MEAL BILL SUMMARY* 🍽️\n`;
    summary += `*Period:* ${selectedMonth === 'all' ? 'All Months (Cumulative)' : selectedMonth}\n\n`;
    summary += `🍳 *Breakfasts:* ${totalBreakfast}\n`;
    summary += `🟢 *Lunch Veg:* ${totalLunchVeg}\n`;
    summary += `🟠 *Lunch Non-Veg:* ${totalLunchNV}\n`;
    summary += `🟢 *Dinner Veg:* ${totalDinnerVeg}\n`;
    summary += `🟠 *Dinner Non-Veg:* ${totalDinnerNV}\n`;
    summary += `📊 *Total Meals:* ${grandTotalMeals}\n`;
    
    if (grandTotalCost > 0) {
      summary += `💰 *Total Estimated Cost:* ₹${grandTotalCost.toLocaleString('en-IN')}\n\n`;
    } else {
      summary += `\n`;
    }
    
    summary += `*Individual Breakdown:*\n`;
    aggregatedData.forEach(agg => {
      const pTotal = agg.breakfast + agg.lunchVeg + agg.lunchNonVeg + agg.dinnerVeg + agg.dinnerNonVeg;
      let parts = [];
      if (agg.breakfast > 0) parts.push(`B: ${agg.breakfast}`);
      if (agg.lunchVeg > 0) parts.push(`LV: ${agg.lunchVeg}`);
      if (agg.lunchNonVeg > 0) parts.push(`LNV: ${agg.lunchNonVeg}`);
      if (agg.dinnerVeg > 0) parts.push(`DV: ${agg.dinnerVeg}`);
      if (agg.dinnerNonVeg > 0) parts.push(`DNV: ${agg.dinnerNonVeg}`);
      
      summary += `- *${agg.name}:* ${parts.join(', ')} (Total: ${pTotal})\n`;
    });
    
    navigator.clipboard.writeText(summary);
    alert('Summary copied to clipboard!');
  };

  return (
    <div className="app-container">
      <header className="header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1>Mess Tracker V3</h1>
        <p style={{ color: 'var(--accent-primary)', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase' }}>State-of-the-art WhatsApp Chat Analytics</p>
      </header>

      {/* Upload & Paste Section */}
      <div className="grid-2">
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2><Upload size={24} color="var(--accent-primary)" /> Upload WhatsApp Chat</h2>
          <input 
            type="file" 
            accept=".txt" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileUpload}
          />
          <div 
            className="upload-zone" 
            onClick={() => fileInputRef.current.click()}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {fileName ? (
              <>
                <CheckCircle2 size={48} color="var(--accent-primary)" />
                <p className="upload-text" style={{ color: 'white', fontWeight: 600 }}>{fileName} Loaded</p>
                <p style={{ fontSize: '0.85rem' }}>Click to upload a different file</p>
              </>
            ) : (
              <>
                <Upload size={48} className="upload-icon" />
                <p className="upload-text" style={{ color: 'white', fontWeight: 600 }}>Drop _chat.txt here</p>
                <p style={{ fontSize: '0.85rem' }}>Or click to browse files</p>
              </>
            )}
          </div>
          
          <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
            <input 
              type="file" 
              accept=".txt" 
              ref={scrapedFileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleScrapedFileUpload}
            />
            <button className="btn btn-secondary" onClick={() => scrapedFileInputRef.current.click()} style={{ width: '100%', fontSize: '0.9rem' }}>
              <Upload size={16} style={{ marginRight: '8px' }}/> Upload Scraped whatsapp_polls.txt
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2><FileText size={24} color="var(--accent-secondary)" /> Smart Poll Ingest</h2>
          
          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <label className="input-label">Date of Poll:</label>
            <input 
              type="date" 
              value={pasteDate}
              onChange={(e) => setPasteDate(e.target.value)}
            />
          </div>

          <textarea 
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Type 'Breakfast' on the first line, then paste your list of names here..."
            rows={5}
            style={{ marginBottom: '1rem', resize: 'vertical', flex: 1 }}
          />
          <button className="btn" onClick={handlePasteAnalyze} style={{ width: '100%' }}>
            Analyze Pasted Poll
          </button>
        </div>
      </div>

      {rawVotes.length > 0 && (
        <>
          {/* Controls & Mappings */}
          <div className="grid-2">
            <div className="glass-panel">
              <h2><Settings size={24} color="var(--text-primary)" /> Setup & Configuration</h2>
              
              <div className="input-group" style={{ marginBottom: '2rem' }}>
                <label className="input-label">Billing Month</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="all">All Months (Cumulative)</option>
                  {uniqueMonths.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <h3>Meal Costs (₹)</h3>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Enter the cost for each meal type to calculate totals.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Breakfast</label>
                  <input type="number" value={costs.breakfast} onChange={(e) => handleCostChange('breakfast', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Lunch Veg</label>
                  <input type="number" value={costs.lunchVeg} onChange={(e) => handleCostChange('lunchVeg', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Lunch Non-Veg</label>
                  <input type="number" value={costs.lunchNonVeg} onChange={(e) => handleCostChange('lunchNonVeg', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Dinner Veg</label>
                  <input type="number" value={costs.dinnerVeg} onChange={(e) => handleCostChange('dinnerVeg', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Dinner Non-Veg</label>
                  <input type="number" value={costs.dinnerNonVeg} onChange={(e) => handleCostChange('dinnerNonVeg', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <h2><Table size={24} color="var(--text-primary)" /> Phrase Mapping Engine</h2>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                The engine automatically detects these phrases in your chat. Adjust how many meals each phrase corresponds to below.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.keys(optionsMapping).map(option => {
                  const config = optionsMapping[option];
                  return (
                    <div key={option} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1.25rem', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontWeight: '600', marginBottom: '0.75rem', color: 'var(--accent-primary)', fontSize: '1.05rem' }}>{option}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '0.7rem', textAlign: 'center' }}>B</label>
                          <input type="number" value={config.breakfast} onChange={(e) => handleMappingChange(option, 'breakfast', e.target.value)} style={{ padding: '0.5rem', textAlign: 'center' }}/>
                        </div>
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '0.7rem', textAlign: 'center' }}>LV</label>
                          <input type="number" value={config.lunchVeg} onChange={(e) => handleMappingChange(option, 'lunchVeg', e.target.value)} style={{ padding: '0.5rem', textAlign: 'center' }}/>
                        </div>
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '0.7rem', textAlign: 'center' }}>LNV</label>
                          <input type="number" value={config.lunchNonVeg} onChange={(e) => handleMappingChange(option, 'lunchNonVeg', e.target.value)} style={{ padding: '0.5rem', textAlign: 'center' }}/>
                        </div>
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '0.7rem', textAlign: 'center' }}>DV</label>
                          <input type="number" value={config.dinnerVeg} onChange={(e) => handleMappingChange(option, 'dinnerVeg', e.target.value)} style={{ padding: '0.5rem', textAlign: 'center' }}/>
                        </div>
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '0.7rem', textAlign: 'center' }}>DNV</label>
                          <input type="number" value={config.dinnerNonVeg} onChange={(e) => handleMappingChange(option, 'dinnerNonVeg', e.target.value)} style={{ padding: '0.5rem', textAlign: 'center' }}/>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn" onClick={handleCopySummary}><Copy size={18} /> Copy WhatsApp Summary</button>
            <button className="btn btn-secondary" onClick={() => {
              const activeVotes = rawVotes.filter(v => !excludedUsers.has(v.name));
              const csv = generateMonthlyCSV(activeVotes, selectedMonth, optionsMapping);
              downloadCSV(`meals_monthly_${selectedMonth.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`, csv);
            }}><Download size={18} /> Export Monthly CSV</button>
            <button className="btn btn-secondary" onClick={() => {
              const activeVotes = rawVotes.filter(v => !excludedUsers.has(v.name));
              const csv = generateDayWiseCSV(activeVotes, selectedMonth, optionsMapping);
              downloadCSV(`meals_daywise_${selectedMonth.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`, csv);
            }}><Calendar size={18} /> Export Day-Wise CSV</button>
            
            <div style={{ flex: 1 }}></div>
            <button className="btn btn-danger" onClick={clearData}>
              <Trash2 size={18} /> Clear Data
            </button>
          </div>

          {/* Table */}
          <div className="glass-panel table-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}><Table size={24} color="var(--accent-primary)" /> Billing Dashboard</h2>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-primary)', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 600 }}>
                Total Revenue: ₹{grandTotalCost.toLocaleString('en-IN')}
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Voter Name</th>
                  <th className="num-cell">Breakfast</th>
                  <th className="num-cell">Lunch Veg</th>
                  <th className="num-cell">Lunch NV</th>
                  <th className="num-cell">Dinner Veg</th>
                  <th className="num-cell">Dinner NV</th>
                  <th className="num-cell" style={{ color: 'white' }}>Total Meals</th>
                  <th className="num-cell" style={{ color: 'var(--accent-primary)' }}>Cost (₹)</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedData.map(agg => {
                  const total = agg.breakfast + agg.lunchVeg + agg.lunchNonVeg + agg.dinnerVeg + agg.dinnerNonVeg;
                  const cost = 
                    (agg.breakfast * costs.breakfast) +
                    (agg.lunchVeg * costs.lunchVeg) +
                    (agg.lunchNonVeg * costs.lunchNonVeg) +
                    (agg.dinnerVeg * costs.dinnerVeg) +
                    (agg.dinnerNonVeg * costs.dinnerNonVeg);

                  return (
                    <tr key={agg.name}>
                      <td style={{ fontWeight: 500, color: 'white' }}>{agg.name}</td>
                      <td className="num-cell" style={{ color: agg.breakfast ? 'var(--text-primary)' : 'var(--text-muted)' }}>{agg.breakfast || '-'}</td>
                      <td className="num-cell" style={{ color: agg.lunchVeg ? 'var(--text-primary)' : 'var(--text-muted)' }}>{agg.lunchVeg || '-'}</td>
                      <td className="num-cell" style={{ color: agg.lunchNonVeg ? 'var(--text-primary)' : 'var(--text-muted)' }}>{agg.lunchNonVeg || '-'}</td>
                      <td className="num-cell" style={{ color: agg.dinnerVeg ? 'var(--text-primary)' : 'var(--text-muted)' }}>{agg.dinnerVeg || '-'}</td>
                      <td className="num-cell" style={{ color: agg.dinnerNonVeg ? 'var(--text-primary)' : 'var(--text-muted)' }}>{agg.dinnerNonVeg || '-'}</td>
                      <td className="num-cell" style={{ color: 'white', fontWeight: 600 }}>{total}</td>
                      <td className="num-cell" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>₹{cost.toLocaleString('en-IN')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
