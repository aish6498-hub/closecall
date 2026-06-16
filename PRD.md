# CloseCall — Product Requirements Document

**Version:** 1.3
**Last updated:** June 2026
**Authors:** Priyan Baskar, Aishwarya Rajmohan
**Repo:** [github link]
**Status:** In progress

---

## Project Description

Every week, dozens of asteroids fly past Earth - some closer than the Moon and almost nobody knows it's happening. NASA tracks all of them and publishes the data for free, but it's buried in a raw API nobody casually opens.

CloseCall pulls that live feed into a readable dashboard. The feed shows what actually matters - how close, how fast, how big - and flags anything NASA considers hazardous.

On top of the live feed, CloseCall adds a personal layer. Save asteroids to a watchlist, log observations with personal danger ratings, and explore a full timeline of every known Earth approach for any asteroid - past and future - pulled live from NASA. A stats page shows size distribution across logged objects and where your danger ratings diverge from NASA's official classification.

CloseCall uses two MongoDB collections. The watchlist collection supports full CRUD: users can save, view, edit, and delete tracked asteroids. The observations collection supports full CRUD: users can log, view, edit, and delete personal research entries.

---

## User Personas

**Dr. Grace, The Astronomy Educator**
Wants real, current asteroid examples to pull up in class without digging through NASA's raw data.

**Ash, The Space Enthusiast**
Loves the "we live in a shooting gallery" reality of near-Earth objects and wants one place to track the close calls.

**Rocky, The Casual Doom-Scroller**
Got curious after a scary headline and wants to know what's incoming, what's hazardous, and how close the alarming ones have gotten before.

---

## User Stories

1. As Ash, I want to save an asteroid to my watchlist with a personal nickname and tag so I can organize and label close calls in my own words.
2. As Ash, I want to view all my saved asteroids in one place so I can see my full watchlist at a glance.
3. As Ash, I want to edit the tag or note on a saved asteroid so my watchlist stays organized.
4. As Ash, I want to delete an asteroid from my watchlist so I can remove ones I no longer care about.
5. As Ash, I want to browse this week's asteroid feed sorted by miss distance so I can immediately see which ones came closest.
6. As Dr. Grace, I want to filter the feed by size and hazard status so I can find objects relevant to what I am teaching that week.
7. As Rocky, I want to log an observation for an asteroid with a danger rating and notes so I can build a personal research record.
8. As Rocky, I want to view all my logged observations so I can revisit objects I have researched before.
9. As Rocky, I want to edit an observation so I can update my notes as I learn more about an object.
10. As Rocky, I want to delete an observation so I can remove entries I no longer need.
11. As Rocky, I want to see a timeline of every known Earth approach for an asteroid I've logged so I can understand its full history.

---

## Technology Stack

| Layer         | Choice                           | Notes                                                         |
| ------------- | -------------------------------- | ------------------------------------------------------------- |
| Frontend      | Vanilla JavaScript (ES6 Modules) | No React, no frameworks                                       |
| Styling       | HTML5 + CSS3                     | One shared base file + one CSS file per owner                 |
| Backend       | Node.js + Express                | ES Modules (import/export, no require)                        |
| Database      | MongoDB Atlas                    | Native NodeJS driver, no Mongoose                             |
| External API  | NASA NeoWs                       | Proxied server-side, key in .env                              |
| Data Requests | Fetch API                        | No Axios                                                      |
| Formatter     | Prettier                         | .prettierrc committed, format script runs before every commit |
| Linter        | ESLint                           | eslint.config.js committed, throws zero errors                |
| Deployment    | Render                           | Environment variables set on host, never in code              |
| License       | MIT                              | LICENSE file in repo root                                     |

---

## Division of Work

### Aishwarya Rajmohan — Observations & Stats (Full-Stack)

**Frontend:** Builds the Observations page (journal form, observation cards, approach timeline visualization, divergence badges) and the Stats page (summary cards, size distribution chart, divergence table).

**Backend & DB:** Handles all Express CRUD routes for the observations collection. Approach timeline data is fetched via the shared NASA proxy route.

**Files owned:**

- `routes/observations.js`
- `public/observations.html`
- `public/stats.html`
- `js/observations.js`
- `js/timeline.js`
- `js/stats.js`
- `css/observations.css`

---

### Priyan Baskar — Live Feed & Watchlist (Full-Stack)

**Frontend:** Builds the Threat Board (live asteroid feed, filters, sort, size comparator) and the Watchlist page (saved asteroids with live-refreshed approach data, edit and delete controls).

**Backend & DB:** Handles all Express CRUD routes for the watchlist collection and builds the NASA NeoWs proxy routes for the feed and per-asteroid refresh. The single asteroid proxy is shared with Aishwarya's timeline.

**Files owned:**

- `routes/nasa.js`
- `routes/watchlist.js`
- `public/index.html`
- `public/watchlist.html`
- `js/feed.js`
- `js/watchlist.js`
- `css/feed.css`

---

## File Structure

```
closecall/
├── server.js                     # Express app entry point — SHARED
├── package.json                  # All dependencies — SHARED
├── .env                          # NASA API key, MongoDB URI — never committed
├── .env.example                  # Template showing required environment variables — SHARED
├── .gitignore                    # Excludes .env, node_modules, .DS_Store — SHARED
├── .prettierrc                   # Prettier config — SHARED
├── eslint.config.js              # ESLint config — SHARED
├── LICENSE                       # MIT — SHARED
├── README.md                     # Setup instructions, authors, screenshots — SHARED
│
├── db/
│   └── connection.js             # MongoDB connection module — SHARED
│
├── routes/
│   ├── nasa.js                   # NASA NeoWs proxy routes — PRIYAN
│   ├── watchlist.js              # Watchlist CRUD routes — PRIYAN
│   └── observations.js           # Observations CRUD routes — AISHWARYA
│
├── public/
│   ├── index.html                # Threat Board — PRIYAN
│   ├── watchlist.html            # Watchlist page — PRIYAN
│   ├── observations.html         # Observations page — AISHWARYA
│   └── stats.html                # Stats page — AISHWARYA
│
├── js/
│   ├── feed.js                   # Threat Board client logic — PRIYAN
│   ├── watchlist.js              # Watchlist client logic — PRIYAN
│   ├── observations.js           # Journal form + observation cards — AISHWARYA
│   ├── timeline.js               # Approach timeline visualization — AISHWARYA
│   └── stats.js                  # Stats dashboard + charts — AISHWARYA
│
└── css/
    ├── styles.css                # Shared reset, variables, nav — SHARED
    ├── feed.css                  # Threat Board + Watchlist styles — PRIYAN
    └── observations.css          # Observations + Stats + Timeline styles — AISHWARYA
```

> No leftover files. No routes/users.js, no unused imports, no default boilerplate. Every file in the repo is used.

---

## API Reference

### External — NASA NeoWs

Base URL: `https://api.nasa.gov/neo/rest/v1`
Auth: `api_key` query parameter — stored in `.env` as `NASA_API_KEY`, never exposed to client.
All calls made server-side through Express proxy routes.

#### Feed endpoint

```
GET /neo/rest/v1/feed
```

| Parameter  | Type   | Required | Description                |
| ---------- | ------ | -------- | -------------------------- |
| start_date | string | yes      | YYYY-MM-DD format          |
| end_date   | string | yes      | max 7 days from start_date |
| api_key    | string | yes      | from .env                  |

**Used by:** Priyan — threat board feed
**Returns:** All NEOs approaching Earth in the date range, grouped by date.

---

#### Single asteroid endpoint

```
GET /neo/rest/v1/neo/:nasaId
```

| Parameter | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| nasaId    | string | yes      | NASA SPK-ID e.g. 3542519 |
| api_key   | string | yes      | from .env                |

**Used by:** Priyan — watchlist live refresh · Aishwarya — approach timeline
**Returns:** Full asteroid record including all known close approach data. Full array spans 1900–2100+, typically 20–60 Earth approaches per asteroid.

---

### Internal — Express Routes

Base URL: `http://localhost:3000`

#### Observation routes — Aishwarya

| Method | Route                 | Description          |
| ------ | --------------------- | -------------------- |
| GET    | /api/observations     | Get all observations |
| POST   | /api/observations     | Log new observation  |
| PUT    | /api/observations/:id | Edit observation     |
| DELETE | /api/observations/:id | Delete observation   |

#### Watchlist routes — Priyan

| Method | Route              | Description               |
| ------ | ------------------ | ------------------------- |
| GET    | /api/watchlist     | Get all saved asteroids   |
| POST   | /api/watchlist     | Add asteroid to watchlist |
| PUT    | /api/watchlist/:id | Edit tag or note          |
| DELETE | /api/watchlist/:id | Remove from watchlist     |

#### NASA proxy routes — Priyan (shared with Aishwarya)

| Method | Route             | Description                                                               |
| ------ | ----------------- | ------------------------------------------------------------------------- |
| GET    | /api/nasa/feed    | Proxies NeoWs feed for a date range                                       |
| GET    | /api/nasa/neo/:id | Proxies single asteroid — used by watchlist refresh and approach timeline |

---

## Sections To Complete

- [ ] Data Models
- [ ] Feature Specs — Threat Board (Priyan)
- [ ] Feature Specs — Watchlist (Priyan)
- [ ] Feature Specs — Observations (Aishwarya)
- [ ] Feature Specs — Approach Timeline (Aishwarya)
- [ ] Feature Specs — Stats Dashboard (Aishwarya)
- [ ] README template
- [ ] Design Mockups
