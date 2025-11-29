# AddEventDrawer - Manual Testing Checklist

**URL:** http://localhost:3000/dashboard
**Component:** Add Curry Event Drawer
**Tester:** _______________
**Date:** _______________

---

## Pre-Testing Setup

- [ ] Convex dev server running (`npx convex dev`)
- [ ] Next.js dev server running (`npm run dev`)
- [ ] Browser: _______________
- [ ] Viewport: Desktop / Mobile (circle one)

---

## Section 1: Visual & Layout (5 min)

### Open the Drawer
- [ ] Navigate to http://localhost:3000/dashboard
- [ ] Click "Add" button on UpcomingCurryCard
- [ ] Drawer slides up smoothly from bottom

### Visual Inspection
- [ ] **CRITICAL:** Drawer takes approximately 90% of screen height
- [ ] **CRITICAL:** Top-left corner is rounded (visible curve)
- [ ] **CRITICAL:** Top-right corner is rounded (visible curve)
- [ ] Header section has a border line at bottom
- [ ] Footer section has a border line at top
- [ ] Spacing looks balanced (not cramped)

### Scroll Test
- [ ] Scroll down in content area
- [ ] Header stays fixed at top
- [ ] Footer stays fixed at bottom
- [ ] Only middle section scrolls

**Issues Found:**
```
_______________________________________________________________________
_______________________________________________________________________
```

---

## Section 2: Form Fields (10 min)

### Restaurant Name Field
- [ ] MapPin icon visible on left
- [ ] Placeholder: "e.g., Spice Garden"
- [ ] Can type text normally
- [ ] Text doesn't overlap icon
- [ ] Try typing 200 characters - Result: _______________

### Address Field
- [ ] Placeholder: "e.g., 123 Curry Lane, London"
- [ ] Can type text normally
- [ ] Try typing 300 characters - Result: _______________

### Date Field
- [ ] Shows "Pick a date" when empty
- [ ] Click opens calendar popup
- [ ] Past dates are greyed out/disabled
- [ ] Click a past date - can't select it: ✓ / ✗
- [ ] Can select today's date: ✓ / ✗
- [ ] Can select future date: ✓ / ✗
- [ ] Selected date displays formatted (e.g., "December 1, 2025")

### Time Field
- [ ] Shows default "19:00"
- [ ] Click opens time picker
- [ ] Mobile: Native time picker appears: ✓ / ✗ / N/A
- [ ] Desktop: Can type or use arrows: ✓ / ✗ / N/A
- [ ] Clock icon visible on left

### Notes Field (Optional)
- [ ] Placeholder: "Any special details..."
- [ ] Shows "0/500 characters" initially
- [ ] Type some text - counter updates
- [ ] Type exactly 500 characters - Counter shows "500/500"
- [ ] Try typing 501st character - blocked: ✓ / ✗
- [ ] Can press Enter to create new lines

**Issues Found:**
```
_______________________________________________________________________
_______________________________________________________________________
```

---

## Section 3: Validation (5 min)

### Empty Field Validation
Start with completely empty form:

- [ ] Click "Create Event" with all fields empty
- [ ] Toast shows: "Please enter a restaurant name"
- [ ] Fill restaurant name only, click submit
- [ ] Toast shows: "Please enter an address"
- [ ] Fill address only, click submit
- [ ] Toast shows: "Please select a date"
- [ ] Select date only, click submit
- [ ] Toast shows: "Please enter a time"

### Whitespace Validation
- [ ] Enter only spaces "   " in restaurant name
- [ ] Click submit
- [ ] Treated as empty: ✓ / ✗

**Issues Found:**
```
_______________________________________________________________________
_______________________________________________________________________
```

---

## Section 4: Create New Event (10 min)

### Fill the Form
- [ ] Restaurant Name: "Test Curry House"
- [ ] Address: "123 Test Street, London"
- [ ] Date: Select tomorrow's date
- [ ] Time: 19:00 (or any future time)
- [ ] Notes: "This is a test event for manual testing"

### Submit
- [ ] Click "Create Event" button
- [ ] Button shows spinner icon
- [ ] Button text changes to "Creating..."
- [ ] All inputs become disabled (greyed out)
- [ ] Cancel button becomes disabled

### Success
- [ ] Green success toast appears: "Curry event created!"
- [ ] Drawer closes smoothly
- [ ] UpcomingCurryCard now shows your test event
- [ ] Restaurant name correct: "Test Curry House"
- [ ] Address correct: "123 Test Street, London"
- [ ] Date correct: (tomorrow's date)
- [ ] Time correct: 19:00
- [ ] Notes visible (if clicked/expanded)
- [ ] Countdown timer shows and counts down

**Issues Found:**
```
_______________________________________________________________________
_______________________________________________________________________
```

---

## Section 5: Edit Existing Event (10 min)

### Open Edit Mode
- [ ] Click pencil/edit icon on the event card
- [ ] Drawer opens
- [ ] Title shows: "Edit Curry Event"
- [ ] Restaurant name pre-filled: "Test Curry House"
- [ ] Address pre-filled: "123 Test Street, London"
- [ ] Date pre-selected (tomorrow)
- [ ] Time pre-filled: 19:00
- [ ] Notes pre-filled: "This is a test event..."

### Modify Data
- [ ] Change restaurant name to: "Updated Curry House"
- [ ] Change time to: 20:00
- [ ] Change notes to: "Updated test event"

### Save Changes
- [ ] Click "Update Event"
- [ ] Button shows "Updating..." with spinner
- [ ] Success toast: "Curry event updated!"
- [ ] Drawer closes
- [ ] Card shows: "Updated Curry House"
- [ ] Card shows: 20:00
- [ ] Notes updated

**Issues Found:**
```
_______________________________________________________________________
_______________________________________________________________________
```

---

## Section 6: Form Reset Test (CRITICAL BUG CHECK) (5 min)

### Test Scenario
- [ ] Click edit on existing event (drawer opens with data)
- [ ] Note the pre-filled values: _______________
- [ ] Click "Cancel" button
- [ ] Drawer closes
- [ ] **CRITICAL:** Click "Add" button (to create NEW event)

### Expected vs Actual
**Expected:** Form should be completely empty
**Actual:**
- Restaurant name field: Empty / Has old data
- Address field: Empty / Has old data
- Date: Not selected / Has old date
- Time: 19:00 (default) / Has old time
- Notes: Empty / Has old notes

**Result:** PASS / **FAIL (Bug confirmed)**

**Issues Found:**
```
_______________________________________________________________________
_______________________________________________________________________
```

---

## Section 7: Cancel & Close Behavior (5 min)

### Cancel Button
- [ ] Open drawer (Add new event)
- [ ] Fill some fields (don't submit)
- [ ] Click "Cancel"
- [ ] Drawer closes
- [ ] No event created (card unchanged)

### Click Outside / Close Icon
- [ ] Open drawer
- [ ] Click outside drawer (on darkened background)
- [ ] Drawer closes: ✓ / ✗
- [ ] Open drawer again
- [ ] Click X icon in top-right
- [ ] Drawer closes: ✓ / ✗

### During Loading
- [ ] Fill valid form
- [ ] Click submit (starts loading)
- [ ] Try clicking Cancel while loading
- [ ] What happens? _______________

**Issues Found:**
```
_______________________________________________________________________
_______________________________________________________________________
```

---

## Section 8: Mobile Testing (15 min)

**Switch to mobile viewport** (iPhone 14 Pro: 393 x 852 or similar)

### Visual Layout
- [ ] Drawer takes ~90% of mobile screen
- [ ] Rounded corners visible on mobile
- [ ] All text readable (not too small)
- [ ] No horizontal scrolling

### Touch Interactions
- [ ] Tap restaurant name field - keyboard appears
- [ ] Keyboard doesn't completely hide submit button
- [ ] Tap date field - calendar popup appears
- [ ] Calendar fits on screen (not cut off)
- [ ] Can select date on mobile
- [ ] Tap time field - **native mobile time picker appears**
- [ ] Can select time easily with touch

### Gestures
- [ ] Swipe down on drawer - drawer dismisses: ✓ / ✗
- [ ] Can scroll content area with touch
- [ ] All buttons are easy to tap (not too small)

### Submit on Mobile
- [ ] Fill form on mobile
- [ ] Tap "Create Event"
- [ ] Works correctly: ✓ / ✗

**Issues Found:**
```
_______________________________________________________________________
_______________________________________________________________________
```

---

## Section 9: Edge Cases (10 min)

### Very Long Text
- [ ] Restaurant name: Enter 200+ characters
- [ ] Drawer handles it: ✓ / ✗
- [ ] Submit and check card display: Truncated / Broken / OK
- [ ] Address: Enter 300+ characters
- [ ] Drawer handles it: ✓ / ✗

### Past Time on Today's Date (BUG CHECK)
- [ ] Select today's date
- [ ] Select a time that has ALREADY passed
  - Example: If it's 5pm now, select 3pm
- [ ] Click submit
- [ ] **What happens?**
  - [ ] Prevented by frontend (good)
  - [ ] Allowed, then backend error (bug)
  - [ ] Error message: _______________

### Rapid Clicking
- [ ] Fill valid form
- [ ] Click "Create Event" 5 times rapidly
- [ ] How many events created? _____ (should be 1)
- [ ] Button disabled after first click: ✓ / ✗

**Issues Found:**
```
_______________________________________________________________________
_______________________________________________________________________
```

---

## Section 10: Accessibility (10 min)

### Keyboard Navigation
- [ ] Open drawer
- [ ] Press Tab key repeatedly
- [ ] Focus order: Restaurant → Address → Date → Time → Notes → Cancel → Submit
- [ ] Focus indicators visible on all fields
- [ ] Can navigate without mouse: ✓ / ✗

### Enter Key Submission
- [ ] Fill form
- [ ] Focus on restaurant name field
- [ ] Press Enter
- [ ] Form submits: ✓ / ✗
- [ ] Focus on notes field
- [ ] Press Enter
- [ ] Creates new line (doesn't submit): ✓ / ✗

### Screen Reader (if available)
- [ ] Enable screen reader
- [ ] All labels announced
- [ ] Required fields indicated
- [ ] Works well: ✓ / ✗ / N/A

**Issues Found:**
```
_______________________________________________________________________
_______________________________________________________________________
```

---

## Section 11: Cross-Browser Testing

Test in multiple browsers and record results:

### Chrome
- [ ] All features work
- [ ] Time picker appearance: _______________
- [ ] Issues: _______________

### Safari
- [ ] All features work
- [ ] Time picker appearance: _______________
- [ ] Issues: _______________

### Firefox
- [ ] All features work
- [ ] Time picker appearance: _______________
- [ ] Issues: _______________

### Mobile Safari (iOS)
- [ ] All features work
- [ ] Native time picker: ✓ / ✗ / N/A
- [ ] Issues: _______________

### Mobile Chrome (Android)
- [ ] All features work
- [ ] Native time picker: ✓ / ✗ / N/A
- [ ] Issues: _______________

---

## Summary

### Total Test Time: _______ minutes

### Critical Issues Found: _______
```
1. _____________________________________________________________________
2. _____________________________________________________________________
3. _____________________________________________________________________
```

### High Priority Issues: _______
```
1. _____________________________________________________________________
2. _____________________________________________________________________
```

### Medium/Low Priority Issues: _______
```
1. _____________________________________________________________________
2. _____________________________________________________________________
```

### Overall Assessment
- [ ] Ready for production
- [ ] Needs bug fixes (see above)
- [ ] Needs major rework

### Tester Notes
```
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
```

---

## Next Steps

1. Review all issues found
2. Prioritize fixes
3. Apply fixes from BUGS_TO_FIX.md
4. Re-test after fixes
5. Sign off for production

**Sign-off:** _______________
**Date:** _______________

---

**For detailed test procedures and bug fixes, see:**
- Full Report: `TEST_REPORT_AddEventDrawer.md`
- Bug Fixes: `BUGS_TO_FIX.md`
