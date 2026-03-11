# 🗄️ Database Layer — Smart Campus

**Provider:** Supabase (PostgreSQL)  
**URL:** `https://mssbxztahabkqjaiimch.supabase.co`

---

## Supabase Tables

| Table                 | Description                                         |
|-----------------------|-----------------------------------------------------|
| `students`            | Student accounts (name, email, dept, rollNumber)    |
| `clubs`               | Club accounts (name, coordinator, email)            |
| `events`              | Campus events (title, domain, date, status, fee)    |
| `event_registrations` | Student ↔ Event registrations                      |
| `od_requests`         | On-Duty requests (student, event, status)           |
| `hods`                | HOD accounts per department                         |
| `admins`              | Admin accounts                                      |
| `payments`            | Razorpay payment records                            |

---

## Seed Scripts (run once to populate initial data)

```bash
# Create admin account
node database/seedAdmin.js

# Create HOD accounts for all departments
node database/seedHODs.js

# Test Supabase connection
node database/test-supabase.js
```

> **Note:** These scripts require `MONGODB_URI` or Supabase credentials set in `server/.env`

---

## Connection

The Supabase client is configured in:  
`server/utils/supabase.js` — uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `server/.env`
