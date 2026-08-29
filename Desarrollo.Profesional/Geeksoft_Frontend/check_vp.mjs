import fs from 'fs';
const quotes = JSON.parse(fs.readFileSync('C:/Users/rguti/PETRAL.SMART.DASHBOARD/scratch/all_quotes.json', 'utf-8'));
const q = quotes.find(x => x.name.includes('SPCC.ILO.MEJILLONES.ILO.2025-2027 COA MOQUEGUA'));
console.log("vesselParams in Foto:", JSON.stringify(q.legs_data.vesselParams, null, 2));
