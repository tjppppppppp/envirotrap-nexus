// EnviroTrap Nexus v0.2.0 - IBM AI for Good Challenge
// Full JSX source - preserves all v0.1.0 functionality + adds:
//   - Ask Nexus (deterministic AI assistant)
//   - Intelligent Collection Log (smart suggestions, duplicate detection)
//   - Overview improvements (time-period toggle, AI insights strip, dig-in links)
//   - Waste Explorer visual breakdown panel

const { useState, useMemo, useEffect, useRef } = React;
const { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = Recharts;

// ─── PALETTE & DESIGN TOKENS ─────────────────────────────────────────────────
const PAL = {
  navy: '#1e3a5f', navyMid: '#2d5a8e', navyLight: '#3b6fae',
  cream: '#f8f5ee', creamDark: '#f0e8d5', border: '#e4d5b5',
  teal: '#2d6a4f', tealLight: '#66b089',
  amber: '#e9a825', amberDark: '#a87214', amberBg: '#fef9ec',
  red: '#dc2626', redLight: '#fee2e2',
  muted: '#6b7280', text: '#374151', white: '#ffffff',
  STREAMS: { 'General Waste': '#3b6fae', 'Recycling': '#2d6a4f', 'Compost': '#e9a825', 'Landfill': '#6b7280', 'Confidential Paper': '#a87214' }
};
const MC = ['#1e3a5f','#2d6a4f','#3b6fae','#e9a825','#66b089','#c4a360','#80a2ce','#a87214'];

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const BUILDINGS = [
  { id:'B001', name:'Illini Union', abbr:'IU', type:'Student Services', sqft:270000, floors:4 },
  { id:'B002', name:'Siebel Center for Computer Science', abbr:'SC', type:'Academic', sqft:210000, floors:4 },
  { id:'B003', name:'Campus Recreation Center East', abbr:'CRCE', type:'Recreation', sqft:158000, floors:3 },
  { id:'B004', name:'Grainger Engineering Library', abbr:'GEL', type:'Academic', sqft:89000, floors:5 },
  { id:'B005', name:'Foellinger Auditorium', abbr:'FA', type:'Academic', sqft:45000, floors:2 },
  { id:'B006', name:'Ikenberry Dining Center', abbr:'IDC', type:'Dining', sqft:62000, floors:2 },
  { id:'B007', name:'Lincoln Hall', abbr:'LH', type:'Academic', sqft:78000, floors:4 },
  { id:'B008', name:'Natural History Building', abbr:'NHB', type:'Academic', sqft:110000, floors:4 },
  { id:'B009', name:'Beckman Institute', abbr:'BI', type:'Research', sqft:205000, floors:5 },
  { id:'B010', name:'Memorial Stadium', abbr:'MS', type:'Athletics', sqft:350000, floors:5 },
  { id:'B011', name:'Chemistry Annex', abbr:'CA', type:'Academic', sqft:55000, floors:3 },
  { id:'B012', name:'Pennsylvania Avenue Residence Hall', abbr:'PAR', type:'Residential', sqft:185000, floors:10 },
  { id:'B013', name:'Loomis Laboratory of Physics', abbr:'LL', type:'Academic', sqft:95000, floors:4 },
  { id:'B014', name:'Transportation Building', abbr:'TB', type:'Academic', sqft:48000, floors:3 },
  { id:'B015', name:'Waste Transfer Station', abbr:'WTS', type:'Operations', sqft:18000, floors:1 },
];

// Route definitions with schedule intelligence
const ROUTE_DEFS = [
  { id:'RA', label:'Route A: North Campus', buildings:['B009','B013','B008','B004'], containers:['Dumpster 2yd','Cart 96gal'], days:[1,2,3,4,5], startHour:6, endHour:10 },
  { id:'RB', label:'Route B: Engineering Quad', buildings:['B002','B004','B013','B011'], containers:['Dumpster 4yd','Cart 96gal'], days:[2,4], startHour:7, endHour:11 },
  { id:'RC', label:'Route C: South Campus', buildings:['B003','B010','B014'], containers:['Compactor','Dumpster 8yd'], days:[1,3,5], startHour:7, endHour:12 },
  { id:'RD', label:'Route D: Residential East', buildings:['B012','B006','B001'], containers:['Compactor','Cart 96gal','Cart 64gal'], days:[1,2,3,4,5], startHour:5, endHour:9 },
  { id:'RE', label:'Route E: Athletics', buildings:['B010','B005','B001'], containers:['Dumpster 8yd','Dumpster 4yd'], days:[1,3,5], startHour:8, endHour:13 },
];

const STREAMS = ['General Waste','Recycling','Compost','Landfill','Confidential Paper'];
const CONTAINERS = ['Dumpster 2yd','Dumpster 4yd','Dumpster 8yd','Cart 96gal','Cart 64gal','Compactor','Toter'];
const MATS = ['Paper','Cardboard','Plastics','Metals','Glass','Food Waste','Paper Towels','Other'];

function rnd(a,b) { return Math.floor(Math.random()*(b-a+1))+a; }
function pick(a) { return a[Math.floor(Math.random()*a.length)]; }

const DEMO_RECORDS = (() => {
  const r = [];
  const s = new Date('2023-01-01').getTime(), e = new Date('2024-06-30').getTime();
  for (let i=0;i<220;i++) {
    const d = new Date(s+Math.random()*(e-s));
    const hb = Math.random()<0.126;
    const g=rnd(200,4800), t=rnd(80,400);
    const b = hb ? pick(BUILDINGS.slice(0,14)) : null;
    const route = pick(ROUTE_DEFS);
    r.push({
      id:`LM${String(i+1).padStart(5,'0')}`,
      date:d.toISOString().split('T')[0],
      time:`${String(rnd(6,17)).padStart(2,'0')}:${String(rnd(0,59)).padStart(2,'0')}`,
      route:route.label,
      route_id:route.id,
      building_id:b?.id||null,
      building_name:b?.name||null,
      container:pick(CONTAINERS),
      stream:pick(STREAMS),
      gross_lbs:g, tare_lbs:t, net_lbs:g-t,
      has_rfid:Math.random()<0.08,
      notes:Math.random()<0.15?pick(['Container overfull','Access blocked','Rain delay','Contamination observed']):''
    });
  }
  return r.sort((a,b)=>a.date.localeCompare(b.date));
})();

const DEMO_AUDITS = [
  { id:'AUD001', title:'Illini Union Pre-Event Audit', building_id:'B001', building_name:'Illini Union', date:'2024-03-15', auditors:['Tajuan Williams','Sarah Chen'], status:'Completed', sample_weight_lbs:87.3, stream:'General Waste',
    materials:[{name:'Paper',weight:12.4},{name:'Plastics',weight:9.1},{name:'Food Waste',weight:18.2},{name:'Paper Towels',weight:19.2},{name:'Other',weight:28.4}],
    notes:'High paper towel fraction consistent with high-traffic restroom proximity.' },
  { id:'AUD002', title:'CRCE Recycling Stream Audit', building_id:'B003', building_name:'Campus Recreation Center East', date:'2024-02-10', auditors:['Sarah Chen'], status:'Completed', sample_weight_lbs:41.6, stream:'Recycling',
    materials:[{name:'Paper',weight:14.2},{name:'Plastics',weight:11.3},{name:'Food Waste',weight:4.0},{name:'Metals',weight:6.1},{name:'Other',weight:6.0}],
    notes:'Food waste contamination at 9.7% of sample. Likely source: post-workout snacks.' },
  { id:'AUD003', title:'Ikenberry Post-Lunch Compost', building_id:'B006', building_name:'Ikenberry Dining Center', date:'2024-01-22', auditors:['Tajuan Williams'], status:'Under Review', sample_weight_lbs:112.4, stream:'Compost',
    materials:[{name:'Food Waste',weight:98.1},{name:'Paper',weight:8.2},{name:'Plastics',weight:4.1},{name:'Other',weight:2.0}],
    notes:'Single data point. Unusually high volume requires replication before conclusions.' },
  { id:'AUD004', title:'Beckman Lab Recycling Pilot', building_id:'B009', building_name:'Beckman Institute', date:'2024-04-18', auditors:['Sarah Chen','Marcus Lee'], status:'In Progress', sample_weight_lbs:67.8, stream:'Recycling',
    materials:[{name:'Plastics',weight:20.4},{name:'Paper',weight:12.1},{name:'Metals',weight:8.4},{name:'Glass',weight:6.3},{name:'Other',weight:20.6}],
    notes:'Preliminary only. Plastics at 30.1% higher than expected. Lab consumables suspected driver.' },
  { id:'AUD005', title:'PAR Baseline Residential Audit', building_id:'B012', building_name:'Pennsylvania Avenue Residence Hall', date:'2024-07-20', auditors:[], status:'Planned', sample_weight_lbs:null, stream:'General Waste', materials:[], notes:'Scheduled before fall move-in.' },
];

const REGO_DATA = [
  { id:'R001', building:'Illini Union', bin:'IU-B12', date:'2024-03-20', stream:'General Waste', fill_pct:78, est_weight_lbs:142, materials:{paper:18,plastics:32,food_waste:45,paper_towels:27,other:20}, contamination:'Moderate food in recycling adjacent', confidence:'Medium' },
  { id:'R002', building:'CRCE', bin:'CRCE-R04', date:'2024-03-22', stream:'Recycling', fill_pct:65, est_weight_lbs:38, materials:{paper:14,plastics:12,food_waste:4,paper_towels:2,other:6}, contamination:'Low - minimal food debris', confidence:'High' },
  { id:'R003', building:'Ikenberry Dining', bin:'IDC-C01', date:'2024-04-05', stream:'Compost', fill_pct:92, est_weight_lbs:198, materials:{paper:5,plastics:8,food_waste:175,paper_towels:6,other:4}, contamination:'Low - expected compost content', confidence:'High' },
  { id:'R004', building:'Siebel Center', bin:'SC-G08', date:'2024-04-12', stream:'General Waste', fill_pct:45, est_weight_lbs:34, materials:{paper:12,plastics:9,food_waste:5,paper_towels:4,other:4}, contamination:'None observed', confidence:'High' },
  { id:'R005', building:'Beckman Institute', bin:'BI-G11', date:'2024-04-18', stream:'General Waste', fill_pct:55, est_weight_lbs:41, materials:{paper:15,plastics:14,food_waste:3,paper_towels:5,other:4}, contamination:'None observed', confidence:'Medium' },
];

const DEMO_INSIGHTS = [
  { id:'INS001', title:'Paper Towel Fraction at Illini Union Warrants Attention', status:'Validated', confidence:'High', category:'Contamination', building_ids:['B001'], summary:'AUD001 found 22% paper towel content by weight in Illini Union general waste. Cross-contamination into adjacent recycling bins observed in Rego data.', evidence:'AUD001 (physical sort, 87.3 lbs sample)', recommendation:'Pilot dedicated paper towel compost collection near high-traffic restrooms. Set AUD001 as baseline.' },
  { id:'INS002', title:'Only 12.6% of Pickup Records Have Building Attribution', status:'Validated', confidence:'High', category:'Data Quality', building_ids:[], summary:'Only 12.6% of 220 demo pickup records can be attributed to a specific building. This mirrors the historical 79,533-record finding from EnviroTrap research.', evidence:'LoadMan records analysis', recommendation:'Investigate whether route logs, container IDs, or driver documentation could improve retrospective attribution.' },
  { id:'INS003', title:'Ikenberry Post-Meal Food Waste Volume Spike', status:'Under Investigation', confidence:'Medium', category:'Composition', building_ids:['B006'], summary:'AUD003 found an unusually high post-lunch food waste volume of 112.4 lbs. Context requires additional audits.', evidence:'AUD003 (single data point)', recommendation:'Conduct 3 additional audits at Ikenberry at different meal times before drawing conclusions.' },
  { id:'INS004', title:'RFID Tag Operational Rate Extremely Low', status:'Validated', confidence:'High', category:'Data Quality', building_ids:[], summary:'Only 8% of simulated pickup records contain any RFID identifier field. Operational status must be confirmed with F&S.', evidence:'LoadMan records (17/220 have RFID populated)', recommendation:'Confirm with F&S whether RFID systems are deployed and operational on collection routes.' },
  { id:'INS005', title:'Recycling Contamination at CRCE Warrants Follow-up', status:'Recommended for Action', confidence:'Medium', category:'Contamination', building_ids:['B003'], summary:'AUD002 documented food waste contamination in CRCE recycling bins at approximately 9.7% of sample weight.', evidence:'AUD002 contamination finding', recommendation:'Propose targeted bin labeling intervention at CRCE. Baseline: AUD002.' },
  { id:'INS006', title:'Route B Engineering Quad Has No Attributed Records', status:'Under Investigation', confidence:'Medium', category:'Data Quality', building_ids:['B002','B004','B013'], summary:'Route B covers the engineering quad but no pickup records carry building-level attribution.', evidence:'LoadMan route analysis', recommendation:'Request route manifests from F&S to determine whether building-level collection occurs on this route.' },
  { id:'INS007', title:'Compost Stream May Be Underrepresented', status:'Under Investigation', confidence:'Low', category:'Composition', building_ids:[], summary:'Compost represents 11% of LoadMan entries but dining facilities produce high organic waste. Attribution gaps may explain the discrepancy.', evidence:'LoadMan stream distribution', recommendation:'Cannot confirm without resolving attribution gap. Flag for F&S discussion.' },
  { id:'INS008', title:'Beckman Lab Plastics Exceed Expected Ratio', status:'Under Investigation', confidence:'Low', category:'Composition', building_ids:['B009'], summary:'AUD004 preliminary data shows plastics at 30.1%, higher than typical. Lab consumables likely driver.', evidence:'AUD004 preliminary (in progress)', recommendation:'Complete AUD004 before drawing conclusions.' },
];

const DEMO_INTERVENTIONS = [
  { id:'INT001', title:'CRCE Recycling Bin Re-labeling', linked_insight:'INS005', building_id:'B003', building_name:'Campus Recreation Center East', observation:'Food waste contamination in recycling bins observed in AUD002 (9.7% by weight).', proposed_action:'Replace recycling bin lids and signage with clearer "No Food Waste" messaging; add paper towel receptacles adjacent to recycling stations.', responsible_party:'F&S Waste Management + CRCE Facilities', status:'Proposed', proposed_date:'2024-07-01', baseline:'AUD002 (Feb 2024) - 9.7% food waste in recycling', followup:'Schedule AUD006 at CRCE 60 days after signage installation.', outcome:'' },
  { id:'INT002', title:'Illini Union Paper Towel Diversion Study', linked_insight:'INS001', building_id:'B001', building_name:'Illini Union', observation:'22% paper towel content in IU general waste (AUD001).', proposed_action:'Pilot dedicated paper towel compost collection in high-traffic restrooms.', responsible_party:'Illini Union Facilities + EnviroTrap Research', status:'Approved', proposed_date:'2024-08-15', baseline:'AUD001 (Mar 2024) - 22.0% paper towels by weight', followup:'Conduct post-intervention audit after one full semester.', outcome:'' },
  { id:'INT003', title:'LoadMan Attribution Improvement Investigation', linked_insight:'INS002', building_id:null, building_name:null, observation:'Only 12.6% of pickup records carry building-level attribution.', proposed_action:'Meet with F&S data team to understand LoadMan data entry workflows and identify whether building IDs exist in unexported fields.', responsible_party:'EnviroTrap Research + F&S IT', status:'In Progress', proposed_date:'2024-06-15', baseline:'12.6% attribution in analyzed dataset', followup:'Follow-up meeting scheduled July 2024.', outcome:'F&S confirmed LoadMan data collection varies by route. Some routes do not collect container-level data.' },
  { id:'INT004', title:'PAR Residential Hall Waste Signage Study', linked_insight:'INS001', building_id:'B012', building_name:'Pennsylvania Avenue Residence Hall', observation:'No current waste composition data for residential halls.', proposed_action:'Conduct baseline waste audit at PAR before fall 2024 move-in.', responsible_party:'EnviroTrap Research + Housing Facilities', status:'Proposed', proposed_date:'2024-07-20', baseline:'AUD005 (planned)', followup:'Fall 2024 follow-up audit after orientation week.', outcome:'' },
];

// ─── AI ENGINE (DETERMINISTIC) ────────────────────────────────────────────────
// All computations are traceable to DEMO_RECORDS / DEMO_AUDITS / DEMO_INSIGHTS
// No LLM calls. No fabricated data. Uncertainty is always stated.

const NexusAI = {
  // Utility calculations
  calcStats() {
    const total = DEMO_RECORDS.length;
    const attributed = DEMO_RECORDS.filter(r=>r.building_id).length;
    const totalWeight = DEMO_RECORDS.reduce((s,r)=>s+r.net_lbs,0);
    const byStream = {};
    STREAMS.forEach(s=>{ byStream[s]=DEMO_RECORDS.filter(r=>r.stream===s).reduce((a,r)=>a+r.net_lbs,0); });
    const byBuilding = {};
    DEMO_RECORDS.filter(r=>r.building_id).forEach(r=>{
      byBuilding[r.building_name]=(byBuilding[r.building_name]||0)+r.net_lbs;
    });
    const byRoute = {};
    DEMO_RECORDS.forEach(r=>{ byRoute[r.route]=(byRoute[r.route]||0)+1; });
    return { total, attributed, totalWeight, attrPct:(attributed/total*100).toFixed(1), byStream, byBuilding, byRoute };
  },

  // Statistical anomaly detection (IQR method)
  findAnomalies() {
    const weights = DEMO_RECORDS.map(r=>r.net_lbs).sort((a,b)=>a-b);
    const q1 = weights[Math.floor(weights.length*0.25)];
    const q3 = weights[Math.floor(weights.length*0.75)];
    const iqr = q3-q1;
    const low = q1-1.5*iqr, high = q3+1.5*iqr;
    return DEMO_RECORDS.filter(r=>r.net_lbs<low||r.net_lbs>high);
  },

  // Pattern: most active day-of-week
  busyDayPattern() {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const counts = Array(7).fill(0);
    DEMO_RECORDS.forEach(r=>{ counts[new Date(r.date).getDay()]++; });
    const maxIdx = counts.indexOf(Math.max(...counts));
    return { day:days[maxIdx], count:counts[maxIdx] };
  },

  // Pattern: monthly trend (last 6 months of data)
  recentTrend() {
    const monthly = {};
    DEMO_RECORDS.forEach(r=>{ const m=r.date.slice(0,7); monthly[m]=(monthly[m]||0)+r.net_lbs; });
    const months = Object.keys(monthly).sort().slice(-6);
    if (months.length < 2) return null;
    const vals = months.map(m=>monthly[m]);
    const first = vals[0], last = vals[vals.length-1];
    const pctChange = ((last-first)/first*100).toFixed(1);
    return { months, vals, pctChange, direction: last>first?'up':'down' };
  },

  // AI-generated insights strip for Overview
  generateInsights() {
    const stats = this.calcStats();
    const anomalies = this.findAnomalies();
    const busyDay = this.busyDayPattern();
    const trend = this.recentTrend();
    const topBuildings = Object.entries(stats.byBuilding).sort(([,a],[,b])=>b-a).slice(0,3);
    const topStream = Object.entries(stats.byStream).sort(([,a],[,b])=>b-a)[0];

    const insights = [];

    // Attribution finding
    insights.push({
      type:'observed',
      label:'Observed Fact',
      color:PAL.navyLight,
      text:`${stats.attrPct}% of records (${stats.attributed} of ${stats.total}) have building-level attribution. This matches the 12.6% rate found in EnviroTrap's historical analysis of 79,533 actual LoadMan records.`,
      action:'Explore in Waste Explorer',
      navTo:'explorer'
    });

    // Top stream
    if (topStream) {
      insights.push({
        type:'calculated',
        label:'Calculated Finding',
        color:PAL.teal,
        text:`${topStream[0]} is the largest stream by weight at ${(topStream[1]/stats.totalWeight*100).toFixed(1)}% (${topStream[1].toLocaleString()} lbs). Note: stream labels reflect intended destination, not verified diversion.`,
        action:'See methodology',
        navTo:'explorer'
      });
    }

    // Top buildings
    if (topBuildings.length>0) {
      const names = topBuildings.map(([n,w])=>`${n.split(' ')[0]} (${(w/2000).toFixed(1)}T)`).join(', ');
      insights.push({
        type:'calculated',
        label:'Calculated Finding',
        color:PAL.teal,
        text:`Among attributed records, ${topBuildings[0][0]} has the highest recorded weight. Top 3 attributed buildings: ${names}. ${(100-parseFloat(stats.attrPct)).toFixed(1)}% of total weight has no building attribution.`,
        action:'View Source Mapper',
        navTo:'mapper'
      });
    }

    // Anomalies
    if (anomalies.length>0) {
      insights.push({
        type:'hypothesis',
        label:'Hypothesis',
        color:PAL.amber,
        text:`${anomalies.length} records have statistically unusual net weights (outside 1.5x IQR from Q1/Q3). These may reflect data entry errors, unusually large pickups, or equipment anomalies. Human review recommended.`,
        action:'Investigate in Explorer',
        navTo:'explorer'
      });
    }

    // Trend
    if (trend) {
      insights.push({
        type:'calculated',
        label:'Calculated Finding',
        color:PAL.teal,
        text:`Over the last 6 months of demo data, net weight trended ${trend.direction} by ${Math.abs(trend.pctChange)}%. This is based on demo data and should not be reported as actual campus performance.`,
        action:null
      });
    }

    return insights;
  },

  // Ask Nexus query handler
  answer(question) {
    const q = question.toLowerCase().trim();
    const stats = this.calcStats();

    // Top buildings
    if (q.includes('building') && (q.includes('most')||q.includes('top')||q.includes('highest')||q.includes('weight'))) {
      const top = Object.entries(stats.byBuilding).sort(([,a],[,b])=>b-a).slice(0,5);
      if (top.length===0) return this._noData('building attribution');
      const list = top.map(([name,w],i)=>`${i+1}. ${name}: ${w.toLocaleString()} lbs (${(w/stats.totalWeight*100).toFixed(1)}% of attributed weight)`).join('\n');
      return {
        answer:`Based on the ${stats.attributed} records with building attribution (${stats.attrPct}% of total):\n\n${list}`,
        note:`${(100-parseFloat(stats.attrPct)).toFixed(1)}% of records have no building ID, so these rankings reflect only attributed records. Total unattributed weight is unknown.`,
        type:'calculated', records_used:stats.attributed, total_records:stats.total
      };
    }

    // Attribution rate
    if (q.includes('attribution')||q.includes('attributed')||(q.includes('building')&&q.includes('id'))) {
      return {
        answer:`${stats.attrPct}% of records (${stats.attributed} of ${stats.total}) have building-level attribution.\n\nThis matches EnviroTrap's historical finding: in a dataset of approximately 79,533 actual LoadMan records, only 12.6% could be attributed to specific buildings.\n\nThis does not mean 87.4% of campus waste is untracked - it reflects limitations in the building attribution fields within LoadMan records.`,
        note:'Source: Demo dataset (220 simulated records) calibrated to match historical pattern.',
        type:'observed', records_used:stats.total, total_records:stats.total
      };
    }

    // Stream distribution
    if (q.includes('stream')||q.includes('recycling')||q.includes('compost')||q.includes('landfill')||q.includes('diversion')) {
      const lines = Object.entries(stats.byStream).sort(([,a],[,b])=>b-a)
        .map(([s,w])=>`${s}: ${w.toLocaleString()} lbs (${(w/stats.totalWeight*100).toFixed(1)}%)`).join('\n');
      return {
        answer:`Waste stream distribution by net weight:\n\n${lines}\n\nTotal recorded net weight: ${stats.totalWeight.toLocaleString()} lbs (${(stats.totalWeight/2000).toFixed(1)} tons)`,
        note:"IMPORTANT: Stream labels reflect the intended destination at time of collection, not verified final disposition. 'Recycling' does not confirm that materials were actually recycled. Actual diversion rates require downstream tracking data not currently available.",
        type:'calculated', records_used:stats.total, total_records:stats.total
      };
    }

    // Total weight
    if (q.includes('total')||q.includes('weight')||q.includes('tons')||q.includes('pounds')||q.includes('lbs')) {
      return {
        answer:`Total recorded net weight: ${stats.totalWeight.toLocaleString()} lbs (${(stats.totalWeight/2000).toFixed(1)} tons)\n\nThis is the sum of net weights (gross minus tare) across all ${stats.total} demo records spanning January 2023 through June 2024.`,
        note:'Demo data only. These figures should not be reported as actual UIUC waste generation statistics.',
        type:'calculated', records_used:stats.total, total_records:stats.total
      };
    }

    // Anomalies / inconsistencies
    if (q.includes('anomal')||q.includes('inconsistent')||q.includes('unusual')||q.includes('outlier')||q.includes('suspicious')) {
      const anomalies = this.findAnomalies();
      const examples = anomalies.slice(0,3).map(r=>`${r.id} (${r.date}): ${r.net_lbs.toLocaleString()} lbs, ${r.stream}, ${r.building_name||'no building'}`).join('\n');
      return {
        answer:`Statistical anomaly detection (IQR method) identified ${anomalies.length} records with unusual net weights:\n\n${examples}${anomalies.length>3?`\n...and ${anomalies.length-3} more`:''}\n\nThese records are outside 1.5x the interquartile range and warrant human review.`,
        note:'Anomaly detection uses net_lbs only. Other inconsistencies (missing timestamps, duplicate routes) require separate review. This method will flag genuine unusual loads as well as data errors.',
        type:'calculated', records_used:stats.total, total_records:stats.total
      };
    }

    // RFID / data quality
    if (q.includes('rfid')||q.includes('data quality')||q.includes('missing')||q.includes('gap')) {
      const rfid = DEMO_RECORDS.filter(r=>r.has_rfid).length;
      const noBuilding = stats.total-stats.attributed;
      return {
        answer:`Current data quality indicators:\n\n- Records with building attribution: ${stats.attributed} of ${stats.total} (${stats.attrPct}%)\n- Records with RFID identifier: ${rfid} of ${stats.total} (${(rfid/stats.total*100).toFixed(1)}%)\n- Records without building ID: ${noBuilding} (${(100-parseFloat(stats.attrPct)).toFixed(1)}%)\n- Records with driver notes: ${DEMO_RECORDS.filter(r=>r.notes).length}`,
        note:"RFID operational status must be confirmed with F&S. Demo data simulates ~8% RFID coverage based on observed patterns in historical records.",
        type:'observed', records_used:stats.total, total_records:stats.total
      };
    }

    // Contamination
    if (q.includes('contamination')||q.includes('contaminated')) {
      const contaminated = DEMO_AUDITS.filter(a=>a.notes&&a.notes.toLowerCase().includes('contamination'));
      const lines = DEMO_INSIGHTS.filter(i=>i.category==='Contamination').map(i=>`${i.title}: ${i.summary}`).join('\n\n');
      return {
        answer:`Contamination findings from waste audits:\n\n${lines}`,
        note:'Findings are based on physical waste audits, which are point-in-time measurements of small samples. They should not be generalized without additional audit replication.',
        type:'observed', records_used:DEMO_AUDITS.length, total_records:DEMO_AUDITS.length
      };
    }

    // Route / collection pattern
    if (q.includes('route')||q.includes('collection pattern')||q.includes('pattern')) {
      const busyDay = this.busyDayPattern();
      const lines = Object.entries(stats.byRoute).sort(([,a],[,b])=>b-a).map(([r,c])=>`${r}: ${c} records`).join('\n');
      return {
        answer:`Collection records by route:\n\n${lines}\n\nMost active day-of-week: ${busyDay.day} (${busyDay.count} records)`,
        note:"Route names in demo data are illustrative. Actual UIUC collection routes and schedules should be confirmed with F&S Operations before operational use.",
        type:'calculated', records_used:stats.total, total_records:stats.total
      };
    }

    // Diversion rate methodology
    if (q.includes('diversion rate')||q.includes('how is diversion')||q.includes('how is recycling')) {
      return {
        answer:`Diversion rate calculation methodology:\n\nEnviroTrap does not currently report a verified diversion rate because:\n\n1. Only ${stats.attrPct}% of records have building attribution - the denominator is incomplete\n2. Stream labels reflect intended destination at collection, not verified final processing\n3. Downstream disposition (what happens after leaving campus) is not tracked in LoadMan data\n4. "Recycling" may include materials that are downcycled, landfilled due to contamination, or processed in ways that do not meet EPA diversion definitions\n\nAny reported diversion rate would require: (a) complete weight capture across all streams, (b) verified downstream disposition data, (c) an agreed methodology definition (mass balance, weight-based, etc.)`,
        note:'This response reflects EnviroTrap research findings from stakeholder conversations and LoadMan data analysis.',
        type:'methodology', records_used:0, total_records:stats.total
      };
    }

    // Intervention status
    if (q.includes('intervention')||q.includes('action')||q.includes('progress')) {
      const lines = DEMO_INTERVENTIONS.map(i=>`${i.title} - Status: ${i.status}${i.outcome?'\nOutcome: '+i.outcome:''}`).join('\n\n');
      return {
        answer:`Current intervention tracking:\n\n${lines}`,
        note:'Interventions are proposed or in-progress. No causal claims about environmental impact are made without before/after audit comparison.',
        type:'observed', records_used:DEMO_INTERVENTIONS.length, total_records:DEMO_INTERVENTIONS.length
      };
    }

    // What data is missing
    if (q.includes('what data')||q.includes('what is missing')||q.includes('what do we need')) {
      return {
        answer:`Key data gaps identified by EnviroTrap research:\n\n1. Building attribution for ${(100-parseFloat(stats.attrPct)).toFixed(1)}% of collection records\n2. Downstream disposition data (where does waste go after WTS?)\n3. RFID/container mapping to building (${(100-rfidPct(stats)).toFixed(1)}% of records lack RFID)\n4. Verified collection route manifests from F&S\n5. Compost stream destination and processing verification\n6. Historical audit data beyond the 5 existing audits\n7. Agreed diversion rate methodology and baseline`,
        note:'This gap analysis is based on EnviroTrap research conversations with F&S stakeholders.',
        type:'methodology', records_used:0, total_records:stats.total
      };
    }

    // Default: not understood
    return {
      answer:null,
      type:'unknown'
    };
  }
};

function rfidPct(stats) { return DEMO_RECORDS.filter(r=>r.has_rfid).length/stats.total*100; }

// Suggested questions for Ask Nexus
const NEXUS_SUGGESTIONS = [
  'Which buildings generated the most waste?',
  'What is our current building attribution rate?',
  'How is the diversion rate calculated?',
  'Which records appear inconsistent or unusual?',
  'What is the breakdown by waste stream?',
  'What data is missing before we can make a recommendation?',
  'What are the contamination findings?',
  'What is the total net weight collected?',
  'What are our active interventions?',
  'What do collection patterns look like by route?',
];

// Collection Log AI: smart suggestions
const CollectionAI = {
  suggestRoute(hour, dow) {
    // dow: 0=Sun, 1=Mon...6=Sat
    const active = ROUTE_DEFS.filter(r => r.days.includes(dow) && hour >= r.startHour && hour <= r.endHour);
    return active;
  },
  suggestBuildingsForRoute(routeId) {
    const route = ROUTE_DEFS.find(r=>r.id===routeId);
    if (!route) return BUILDINGS;
    return BUILDINGS.filter(b=>route.buildings.includes(b.id));
  },
  suggestContainerForRoute(routeId) {
    const route = ROUTE_DEFS.find(r=>r.id===routeId);
    return route ? route.containers : CONTAINERS;
  },
  detectDuplicate(form, existingLogs) {
    const today = new Date().toISOString().split('T')[0];
    return existingLogs.some(l =>
      l.building_id === form.building &&
      l.route_id === form.route_id &&
      l.date === today &&
      l.stream === form.stream &&
      Math.abs(parseToTime(l.time) - parseToTime(form.time)) < 120
    );
  },
  detectAbnormalWeight(buildingId, net) {
    const bldRecs = DEMO_RECORDS.filter(r=>r.building_id===buildingId&&r.net_lbs>0);
    if (bldRecs.length < 3) return null;
    const avg = bldRecs.reduce((s,r)=>s+r.net_lbs,0)/bldRecs.length;
    const stddev = Math.sqrt(bldRecs.reduce((s,r)=>s+(r.net_lbs-avg)**2,0)/bldRecs.length);
    if (Math.abs(net-avg) > 2*stddev) {
      return { avg:Math.round(avg), stddev:Math.round(stddev), zScore:((net-avg)/stddev).toFixed(1) };
    }
    return null;
  }
};

function parseToTime(timeStr) {
  const [h,m] = timeStr.split(':').map(Number);
  return h*60+m;
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function DemoBanner() {
  return (
    <div className="demo-banner text-center py-1.5 text-xs font-bold text-amber-900 tracking-widest uppercase">
      DEMO DATA - NOT ACTUAL UIUC OPERATIONAL RECORDS
    </div>
  );
}

function Badge({ cls, children }) {
  return <span className={`badge ${cls||'badge-gray'}`}>{children}</span>;
}

function SH({ title, sub, action }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <h2 className="section-header" style={{ marginBottom:sub?4:0 }}>{title}</h2>
        {action}
      </div>
      {sub && <p style={{ margin:0, fontSize:13, color:PAL.muted }}>{sub}</p>}
    </div>
  );
}

function StatCard({ label, value, sub, color, onClick, linkLabel }) {
  const colors = { navy:PAL.navy, green:PAL.teal, amber:PAL.amber, red:PAL.red };
  const c = colors[color]||PAL.navy;
  return (
    <div className="stat-card" onClick={onClick}
      style={{ borderLeft:`4px solid ${c}`, cursor:onClick?'pointer':'default', transition:'box-shadow .15s' }}
      onMouseEnter={e=>{ if(onClick) e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.boxShadow='none'; }}>
      <div style={{ fontSize:11, fontWeight:600, color:PAL.muted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color:c, lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:PAL.muted, marginTop:3 }}>{sub}</div>}
      {onClick && linkLabel && <div style={{ fontSize:11, color:PAL.navyLight, marginTop:6, fontWeight:600 }}>{linkLabel} +</div>}
    </div>
  );
}

function QBar({ label, value, pct, color }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
        <span style={{ color:PAL.text }}>{label}</span>
        <span style={{ fontWeight:600, color:PAL.navy }}>{value}</span>
      </div>
      <div className="progress-bar" style={{ height:8 }}>
        <div className="progress-fill" style={{ width:`${pct}%`, background:color||PAL.navyLight }} />
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children, maxWidth }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth:maxWidth||620 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:PAL.navy }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:PAL.muted }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InfoBanner({ text, color }) {
  return (
    <div style={{ background:color==='blue'?'#eff6ff':PAL.amberBg, border:`1px solid ${color==='blue'?'#bfdbfe':'#fde68a'}`, borderRadius:6, padding:'8px 12px', fontSize:12, color:color==='blue'?'#1e40af':'#92400e', marginBottom:12 }}>
      {text}
    </div>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <div style={{ color:PAL.red, fontSize:12, marginTop:3 }}>{msg}</div>;
}

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
function Overview({ setActive }) {
  const [timePeriod, setTimePeriod] = useState('month');
  const [aiExpanded, setAiExpanded] = useState(true);

  const stats = useMemo(()=>NexusAI.calcStats(),[]);
  const aiInsights = useMemo(()=>NexusAI.generateInsights(),[]);

  // Weight by time period (derived from actual DEMO_RECORDS)
  const trendData = useMemo(()=>{
    const groups = {};
    DEMO_RECORDS.forEach(r=>{
      const d = new Date(r.date);
      let key;
      if (timePeriod==='day') key=r.date;
      else if (timePeriod==='week') {
        const wk=new Date(d); wk.setDate(d.getDate()-d.getDay());
        key=wk.toISOString().slice(0,10);
      } else {
        key=r.date.slice(0,7);
      }
      groups[key]=(groups[key]||0)+r.net_lbs;
    });
    return Object.entries(groups).sort().map(([k,v])=>({ period:k, weight:Math.round(v) })).slice(-24);
  },[timePeriod]);

  // Top buildings by attributed weight
  const buildingData = useMemo(()=>{
    const g={};
    DEMO_RECORDS.filter(r=>r.building_id).forEach(r=>{ g[r.building_name]=(g[r.building_name]||0)+r.net_lbs; });
    return Object.entries(g).sort(([,a],[,b])=>b-a).slice(0,8).map(([name,weight])=>({ name:name.length>18?name.slice(0,16)+'...':name, weight:Math.round(weight) }));
  },[]);

  // Stream distribution
  const streamData = useMemo(()=>
    Object.entries(stats.byStream).map(([name,value])=>({ name, value })).filter(d=>d.value>0)
  ,[stats]);

  const typeColors = { observed:PAL.navyLight, calculated:PAL.teal, hypothesis:PAL.amber, methodology:PAL.muted };

  return (
    <div style={{ padding:24 }}>
      <SH title="Waste Intelligence Dashboard"
        sub="Overview of EnviroTrap Nexus data, research status, and collection analytics"
        action={<Badge cls="badge-amber">Demo Mode</Badge>} />

      {/* Hero Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:14, marginBottom:20 }}>
        <StatCard label="Total Net Weight" value={`${(stats.totalWeight/2000).toFixed(1)} T`} sub={`${stats.totalWeight.toLocaleString()} lbs across ${stats.total} records`} color="green" onClick={()=>setActive('explorer')} linkLabel="Explore records" />
        <StatCard label="Total Records" value={stats.total.toLocaleString()} sub="Simulated LoadMan records" color="navy" onClick={()=>setActive('explorer')} linkLabel="View all" />
        <StatCard label="Building Attribution" value={`${stats.attrPct}%`} sub={`${stats.attributed} of ${stats.total} records linked to buildings`} color="amber" onClick={()=>setActive('mapper')} linkLabel="View Source Mapper" />
        <StatCard label="Missing Attribution" value={`${(100-parseFloat(stats.attrPct)).toFixed(1)}%`} sub="Records without building ID" color="red" onClick={()=>setActive('insights')} linkLabel="View insights" />
      </div>

      {/* Research Context */}
      <div className="card" style={{ padding:14, marginBottom:20, borderLeft:`4px solid ${PAL.amber}`, background:PAL.amberBg }}>
        <div style={{ fontSize:11, fontWeight:700, color:PAL.amberDark, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Research Context - Historical Finding</div>
        <p style={{ margin:0, fontSize:13, color:PAL.text, lineHeight:1.7 }}>
          EnviroTrap analyzed approximately <strong>79,533</strong> historical LoadMan truck-weight records. Only <strong>9,989 (~12.6%)</strong> could be attributed to specific buildings. This does not mean 87.4% of campus waste is untracked - it reflects limitations in building attribution within the analyzed dataset. Demo data simulates this same pattern.
        </p>
      </div>

      {/* AI Insights Strip */}
      <div className="card" style={{ padding:14, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ background:PAL.navy, color:'#fff', borderRadius:5, padding:'2px 8px', fontSize:11, fontWeight:700 }}>ASK NEXUS</div>
            <span style={{ fontSize:13, fontWeight:700, color:PAL.navy }}>AI-Computed Insights</span>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:11, color:PAL.muted }}>Deterministic analysis of demo dataset</span>
            <button onClick={()=>setAiExpanded(x=>!x)} style={{ background:'none', border:`1px solid ${PAL.border}`, borderRadius:5, padding:'3px 10px', cursor:'pointer', fontSize:12, color:PAL.muted }}>{aiExpanded?'Collapse':'Expand'}</button>
          </div>
        </div>
        {aiExpanded && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {aiInsights.map((ins,i)=>(
              <div key={i} style={{ background:PAL.cream, borderRadius:6, padding:'10px 14px', borderLeft:`3px solid ${typeColors[ins.type]||PAL.muted}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:'#fff', background:typeColors[ins.type]||PAL.muted, padding:'1px 7px', borderRadius:10 }}>{ins.label.toUpperCase()}</span>
                </div>
                <p style={{ margin:0, fontSize:13, color:PAL.text, lineHeight:1.6 }}>{ins.text}</p>
                {ins.action && ins.navTo && (
                  <button onClick={()=>setActive(ins.navTo)} style={{ background:'none', border:'none', color:PAL.navyLight, fontSize:12, cursor:'pointer', padding:'4px 0 0', fontWeight:600 }}>
                    {ins.action} +
                  </button>
                )}
              </div>
            ))}
            <div style={{ fontSize:11, color:PAL.muted, padding:'4px 0' }}>
              All insights computed from {stats.total} demo records. Methodology: IQR anomaly detection, weight aggregation by building/stream. Not actual UIUC operational data.
            </div>
          </div>
        )}
      </div>

      {/* Collection Weight Trend */}
      <div className="card" style={{ padding:16, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:14 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:PAL.navy }}>Collection Weight Trend</div>
            <div style={{ fontSize:12, color:PAL.muted }}>Net weight from actual demo records (not independently randomized)</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {['day','week','month'].map(p=>(
              <button key={p} onClick={()=>setTimePeriod(p)}
                style={{ padding:'5px 12px', borderRadius:5, border:`1px solid ${timePeriod===p?PAL.navy:PAL.border}`, background:timePeriod===p?PAL.navy:PAL.white, color:timePeriod===p?PAL.white:PAL.navy, cursor:'pointer', fontSize:12, fontWeight:600, textTransform:'capitalize' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trendData} margin={{ top:4, right:16, bottom:4, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={PAL.border} />
            <XAxis dataKey="period" tick={{ fontSize:10 }} />
            <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v)=>[`${v.toLocaleString()} lbs`, 'Net Weight']} />
            <Area type="monotone" dataKey="weight" stroke={PAL.navyLight} fill={`${PAL.navyLight}22`} strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Building + Stream charts */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16, marginBottom:20 }}>
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:4 }}>Weight by Building (Attributed Records)</div>
          <div style={{ fontSize:12, color:PAL.muted, marginBottom:12 }}>Only the {stats.attributed} records with building IDs are shown</div>
          {buildingData.length>0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={buildingData} layout="vertical" margin={{ top:0, right:12, bottom:0, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={PAL.border} />
                <XAxis type="number" tick={{ fontSize:10 }} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize:10 }} width={110} />
                <Tooltip formatter={(v)=>[`${v.toLocaleString()} lbs`, 'Net Weight']} />
                <Bar dataKey="weight" fill={PAL.teal} radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign:'center', color:PAL.muted, padding:30 }}>No attributed records</div>}
          <button onClick={()=>setActive('mapper')} style={{ marginTop:10, background:'none', border:`1px solid ${PAL.border}`, borderRadius:5, padding:'5px 12px', cursor:'pointer', fontSize:12, color:PAL.navyLight, fontWeight:600 }}>View Source Mapper +</button>
        </div>

        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:4 }}>Waste Stream Distribution</div>
          <div style={{ fontSize:12, color:PAL.muted, marginBottom:8 }}>By net weight - intended destination only, not verified diversion</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={streamData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent })=>`${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {streamData.map((e,i)=>(<Cell key={i} fill={PAL.STREAMS[e.name]||MC[i]} />))}
              </Pie>
              <Tooltip formatter={(v)=>[`${v.toLocaleString()} lbs`, 'Net Weight']} />
            </PieChart>
          </ResponsiveContainer>
          {streamData.map((d,i)=>(
            <div key={d.name} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
              <div style={{ width:10, height:10, borderRadius:2, background:PAL.STREAMS[d.name]||MC[i], flexShrink:0 }} />
              <span style={{ flex:1, fontSize:12 }}>{d.name}</span>
              <span style={{ fontSize:12, fontWeight:600, color:PAL.navy }}>{(d.value/stats.totalWeight*100).toFixed(1)}%</span>
              <span style={{ fontSize:11, color:PAL.muted }}>{d.value.toLocaleString()} lbs</span>
            </div>
          ))}
          <div style={{ marginTop:8, fontSize:11, color:PAL.muted, fontStyle:'italic' }}>
            Stream labels = intended destination at collection. Verified diversion requires downstream data.
          </div>
        </div>
      </div>

      {/* Quick data quality */}
      <div className="card" style={{ padding:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:12 }}>Data Quality Indicators</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:10 }}>
          <QBar label="Records with building ID" value={`${stats.attrPct}%`} pct={parseFloat(stats.attrPct)} color={PAL.teal} />
          <QBar label="Records with RFID" value={`${(DEMO_RECORDS.filter(r=>r.has_rfid).length/stats.total*100).toFixed(1)}%`} pct={DEMO_RECORDS.filter(r=>r.has_rfid).length/stats.total*100} color={PAL.navyLight} />
          <QBar label="Records with container ID" value="100%" pct={100} color={PAL.amber} />
          <QBar label="Records with timestamps" value="100%" pct={100} color={PAL.teal} />
        </div>
      </div>
    </div>
  );
}

// ─── WASTE EXPLORER ───────────────────────────────────────────────────────────
function WasteExplorer() {
  const [filter, setFilter] = useState({ route:'', stream:'', building:'', from:'', to:'' });
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState(false);
  const [step, setStep] = useState(0);
  const [csv, setCsv] = useState(null);
  const [cm, setCm] = useState({});
  const [showMethodology, setShowMethodology] = useState(false);
  const PS = 25;

  const filtered = useMemo(()=>DEMO_RECORDS.filter(r=>{
    if (filter.route && r.route_id!==filter.route) return false;
    if (filter.stream && r.stream!==filter.stream) return false;
    if (filter.building && r.building_id!==filter.building) return false;
    if (filter.from && r.date<filter.from) return false;
    if (filter.to && r.date>filter.to) return false;
    return true;
  }),[filter]);

  const paged = filtered.slice(page*PS,(page+1)*PS);
  const tp = Math.ceil(filtered.length/PS);
  const att = DEMO_RECORDS.filter(r=>r.building_id).length;

  // Weight breakdown for filtered set
  const weightBreakdown = useMemo(()=>{
    const totals = {};
    STREAMS.forEach(s=>{ totals[s]=filtered.filter(r=>r.stream===s).reduce((a,r)=>a+r.net_lbs,0); });
    const total = Object.values(totals).reduce((a,b)=>a+b,0);
    return { totals, total };
  },[filtered]);

  // Anomalies in filtered set
  const anomalies = useMemo(()=>NexusAI.findAnomalies(),[]);
  const anomalyIds = new Set(anomalies.map(r=>r.id));

  function handleCSV(e) {
    const file = e.target.files[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = ev => {
      const lines = ev.target.result.split('\n').filter(l=>l.trim());
      const headers = lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));
      const rows = lines.slice(1,6).map(l=>{
        const v = l.split(',').map(x=>x.trim().replace(/^"|"$/g,''));
        return Object.fromEntries(headers.map((h,i)=>[h,v[i]||'']));
      });
      const autoMap={};
      headers.forEach(h=>{
        const lh=h.toLowerCase();
        if(lh.includes('date')) autoMap.date=h;
        else if(lh.includes('weight')||lh.includes('net')) autoMap.net_lbs=h;
        else if(lh.includes('stream')||lh.includes('type')) autoMap.stream=h;
        else if(lh.includes('building')) autoMap.building=h;
        else if(lh.includes('route')) autoMap.route=h;
        else if(lh.includes('container')) autoMap.container=h;
      });
      setCsv({ filename:file.name, headers, rows, total:lines.length-1 });
      setCm(autoMap);
      setStep(1);
    };
    rd.readAsText(file);
  }

  function exp() {
    const hdr = 'ID,Date,Time,Route,Building,Container,Stream,Gross,Net,RFID,Notes';
    const rows = filtered.map(r=>[r.id,r.date,r.time,r.route,r.building_name||'Unknown',r.container,r.stream,r.gross_lbs,r.net_lbs,r.has_rfid?'Yes':'No',r.notes||''].join(','));
    const blob = new Blob([[hdr,...rows].join('\n')],{type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='envirotrap_records.csv'; a.click();
  }

  const uf = k => v => { setFilter(p=>({...p,[k]:v})); setPage(0); };

  return (
    <div style={{ padding:24 }}>
      <SH title="Waste Data Explorer" sub="Filter, visualize, and export collection records. Identify patterns and data quality issues." />

      {/* Filters */}
      <div className="card" style={{ padding:14, marginBottom:16 }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'flex-end' }}>
          <div>
            <label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>Route</label>
            <select value={filter.route} onChange={e=>uf('route')(e.target.value)} style={{ padding:'7px 10px', borderRadius:5, border:`1px solid ${PAL.border}`, fontSize:13, minWidth:160 }}>
              <option value="">All routes</option>
              {ROUTE_DEFS.map(r=>(<option key={r.id} value={r.id}>{r.label}</option>))}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>Stream</label>
            <select value={filter.stream} onChange={e=>uf('stream')(e.target.value)} style={{ padding:'7px 10px', borderRadius:5, border:`1px solid ${PAL.border}`, fontSize:13 }}>
              <option value="">All streams</option>
              {STREAMS.map(s=>(<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>Building</label>
            <select value={filter.building} onChange={e=>uf('building')(e.target.value)} style={{ padding:'7px 10px', borderRadius:5, border:`1px solid ${PAL.border}`, fontSize:13, minWidth:160 }}>
              <option value="">All buildings</option>
              {BUILDINGS.filter(b=>DEMO_RECORDS.some(r=>r.building_id===b.id)).map(b=>(<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>From</label>
            <input type="date" value={filter.from} onChange={e=>uf('from')(e.target.value)} style={{ padding:'7px 10px', borderRadius:5, border:`1px solid ${PAL.border}`, fontSize:13, width:'auto' }} />
          </div>
          <div>
            <label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>To</label>
            <input type="date" value={filter.to} onChange={e=>uf('to')(e.target.value)} style={{ padding:'7px 10px', borderRadius:5, border:`1px solid ${PAL.border}`, fontSize:13, width:'auto' }} />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={()=>{setFilter({route:'',stream:'',building:'',from:'',to:''});setPage(0);}}>Clear</button>
          <button className="btn btn-primary btn-sm" onClick={exp} style={{ marginLeft:'auto' }}>Export CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setModal(true)}>Import CSV</button>
        </div>
        <div style={{ marginTop:8, fontSize:13, color:PAL.muted }}>
          Showing <strong style={{ color:PAL.navy }}>{filtered.length}</strong> of {DEMO_RECORDS.length} records
          {filtered.length!==DEMO_RECORDS.length && ' (filters active)'}
        </div>
      </div>

      {/* Visual Weight Breakdown Panel */}
      <div className="card" style={{ padding:16, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:PAL.navy }}>Weight Breakdown by Stream</div>
            <div style={{ fontSize:12, color:PAL.muted }}>
              {weightBreakdown.total.toLocaleString()} lbs ({(weightBreakdown.total/2000).toFixed(1)} tons) across {filtered.length} records shown
            </div>
          </div>
          <button onClick={()=>setShowMethodology(x=>!x)} style={{ background:'none', border:`1px solid ${PAL.border}`, borderRadius:5, padding:'4px 10px', cursor:'pointer', fontSize:12, color:PAL.navyLight, fontWeight:600 }}>
            {showMethodology?'Hide':'View'} Methodology
          </button>
        </div>
        {showMethodology && (
          <div style={{ background:PAL.amberBg, border:`1px solid ${PAL.border}`, borderRadius:6, padding:12, marginBottom:12, fontSize:12, color:PAL.text, lineHeight:1.7 }}>
            <strong>Methodology and Definitions:</strong><br/>
            <strong>Net Weight:</strong> Gross weight minus tare weight, as recorded by LoadMan or entered manually.<br/>
            <strong>Stream labels</strong> reflect the intended destination at the time of collection, not verified final disposition.<br/>
            <strong>"Recycling"</strong> does not confirm materials were recycled - it indicates the stream the container is designated for.<br/>
            <strong>Diversion rate</strong> is not currently calculable from this dataset because: (a) only {((DEMO_RECORDS.filter(r=>r.building_id).length/DEMO_RECORDS.length)*100).toFixed(1)}% of records have building attribution, (b) downstream disposition is not tracked, (c) contamination may prevent some "recycling" stream materials from actually being recycled.<br/>
            <strong>Demo data disclaimer:</strong> All figures are from simulated records calibrated to match historical LoadMan patterns.
          </div>
        )}
        <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ flex:'0 0 160px' }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={STREAMS.map(s=>({ name:s, value:weightBreakdown.totals[s]||0 })).filter(d=>d.value>0)}
                  cx={75} cy={75} innerRadius={40} outerRadius={72} paddingAngle={2} dataKey="value">
                  {STREAMS.map((s,i)=>(<Cell key={s} fill={PAL.STREAMS[s]||MC[i]} />))}
                </Pie>
                <Tooltip formatter={(v)=>`${v.toLocaleString()} lbs`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex:1, minWidth:200 }}>
            {STREAMS.map((s,i)=>{
              const val=weightBreakdown.totals[s]||0;
              const pct=weightBreakdown.total>0?(val/weightBreakdown.total*100):0;
              return (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <div style={{ width:12, height:12, borderRadius:2, background:PAL.STREAMS[s]||MC[i], flexShrink:0 }} />
                  <span style={{ flex:1, fontSize:13 }}>{s}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:PAL.navy, minWidth:48, textAlign:'right' }}>{pct.toFixed(1)}%</span>
                  <span style={{ fontSize:12, color:PAL.muted, minWidth:90, textAlign:'right' }}>{val.toLocaleString()} lbs</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Anomaly callout */}
      {anomalies.length>0 && (
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:6, padding:'10px 14px', marginBottom:12, fontSize:13 }}>
          <strong style={{ color:PAL.amberDark }}>AI Detection:</strong>{' '}
          <span style={{ color:PAL.text }}>{anomalies.length} records have statistically unusual net weights (outside 1.5x IQR). These are highlighted in the table below. Verify with original LoadMan records before drawing conclusions.</span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr>
                {['ID','Date','Route','Building','Container','Stream','Net (lbs)','RFID','Notes'].map(h=>(
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(r=>(
                <tr key={r.id} style={{ background:anomalyIds.has(r.id)?'#fffbeb':'inherit' }}>
                  <td style={{ fontFamily:'monospace', fontSize:12 }}>
                    {anomalyIds.has(r.id) && <span style={{ color:PAL.amber, marginRight:4 }}>!</span>}
                    {r.id}
                  </td>
                  <td>{r.date}</td>
                  <td style={{ fontSize:12, color:PAL.muted }}>{r.route}</td>
                  <td>{r.building_name ? <strong style={{ color:PAL.navy }}>{r.building_name}</strong> : <span style={{ color:'#9ca3af', fontStyle:'italic' }}>Not attributed</span>}</td>
                  <td style={{ fontSize:12 }}>{r.container}</td>
                  <td><span style={{ padding:'2px 7px', borderRadius:12, fontSize:11, fontWeight:600, background:PAL.STREAMS[r.stream]+'22'||'#f3f4f6', color:PAL.STREAMS[r.stream]||PAL.muted }}>{r.stream}</span></td>
                  <td style={{ fontWeight:600 }}>{r.net_lbs.toLocaleString()}</td>
                  <td style={{ fontSize:11 }}>{r.has_rfid ? <span style={{ color:PAL.teal, fontWeight:600 }}>Yes</span> : <span style={{ color:'#9ca3af' }}>No</span>}</td>
                  <td style={{ fontSize:12, color:PAL.muted }}>{r.notes||''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tp>1 && (
          <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10, borderTop:`1px solid ${PAL.border}` }}>
            <button className="btn btn-secondary btn-sm" onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}>Previous</button>
            <span style={{ fontSize:13, color:PAL.muted }}>Page {page+1} of {tp}</span>
            <button className="btn btn-secondary btn-sm" onClick={()=>setPage(p=>Math.min(tp-1,p+1))} disabled={page>=tp-1}>Next</button>
          </div>
        )}
      </div>

      {/* Data Quality */}
      <div className="card" style={{ padding:16, marginTop:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:10 }}>Data Quality Summary</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:10 }}>
          <QBar label="Building attribution" value={`${((att/DEMO_RECORDS.length)*100).toFixed(1)}%`} pct={(att/DEMO_RECORDS.length)*100} color={PAL.teal} />
          <QBar label="RFID populated" value={`${((DEMO_RECORDS.filter(r=>r.has_rfid).length/DEMO_RECORDS.length)*100).toFixed(1)}%`} pct={DEMO_RECORDS.filter(r=>r.has_rfid).length/DEMO_RECORDS.length*100} color={PAL.navyLight} />
          <QBar label="Records with container" value="100%" pct={100} color={PAL.amber} />
          <QBar label="Records with timestamp" value="100%" pct={100} color={PAL.amber} />
        </div>
      </div>

      {/* CSV Import Modal */}
      <Modal open={modal} onClose={()=>{setModal(false);setStep(0);setCsv(null);setCm({});}} title="Import LoadMan CSV">
        {step===0 && (
          <div>
            <InfoBanner text="Upload a CSV exported from LoadMan or another collection system. The importer maps columns and reports data quality." />
            <div style={{ border:`2px dashed ${PAL.border}`, borderRadius:8, padding:30, textAlign:'center' }}>
              <p style={{ margin:'0 0 12px', color:PAL.muted, fontSize:13 }}>Drag and drop a CSV file here, or click to browse</p>
              <label className="btn btn-primary" style={{ cursor:'pointer' }}>
                Choose File
                <input type="file" accept=".csv" onChange={handleCSV} style={{ display:'none' }} />
              </label>
            </div>
          </div>
        )}
        {step===1 && csv && (
          <div>
            <InfoBanner text={`Loaded: ${csv.filename} (${csv.total} rows). Auto-detected column mappings shown below. Review and adjust.`} color="blue" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {['date','net_lbs','stream','building','route','container'].map(f=>(
                <div key={f}>
                  <label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>{f} {['date','net_lbs','stream'].includes(f)?<span style={{ color:PAL.red }}>*</span>:''}</label>
                  <select value={cm[f]||''} onChange={e=>setCm(p=>({...p,[f]:e.target.value}))} style={{ padding:'6px 8px', fontSize:13 }}>
                    <option value="">(not mapped)</option>
                    {csv.headers.map(h=>(<option key={h} value={h}>{h}</option>))}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:PAL.navy, marginBottom:8 }}>Data Quality Preview (first 5 rows)</div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ fontSize:11 }}>
                  <thead><tr>{csv.headers.map(h=>(<th key={h} style={{ padding:'4px 8px', fontSize:10 }}>{h}</th>))}</tr></thead>
                  <tbody>{csv.rows.map((row,i)=>(<tr key={i}>{csv.headers.map(h=>(<td key={h} style={{ padding:'4px 8px' }}>{row[h]||''}</td>))}</tr>))}</tbody>
                </table>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
              {[
                { label:'Total rows', value:csv.total, color:PAL.navy },
                { label:'With date', value:cm.date?csv.rows.filter(r=>r[cm.date]).length+'+':'N/A', color:PAL.teal },
                { label:'With weight', value:cm.net_lbs?csv.rows.filter(r=>r[cm.net_lbs]).length+'+':'N/A', color:PAL.teal },
              ].map(s=>(
                <div key={s.label} style={{ background:PAL.cream, borderRadius:6, padding:'8px 10px', borderLeft:`3px solid ${s.color}` }}>
                  <div style={{ fontSize:11, color:PAL.muted }}>{s.label}</div>
                  <div style={{ fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ background:'#fff3cd', border:'1px solid #ffc107', borderRadius:6, padding:'8px 12px', fontSize:12, color:'#664d03', marginBottom:16 }}>
              This importer performs column mapping and quality assessment only. Records are not merged into the demo dataset in this prototype version.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-secondary" onClick={()=>{setModal(false);setStep(0);setCsv(null);setCm({});}}>Close</button>
              <button className="btn btn-primary">Confirm Mapping (prototype - not persisted)</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── SOURCE MAPPER ────────────────────────────────────────────────────────────
function SourceMapper() {
  const [sel, setSel] = useState(null);
  const [search, setSearch] = useState('');
  const fb = BUILDINGS.filter(b=>b.name.toLowerCase().includes(search.toLowerCase())||b.abbr.toLowerCase().includes(search.toLowerCase()));
  const bld = sel ? BUILDINGS.find(b=>b.id===sel) : null;
  const br = bld ? DEMO_RECORDS.filter(r=>r.building_id===bld.id) : [];
  const ba = bld ? DEMO_AUDITS.filter(a=>a.building_id===bld.id) : [];

  function JStep({ label, status, note }) {
    const colors = { verified:[PAL.teal,'#f0fdf4'], inferred:[PAL.amber,'#fffbeb'], unknown:[PAL.muted,'#f9fafb'] };
    const [c,bg] = colors[status]||colors.unknown;
    return (
      <div style={{ textAlign:'center', minWidth:100 }}>
        <div style={{ padding:'6px 10px', borderRadius:6, background:bg, border:`1px solid ${c}`, fontSize:11, fontWeight:600, color:c }}>{label}</div>
        <div style={{ fontSize:10, color:PAL.muted, marginTop:3 }}>{note}</div>
      </div>
    );
  }

  return (
    <div style={{ padding:24, display:'flex', gap:16, minHeight:'calc(100vh - 100px)' }}>
      <div style={{ width:260, flexShrink:0 }}>
        <SH title="Source Mapper" sub="Select a building to explore its waste journey." />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search buildings..." style={{ marginBottom:10 }} />
        <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:'calc(100vh - 220px)', overflowY:'auto' }}>
          {fb.map(b=>{
            const rc = DEMO_RECORDS.filter(r=>r.building_id===b.id);
            const isActive = sel===b.id;
            return (
              <button key={b.id} onClick={()=>setSel(isActive?null:b.id)}
                style={{ padding:'10px 12px', borderRadius:7, border:`2px solid ${isActive?PAL.navy:PAL.border}`, background:isActive?PAL.navy:PAL.white, cursor:'pointer', textAlign:'left', transition:'all .15s' }}>
                <div style={{ fontWeight:600, fontSize:13, color:isActive?'#fff':PAL.navy }}>{b.name}</div>
                <div style={{ fontSize:11, color:isActive?'rgba(255,255,255,.65)':PAL.muted, marginTop:2 }}>{b.type} - {rc.length} records</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex:1 }}>
        {!bld ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:PAL.muted, flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:36 }}>&#9711;</div>
            <div style={{ fontWeight:600 }}>Select a building to explore its waste data</div>
            <div style={{ fontSize:13 }}>{BUILDINGS.length} buildings in demo dataset - {DEMO_RECORDS.filter(r=>r.building_id).length} attributed records</div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom:16 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:PAL.navy }}>{bld.name}</h2>
              <p style={{ margin:'4px 0 0', color:PAL.muted, fontSize:13 }}>{bld.type} - {bld.sqft.toLocaleString()} sq ft - {bld.floors} floors - {bld.abbr}</p>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
              {[
                { label:'Pickup Records', value:br.length, note:'attributed to this building' },
                { label:'Net Weight', value:br.length>0?`${br.reduce((s,r)=>s+r.net_lbs,0).toLocaleString()} lbs`:'No data', note:'sum of attributed records' },
                { label:'Waste Audits', value:ba.length, note:'audits at this building' },
                { label:'Streams Observed', value:[...new Set(br.map(r=>r.stream))].length||0, note:'distinct streams' },
              ].map(s=>(
                <div key={s.label} className="card" style={{ padding:'10px 12px' }}>
                  <div style={{ fontSize:11, color:PAL.muted }}>{s.label}</div>
                  <div style={{ fontSize:20, fontWeight:700, color:PAL.navy }}>{s.value}</div>
                  <div style={{ fontSize:11, color:PAL.muted }}>{s.note}</div>
                </div>
              ))}
            </div>

            {/* Journey diagram */}
            <div className="card" style={{ padding:14, marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:PAL.navy, marginBottom:4 }}>Waste Journey</div>
              <p style={{ fontSize:12, color:PAL.muted, margin:'0 0 10px' }}>Each link is labeled with its evidence status. Only verified links are based on confirmed data.</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
                {[
                  { label:bld.name, status:'verified', note:'Building' },
                  { label:'Collection Point', status:br.length>0?'inferred':'unknown', note:br.length>0?`${br.length} records`:'No records' },
                  { label:'Truck Pickup', status:br.length>0?'inferred':'unknown', note:'Route-based' },
                  { label:'Waste Transfer Station', status:'inferred', note:'Campus WTS' },
                  { label:'Downstream', status:'unknown', note:'Not tracked' },
                ].map((step,i,arr)=>(
                  <React.Fragment key={i}>
                    <JStep {...step} />
                    {i<arr.length-1 && <div style={{ color:PAL.muted, fontSize:18, marginTop:-12 }}>&#8594;</div>}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ display:'flex', gap:14, marginTop:8, fontSize:11 }}>
                <span style={{ color:PAL.teal }}>&#9632; Verified</span>
                <span style={{ color:PAL.amber }}>&#9632; Inferred</span>
                <span style={{ color:PAL.muted }}>&#9632; Unknown</span>
              </div>
            </div>

            {/* Records table */}
            {br.length>0 ? (
              <div className="card" style={{ marginBottom:16 }}>
                <div style={{ padding:'10px 14px', borderBottom:`1px solid ${PAL.border}`, fontSize:13, fontWeight:700, color:PAL.navy }}>
                  Pickup Records ({br.length})
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table>
                    <thead><tr>{['Date','Stream','Net (lbs)','Container','RFID'].map(h=>(<th key={h}>{h}</th>))}</tr></thead>
                    <tbody>
                      {br.slice(0,8).map(r=>(
                        <tr key={r.id}>
                          <td>{r.date}</td>
                          <td><span style={{ padding:'2px 7px', borderRadius:12, fontSize:11, fontWeight:600, background:(PAL.STREAMS[r.stream]||'#999')+'22', color:PAL.STREAMS[r.stream]||PAL.muted }}>{r.stream}</span></td>
                          <td style={{ fontWeight:600 }}>{r.net_lbs.toLocaleString()}</td>
                          <td style={{ fontSize:12 }}>{r.container}</td>
                          <td style={{ fontSize:12 }}>{r.has_rfid?<span style={{ color:PAL.teal }}>Yes</span>:<span style={{ color:'#9ca3af' }}>No</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {br.length>8 && <div style={{ padding:'8px 14px', fontSize:12, color:PAL.muted }}>...and {br.length-8} more records</div>}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding:14, marginBottom:16 }}>
                <p style={{ margin:0, fontSize:13, color:PAL.muted }}>No attributed pickup records found for this building. This represents the broader unattributed fraction (~87.4%) in the demo dataset.</p>
              </div>
            )}

            {/* Audits */}
            {ba.length>0 && (
              <div className="card">
                <div style={{ padding:'10px 14px', borderBottom:`1px solid ${PAL.border}`, fontSize:13, fontWeight:700, color:PAL.navy }}>Waste Audits ({ba.length})</div>
                {ba.map(a=>(
                  <div key={a.id} style={{ padding:'10px 14px', borderBottom:`1px solid ${PAL.border}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontWeight:600, fontSize:13 }}>{a.title}</span>
                      <span className={`badge ${a.status==='Completed'?'badge-green':a.status==='In Progress'?'badge-amber':'badge-gray'}`}>{a.status}</span>
                    </div>
                    <div style={{ fontSize:12, color:PAL.muted }}>{a.date} - {a.stream} - {a.sample_weight_lbs ? `${a.sample_weight_lbs} lbs` : 'Weight not recorded'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COLLECTION LOG (INTELLIGENT) ─────────────────────────────────────────────
function CollectionLog() {
  const now = new Date();
  const dow = now.getDay();
  const hour = now.getHours();
  const timeStr = `${String(hour).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const [form, setForm] = useState({
    route_id: '', building: '', container: '', time: timeStr,
    gross: '', tare: '', stream: '', notes: '', flags: []
  });
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState({});
  const [ok, setOk] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [weightWarning, setWeightWarning] = useState(null);

  const net = form.gross && form.tare ? (parseFloat(form.gross)-parseFloat(form.tare)).toFixed(1) : form.gross ? form.gross : '';

  // Smart suggestions
  const suggestedRoutes = CollectionAI.suggestRoute(hour, dow);
  const selectedRoute = ROUTE_DEFS.find(r=>r.id===form.route_id);
  const availableBuildings = form.route_id ? CollectionAI.suggestBuildingsForRoute(form.route_id) : BUILDINGS;
  const availableContainers = form.route_id ? CollectionAI.suggestContainerForRoute(form.route_id) : CONTAINERS;

  const FLAGS = ['Container overfull','Access blocked','Contamination observed','Damaged container','Safety concern','Unusual odor'];

  function tf(f) { setForm(p=>({ ...p, flags:p.flags.includes(f)?p.flags.filter(x=>x!==f):[...p.flags,f] })); }

  function up(k,v) {
    setErrors(e=>({...e,[k]:null}));
    const updated = { ...form, [k]:v };
    if (k==='route_id') {
      updated.building='';
      updated.container='';
    }
    if (k==='container' && v==='' && form.route_id) {
      const suggested = CollectionAI.suggestContainerForRoute(form.route_id);
      if (suggested.length>0) updated.container=suggested[0];
    }
    setForm(updated);

    // Weight anomaly check
    if ((k==='gross'||k==='tare') && updated.building) {
      const netVal = updated.gross && updated.tare ? parseFloat(updated.gross)-parseFloat(updated.tare) : parseFloat(updated.gross)||0;
      if (netVal>0) {
        const warn = CollectionAI.detectAbnormalWeight(updated.building, netVal);
        setWeightWarning(warn);
      }
    }

    // Duplicate check
    if (k==='stream'||k==='building'||k==='route_id') {
      setDuplicate(CollectionAI.detectDuplicate(updated, logs));
    }
  }

  // Auto-fill container when route is chosen and no container set
  useEffect(()=>{
    if (form.route_id && !form.container) {
      const suggested = CollectionAI.suggestContainerForRoute(form.route_id);
      if (suggested.length>0) setForm(p=>({...p, container:suggested[0]}));
    }
  },[form.route_id]);

  function validate() {
    const e = {};
    if (!form.route_id) e.route_id='Select a route';
    if (!form.building) e.building='Select a building';
    if (!form.container) e.container='Select a container';
    if (!form.stream) e.stream='Select a stream';
    if (form.gross && form.tare && parseFloat(form.tare)>=parseFloat(form.gross)) e.tare='Tare must be less than gross weight';
    return e;
  }

  function sub() {
    const e = validate();
    if (Object.keys(e).length>0) { setErrors(e); return; }
    const b = BUILDINGS.find(x=>x.id===form.building);
    setLogs(p=>[{
      id:`COL${Date.now()}`, date:new Date().toISOString().split('T')[0],
      time:form.time, route:selectedRoute?.label||form.route_id, route_id:form.route_id,
      building_id:form.building, building_name:b?.name||'Unknown',
      container:form.container, stream:form.stream, net:net||'Not calculated',
      notes:form.notes, flags:form.flags
    },...p]);
    setOk(true);
    setTimeout(()=>{
      setOk(false); setDuplicate(false); setWeightWarning(null);
      setForm({ route_id:'', building:'', container:'', time:new Date().toTimeString().slice(0,5), gross:'', tare:'', stream:'', notes:'', flags:[] });
      setErrors({});
    },2500);
  }

  return (
    <div style={{ padding:16, maxWidth:580, margin:'0 auto' }}>
      <SH title="Collection Log" sub="Driver interface - smart suggestions based on current route schedule" />

      {ok && (
        <div style={{ background:'#cce5d8', border:'1px solid #66b089', color:'#1a3d30', padding:14, borderRadius:8, textAlign:'center', fontWeight:600, marginBottom:14 }}>
          Pickup logged successfully
        </div>
      )}

      {/* Route suggestion */}
      {suggestedRoutes.length>0 && !form.route_id && (
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:12, marginBottom:14, fontSize:13 }}>
          <div style={{ fontWeight:700, color:PAL.navyLight, marginBottom:6 }}>
            Suggested for {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow]} {timeStr}:
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {suggestedRoutes.map(r=>(
              <button key={r.id} onClick={()=>up('route_id',r.id)}
                style={{ padding:'5px 12px', borderRadius:5, border:`1px solid ${PAL.navyLight}`, background:PAL.white, color:PAL.navyLight, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                {r.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize:11, color:PAL.muted, marginTop:5 }}>Smart suggestions based on demo route schedules. Tap to select.</div>
        </div>
      )}

      {duplicate && (
        <div style={{ background:'#fff3cd', border:'1px solid #ffc107', borderRadius:8, padding:10, marginBottom:12, fontSize:13 }}>
          <strong style={{ color:'#664d03' }}>Possible duplicate:</strong> A similar record (same building, route, stream) may already exist for today. Review before saving.
        </div>
      )}

      <div className="card" style={{ padding:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Route */}
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>
              Route <span style={{ color:PAL.red }}>*</span>
            </label>
            <select value={form.route_id} onChange={e=>up('route_id',e.target.value)}
              style={{ border:`1px solid ${errors.route_id?PAL.red:PAL.border}` }}>
              <option value="">Select route...</option>
              {ROUTE_DEFS.map(r=>(<option key={r.id} value={r.id}>{r.label} ({r.days.map(d=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join('/')})</option>))}
            </select>
            <FieldError msg={errors.route_id} />
            {selectedRoute && (
              <div style={{ fontSize:12, color:PAL.muted, marginTop:3 }}>
                Typical time: {selectedRoute.startHour}:00 - {selectedRoute.endHour}:00. Covers {availableBuildings.length} buildings on this route.
              </div>
            )}
          </div>

          {/* Building */}
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>
              Building <span style={{ color:PAL.red }}>*</span>
              {form.route_id && <span style={{ fontSize:11, color:PAL.teal, fontWeight:400, marginLeft:6 }}>Filtered to route buildings</span>}
            </label>
            <select value={form.building} onChange={e=>up('building',e.target.value)}
              style={{ border:`1px solid ${errors.building?PAL.red:PAL.border}` }}>
              <option value="">Select building...</option>
              {availableBuildings.map(b=>(<option key={b.id} value={b.id}>{b.name}</option>))}
              {form.route_id && BUILDINGS.filter(b=>!availableBuildings.some(ab=>ab.id===b.id)).length>0 && (
                <option disabled>-- Other buildings (outside selected route) --</option>
              )}
              {form.route_id && BUILDINGS.filter(b=>!availableBuildings.some(ab=>ab.id===b.id)).map(b=>(<option key={b.id+'_'} value={b.id}>{b.name}</option>))}
            </select>
            <FieldError msg={errors.building} />
          </div>

          {/* Container */}
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>
              Container <span style={{ color:PAL.red }}>*</span>
              {form.route_id && <span style={{ fontSize:11, color:PAL.teal, fontWeight:400, marginLeft:6 }}>Pre-filled from route</span>}
            </label>
            <select value={form.container} onChange={e=>up('container',e.target.value)}
              style={{ border:`1px solid ${errors.container?PAL.red:PAL.border}` }}>
              <option value="">Select container...</option>
              {availableContainers.map(c=>(<option key={c} value={c}>{c}</option>))}
              {availableContainers.length<CONTAINERS.length && CONTAINERS.filter(c=>!availableContainers.includes(c)).map(c=>(<option key={c+'_'} value={c}>{c}</option>))}
            </select>
            <FieldError msg={errors.container} />
          </div>

          {/* Time + Weight */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Time</label>
              <input type="time" value={form.time} onChange={e=>up('time',e.target.value)} style={{ width:'auto' }} />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Gross (lbs)</label>
              <input type="number" min="0" placeholder="Optional" value={form.gross} onChange={e=>up('gross',e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Tare (lbs)</label>
              <input type="number" min="0" placeholder="Optional" value={form.tare} onChange={e=>up('tare',e.target.value)} />
              <FieldError msg={errors.tare} />
            </div>
          </div>
          {net && (
            <div style={{ background:PAL.cream, borderRadius:6, padding:'8px 12px', fontSize:13 }}>
              <strong>Calculated net weight: {net} lbs</strong>
            </div>
          )}
          {weightWarning && (
            <div style={{ background:'#fff3cd', border:'1px solid #ffc107', borderRadius:6, padding:'8px 12px', fontSize:13 }}>
              <strong style={{ color:'#664d03' }}>Weight check:</strong> This net weight differs significantly from the historical average for this building
              ({weightWarning.avg.toLocaleString()} lbs avg, z-score {weightWarning.zScore}). Verify before saving.
            </div>
          )}

          {/* Stream */}
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:6 }}>
              Waste Stream <span style={{ color:PAL.red }}>*</span>
            </label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {STREAMS.map(s=>(
                <button key={s} onClick={()=>up('stream',s)}
                  style={{ padding:'7px 14px', borderRadius:6, border:`2px solid ${form.stream===s?(PAL.STREAMS[s]||PAL.navy):PAL.border}`, background:form.stream===s?(PAL.STREAMS[s]||PAL.navy):PAL.white, color:form.stream===s?'#fff':PAL.text, cursor:'pointer', fontSize:13, fontWeight:600, transition:'all .1s' }}>
                  {s}
                </button>
              ))}
            </div>
            <FieldError msg={errors.stream} />
          </div>

          {/* Flags */}
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:6 }}>Flags (optional)</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {FLAGS.map(f=>(
                <button key={f} onClick={()=>tf(f)}
                  style={{ padding:'5px 11px', borderRadius:5, border:`1px solid ${form.flags.includes(f)?PAL.amber:PAL.border}`, background:form.flags.includes(f)?'#fef9ec':PAL.white, color:form.flags.includes(f)?PAL.amberDark:PAL.text, cursor:'pointer', fontSize:12 }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Notes (optional)</label>
            <textarea value={form.notes} onChange={e=>up('notes',e.target.value)} rows={2} placeholder="Operational observations..." style={{ resize:'vertical', fontFamily:'inherit' }} />
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-primary" onClick={sub} style={{ flex:1, padding:'11px 18px', fontSize:15, fontWeight:700 }}>
              Log Pickup
            </button>
            <button className="btn btn-secondary" onClick={()=>{ setForm({ route_id:'', building:'', container:'', time:new Date().toTimeString().slice(0,5), gross:'', tare:'', stream:'', notes:'', flags:[] }); setErrors({}); setDuplicate(false); setWeightWarning(null); }}>
              Clear
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop:10, padding:'8px 12px', background:PAL.cream, borderRadius:6, fontSize:11, color:PAL.muted }}>
        Smart suggestions use demo route schedules. This interface is not connected to LoadMan or existing university systems.
      </div>

      {/* Log history */}
      {logs.length>0 && (
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:10 }}>Session Log ({logs.length})</div>
          {logs.map(l=>(
            <div key={l.id} className="card" style={{ padding:12, marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{l.building_name}</div>
                  <div style={{ fontSize:12, color:PAL.muted }}>{l.date} at {l.time} - {l.route} - Net: {l.net} lbs</div>
                </div>
                <span style={{ padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:600, background:(PAL.STREAMS[l.stream]||'#999')+'22', color:PAL.STREAMS[l.stream]||PAL.muted }}>{l.stream}</span>
              </div>
              {l.flags.length>0 && <div style={{ marginTop:6, display:'flex', gap:5, flexWrap:'wrap' }}>{l.flags.map(f=>(<span key={f} className="badge badge-amber">{f}</span>))}</div>}
              {l.notes && <div style={{ marginTop:6, fontSize:12 }}>{l.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WASTE AUDITS ─────────────────────────────────────────────────────────────
function WasteAudits() {
  const [audits, setAudits] = useState(DEMO_AUDITS);
  const [sel, setSel] = useState(null);
  const [modal, setModal] = useState(false);
  const [nA, setNA] = useState({ title:'', building_id:'', date:'', stream:'', auditors:'', notes:'' });
  const [errors, setErrors] = useState({});

  function AuditDetail({ audit }) {
    const [mats, setMats] = useState(audit.materials.length>0 ? audit.materials : MATS.map(n=>({ name:n, weight:'' })));
    const total = mats.reduce((s,m)=>s+(parseFloat(m.weight)||0),0);
    const pie = mats.filter(m=>parseFloat(m.weight)>0).map(m=>({ name:m.name, value:parseFloat(m.weight) }));

    function expAudit() {
      const blob = new Blob([['Audit,Building,Date,Material,Weight,Pct',...mats.filter(m=>m.weight>0).map(m=>[audit.id,audit.building_name,audit.date,m.name,m.weight,total>0?(m.weight/total*100).toFixed(1)+'%':''].join(','))].join('\n')],{type:'text/csv'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${audit.id}_composition.csv`; a.click();
    }

    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <button className="btn btn-secondary btn-sm" onClick={()=>setSel(null)}>Back</button>
          <h3 style={{ margin:0, flex:1, fontSize:16, fontWeight:700, color:PAL.navy }}>{audit.title}</h3>
          <span className={`badge ${audit.status==='Completed'?'badge-green':audit.status==='In Progress'?'badge-amber':'badge-gray'}`}>{audit.status}</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14, marginBottom:16 }}>
          <div className="card" style={{ padding:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:PAL.navy, marginBottom:8 }}>Audit Details</div>
            {[['Building',audit.building_name],['Date',audit.date||'Not recorded'],['Stream',audit.stream],['Auditors',audit.auditors.join(', ')||'Not assigned'],['Sample Weight',audit.sample_weight_lbs?`${audit.sample_weight_lbs} lbs`:'Not recorded']].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${PAL.border}`, fontSize:13 }}>
                <span style={{ color:PAL.muted }}>{k}</span><span style={{ fontWeight:600 }}>{v||'N/A'}</span>
              </div>
            ))}
            {audit.notes && <p style={{ margin:'10px 0 0', fontSize:12, color:PAL.text, lineHeight:1.6 }}>{audit.notes}</p>}
          </div>
          {pie.length>0 && (
            <div className="card" style={{ padding:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:PAL.navy, marginBottom:8 }}>Material Composition</div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pie} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {pie.map((e,i)=>(<Cell key={i} fill={MC[i%MC.length]} />))}
                  </Pie>
                  <Tooltip formatter={(v,n)=>[`${v} lbs (${(v/total*100).toFixed(1)}%)`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ fontSize:11, color:PAL.muted, textAlign:'center', marginTop:4 }}>Total sorted: {total.toFixed(1)} lbs</div>
            </div>
          )}
        </div>
        <div className="card" style={{ padding:14, marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:PAL.navy, marginBottom:10 }}>Material Weight Entry</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:8 }}>
            {mats.map((m,i)=>(
              <div key={m.name}>
                <label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>{m.name} (lbs)</label>
                <input type="number" min="0" step="0.1" value={m.weight} placeholder="0.0"
                  onChange={e=>{ const v=parseFloat(e.target.value)||0; setMats(p=>p.map((x,j)=>j===i?{...x,weight:v}:x)); }} />
              </div>
            ))}
          </div>
          {total>0 && <div style={{ marginTop:8, fontSize:12, color:PAL.muted }}>Total entered: {total.toFixed(1)} lbs</div>}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={expAudit}>Export Audit CSV</button>
      </div>
    );
  }

  if (sel) {
    const a = audits.find(x=>x.id===sel);
    return <div style={{ padding:24 }}><AuditDetail audit={a} /></div>;
  }

  function validateNew() {
    const e={};
    if (!nA.title.trim()) e.title='Audit title is required';
    if (!nA.building_id) e.building_id='Select a building';
    if (!nA.date) e.date='Enter an audit date';
    return e;
  }

  function create() {
    const e=validateNew();
    if (Object.keys(e).length>0) { setErrors(e); return; }
    const b=BUILDINGS.find(x=>x.id===nA.building_id);
    setAudits(p=>[...p,{
      id:`AUD${String(p.length+1).padStart(3,'0')}`, title:nA.title,
      building_id:nA.building_id, building_name:b?.name||'',
      date:nA.date, auditors:nA.auditors.split(',').map(x=>x.trim()).filter(Boolean),
      status:'Planned', sample_weight_lbs:null, stream:nA.stream||'General Waste',
      materials:[], notes:nA.notes
    }]);
    setModal(false);
    setNA({ title:'', building_id:'', date:'', stream:'', auditors:'', notes:'' });
    setErrors({});
  }

  return (
    <div style={{ padding:24 }}>
      <SH title="Waste Audits" sub="Plan and document physical waste composition audits"
        action={<button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}>+ New Audit</button>} />

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {audits.map(a=>(
          <div key={a.id} className="card" style={{ padding:14, cursor:'pointer' }} onClick={()=>setSel(a.id)}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:PAL.navy }}>{a.title}</div>
                <div style={{ fontSize:12, color:PAL.muted, marginTop:3 }}>{a.building_name} - {a.date} - {a.stream}</div>
                {a.materials.length>0 && (
                  <div style={{ fontSize:12, color:PAL.text, marginTop:3 }}>
                    Top material: {[...a.materials].sort((x,y)=>y.weight-x.weight)[0]?.name} ({[...a.materials].sort((x,y)=>y.weight-x.weight)[0]?.weight} lbs)
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:6, flexDirection:'column', alignItems:'flex-end' }}>
                <span className={`badge ${a.status==='Completed'?'badge-green':a.status==='In Progress'?'badge-amber':a.status==='Under Review'?'badge-navy':'badge-gray'}`}>{a.status}</span>
                {a.sample_weight_lbs && <span style={{ fontSize:12, color:PAL.muted }}>{a.sample_weight_lbs} lbs</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={()=>{ setModal(false); setErrors({}); }} title="New Waste Audit">
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Audit Title <span style={{ color:PAL.red }}>*</span></label>
            <input value={nA.title} onChange={e=>{ setErrors(x=>({...x,title:null})); setNA(p=>({...p,title:e.target.value})); }} placeholder="e.g., Illini Union Spring 2024 Audit" />
            <FieldError msg={errors.title} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Building <span style={{ color:PAL.red }}>*</span></label>
              <select value={nA.building_id} onChange={e=>{ setErrors(x=>({...x,building_id:null})); setNA(p=>({...p,building_id:e.target.value})); }}>
                <option value="">Select building...</option>
                {BUILDINGS.map(b=>(<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
              <FieldError msg={errors.building_id} />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Date <span style={{ color:PAL.red }}>*</span></label>
              <input type="date" value={nA.date} onChange={e=>{ setErrors(x=>({...x,date:null})); setNA(p=>({...p,date:e.target.value})); }} />
              <FieldError msg={errors.date} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Stream</label>
              <select value={nA.stream} onChange={e=>setNA(p=>({...p,stream:e.target.value}))}>
                {STREAMS.map(s=>(<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Auditors (comma separated)</label>
              <input value={nA.auditors} onChange={e=>setNA(p=>({...p,auditors:e.target.value}))} placeholder="Name 1, Name 2" />
            </div>
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Notes</label>
            <textarea value={nA.notes} onChange={e=>setNA(p=>({...p,notes:e.target.value}))} rows={3} style={{ resize:'vertical', fontFamily:'inherit' }} />
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-secondary" onClick={()=>{ setModal(false); setErrors({}); }}>Cancel</button>
            <button className="btn btn-primary" onClick={create}>Create Audit</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── REGO RESEARCH ────────────────────────────────────────────────────────────
function RegoResearch() {
  const [view, setView] = useState('table');
  const compData = ['paper','plastics','food_waste','paper_towels','other'].map(k=>({
    name:k.replace('_',' '), value:REGO_DATA.reduce((s,r)=>s+(r.materials[k]||0),0)
  }));

  function exp() {
    const blob = new Blob([['ID,Building,Bin,Date,Stream,Fill%,Est Weight,Contamination,Confidence',...REGO_DATA.map(r=>[r.id,r.building,r.bin,r.date,r.stream,r.fill_pct,r.est_weight_lbs,r.contamination,r.confidence].join(','))].join('\n')],{type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='rego_data.csv'; a.click();
  }

  return (
    <div style={{ padding:24 }}>
      <SH title="Rego Research Hub" sub="Waste characterization data from image-based observation (mock data - pending authorized integration)" />
      <div className="card" style={{ padding:12, marginBottom:16, background:PAL.amberBg, borderLeft:`4px solid ${PAL.amber}` }}>
        <div style={{ fontSize:12, fontWeight:700, color:PAL.amberDark, marginBottom:4 }}>Integration Status</div>
        <p style={{ margin:0, fontSize:13, color:PAL.text, lineHeight:1.6 }}>EnviroTrap is exploring a research collaboration with Rego. This module uses mock data to demonstrate how image-based waste characterization could integrate with collection records. No actual Rego API access has been implemented. When authorized data becomes available, this module supports CSV import.</p>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
        {['table','charts'].map(v=>(
          <button key={v} className={`btn ${view===v?'btn-primary':'btn-secondary'} btn-sm`} onClick={()=>setView(v)} style={{ textTransform:'capitalize' }}>{v}</button>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={exp} style={{ marginLeft:'auto' }}>Export CSV</button>
      </div>
      {view==='table' && (
        <div className="card" style={{ overflow:'hidden' }}>
          <table>
            <thead><tr>{['ID','Building','Bin','Date','Stream','Fill %','Est Weight','Contamination','Confidence'].map(h=>(<th key={h}>{h}</th>))}</tr></thead>
            <tbody>{REGO_DATA.map(r=>(<tr key={r.id}><td style={{ fontFamily:'monospace', fontSize:12 }}>{r.id}</td><td>{r.building}</td><td style={{ fontFamily:'monospace', fontSize:12 }}>{r.bin}</td><td>{r.date}</td><td>{r.stream}</td><td>{r.fill_pct}%</td><td>{r.est_weight_lbs} lbs</td><td>{r.contamination}</td><td><span className={`badge ${r.confidence==='High'?'badge-green':r.confidence==='Medium'?'badge-amber':'badge-gray'}`}>{r.confidence}</span></td></tr>))}</tbody>
          </table>
        </div>
      )}
      {view==='charts' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:14 }}>
          <div className="card" style={{ padding:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:PAL.navy, marginBottom:10 }}>Aggregate Material Composition (All Rego Observations)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={compData}><CartesianGrid strokeDasharray="3 3" stroke={PAL.border} /><XAxis dataKey="name" tick={{ fontSize:11 }} /><YAxis tick={{ fontSize:11 }} /><Tooltip /><Bar dataKey="value" fill={PAL.navyLight}>{compData.map((e,i)=>(<Cell key={i} fill={MC[i]} />))}</Bar></BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize:11, color:PAL.muted, marginTop:6 }}>Material weights are estimated from Rego image analysis (mock data). Physical measurement required for verification.</div>
          </div>
          <div className="card" style={{ padding:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:PAL.navy, marginBottom:10 }}>Fill Level by Observation</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={REGO_DATA.map(r=>({ name:r.building.split(' ')[0], fill:r.fill_pct, weight:r.est_weight_lbs }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={PAL.border} />
                <XAxis dataKey="name" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} domain={[0,100]} />
                <Tooltip />
                <Bar dataKey="fill" fill={PAL.teal} name="Fill %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INSIGHTS ENGINE ──────────────────────────────────────────────────────────
function InsightsEngine() {
  const [ins, setIns] = useState(DEMO_INSIGHTS);
  const [fs, setFs] = useState('All');
  const [ex, setEx] = useState(null);
  const STATS = ['All','Under Investigation','Validated','Recommended for Action','Rejected'];
  const fi = fs==='All' ? ins : ins.filter(i=>i.status===fs);
  function upd(id,s) { setIns(p=>p.map(i=>i.id===id?{...i,status:s}:i)); }

  if (ex) {
    const i = ins.find(x=>x.id===ex);
    return (
      <div style={{ padding:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <button className="btn btn-secondary btn-sm" onClick={()=>setEx(null)}>Back to Insights</button>
          <span className={`badge ${i.status==='Validated'?'badge-green':i.status==='Recommended for Action'?'badge-amber':i.status==='Rejected'?'badge-red':'badge-navy'}`}>{i.status}</span>
          <span className="badge badge-gray">{i.category}</span>
          <span className={`badge ${i.confidence==='High'?'badge-green':i.confidence==='Medium'?'badge-amber':'badge-gray'}`}>{i.confidence} confidence</span>
        </div>
        <h2 style={{ fontSize:18, fontWeight:700, color:PAL.navy, marginBottom:8 }}>{i.title}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14, marginBottom:16 }}>
          <div className="card" style={{ padding:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:PAL.muted, marginBottom:6 }}>SUMMARY</div>
            <p style={{ margin:0, fontSize:13, lineHeight:1.7 }}>{i.summary}</p>
          </div>
          <div className="card" style={{ padding:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:PAL.muted, marginBottom:6 }}>EVIDENCE</div>
            <p style={{ margin:'0 0 8px', fontSize:13, lineHeight:1.7 }}>{i.evidence}</p>
            <div style={{ fontSize:12, fontWeight:700, color:PAL.muted, marginBottom:6 }}>RECOMMENDATION</div>
            <p style={{ margin:0, fontSize:13, lineHeight:1.7 }}>{i.recommendation}</p>
          </div>
        </div>
        <div className="card" style={{ padding:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:PAL.navy, marginBottom:8 }}>Update Status</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {['Under Investigation','Validated','Recommended for Action','Rejected'].map(s=>(
              <button key={s} onClick={()=>upd(i.id,s)}
                className={`btn btn-sm ${i.status===s?'btn-primary':'btn-secondary'}`}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop:12, padding:'8px 12px', background:PAL.amberBg, borderRadius:6, fontSize:12, color:'#92400e' }}>
          <strong>Research integrity:</strong> Human review is required before any operational decisions are made based on these findings.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:24 }}>
      <SH title="Research Insights Engine" sub="Patterns, findings, and recommendations from EnviroTrap data analysis" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
        {['Under Investigation','Validated','Recommended for Action','Rejected'].map(s=>(
          <StatCard key={s} label={s} value={ins.filter(i=>i.status===s).length} color={s==='Validated'?'green':s==='Recommended for Action'?'amber':s==='Rejected'?'red':'navy'} />
        ))}
      </div>
      <div className="card" style={{ padding:10, background:PAL.amberBg, border:`1px solid #fde68a`, marginBottom:14, fontSize:12, color:'#92400e' }}>
        <strong>Research integrity:</strong> All insights are derived from available data with documented sources. Human review is required before any operational decisions are made.
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
        {STATS.map(s=>(<button key={s} className={`btn btn-sm ${fs===s?'btn-primary':'btn-secondary'}`} onClick={()=>setFs(s)}>{s}</button>))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {fi.map(i=>(
          <div key={i.id} className="card insight-card" style={{ padding:14, cursor:'pointer' }} onClick={()=>setEx(i.id)}
            style={{ borderLeft:`4px solid ${{Validated:PAL.teal,'Recommended for Action':PAL.amber,Rejected:PAL.red}[i.status]||PAL.navyLight}`, cursor:'pointer' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
              <span className={`badge ${i.category==='Contamination'?'badge-red':'badge-navy'}`}>{i.category}</span>
              <span className={`badge ${i.status==='Validated'?'badge-green':i.status==='Recommended for Action'?'badge-amber':i.status==='Rejected'?'badge-red':'badge-navy'}`}>{i.status}</span>
              <span className={`badge ${i.confidence==='High'?'badge-green':i.confidence==='Medium'?'badge-amber':'badge-gray'}`}>{i.confidence}</span>
              <span style={{ fontSize:11, color:PAL.muted, marginLeft:'auto' }}>Click to expand</span>
            </div>
            <div style={{ fontWeight:700, fontSize:14, color:PAL.navy, marginBottom:4 }}>{i.title}</div>
            <p style={{ margin:0, fontSize:13, color:PAL.muted, lineHeight:1.6 }}>{i.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── INTERVENTIONS ────────────────────────────────────────────────────────────
function Interventions() {
  const [items, setItems] = useState(DEMO_INTERVENTIONS);
  const [sel, setSel] = useState(null);
  const [modal, setModal] = useState(false);
  const [nI, setNI] = useState({ title:'', building_id:'', observation:'', proposed_action:'', responsible_party:'', proposed_date:'' });
  const FLOW = ['Proposed','Approved','In Progress','Completed','Rejected'];

  function advance(id) {
    setItems(p=>p.map(i=>{
      if (i.id!==id) return i;
      const ix=FLOW.indexOf(i.status);
      return ix<FLOW.length-2 ? {...i,status:FLOW[ix+1]} : i;
    }));
  }

  function create() {
    if (!nI.title.trim()||!nI.building_id) return;
    const b=BUILDINGS.find(x=>x.id===nI.building_id);
    setItems(p=>[...p,{ id:`INT${String(p.length+1).padStart(3,'0')}`, ...nI, building_name:b?.name||null, status:'Proposed', linked_insight:'', followup:'', outcome:'' }]);
    setModal(false);
    setNI({ title:'', building_id:'', observation:'', proposed_action:'', responsible_party:'', proposed_date:'' });
  }

  if (sel) {
    const iv=items.find(x=>x.id===sel);
    const ix=FLOW.indexOf(iv.status);
    return (
      <div style={{ padding:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <button className="btn btn-secondary btn-sm" onClick={()=>setSel(null)}>Back</button>
          <span className={`badge ${iv.status==='Completed'?'badge-green':iv.status==='In Progress'?'badge-amber':iv.status==='Rejected'?'badge-red':'badge-navy'}`}>{iv.status}</span>
        </div>
        <h2 style={{ fontSize:18, fontWeight:700, color:PAL.navy, marginBottom:4 }}>{iv.title}</h2>
        <p style={{ color:PAL.muted, fontSize:13, margin:'0 0 16px' }}>{iv.building_name||'Campus-wide'} - {iv.proposed_date||'No date set'}</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14, marginBottom:16 }}>
          {[['Observation',iv.observation],['Proposed Action',iv.proposed_action],['Responsible Party',iv.responsible_party||'Not assigned'],['Baseline Measurement',iv.baseline||'Not set'],['Follow-up Plan',iv.followup||'Not set'],['Outcome',iv.outcome||'No outcome recorded yet']].map(([k,v])=>(
            <div key={k} style={{ padding:'10px 14px', background:PAL.cream, borderRadius:6 }}>
              <div style={{ fontSize:11, fontWeight:700, color:PAL.muted, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{k}</div>
              <div style={{ fontSize:13, color:PAL.text, lineHeight:1.6 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {ix<FLOW.length-2 && <button className="btn btn-green btn-sm" onClick={()=>advance(iv.id)}>Advance to {FLOW[ix+1]}</button>}
          <div style={{ display:'flex', gap:6 }}>{FLOW.map((s,i)=>(<span key={s} style={{ padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:600, background:i<=ix?PAL.navy:PAL.creamDark, color:i<=ix?'#fff':PAL.muted }}>{s}</span>))}</div>
        </div>
        <div style={{ marginTop:12, padding:'8px 12px', background:PAL.amberBg, borderRadius:6, fontSize:12, color:'#92400e' }}>
          Do not claim an intervention caused improvements without sufficient before/after audit evidence.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:24 }}>
      <SH title="Interventions" sub="Track proposed actions and their evidence-based outcomes"
        action={<button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}>+ New Intervention</button>} />
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {items.map(iv=>(
          <div key={iv.id} className="card" style={{ padding:14, cursor:'pointer' }} onClick={()=>setSel(iv.id)}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:PAL.navy }}>{iv.title}</div>
                <div style={{ fontSize:12, color:PAL.muted, marginTop:3 }}>{iv.building_name||'Campus-wide'} - {iv.proposed_date||'No date'}</div>
                <div style={{ fontSize:12, color:PAL.text, marginTop:4, lineHeight:1.5 }}>{iv.observation.length>100?iv.observation.slice(0,100)+'...':iv.observation}</div>
              </div>
              <span className={`badge ${iv.status==='Completed'?'badge-green':iv.status==='In Progress'?'badge-amber':iv.status==='Rejected'?'badge-red':'badge-navy'}`}>{iv.status}</span>
            </div>
          </div>
        ))}
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title="New Intervention">
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Title <span style={{ color:PAL.red }}>*</span></label>
            <input value={nI.title} onChange={e=>setNI(p=>({...p,title:e.target.value}))} placeholder="Brief descriptive title" />
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Building <span style={{ color:PAL.red }}>*</span></label>
            <select value={nI.building_id} onChange={e=>setNI(p=>({...p,building_id:e.target.value}))}>
              <option value="">Select building (or campus-wide)...</option>
              {BUILDINGS.map(b=>(<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Observation</label>
            <textarea value={nI.observation} onChange={e=>setNI(p=>({...p,observation:e.target.value}))} rows={2} style={{ fontFamily:'inherit', resize:'vertical' }} />
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Proposed Action</label>
            <textarea value={nI.proposed_action} onChange={e=>setNI(p=>({...p,proposed_action:e.target.value}))} rows={2} style={{ fontFamily:'inherit', resize:'vertical' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Responsible Party</label>
              <input value={nI.responsible_party} onChange={e=>setNI(p=>({...p,responsible_party:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Proposed Date</label>
              <input type="date" value={nI.proposed_date} onChange={e=>setNI(p=>({...p,proposed_date:e.target.value}))} />
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={create}>Create Intervention</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function Reports() {
  const [cfg, setCfg] = useState({ from:'2024-01-01', to:'2024-06-30', sections:{ records:true, audits:true, insights:true, interventions:true } });
  const [prev, setPrev] = useState(false);

  const inRange = DEMO_RECORDS.filter(r=>r.date>=cfg.from&&r.date<=cfg.to);
  const tot=inRange.length, attr=inRange.filter(r=>r.building_id).length, wt=inRange.reduce((s,r)=>s+r.net_lbs,0);

  function expCSV() {
    const rows=[
      ['ENVIROTRAP NEXUS RESEARCH SUMMARY'],['Generated:',new Date().toISOString()],
      ['Range:',`${cfg.from} to ${cfg.to}`],['NOTE: DEMO DATA - NOT ACTUAL UIUC OPERATIONAL RECORDS'],[],
      ['METRIC','VALUE','NOTE'],
      ['Total Records',tot,'Simulated LoadMan'],['Attributed',attr,'With building ID'],
      ['Attribution Rate',(attr/tot*100||0).toFixed(1)+'%','Matches historical 12.6%'],
      ['Total Net Weight (lbs)',wt,'Estimated'],[],
      ['INSIGHT','STATUS','CATEGORY'],
      ...DEMO_INSIGHTS.map(i=>[`"${i.title}"`,i.status,i.category])
    ];
    const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`envirotrap_report_${cfg.from}_${cfg.to}.csv`; a.click();
  }

  function expJSON() {
    const report = {
      metadata:{ generated:new Date().toISOString(), tool:'EnviroTrap Nexus v0.2.0', note:'DEMO DATA - NOT ACTUAL UIUC OPERATIONAL RECORDS' },
      date_range:{ from:cfg.from, to:cfg.to },
      summary:{ total_records:tot, attributed_records:attr, attribution_rate_pct:parseFloat((attr/tot*100||0).toFixed(1)), total_net_weight_lbs:wt },
      insights:DEMO_INSIGHTS.map(i=>({ id:i.id, title:i.title, status:i.status, category:i.category, confidence:i.confidence }))
    };
    const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`envirotrap_report_${cfg.from}_${cfg.to}.json`; a.click();
  }

  return (
    <div style={{ padding:24 }}>
      <SH title="Reports" sub="Generate and export research summaries" />
      <div className="card" style={{ padding:16, maxWidth:540, marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:12 }}>Report Configuration</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div>
            <label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>From</label>
            <input type="date" value={cfg.from} onChange={e=>setCfg(p=>({...p,from:e.target.value}))} />
          </div>
          <div>
            <label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>To</label>
            <input type="date" value={cfg.to} onChange={e=>setCfg(p=>({...p,to:e.target.value}))} />
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={expCSV}>Export CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={expJSON}>Export JSON</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setPrev(x=>!x)}>{prev?'Hide':'Show'} Preview</button>
        </div>
      </div>
      {prev && (
        <div className="card" style={{ padding:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:PAL.navy, marginBottom:10 }}>Preview: {cfg.from} to {cfg.to}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10, marginBottom:10 }}>
            {[['Records in range',tot],['Attributed',attr],['Attribution rate',tot>0?(attr/tot*100).toFixed(1)+'%':'N/A'],['Net weight',`${wt.toLocaleString()} lbs`]].map(([k,v])=>(
              <div key={k} style={{ background:PAL.cream, borderRadius:6, padding:'10px 12px' }}>
                <div style={{ fontSize:11, color:PAL.muted }}>{k}</div>
                <div style={{ fontSize:20, fontWeight:700, color:PAL.navy }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'#fff3cd', border:'1px solid #ffc107', borderRadius:6, padding:'8px 12px', fontSize:12, color:'#664d03' }}>
            All values are from demo data only. Do not cite these figures as actual UIUC waste generation statistics.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings() {
  const [profile, setProfile] = useState(()=>{ try { return JSON.parse(localStorage.getItem('et_profile'))||{ name:'Demo User', role:'Researcher', org:'EnviroTrap / UIUC' }; } catch { return { name:'Demo User', role:'Researcher', org:'EnviroTrap / UIUC' }; } });
  const [saved, setSaved] = useState(false);

  function save() {
    localStorage.setItem('et_profile', JSON.stringify(profile));
    setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  }

  return (
    <div style={{ padding:24 }}>
      <SH title="Settings" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, marginBottom:16 }}>
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:12 }}>User Profile</div>
          {saved && <div style={{ background:'#cce5d8', borderRadius:6, padding:'6px 10px', fontSize:12, color:'#1a3d30', fontWeight:600, marginBottom:10 }}>Saved.</div>}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div><label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>Name</label><input value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} /></div>
            <div><label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>Role</label><select value={profile.role} onChange={e=>setProfile(p=>({...p,role:e.target.value}))}><option>Researcher</option><option>F&S Staff</option><option>Driver</option><option>Administrator</option><option>Viewer</option></select></div>
            <div><label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>Organization</label><input value={profile.org} onChange={e=>setProfile(p=>({...p,org:e.target.value}))} /></div>
            <button className="btn btn-primary btn-sm" onClick={save}>Save Profile</button>
          </div>
        </div>
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:12 }}>Application Info</div>
          {[['Version','0.2.0 - AI Sprint'],['Mode','Demo (No Backend)'],['Records',DEMO_RECORDS.length],['Audits',DEMO_AUDITS.length],['Insights',DEMO_INSIGHTS.length],['Interventions',DEMO_INTERVENTIONS.length],['AI Engine','Ask Nexus (Deterministic)']].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${PAL.border}`, fontSize:13 }}>
              <span style={{ color:PAL.muted }}>{k}</span><span style={{ fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:12 }}>Development Roadmap</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
          {[
            { label:'Phase 1: MVP', done:true, items:['Dashboard','CSV importer','Data quality analysis','Source mapper','Waste audits','Basic insights','Demo mode'] },
            { label:'Phase 2: AI Sprint', done:true, items:['Ask Nexus AI assistant','Smart Collection Log','AI insights strip','Anomaly detection','Overview upgrades'] },
            { label:'Phase 3: Integrations', done:false, items:['Authorized Rego data imports','F&S system integration','QR-code container scanning','Real-time collection tracking'] },
          ].map(ph=>(
            <div key={ph.label} style={{ padding:12, borderRadius:7, border:`1px solid ${ph.done?PAL.teal:PAL.border}`, background:ph.done?'#f0fdf4':PAL.white }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                <span style={{ fontWeight:700, fontSize:13, color:ph.done?PAL.teal:PAL.navy }}>{ph.label}</span>
                {ph.done && <span className="badge badge-green">Done</span>}
              </div>
              {ph.items.map(it=>(<div key={it} style={{ fontSize:12, color:PAL.muted, padding:'2px 0 2px 10px', borderLeft:`2px solid ${ph.done?PAL.teal:PAL.creamDark}` }}>{it}</div>))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ASK NEXUS ────────────────────────────────────────────────────────────────
function AskNexus() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const historyRef = useRef(null);

  function ask(q) {
    const question = (q||query).trim();
    if (!question) return;
    setLoading(true);
    setQuery('');
    // Simulate brief processing time for UX
    setTimeout(()=>{
      const result = NexusAI.answer(question);
      setHistory(h=>[{
        id:Date.now(), question,
        ...result,
        timestamp: new Date().toLocaleTimeString()
      },...h]);
      setLoading(false);
    }, 400);
  }

  const typeColors = { calculated:PAL.teal, observed:PAL.navyLight, methodology:PAL.muted, unknown:PAL.muted };
  const typeLabels = { calculated:'Calculated Finding', observed:'Observed Fact', methodology:'Methodology', unknown:'Could not answer' };

  return (
    <div style={{ padding:24, maxWidth:820, margin:'0 auto' }}>
      <SH title="Ask Nexus" sub="Deterministic waste intelligence assistant - all answers computed from verified demo records" />

      <div className="card" style={{ padding:14, marginBottom:16, background:'#eff6ff', borderLeft:`4px solid ${PAL.navyLight}` }}>
        <div style={{ fontSize:12, fontWeight:700, color:PAL.navy, marginBottom:4 }}>About Ask Nexus</div>
        <p style={{ margin:0, fontSize:13, color:PAL.text, lineHeight:1.7 }}>
          Ask Nexus answers questions by running deterministic calculations against EnviroTrap's demo dataset ({DEMO_RECORDS.length} records). Every numerical claim is traceable to underlying records. Uncertainty and data gaps are always stated. This is not a language model - it uses pattern matching and rule-based computation. No external API calls are made.
        </p>
      </div>

      {/* Query input */}
      <div className="card" style={{ padding:14, marginBottom:16 }}>
        <div style={{ display:'flex', gap:10 }}>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&query.trim()) ask(); }}
            placeholder="Ask a question about campus waste data..." style={{ flex:1, fontSize:14 }} />
          <button className="btn btn-primary" onClick={()=>ask()} disabled={loading||!query.trim()}>
            {loading ? 'Thinking...' : 'Ask'}
          </button>
        </div>
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:12, color:PAL.muted, marginBottom:7 }}>Suggested questions:</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {NEXUS_SUGGESTIONS.map(s=>(
              <button key={s} onClick={()=>ask(s)}
                style={{ padding:'4px 10px', borderRadius:12, border:`1px solid ${PAL.border}`, background:PAL.white, cursor:'pointer', fontSize:12, color:PAL.navy }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div ref={historyRef} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {history.length===0 && !loading && (
          <div style={{ textAlign:'center', padding:40, color:PAL.muted }}>
            <div style={{ fontSize:24, marginBottom:8 }}>&#9711;</div>
            <div style={{ fontWeight:600 }}>Ask a question to get started</div>
            <div style={{ fontSize:13, marginTop:4 }}>Try one of the suggested questions above</div>
          </div>
        )}
        {loading && (
          <div style={{ textAlign:'center', padding:20, color:PAL.muted, fontSize:13 }}>Computing answer from demo records...</div>
        )}
        {history.map(h=>(
          <div key={h.id} className="card" style={{ padding:16 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:14, fontWeight:700, color:PAL.navy }}>Q: {h.question}</div>
              <div style={{ fontSize:11, color:PAL.muted, flexShrink:0, marginLeft:10 }}>{h.timestamp}</div>
            </div>
            {h.type==='unknown' ? (
              <div style={{ background:PAL.cream, borderRadius:6, padding:12, fontSize:13, color:PAL.muted }}>
                Ask Nexus could not find a specific handler for this question. Try rephrasing, or use one of the suggested questions above.
                Supported topics: buildings by weight, attribution rate, stream distribution, anomalies, diversion rate methodology, RFID/data quality, contamination, routes, interventions.
              </div>
            ) : (
              <div>
                <div style={{ marginBottom:8 }}>
                  <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:700, background:(typeColors[h.type]||PAL.muted)+'22', color:typeColors[h.type]||PAL.muted, marginBottom:8 }}>
                    {typeLabels[h.type]||h.type}
                  </span>
                </div>
                <pre style={{ margin:'0 0 12px', fontSize:13, lineHeight:1.7, fontFamily:'inherit', whiteSpace:'pre-wrap', color:PAL.text, background:PAL.cream, borderRadius:6, padding:12 }}>{h.answer}</pre>
                {h.note && (
                  <div style={{ background:PAL.amberBg, border:`1px solid #fde68a`, borderRadius:6, padding:'8px 12px', fontSize:12, color:'#92400e' }}>
                    <strong>Note:</strong> {h.note}
                  </div>
                )}
                {h.records_used!==undefined && (
                  <div style={{ marginTop:8, fontSize:11, color:PAL.muted }}>
                    Data source: {h.records_used} records used of {h.total_records} total demo records. All computations are deterministic.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NAV + APP ────────────────────────────────────────────────────────────────
const NAV = [
  { id:'overview', label:'Overview', icon:'📊' },
  { id:'nexus', label:'Ask Nexus', icon:'🤖', badge:'AI' },
  { id:'explorer', label:'Waste Explorer', icon:'📂' },
  { id:'mapper', label:'Source Mapper', icon:'🗺' },
  { id:'collection', label:'Collection Log', icon:'🚛' },
  { id:'audits', label:'Waste Audits', icon:'🔬' },
  { id:'rego', label:'Rego Research', icon:'📡' },
  { id:'insights', label:'Insights', icon:'💡' },
  { id:'interventions', label:'Interventions', icon:'🎯' },
  { id:'reports', label:'Reports', icon:'📄' },
  { id:'settings', label:'Settings', icon:'⚙️' },
];

function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  return (
    <div style={{ background:PAL.navy, minHeight:'100vh', width:collapsed?56:220, flexShrink:0, display:'flex', flexDirection:'column', transition:'width .2s', overflowX:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 12px', borderBottom:'1px solid rgba(255,255,255,.1)' }}>
        <div style={{ width:32, height:32, borderRadius:8, background:PAL.amber, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:PAL.navy, flexShrink:0 }}>ET</div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:'#fff', lineHeight:1.2 }}>EnviroTrap</div>
            <div style={{ fontSize:10, color:'#80a2ce' }}>Nexus - UIUC</div>
          </div>
        )}
        <button onClick={()=>setCollapsed(x=>!x)} style={{ marginLeft:'auto', background:'none', border:'none', color:'#80a2ce', cursor:'pointer', fontSize:18, padding:0, lineHeight:1 }}>
          {collapsed?'>':'<'}
        </button>
      </div>
      <nav style={{ flex:1, paddingTop:6 }}>
        {NAV.map(item=>(
          <button key={item.id} onClick={()=>setActive(item.id)}
            className={`nav-item ${active===item.id?'active':''}`}
            style={{ color:active===item.id?'white':'#abc1df', fontWeight:active===item.id?600:400, fontSize:13 }}>
            <span style={{ fontSize:15, flexShrink:0 }}>{item.icon}</span>
            {!collapsed && (
              <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                {item.label}
                {item.badge && <span style={{ background:PAL.amber, color:PAL.navy, fontSize:9, fontWeight:800, padding:'1px 5px', borderRadius:8, letterSpacing:'.05em' }}>{item.badge}</span>}
              </span>
            )}
          </button>
        ))}
      </nav>
      {!collapsed && (
        <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,.1)', fontSize:10, color:'#5683be' }}>
          v0.2.0 AI Sprint
        </div>
      )}
    </div>
  );
}

function App() {
  const [active, setActive] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);

  const PAGES = {
    overview: <Overview setActive={setActive} />,
    nexus: <AskNexus />,
    explorer: <WasteExplorer />,
    mapper: <SourceMapper />,
    collection: <CollectionLog />,
    audits: <WasteAudits />,
    rego: <RegoResearch />,
    insights: <InsightsEngine />,
    interventions: <Interventions />,
    reports: <Reports />,
    settings: <Settings />,
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <DemoBanner />
      <div style={{ display:'flex', flex:1 }}>
        <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} />
        <main style={{ flex:1, overflowY:'auto', background:'#f8f5ee' }}>
          {PAGES[active]||null}
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
