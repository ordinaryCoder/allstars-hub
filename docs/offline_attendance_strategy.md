 # Offline Attendance Submission Strategy & Architecture

This document outlines the simplified, step-by-step strategy for handling **offline attendance submission** for coaches in the sports academy application.

---

## 1. Executive Strategy Overview

When coaches conduct training on fields with poor or zero network connectivity, they need to view session rosters, mark player attendance, and have confidence that their work is saved and synced seamlessly when internet access is restored.

### Core Objectives
1. **Instant UI Feedback**: Coach marks attendance offline without app lag or error popups.
2. **Zero Data Loss**: Offline records are persisted locally in IndexedDB using `Dexie.js`.
3. **Automatic Reconnection Sync**: The system auto-syncs pending records in a single batch when online.
4. **Idempotency & Duplicate Prevention**: Server uses DB `UPSERT` operations to ensure retries do not create duplicate records.

---

## 2. Tech Stack Recommendations

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React / Next.js | Modern UI rendering and component state |
| **Local Offline Storage** | IndexedDB via `Dexie.js` | Fast, structured, asynchronous browser storage |
| **Network Detection** | `navigator.onLine` & Event Listeners | Detects internet state changes (`online` / `offline`) |
| **Backend API** | Node.js / Next.js API Routes | Batch sync processing endpoint (`/api/attendance/sync`) |
| **Database** | PostgreSQL (via Prisma / Supabase) | Main database with `UPSERT` constraint on `(session_id, player_id)` |

---

## 3. The 4 Key Components

### a] UI Management (Offline Mode)
* **Status Bar**: Small non-intrusive top banner when offline:  
  `"You are offline. Attendance is saved locally and will sync when internet returns."`
* **Optimistic UI Indicators**:
  * Clicking **Present / Absent / Late** instantly updates the UI state.
  * Displays a **Yellow Cloud Icon** 🟡 next to offline-marked attendance.
  * Switches to a **Green Checkmark** 🟢 once synced to the cloud.

### b] Offline Data Management (`Dexie.js` Schema)
The local database stores two datasets:
1. **Read-only Cached Roster**: Sessions and player lists pre-fetched while online.
2. **Write Queue (`attendance_queue`)**: Local pending changes.

```javascript
// Dexie.js Schema Example
import Dexie from 'dexie';

const db = new Dexie('AllstarsOfflineDB');
db.version(1).stores({
  cached_rosters: 'sessionId, academyId, locationId',
  attendance_queue: 'id, sessionId, playerId, status, synced, markedAt'
});
```

### c] Authentication & Authorization Management
* **While Online**: App caches Coach Profile, Role permissions, Access Token, and Refresh Token in local storage.
* **While Offline**: The app allows coaches to view their pre-fetched sessions and record attendance based on cached permissions without forcing logouts.
* **During Reconnection**: If the Access Token expired while offline, the background sync manager silently exchanges the **Refresh Token** for a new Access Token *before* pushing the queued records to the server.

### d] Network Sync Strategy
1. **Detection**: `window.addEventListener('online', triggerSync)` executes automatically.
2. **Fetch Pending Queue**: Reads all items from `attendance_queue` where `synced === false`.
3. **Batch POST API Call**: Sends array of pending actions to `/api/attendance/sync`.
4. **Database UPSERT**: Backend processes the queue using SQL `ON CONFLICT (session_id, player_id) DO UPDATE`.
5. **UI Update**: On HTTP 200 OK response, local queue items are marked `synced = true` (or purged), and UI icons update to Green Checkmarks.

---

## 4. End-to-End Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Coach
    participant UI as Coach App UI (React)
    participant Dexie as Local DB (Dexie.js)
    participant SyncEngine as Background Sync Engine
    participant API as Backend API (/api/sync)
    participant DB as PostgreSQL Database

    Note over Coach, DB: Phase 1: Online Setup & Pre-Fetch
    Coach->>UI: Open App (Online)
    UI->>API: Fetch Today's Sessions & Roster
    API->>DB: Query Coach Sessions & Players
    DB-->>API: Return Roster & Auth Context
    API-->>UI: Return Sessions & Players Data
    UI->>Dexie: Save Sessions & Player Roster Locally
    UI->>Dexie: Cache Auth & Refresh Tokens

    Note over Coach, DB: Phase 2: Offline Attendance Submission
    Note over Coach, UI: Internet Disconnects (Offline Mode)
    UI->>UI: Show Top Banner: "Offline - Saving Locally"
    Coach->>UI: Click "Present" for Player A
    UI->>Dexie: Save record to attendance_queue (synced: false)
    UI-->>Coach: Update UI instantly with Yellow Cloud Icon 🟡

    Note over Coach, DB: Phase 3: Internet Connection Restored & Batch Sync
    Note over Coach, UI: Internet Reconnected (Online Event Fired)
    SyncEngine->>SyncEngine: Detect window.onLine event
    SyncEngine->>Dexie: Fetch items where synced == false
    Dexie-->>SyncEngine: Return Pending Attendance Array

    opt Token Expired While Offline
        SyncEngine->>API: Request new Access Token using Refresh Token
        API-->>SyncEngine: Return fresh Access Token
    end

    SyncEngine->>API: POST /api/attendance/sync (Batch Payload)
    API->>DB: Execute UPSERT on (session_id, player_id)
    DB-->>API: Confirm Rows Saved / Updated
    API-->>SyncEngine: Return 200 OK (Processed Item IDs)
    SyncEngine->>Dexie: Delete synced items or set synced = true
    SyncEngine->>UI: Notify UI Sync Complete
    UI-->>Coach: Change Status Icons to Green Checkmark 🟢
```

---

## 5. Offline Sync Process Flowchart

```mermaid
flowchart TD
    A["Start: Attendance Action Clicked"] --> B{"Is Device Online?"}
    
    B -- Yes --> C["Send API POST directly to Server"]
    B -- No --> D["Save to Dexie.js (attendance_queue)"]
    
    D --> E["Update UI with Yellow Cloud Icon 🟡"]
    
    F["Event: Network Back Online"] --> G["Fetch Pending Records from Dexie.js"]
    G --> H{"Any Pending Items?"}
    
    H -- No --> I["Idle"]
    H -- Yes --> J{"Is Access Token Valid?"}
    
    J -- Expired --> K["Silently Refresh Token via API"]
    J -- Valid --> L["Send Batch Payload to /api/attendance/sync"]
    K --> L
    
    L --> M["Backend Executes PostgreSQL UPSERT"]
    M --> N["Server returns 200 OK"]
    N --> O["Mark Local Queue as Synced / Clear Queue"]
    O --> P["Update UI Badges to Green Checkmark 🟢"]
```

---

## 6. Summary Checklist for Developers

- [ ] Install `dexie` package for IndexedDB local storage.
- [ ] Create `attendance_queue` store with `synced` flag and timestamp.
- [ ] Add `useNetworkStatus` hook to track online/offline status in UI.
- [ ] Implement batch sync endpoint `/api/attendance/sync` supporting array of records.
- [ ] Ensure DB query uses PostgreSQL `ON CONFLICT (session_id, player_id) DO UPDATE`.
- [ ] Test offline behavior by turning on Chrome DevTools "Offline" throttling mode.
