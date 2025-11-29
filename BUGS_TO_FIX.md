# Critical Bugs to Fix - AddEventDrawer

## 🔴 CRITICAL BUG #1: Form Reset Logic Broken
**Priority:** CRITICAL - Fix immediately
**File:** `/Users/jake.duffy/git/chutney-smugglers/components/curry/add-event-drawer.tsx`
**Lines:** 56-69

### Problem
When switching from editing an event to creating a new event, the form retains the old event's data instead of resetting to empty fields.

### Reproduction Steps
1. Click edit (pencil icon) on an existing curry event
2. Drawer opens with pre-filled data (e.g., "Spice Palace", "123 Main St")
3. Click "Cancel" to close drawer
4. Click "Add" button to create a new event
5. **BUG:** Form still shows "Spice Palace" and "123 Main St" instead of empty fields

### Current Code (Buggy)
```tsx
React.useEffect(() => {
  if (!open) {
    setTimeout(() => {
      if (!existingEvent) {  // ❌ This condition is the problem
        setRestaurantName("")
        setAddress("")
        setDate(undefined)
        setTime("19:00")
        setNotes("")
      }
    }, 300)
  }
}, [open, existingEvent])
```

### Fix
Replace lines 56-80 with:

```tsx
// Reset form when drawer closes
React.useEffect(() => {
  if (!open) {
    setTimeout(() => {
      // Always reset to clean state when closing
      setRestaurantName("")
      setAddress("")
      setDate(undefined)
      setTime("19:00")
      setNotes("")
    }, 300) // Wait for sheet animation to complete
  }
}, [open])

// Populate form when opening with existing event
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

### Testing After Fix
1. Edit an event, close drawer
2. Click "Add" - form should be completely empty ✓
3. Open edit again - form should pre-fill ✓
4. Edit and save - should work correctly ✓

---

## ⚠️ HIGH PRIORITY BUG #2: Rounded Corners Not Visible
**Priority:** HIGH - Visual requirement
**File:** `/Users/jake.duffy/git/chutney-smugglers/components/curry/add-event-drawer.tsx`
**Line:** 156

### Problem
The `rounded-t-3xl` class may be overridden by the base SheetContent component styles, making the rounded corners invisible.

### Investigation Needed
**Manual test required:** Open the drawer and visually inspect if the top-left and top-right corners are rounded (should be ~1.5rem radius).

### If Corners Are NOT Visible, Apply This Fix
Replace line 156 with:

```tsx
<SheetContent
  side="bottom"
  className="h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0"
  style={{
    borderTopLeftRadius: '1.5rem',
    borderTopRightRadius: '1.5rem',
  }}
>
```

### Alternative Fix (if style prop doesn't work)
Modify `components/ui/sheet.tsx` line 68-69 to remove conflicting styles for bottom sheets, or create a custom variant.

---

## ⚠️ MEDIUM PRIORITY BUG #3: Past Time Selection Allowed on Today
**Priority:** MEDIUM - UX issue
**File:** `/Users/jake.duffy/git/chutney-smugglers/components/curry/add-event-drawer.tsx`
**Line:** 224

### Problem
The calendar correctly disables past dates, but if a user selects today's date and a time that has already passed, the frontend allows it but the backend rejects it with an unclear error.

**Example:**
- Current time: 8:00 PM (20:00)
- User selects today + 7:00 PM (19:00)
- Frontend allows this
- Backend returns error: "Cannot create an event in the past"
- User is confused

### Fix Option 1: Disable Today Entirely
Change line 224 to also disable today:

```tsx
disabled={(date) => date <= new Date(new Date().setHours(0, 0, 0, 0))}
```

### Fix Option 2: Smart Time Validation (Recommended)
Add validation in the `handleSubmit` function after line 103:

```tsx
if (!time) {
  toast.error("Please enter a time")
  return
}

// NEW CODE: Check if selecting today with past time
const selectedDateTime = new Date(date)
const [hours, minutes] = time.split(":").map(Number)
selectedDateTime.setHours(hours, minutes, 0, 0)

if (selectedDateTime.getTime() <= Date.now()) {
  toast.error("Please select a future date and time")
  return
}

setLoading(true)
```

---

## 📋 Other Issues to Consider

### Low Priority: Multiple Drawer Instances
**File:** `/Users/jake.duffy/git/chutney-smugglers/components/curry/upcoming-curry-card.tsx`
**Lines:** 161-164, 256-263

Currently renders two separate AddEventDrawer instances (one for add, one for edit). While unlikely to cause issues, this is not ideal.

**Recommendation:** Use a single drawer instance with mode state instead of two instances.

---

## Testing Checklist After Fixes

- [ ] Fix applied for Bug #1 (form reset)
- [ ] Tested: Edit event → close → Add new event → form is empty
- [ ] Tested: Open edit → form pre-fills correctly
- [ ] Fix applied for Bug #2 (rounded corners) if needed
- [ ] Visually confirmed: Rounded corners visible at top of drawer
- [ ] Fix applied for Bug #3 (time validation)
- [ ] Tested: Cannot select past time on today's date
- [ ] Error message is clear and helpful
- [ ] All existing functionality still works
- [ ] No new bugs introduced

---

## Files Modified Summary

After applying all fixes, you will have modified:

1. `/Users/jake.duffy/git/chutney-smugglers/components/curry/add-event-drawer.tsx`
   - Lines 56-80 (form reset logic)
   - Line 156 (rounded corners - if needed)
   - Lines 100-105 (time validation)

Total changes: ~30 lines in 1 file

---

## Need Help?

See the full test report at:
`/Users/jake.duffy/git/chutney-smugglers/TEST_REPORT_AddEventDrawer.md`

Sections 10-15 contain detailed manual testing procedures.
