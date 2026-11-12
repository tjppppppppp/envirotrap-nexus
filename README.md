# EnviroTrap Nexus

**UIUC Waste Intelligence Platform — v0.1.0 MVP Prototype**

> *From collection to characterization to action.*

EnviroTrap Nexus is a research and operations prototype built for [EnviroTrap](https://github.com/tjppppppppp), a student-led sustainability initiative at the **University of Illinois Urbana-Champaign**. It connects fragmented campus waste-management information — LoadMan truck-weight records, waste composition audits, Rego characterization data, and collection logs — into a single research platform.

> ⚠️ **This is a demonstration prototype using synthetic data. It does not connect to any live UIUC operational system.**

---

## Live Demo

**[Open EnviroTrap Nexus →](https://tjppppppppp.github.io/envirotrap-nexus/)**

No installation required. Opens in any modern browser.

---

## What It Does

EnviroTrap Nexus addresses four problems identified through EnviroTrap's research at the UIUC Waste Transfer Station:

| Problem | How Nexus Helps |
|---|---|
| Only ~12.6% of LoadMan records are attributable to specific buildings | Waste Explorer shows attribution rate and lets researchers investigate the gap |
| Information is fragmented across systems | Source Mapper links buildings → pickup records → audits → insights |
| Waste composition audits are infrequent | Waste Audit Manager supports recurring, structured composition research |
| Data rarely translates to action | Insights Engine → Intervention Tracker connects findings to proposals |

---

## Modules

| Module | Purpose |
|---|---|
| **📊 Overview** | Dashboard — key metrics, trend charts, data quality, active recommendations |
| **📂 Waste Explorer** | Upload and explore LoadMan CSV records; filter by building, stream, route |
| **🗺 Source Mapper** | Building-by-building waste profile with traceability journey visualization |
| **🚛 Collection Log** | Mobile-friendly driver logging interface with net weight calculation |
| **🔬 Waste Audits** | Plan, conduct, and document physical waste composition audits |
| **📡 Rego Research** | Rego characterization data hub (mock data, adapter architecture ready) |
| **💡 Insights** | Research findings with evidence, confidence, and workflow actions |
| **🎯 Interventions** | Sustainability intervention proposals linked to research findings |
| **📄 Reports** | Generate and export summaries (CSV and JSON) |
| **⚙️ Settings** | User profile, open F&S questions, phase roadmap |

---

## Running Locally

### Option 1 — Python server (recommended)

```bash
# Clone the repo
git clone https://github.com/tjppppppppp/envirotrap-nexus.git
cd envirotrap-nexus

# Start the server
python3 -m http.server 8765

# Open in your browser
open http://localhost:8765
```

### Option 2 — Double-click

Open `index.html` directly in any browser. The application uses pre-compiled JavaScript and local library files — no build step and no internet connection required.

---

## Demo Data

All data displayed in this prototype is **synthetic and clearly labeled**:

```
⚠ DEMO DATA — NOT ACTUAL UIUC OPERATIONAL RECORDS ⚠
```

The demo dataset includes:
- **220 simulated LoadMan pickup records** (Jan 2023 – Jun 2024) with ~12.6% building attribution — matching EnviroTrap's actual historical finding from 79,533 records
- **15 UIUC campus buildings** (Illini Union, Siebel Center, CRCE, Beckman, etc.)
- **5 waste composition audits** across Planned → Completed stages
- **8 research insights** with evidence and recommendations
- **4 intervention proposals** linked to research findings
- **5 Rego characterization observations** (mock, pending authorized integration)

---

## Key Research Finding

> EnviroTrap's analysis of approximately **79,533** historical LoadMan truck-weight records found that only **9,989** (~12.6%) could be attributed to specific buildings.
>
> This does not mean 87.4% of campus waste is untracked. It reflects limitations in building attribution within the analyzed dataset.

This finding is reproduced proportionally in the demo data and is the focus of several research insights in the platform.

---

## Technology

| Layer | Technology |
|---|---|
| UI Framework | React 18 (pre-compiled, no build step) |
| Charts | Recharts 2.12 |
| Styling | Tailwind CSS 3 |
| Storage | In-memory state + `localStorage` for user profile |
| Backend | None — prototype runs entirely in the browser |

All dependencies are bundled in `lib/` — no internet connection needed after cloning.

---

## Project Structure

```
envirotrap-nexus/
├── index.html        # Complete application (pre-compiled React)
├── lib/
│   ├── react.js      # React 18 UMD
│   ├── react-dom.js  # ReactDOM 18 UMD
│   ├── prop-types.js # PropTypes (required by Recharts)
│   ├── recharts.js   # Recharts 2.12 UMD
│   └── tailwind.js   # Tailwind CSS CDN build
└── README.md
```

---

## Acceptance Criteria (Phase 1 MVP)

A researcher can:

- [x] Open the dashboard and see key waste metrics
- [x] Upload a waste-record CSV and map its columns
- [x] Identify missing building attribution
- [x] Explore records by building in Source Mapper
- [x] Create a physical waste audit
- [x] Enter waste composition measurements and see a pie chart
- [x] Compare audit findings with available pickup records
- [x] Review research insights with supporting evidence
- [x] Generate and export a research summary (CSV or JSON)

---

## Limitations & Open Questions for F&S

The following questions require answers from UIUC Facilities & Services before Nexus can move from prototype to operational system:

1. What is the current operational status of RFID systems on LoadMan trucks?
2. Can building-level pickup data be recovered from route manifests or driver logs?
3. Is there a data export API or scheduled export from LoadMan available to researchers?
4. Which buildings have permanent container assignments vs. shared containers?
5. What is the downstream disposal destination for each waste stream leaving the WTS?
6. Is F&S open to a pilot driver logging supplement using this interface?
7. Are there existing waste composition studies we should integrate findings from?
8. What approval process exists for implementing bin-labeling interventions?

---

## Roadmap

| Phase | Status | Contents |
|---|---|---|
| Phase 1 — MVP | **Current** | Dashboard, CSV Importer, Source Mapper, Waste Audits, Insights Engine, Demo Mode |
| Phase 2 — Operations | Planned | Full driver logging, route management, intervention tracking, advanced reporting |
| Phase 3 — Integrations | Future | Authorized Rego import, F&S data exports, QR container scanning |

---

## About EnviroTrap

EnviroTrap is a student-led sustainability research initiative at UIUC investigating campus waste management through data analysis, physical audits, and stakeholder engagement. The project explores how fragmented waste information can be connected to support evidence-based sustainability decisions.

**Contact:** tpine3@illinois.edu

---

*EnviroTrap Nexus · University of Illinois Urbana-Champaign · Student Sustainability Research Initiative · v0.1.0*
