import Papa from 'papaparse';

export function downloadCSV(filename, csvData) {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateMonthlyCSV(voters, selectedMonth, optionsMapping) {
  const filteredVoters = voters.filter(v => {
    return selectedMonth === 'all' || v.monthYear === selectedMonth;
  });
  
  const personAgg = {};
  filteredVoters.forEach(v => {
    const name = v.name;
    if (!personAgg[name]) {
      personAgg[name] = {
        name: name,
        monthYear: v.monthYear,
        breakfast: 0,
        lunchVeg: 0,
        lunchNonVeg: 0,
        dinnerVeg: 0,
        dinnerNonVeg: 0
      };
    } else if (v.monthYear !== personAgg[name].monthYear) {
      personAgg[name].monthYear = 'Multiple';
    }
    
    const config = optionsMapping[v.option] || { breakfast: 0, lunchVeg: 0, lunchNonVeg: 0, dinnerVeg: 0, dinnerNonVeg: 0 };
    
    personAgg[name].breakfast += config.breakfast || 0;
    personAgg[name].lunchVeg += config.lunchVeg || 0;
    personAgg[name].lunchNonVeg += config.lunchNonVeg || 0;
    personAgg[name].dinnerVeg += config.dinnerVeg || 0;
    personAgg[name].dinnerNonVeg += config.dinnerNonVeg || 0;
  });
  
  const data = [];
  Object.values(personAgg)
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(agg => {
      const voterTotalMeals = agg.breakfast + agg.lunchVeg + agg.lunchNonVeg + agg.dinnerVeg + agg.dinnerNonVeg;
      if (voterTotalMeals === 0) return;
      
      const dinnerCombined = agg.dinnerVeg + agg.dinnerNonVeg;
      
      data.push({
        Name: agg.name,
        Month: agg.monthYear,
        Breakfast: agg.breakfast,
        'Lunch Veg': agg.lunchVeg,
        'Lunch Non Veg': agg.lunchNonVeg,
        Dinner: dinnerCombined
      });
    });
    
  return Papa.unparse(data);
}

export function generateDayWiseCSV(voters, selectedMonth, optionsMapping) {
  const filteredVoters = voters.filter(v => {
    return selectedMonth === 'all' || v.monthYear === selectedMonth;
  });
  
  const dayAgg = {};
  filteredVoters.forEach(v => {
    const name = v.name;
    const date = v.rawDate !== 'manual' && v.rawDate !== 'current' ? v.rawDate : 'Unknown Date';
    const key = `${name}_${date}`;
    
    if (!dayAgg[key]) {
      dayAgg[key] = {
        name: name,
        date: date,
        breakfast: 0,
        lunchVeg: 0,
        lunchNonVeg: 0,
        dinnerVeg: 0,
        dinnerNonVeg: 0
      };
    }
    
    const config = optionsMapping[v.option] || { breakfast: 0, lunchVeg: 0, lunchNonVeg: 0, dinnerVeg: 0, dinnerNonVeg: 0 };
    
    dayAgg[key].breakfast += config.breakfast || 0;
    dayAgg[key].lunchVeg += config.lunchVeg || 0;
    dayAgg[key].lunchNonVeg += config.lunchNonVeg || 0;
    dayAgg[key].dinnerVeg += config.dinnerVeg || 0;
    dayAgg[key].dinnerNonVeg += config.dinnerNonVeg || 0;
  });
  
  const data = [];
  Object.values(dayAgg)
    .sort((a, b) => a.name.localeCompare(b.name) || a.date.localeCompare(b.date))
    .forEach(agg => {
      const voterTotalMeals = agg.breakfast + agg.lunchVeg + agg.lunchNonVeg + agg.dinnerVeg + agg.dinnerNonVeg;
      if (voterTotalMeals === 0) return;
      
      const dinnerCombined = agg.dinnerVeg + agg.dinnerNonVeg;
      
      data.push({
        Name: agg.name,
        Date: agg.date,
        Breakfast: agg.breakfast,
        'Lunch Veg': agg.lunchVeg,
        'Lunch Non Veg': agg.lunchNonVeg,
        Dinner: dinnerCombined
      });
    });
    
  return Papa.unparse(data);
}
