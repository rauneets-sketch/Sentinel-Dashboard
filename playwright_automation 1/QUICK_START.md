# Quick Start - Supabase Logging

## ✅ Setup Complete!

Your Supabase credentials are configured and ready to use.

---

## 🚀 Run Tests with Supabase Logging

```bash
# Install dependencies (first time only)
npm install

# Run tests (logs automatically sent to Supabase)
npm test
```

---

## 📊 View Logs

After tests complete, view your logs at:
**https://wnymknrycmldwqzdqoct.supabase.co**

1. Go to **Table Editor**
2. Check these tables:
   - `raw_test_logs` - Complete JSON payloads
   - `test_runs` - Execution summaries
   - `journeys` - Journey details
   - `steps` - Step-level data

---

## 🔧 Configuration

All configuration is in `.env` file:

```bash
SUPABASE_URL=https://wnymknrycmldwqzdqoct.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ENV=dev
```

---

## ✅ What Happens Automatically

When you run `npm test`:

1. ✅ Tests execute normally
2. ✅ StepTracker captures step data
3. ✅ ApiResponseTracker captures API calls
4. ✅ ExecutionDataCollector aggregates data
5. ✅ SupabaseLogger sends to Supabase
6. ✅ Data appears in Supabase tables

**No manual steps required!**

---

## 🎯 Next Steps

1. **Run your first test**: `npm test`
2. **Check Supabase**: View logs in dashboard
3. **Build React dashboard**: See `supabase/react-queries.md`

---

## 🐛 Troubleshooting

### Logs not appearing?

Check console output for:
```
📊 Supabase Logging: ✅ ENABLED
✅ SupabaseLogger: Initialized successfully
✅ Execution logged to Supabase with log ID: xxx
```

### Connection issues?

Verify `.env` file exists and contains correct credentials.

---

**Ready to go!** Just run `npm test` 🚀
