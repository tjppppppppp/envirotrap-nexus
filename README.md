# EnviroTrap Nexus

**From collection to characterization to action.**

A waste intelligence platform built for the University of Illinois Urbana-Champaign (UIUC), developed by EnviroTrap as part of the IBM AI for Good Challenge.

**Live site:** https://tjppppppppp.github.io/envirotrap-nexus/

---

## What It Is

EnviroTrap Nexus is a research and operations platform that connects fragmented campus waste data into one place -- helping researchers, Facilities & Services (F&S) staff, and sustainability stakeholders understand where waste comes from, how it moves, and where the information gaps are.

The platform is built around a real problem: UIUC's LoadMan truck-weight system has captured 79,533 pickup records since 2019, but only 9,989 of them (12.6%) can be attributed to a specific building. The rest are weights without an address. EnviroTrap Nexus helps close that gap -- and document exactly why it exists.

---

## The AI for Good Connection

The IBM AI for Good Challenge asks: can AI be used to address real-world problems that matter?

EnviroTrap Nexus answers that question with a concrete example: **campus waste attribution**.

### The Problem

UIUC's truck-weight system lost its ability to identify which containers it was picking up. The RFID readers on both trucks peaked at 88.3% detection in April 2021, degraded over the following months, and reached 0% in August 2022 -- and have not recovered. Every pickup since then has a weight but no building.

That means roughly 70,000 records have no way to answer: *whose waste is this?*

### The AI Solution

Nexus contains a **three-tier attribution engine** built from the 9,989 verified records:

**Tier 1 -- RFID Lookup (100% accuracy)**  
When an RFID tag is present, it is looked up against a 179-container mapping table derived from verified LoadMan records. All 179 RFIDs map exclusively to one building. No model needed -- this is a deterministic lookup.

**Tier 2 -- GPS Nearest-Centroid Model (84.8% top-1 accuracy)**  
When GPS coordinates are available but no RFID, the engine calculates the Haversine distance from the pickup location to 123 campus building centroids derived from real data. The closest centroid within 150m wins. Validated on a held-out 20% test set:
- Top-1 accuracy: **84.8%**
- Top-3 accuracy: **97.8%**
- Coverage at 150m threshold: **91.6%**

This means approximately 15,860 currently unattributed records with GPS coordinates could be attributed using this model.

**Tier 3 -- Abstain**  
When there is no RFID and no GPS, or the nearest centroid is more than 150m away, the engine abstains and says so explicitly. It does not guess.

### Every Prediction Is Labeled

Every piece of information in Nexus carries a provenance label:
- **Verified** -- from the actual LoadMan dataset, confirmed through RFID
- **AI-Inferred** -- from the GPS model, subject to review
- **Simulated** -- demo data, clearly marked
- **Unknown** -- genuinely missing, never fabricated

The platform never presents a gap as zero. It never presents a simulation as an operational record.

---

## Features

### 1. Overview

The dashboard displays headline numbers drawn from the actual LoadMan analysis: 79,533 total records, 9,989 usable (12.6%), RFID peak of 88.3% in April 2021, and 0% from August 2022 onward. Each metric links to the module where it can be explored further.

An AI Insights strip surfaces the three most important validated research findings, with links to full details.

A validity funnel chart shows how records fall through each data-quality gate: total records to Load Pickup events, to records with valid dates, to records with RFID, to records with site attribution, to fully usable records.

### 2. Attribution Engine

The live attribution engine demo. Enter GPS coordinates and optionally an RFID tag to get a building prediction in real time. The engine:

- Shows which tier resolved the prediction (RFID vs GPS vs abstain)
- Displays the top-3 building candidates with distances in meters
- Shows a confidence score and label (Verified, High, Medium, Low, Abstain)
- Displays the evidence string explaining exactly why that building was chosen
- Shows the GPS spread of the winning site (how spread out its pickup locations are)

Below the demo, the module explains the full three-tier architecture, model validation results, and what happens to records that cannot be attributed.

A batch demo runs the GPS model on 20 simulated unattributed records (with realistic noise around real campus locations) and shows the predictions in a table with their confidence levels.

### 3. Data Pipeline

A deep dive into the LoadMan dataset's structure and health.

The validity funnel shows all eight gates with counts and percentages. Each gate has an annotation explaining what it filters and why.

A monthly RFID trend chart plots RFID detection rate from December 2019 through July 2025, showing the ramp-up period, the April 2021 peak, the degradation, and the cliff to zero in August 2022.

A field inventory panel shows the 8 key fields in the dataset with their population rates: pickup time (100%), truck name (100%), service type (93.8%), NVW (93.3%), GPS (40.1%), site name (28.0%), RFID (20.4%), capacity/volume/density (0% -- fields present but unconfigured).

### 4. Ask Nexus

A deterministic question-answering interface grounded in the real LoadMan statistics. This is not a language model and makes no external API calls.

Ask questions like:
- "Which buildings have the most verified pickup records?"
- "What happened to the RFID system?"
- "What is the attribution rate and why?"
- "How accurate is the GPS attribution model?"
- "What data gaps prevent a diversion rate calculation?"
- "What are the 2001 timestamp records?"

Every answer includes:
- The answer text with specific numbers
- A note explaining data limitations
- How many records were used to compute the answer
- Out of how many total records

Suggested questions are shown below the input so users can explore immediately without knowing what to ask.

### 5. Collection Log

A driver-facing interface for logging waste pickups manually. Fields include route, building, container type, waste stream, pickup time, weight, operational notes, and a flag for unusual conditions.

Smart suggestions based on verified LoadMan route patterns help drivers fill in fields faster. Duplicate detection warns if a pickup looks like it may already have been logged. Weight anomaly detection flags entries that are unusually high or low for the selected service type.

### 6. Waste Audits

A research module for planning and documenting physical waste composition audits. Each audit record includes:
- Building and collection location
- Assigned researchers
- Audit date and status (Planned, In Progress, Under Review, Completed)
- Sample weight
- Material breakdown by category (paper, cardboard, plastics, metals, glass, food waste, paper towels, other)
- Contamination notes
- Research notes

Audits can be created, edited, filtered by status, and exported. The module includes four pre-loaded demo audits covering buildings such as Orchard Downs Apartments, Vet Med Basic Sciences, Memorial Stadium, and others.

### 7. Research Insights

Pattern analysis derived from the actual LoadMan dataset. Six pre-loaded insights are grounded in real data:

1. **RFID system failure after Oct 2021** -- Validated, High confidence. The primary attribution loss event. Recommendation: physical inspection of RFID readers on both trucks.
2. **28,337 epoch-default timestamps** -- Validated, High confidence. Device clock failures excluded 28,337 records from date analysis.
3. **GPS model achieves 84.8% top-1 accuracy** -- Validated, High confidence. Approximately 15,860 records could be attributed using the model.
4. **Orchard Downs accounts for 17.1% of verified pickups** -- Validated, High confidence. Requires cross-reference with operational records.
5. **NVW field definition unconfirmed** -- Under Investigation, High confidence. Cannot be used for net weight calculations until the LoadMan operator confirms its definition.
6. **Nearby site centroids create GPS disambiguation challenges** -- Under Investigation, Medium confidence. Buildings within 19-24m of each other may be confused by the GPS model.

Each insight can be expanded to show its full summary, evidence base, and recommendation. Status can be updated (Under Investigation, Validated, Recommended for Action, Rejected) to track research progress.

### 8. Interventions

A tracker that connects research findings to proposed operational actions. Each intervention is linked to a specific insight and includes:

- Observation
- Proposed action
- Responsible party
- Status (Proposed, In Progress, Recommended for Action, Completed)
- Proposed date
- Baseline measurement
- Follow-up plan
- Outcome (filled in after action)

Three pre-loaded interventions cover the RFID system investigation, container-to-building mapping verification, and NVW field definition confirmation.

### 9. Reports

A summary panel showing overall research activity: records analyzed, buildings mapped, audits completed, insights generated. Includes a quick-view of validated findings and a prompt to export.

### 10. Settings

Configuration panel for data sources, model thresholds, demo mode toggle, and application preferences.

---

## Data Transparency

All statistics in this application come from one source: `UIUC_LoadMan_Consolidated_Dataset.xlsx`, a 15.5 MB export containing 79,533 rows and 53 columns, provided by Betsy Ruckman, Zero Waste Coordinator, UIUC Facilities & Services.

The 79,533-record analysis is not "loaded into" the application. The application embeds the **summary statistics derived from that analysis** -- counts, rates, centroids, and RFID mappings. The raw records are not embedded and are not publicly accessible.

Demo data is generated synthetically using real building names and realistic GPS noise. It is always labeled: **DEMO DATA -- NOT ACTUAL UIUC OPERATIONAL RECORDS**.

---

## Architecture

EnviroTrap Nexus is a fully static single-page application. No server, no database, no API keys.

```
index.html          Single deployable file (175 KB)
app.jsx             JSX source (1,635 lines)
compiled.js         Babel-compiled output (5,278 lines)
model_data.json     Attribution model: 179 RFIDs, 123 GPS centroids, monthly trend
lib/
  react.js          React 18 UMD
  react-dom.js      ReactDOM 18 UMD
  prop-types.js     PropTypes
  recharts.js       Recharts 2.12 UMD
  tailwind.js       Tailwind CSS CDN
```

### Why Static?

A university demonstration prototype needs to be:
- Sharable via a single link
- Runnable without credentials
- Deployable without infrastructure
- Demonstrable to stakeholders without IT involvement

A static site on GitHub Pages satisfies all of these. The attribution engine and all AI logic run entirely in the browser.

### How to Run Locally

```bash
git clone https://github.com/tjppppppppp/envirotrap-nexus
cd envirotrap-nexus
open index.html
```

No install required.

### How to Rebuild After Editing app.jsx

Requires Node.js:

```bash
node -e "
const babel = require('./lib/babel.js');
const fs = require('fs');
const result = babel.transform(fs.readFileSync('app.jsx','utf8'), {
  presets: [['react', {runtime:'classic'}]],
  sourceType: 'script'
});
fs.writeFileSync('compiled.js', result.code);
console.log('Compiled:', result.code.split('\\n').length, 'lines');
"
```

Then reassemble `index.html` by replacing the contents of the `<script>` block at the bottom of the file with the new `compiled.js` output.

---

## What This Is Not

- Not an officially deployed UIUC system
- Not integrated with live LoadMan truck hardware
- Not connected to RFID readers or any university IT infrastructure
- Not presenting the 79,533-record dataset as if it is loaded or browsable in the app
- Not fabricating attribution predictions -- the engine abstains when confidence is insufficient
- Not using an LLM -- Ask Nexus is deterministic, grounded in fixed statistics

---

## Project Status

| Version | What Was Built |
|---------|----------------|
| v0.1.0  | Full 10-module SPA, demo data, initial deployment |
| v0.2.0  | Ask Nexus (deterministic), smart Collection Log, Overview improvements |
| v0.3.0  | Real attribution engine, verified LoadMan statistics, GPS model, model_data.json |

**Next priorities:**
- Apply GPS model to the 15,860 GPS-equipped unattributed records (requires authorized data access)
- Schedule RFID system ride-along (physical investigation)
- Confirm NVW field definition with LoadMan operator
- Expand Waste Audit records with actual composition data

---

## People

**EnviroTrap** -- Student-led research initiative, University of Illinois Urbana-Champaign

Data source: UIUC Facilities & Services, LoadMan truck-weight system  
Stakeholder contact: Betsy Ruckman, Zero Waste Coordinator, F&S

---

## License

This repository is a research prototype. The LoadMan data it was built from is property of UIUC Facilities & Services and is not included in this repository.
