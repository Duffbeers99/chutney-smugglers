# Critical Bug #1 - Visual Explanation

## The Problem: Form Doesn't Reset When Switching Modes

### Current Buggy Behavior

```
┌─────────────────────────────────────────────────────────────┐
│ SCENARIO: User edits event, then tries to create new one   │
└─────────────────────────────────────────────────────────────┘

Step 1: Edit Existing Event
┌──────────────────────────────────────────┐
│  Edit Curry Event                        │
│                                          │
│  Restaurant: [Spice Palace        ]  ✓  │
│  Address:    [123 Main St         ]  ✓  │
│  Date:       [Dec 5, 2025         ]  ✓  │
│  Time:       [19:00               ]  ✓  │
│  Notes:      [Bring cash          ]  ✓  │
│                                          │
│  [Cancel]  [Update Event]                │
└──────────────────────────────────────────┘
                    ↓
              User clicks Cancel
                    ↓

Step 2: Create New Event (BUG!)
┌──────────────────────────────────────────┐
│  Add Next Curry Event                    │
│                                          │
│  Restaurant: [Spice Palace        ]  ❌  │  <- Should be empty!
│  Address:    [123 Main St         ]  ❌  │  <- Should be empty!
│  Date:       [Dec 5, 2025         ]  ❌  │  <- Should be empty!
│  Time:       [19:00               ]  ❌  │  <- Should be 19:00 (default)
│  Notes:      [Bring cash          ]  ❌  │  <- Should be empty!
│                                          │
│  [Cancel]  [Create Event]                │
└──────────────────────────────────────────┘
            ↑
    🐛 BUG: Old data still here!
```

---

## Why This Happens

### Current Code Logic (Buggy)

```tsx
// components/curry/add-event-drawer.tsx (lines 56-69)

React.useEffect(() => {
  if (!open) {
    setTimeout(() => {
      if (!existingEvent) {  // 🐛 THIS IS THE BUG!
        // Only reset if NO existingEvent prop
        setRestaurantName("")
        setAddress("")
        // ... etc
      }
    }, 300)
  }
}, [open, existingEvent])
```

### The Problem Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Initial State: No event                                     │
│ existingEvent = undefined                                   │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Edit" on existing event                        │
│ existingEvent = { name: "Spice Palace", ... }              │
│ open = true                                                 │
│ → useEffect on lines 72-80 populates form ✓                │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Cancel"                                        │
│ open = false                                                │
│ → Reset effect on lines 56-69 triggers                     │
│ → Checks: if (!existingEvent) { ... }                      │
│ → existingEvent STILL EXISTS (still the event object)      │
│ → Condition is FALSE                                        │
│ → Form DOESN'T reset! 🐛                                   │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Parent component re-renders UpcomingCurryCard              │
│ Now passes existingEvent = undefined to AddEventDrawer     │
│ But form state is still populated with old data            │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Add" to create new event                       │
│ open = true                                                 │
│ existingEvent = undefined                                   │
│ → useEffect on lines 72-80 checks if (existingEvent)       │
│ → Condition is FALSE (existingEvent is undefined)          │
│ → Form doesn't update                                       │
│ → OLD DATA STILL VISIBLE! 🐛                               │
└─────────────────────────────────────────────────────────────┘
```

---

## The Fix

### Correct Code Logic

```tsx
// REPLACE lines 56-80 with this:

// Always reset when closing
React.useEffect(() => {
  if (!open) {
    setTimeout(() => {
      // Reset to clean state every time drawer closes
      setRestaurantName("")
      setAddress("")
      setDate(undefined)
      setTime("19:00")
      setNotes("")
    }, 300)
  }
}, [open])  // Only depend on 'open', not 'existingEvent'

// Populate when opening WITH existing event
React.useEffect(() => {
  if (open && existingEvent) {
    setRestaurantName(existingEvent.restaurantName)
    setAddress(existingEvent.address)
    setDate(new Date(existingEvent.scheduledDate))
    setTime(existingEvent.scheduledTime)
    setNotes(existingEvent.notes ?? "")
  }
}, [open, existingEvent])
```

### Fixed Behavior Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Edit" on existing event                        │
│ existingEvent = { name: "Spice Palace", ... }              │
│ open = true                                                 │
│ → Second useEffect triggers: if (open && existingEvent)    │
│ → Populates form ✓                                         │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Cancel"                                        │
│ open = false                                                │
│ → First useEffect triggers: if (!open)                     │
│ → ALWAYS resets form to clean state ✓                      │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Add" to create new event                       │
│ open = true                                                 │
│ existingEvent = undefined                                   │
│ → Second useEffect: if (open && existingEvent)             │
│ → Condition is FALSE                                        │
│ → Doesn't populate (form already clean) ✓                  │
│ → User sees EMPTY FORM ✓                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Side-by-Side Comparison

### BEFORE (Buggy)
```tsx
❌ Single effect with conditional reset
React.useEffect(() => {
  if (!open) {
    setTimeout(() => {
      if (!existingEvent) {  // 🐛 Problem here
        // Reset
      }
    }, 300)
  }
}, [open, existingEvent])

React.useEffect(() => {
  if (existingEvent) {  // Populates regardless of open state
    // Populate
  }
}, [existingEvent])
```

### AFTER (Fixed)
```tsx
✓ Two separate effects with clear responsibilities

// Effect 1: ALWAYS reset when closing
React.useEffect(() => {
  if (!open) {
    setTimeout(() => {
      // Always reset (no condition)
    }, 300)
  }
}, [open])  // Only depends on open

// Effect 2: Populate ONLY when opening with data
React.useEffect(() => {
  if (open && existingEvent) {  // Both conditions required
    // Populate
  }
}, [open, existingEvent])
```

---

## Testing the Fix

### Test Case 1: Edit → Cancel → Add New
```
1. Edit existing event           → Form shows: "Spice Palace"
2. Cancel                         → Form resets to empty
3. Add new event                  → Form shows: (empty) ✓
```

### Test Case 2: Add New → Cancel → Add New
```
1. Add new event, fill "Test"     → Form shows: "Test"
2. Cancel                         → Form resets to empty
3. Add new event                  → Form shows: (empty) ✓
```

### Test Case 3: Edit → Cancel → Edit Same Event
```
1. Edit existing event            → Form shows: "Spice Palace"
2. Cancel                         → Form resets to empty
3. Edit same event                → Form shows: "Spice Palace" ✓
```

### Test Case 4: Edit → Save → Edit Again
```
1. Edit event, change to "New"    → Form shows: "New"
2. Save                           → Form resets to empty
3. Edit same event                → Form shows: "New" (updated) ✓
```

---

## Why Two useEffects Is Better

### Separation of Concerns

```
Effect 1 (Reset):
  Responsibility: Clean up when closing
  Trigger: open changes to false
  Action: Always reset to default state

Effect 2 (Populate):
  Responsibility: Pre-fill when editing
  Trigger: open changes to true AND existingEvent exists
  Action: Populate with existing data
```

### Prevents Race Conditions

```
❌ BEFORE: Both actions in one effect
   → Dependencies: [open, existingEvent]
   → Problem: Effect runs when EITHER changes
   → Can cause unexpected behavior

✓ AFTER: Separate effects
   → Reset depends only on [open]
   → Populate depends on [open, existingEvent]
   → Clear, predictable behavior
```

---

## Visual State Diagram

```
                    ┌─────────────┐
                    │ Drawer Open │
                    │ Empty Form  │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │                             │
      ┌─────▼─────┐                 ┌─────▼─────┐
      │ Add Mode  │                 │ Edit Mode │
      │ (no data) │                 │ (w/ data) │
      └─────┬─────┘                 └─────┬─────┘
            │                             │
      ┌─────▼─────┐                 ┌─────▼─────┐
      │  Submit   │                 │  Submit   │
      │  Success  │                 │  Success  │
      └─────┬─────┘                 └─────┬─────┘
            │                             │
            └──────────────┬──────────────┘
                           │
                    ┌──────▼──────┐
                    │ Drawer Close│
                    │ RESET FORM  │ ← Always happens
                    └─────────────┘
                           │
                    ┌──────▼──────┐
                    │ Can re-open │
                    │ Clean state │
                    └─────────────┘
```

---

## Code Location

**File:** `/Users/jake.duffy/git/chutney-smugglers/components/curry/add-event-drawer.tsx`

**Lines to Replace:** 56-80

**Current Lines:**
```tsx
56:  // Reset form when drawer closes
57:  React.useEffect(() => {
58:    if (!open) {
59:      setTimeout(() => {
60:        if (!existingEvent) {
61:          setRestaurantName("")
62:          setAddress("")
63:          setDate(undefined)
64:          setTime("19:00")
65:          setNotes("")
66:        }
67:      }, 300) // Wait for sheet animation to complete
68:    }
69:  }, [open, existingEvent])
70:
71:  // Update form when existingEvent changes
72:  React.useEffect(() => {
73:    if (existingEvent) {
74:      setRestaurantName(existingEvent.restaurantName)
75:      setAddress(existingEvent.address)
76:      setDate(new Date(existingEvent.scheduledDate))
77:      setTime(existingEvent.scheduledTime)
78:      setNotes(existingEvent.notes ?? "")
79:    }
80:  }, [existingEvent])
```

**Replace with:** (see BUGS_TO_FIX.md for complete fix)

---

## Impact Assessment

### User Impact
- **High** - Cannot create new events without manual field clearing
- Affects every user who edits an event and then wants to add a new one
- Causes confusion and frustration

### Developer Impact
- **Low** - Simple fix, 25 lines of code
- Clear solution with no side effects
- Better code organization (separation of concerns)

### Testing Impact
- **Medium** - Need to test all edit/create combinations
- 4 test cases to verify (see above)
- Should take 5-10 minutes to verify

---

**Priority:** 🔴 CRITICAL - Fix before any manual testing
**Difficulty:** 🟢 Easy - Copy/paste fix available
**Time to Fix:** ⏱️ 10 minutes
**Time to Test:** ⏱️ 10 minutes

---

See `BUGS_TO_FIX.md` for the exact code to copy/paste.
