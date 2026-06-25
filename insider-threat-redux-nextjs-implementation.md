# Insider Cyber Threat Detection Using Behavioral Sentiment Analysis

## Goal

Build a 2-page frontend-only Next.js application that demonstrates how insider cyber threats can be detected using:

- employee behavior signals
- communication sentiment analysis
- Redux for client-side state management
- mock data only, with no backend implementation

This guide is written for the current repo, which already uses the Next.js App Router under `src/app`.

## Recommended Scope

Use Next.js 16, React 19, and Redux Toolkit.

Why this choice:

- the project already uses the App Router
- file-based routing makes a 2-page structure simple
- Redux Toolkit is the cleanest way to share state across pages
- all demo data can stay local with no backend

## Project Outcome

Create these two pages.

### Page 1: Overview / Monitoring Page

Route: `/`

Purpose:

- introduce the problem domain
- show monitored employees or departments
- display recent behavior signals
- allow the user to choose an employee and run a mock analysis

Suggested UI blocks:

- hero section with project title
- short explanation of insider cyber threats
- employee activity cards
- sentiment summary widgets
- filter controls for department, risk level, and date window
- button to open the detailed analysis page

### Page 2: Threat Analysis Dashboard

Route: `/analysis`

Purpose:

- show the selected employee's risk profile
- combine sentiment and behavior signals into a risk score
- explain why the employee was flagged
- display mitigation recommendations

Suggested UI blocks:

- selected employee profile panel
- risk score meter
- sentiment trend chart or score cards
- suspicious activity timeline
- triggered threat indicators
- recommended action list

## Functional Idea

The app does not need real AI or a real sentiment model. Simulate the workflow:

1. Load mock employees and mock communication logs.
2. Assign each employee:
   - sentiment score
   - anomaly score
   - policy violation count
   - access-time irregularity
3. Combine those values into a final threat risk score.
4. Use Redux to store:
   - selected employee
   - filters
   - dashboard metrics
   - analysis results

## Recommended Folder Structure

```text
src/
  app/
    layout.tsx
    page.tsx
    analysis/
      page.tsx
    globals.css
  components/
    insider-threat/
      overview-hero.tsx
      employee-card.tsx
      filter-panel.tsx
      sentiment-summary.tsx
      risk-meter.tsx
      analysis-timeline.tsx
      recommendation-list.tsx
  store/
    index.ts
    provider.tsx
    hooks.ts
    slices/
      employeeSlice.ts
      analysisSlice.ts
      uiSlice.ts
  data/
    mockEmployees.ts
    mockSignals.ts
  types/
    insider-threat.ts
```

## Step-by-Step Implementation

### Step 1: Install Redux packages

Add the required dependencies:

```bash
npm install @reduxjs/toolkit react-redux
```

### Step 2: Define the app data model

Create types for:

- `Employee`
- `BehaviorSignal`
- `SentimentRecord`
- `ThreatAnalysisResult`

Example fields:

```ts
type Employee = {
  id: string;
  name: string;
  department: string;
  role: string;
  riskLevel: "low" | "medium" | "high";
};
```

For analysis data, include fields such as:

- `sentimentScore`
- `anomalyScore`
- `afterHoursAccessCount`
- `usbTransferFlag`
- `policyViolationCount`
- `finalRiskScore`

### Step 3: Create mock data

Inside `src/data/`, add static arrays for:

- employees
- communication sentiment values
- behavior events
- system access logs

Because there is no backend:

- hardcode the data
- optionally randomize some values on page load
- keep everything deterministic enough for demo purposes

### Step 4: Create the Redux store

Create:

- `src/store/index.ts`
- `src/store/provider.tsx`
- `src/store/hooks.ts`

Use Redux Toolkit with `configureStore`.

Recommended slices:

#### `employeeSlice`

Stores:

- employee list
- selected employee ID
- current department filter

#### `analysisSlice`

Stores:

- computed risk metrics
- flagged indicators
- selected analysis result

#### `uiSlice`

Stores:

- current date range filter
- sort option
- comparison mode

### Step 5: Add a client-side Redux provider

Because this repo uses the Next.js App Router, the Redux provider must be a Client Component.

Create a file like:

```tsx
"use client";

import { Provider } from "react-redux";
import { store } from "./index";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
```

Then wrap `children` inside the provider from `src/app/layout.tsx`.

Important App Router rule:

- keep `layout.tsx` as a Server Component unless interactivity is required there
- place Redux logic inside a separate `"use client"` provider component

### Step 6: Build Page 1 (`src/app/page.tsx`)

This page should act as the monitoring overview.

Suggested content flow:

1. Header or title:
   `Insider Cyber Threat Detection Using Behavioral Sentiment Analysis`
2. Short description of how behavioral signals and sentiment combine.
3. Summary cards:
   - total monitored employees
   - high-risk employees
   - negative sentiment alerts
   - unusual activity alerts
4. Filter panel:
   - department
   - risk level
   - time range
5. Employee grid or table.
6. "Analyze Employee" button that:
   - dispatches `setSelectedEmployee`
   - routes to `/analysis`

Use client components for:

- filters
- click handlers
- Redux dispatches

### Step 7: Build Page 2 (`src/app/analysis/page.tsx`)

This page should present the detailed threat analysis.

Suggested content flow:

1. Selected employee overview.
2. Risk score meter or progress bar.
3. Breakdown of:
   - sentiment score
   - anomaly score
   - policy violations
   - after-hours access
4. Timeline of suspicious events.
5. Explanation panel:
   `Why this employee was flagged`
6. Recommendation list:
   - monitor activity
   - require manager review
   - trigger security audit

If no employee is selected:

- show a fallback message
- add a link back to `/`

### Step 8: Add selectors for computed analytics

Instead of hardcoding everything in components, compute derived values with selectors.

Examples:

- filtered employees
- total high-risk employees
- average sentiment score
- final risk score per employee

Example scoring logic:

```ts
finalRiskScore =
  sentimentScore * 0.3 +
  anomalyScore * 0.35 +
  afterHoursAccessCount * 0.15 +
  policyViolationCount * 0.2;
```

You can normalize the final score to a `0-100` range.

### Step 9: Style the app as a cybersecurity dashboard

Recommended design direction:

- dark navy, slate, cyan, red, and amber accents
- bold headings
- card-based dashboard layout
- simple charts using CSS bars if you want to avoid chart libraries

Sections to style carefully:

- summary stat cards
- employee risk cards
- score meter
- alert timeline
- call-to-action buttons

### Step 10: Keep the app frontend-only

Do not add:

- API routes
- database logic
- Supabase integration
- authentication requirements

For this demo, all state should come from:

- Redux store
- local mock data
- derived client-side calculations

## Minimal Build Order

If you want the fastest implementation path, build in this order:

1. Install Redux packages.
2. Create mock data.
3. Create types.
4. Create store and slices.
5. Add `StoreProvider` in `layout.tsx`.
6. Build overview page.
7. Build analysis page.
8. Add selectors and score calculations.
9. Polish styling.

## Suggested Redux State Shape

```ts
{
  employees: {
    items: [],
    selectedEmployeeId: null,
    departmentFilter: "all",
    riskFilter: "all"
  },
  analysis: {
    resultsByEmployeeId: {},
    activeScoreModel: "default"
  },
  ui: {
    dateRange: "7d",
    sortBy: "riskScore"
  }
}
```

## Suggested Demo Features

To make the project look complete without backend work, include:

- mock threat alerts
- employee sentiment trend cards
- suspicious event feed
- department filter
- employee selection persistence in Redux while navigating between pages

## Acceptance Criteria

The implementation is complete when:

- the app has exactly two main pages
- routing works with the App Router
- Redux manages shared state across pages
- the analysis page reads the selected employee from Redux
- all data comes from local mock files
- no backend or database is required

## Optional Enhancements

If you want to improve the demo later, add:

- local storage persistence for Redux state
- downloadable PDF threat report
- client-side chart library
- search by employee name
- mock incident severity heatmap

## Final Recommendation

For this repo, implement the project as a Next.js App Router frontend with:

- `src/app/page.tsx` for the overview page
- `src/app/analysis/page.tsx` for the detailed dashboard
- Redux Toolkit for app-wide state
- mock behavioral and sentiment datasets for the threat model

This gives you a clean academic or portfolio demo without introducing backend complexity.
