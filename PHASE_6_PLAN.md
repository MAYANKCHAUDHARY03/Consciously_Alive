# Phase 6 Implementation Plan: OIR Analytics & Visualizations

## 1. Executive Summary
Phase 6 focuses on transforming raw Officer Intelligence Rating (OIR) practice data into actionable intelligence. By building a dedicated analytics view, users will be able to track their performance, identify weak topics, and monitor speed vs. accuracy tradeoffs over time.

## 2. Objectives
- **Data Aggregation:** Fetch and aggregate OIR records across multiple weeks.
- **Performance Visualizations:** Build interactive charts for Accuracy, Speed, and Topic-wise performance.
- **Insights Engine:** Calculate average time per question and highlight areas needing improvement.
- **Premium UI:** Integrate the analytics seamlessly into the existing intelligence dashboard aesthetic.

## 3. Technical Requirements & Stack
- **Frontend Framework:** Next.js (App Router)
- **Charting Library:** `recharts` (recommended for React/Next.js due to its composability and responsive design) or `chart.js`.
- **API Boundary:** New dedicated analytics endpoints to handle data aggregation server-side, ensuring the client does not query Notion directly.

## 4. Implementation Steps

### Step 1: Server-Side Analytics API
Create a new API route: `src/app/api/notion/analytics/oir/route.ts`.
- **Functionality:** 
  - Query the OIR data source for records (potentially paginated or limited to the last 12 weeks).
  - Aggregate the data server-side (e.g., group by week, calculate weekly average accuracy, total questions attempted, average time per question).
  - Return a sanitized JSON payload optimized for charting.

### Step 2: SWR Hooks & Data Management
Create `src/lib/hooks/useOirAnalytics.ts`.
- **Functionality:** 
  - Implement a `useSWR` hook to fetch the aggregated data from the new API.
  - Handle loading and error states.

### Step 3: Visualization Components
Develop a suite of chart components in `src/components/analytics/`:
1. **`AccuracyTrendChart.tsx`**: A Line Chart plotting weekly accuracy percentages over time.
2. **`SpeedVsAccuracyChart.tsx`**: A Scatter Plot or Composed Chart correlating average time taken per question with accuracy.
3. **`TopicRadarChart.tsx`**: A Radar Chart showing accuracy across different OIR topics (e.g., Spatial, Verbal, Math).

### Step 4: The Analytics Dashboard
Create a new view, either as a tab in the existing dashboard or a dedicated route `src/app/dashboard/oir/page.tsx`.
- **Layout:**
  - Header: Overall OIR statistics (Total Questions Practiced, Global Accuracy, Average Speed).
  - Main Grid: Placement of the visualization components.
  - Recent Log: A small table of the most recent OIR practice sets with color-coded accuracy badges (Green > 80%, Yellow 60-80%, Red < 60%).

### Step 5: Integration & Polish
- Update the main `page.tsx` dashboard to include a "Deep Dive" link to the OIR Analytics view.
- Ensure all charts adhere to the application's color palette (Dark mode, neon accents, military/intelligence aesthetic).
- Implement responsive design so charts scale correctly on mobile devices.

## 5. Verification & Testing Gate (Phase 6A)
- **API Correctness:** Ensure the analytics endpoint correctly calculates averages (handling edge cases like division by zero).
- **Data Integrity:** Verify that archived/deleted OIR records are excluded from the analytics.
- **UI Performance:** Ensure `recharts` does not cause hydration errors or layout shifts during client-side rendering.

---
*Note: Do not proceed with implementation until this plan is approved by the user.*
