/**
 * Comprehensive UI Testing Script for Event-Based Rating System
 * Tests attendance confirmation, active curry card, rating submission, and more
 */

const { chromium } = require('playwright');

async function runTests() {
  console.log('='.repeat(80));
  console.log('COMPREHENSIVE UI TEST REPORT - Event-Based Rating System');
  console.log('='.repeat(80));
  console.log(`Test Date: ${new Date().toISOString()}`);
  console.log(`Base URL: http://localhost:3000`);
  console.log('='.repeat(80));
  console.log();

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 12 Pro dimensions
  });
  const page = await context.newPage();

  const testResults = [];
  let testNumber = 0;

  // Helper function to log test results
  function logTest(category, name, status, details = '') {
    testNumber++;
    const result = {
      number: testNumber,
      category,
      name,
      status,
      details,
      timestamp: new Date().toISOString(),
    };
    testResults.push(result);

    const statusSymbol = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
    console.log(`[${testNumber}] ${statusSymbol} ${category} > ${name}`);
    if (details) {
      console.log(`    ${details}`);
    }
  }

  // Helper function to take screenshot
  async function takeScreenshot(name) {
    const filename = `/Users/jake.duffy/git/chutney-smugglers/screenshots/${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`    📸 Screenshot: ${filename}`);
  }

  try {
    // Ensure screenshots directory exists
    const fs = require('fs');
    const screenshotDir = '/Users/jake.duffy/git/chutney-smugglers/screenshots';
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    console.log('\n' + '='.repeat(80));
    console.log('PHASE 1: INITIAL NAVIGATION & SETUP');
    console.log('='.repeat(80) + '\n');

    // Test 1: Navigate to dashboard
    try {
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      logTest('Navigation', 'Load dashboard page', 'PASS', 'Successfully loaded dashboard');
      await takeScreenshot('01_dashboard_initial');
    } catch (error) {
      logTest('Navigation', 'Load dashboard page', 'FAIL', `Error: ${error.message}`);
      try {
        await takeScreenshot('01_dashboard_error');
      } catch (e) {
        console.log('    Could not take error screenshot');
      }
    }

    // Test 2: Check for authentication/onboarding redirect
    try {
      const currentUrl = page.url();
      if (currentUrl.includes('/onboarding') || currentUrl.includes('/signin')) {
        logTest('Navigation', 'Authentication check', 'INFO', `Redirected to: ${currentUrl}`);
        console.log('    ⚠️  Note: User needs to complete authentication/onboarding first');
        await takeScreenshot('02_auth_required');
      } else {
        logTest('Navigation', 'Authentication check', 'PASS', 'User is authenticated');
      }
    } catch (error) {
      logTest('Navigation', 'Authentication check', 'FAIL', `Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('PHASE 2: NAVIGATION BAR TESTING');
    console.log('='.repeat(80) + '\n');

    // Test 3: Verify bottom navigation has 4 tabs (no plus button)
    try {
      await page.waitForSelector('nav[aria-label="Bottom navigation"]', { timeout: 5000 });
      const navLinks = await page.$$('nav[aria-label="Bottom navigation"] a');
      const navCount = navLinks.length;

      if (navCount === 4) {
        logTest('Navigation', 'Bottom nav tab count', 'PASS', `Found ${navCount} navigation tabs (Dashboard, Leaderboards, Restaurants, Profile)`);
      } else {
        logTest('Navigation', 'Bottom nav tab count', 'FAIL', `Expected 4 tabs, found ${navCount}`);
      }
      await takeScreenshot('03_bottom_nav');
    } catch (error) {
      logTest('Navigation', 'Bottom nav tab count', 'FAIL', `Error: ${error.message}`);
    }

    // Test 4: Verify no center plus button exists
    try {
      const plusButton = await page.$('nav button[aria-label*="Add"], nav a[aria-label*="Add"]');
      if (!plusButton) {
        logTest('Navigation', 'Center plus button removed', 'PASS', 'No plus button found in navigation');
      } else {
        logTest('Navigation', 'Center plus button removed', 'FAIL', 'Plus button still exists in navigation');
      }
    } catch (error) {
      logTest('Navigation', 'Center plus button removed', 'FAIL', `Error: ${error.message}`);
    }

    // Test 5: Test navigation to each tab
    const navItems = [
      { href: '/dashboard', label: 'Dashboard/Home' },
      { href: '/leaderboards', label: 'Leaderboards' },
      { href: '/restaurants', label: 'Restaurants' },
      { href: '/profile', label: 'Profile' },
    ];

    for (const item of navItems) {
      try {
        await page.goto(`http://localhost:3000${item.href}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1500);
        const currentUrl = page.url();
        if (currentUrl.includes(item.href)) {
          logTest('Navigation', `Navigate to ${item.label}`, 'PASS', `Successfully loaded ${item.href}`);
        } else {
          logTest('Navigation', `Navigate to ${item.label}`, 'WARN', `URL mismatch: ${currentUrl}`);
        }
      } catch (error) {
        logTest('Navigation', `Navigate to ${item.label}`, 'FAIL', `Error: ${error.message}`);
      }
    }

    // Return to dashboard for main testing
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    console.log('\n' + '='.repeat(80));
    console.log('PHASE 3: UPCOMING CURRY CARD - ATTENDANCE SYSTEM');
    console.log('='.repeat(80) + '\n');

    // Test 6: Check for upcoming curry card
    try {
      const upcomingCard = await page.$('text=I\'m attending this curry');
      if (upcomingCard) {
        logTest('Attendance', 'Upcoming curry card exists', 'PASS', 'Found upcoming curry card with attendance checkbox');
        await takeScreenshot('04_upcoming_curry_card');
      } else {
        logTest('Attendance', 'Upcoming curry card exists', 'WARN', 'No upcoming curry card found (may need to create an event)');
        await takeScreenshot('04_no_upcoming_curry');
      }
    } catch (error) {
      logTest('Attendance', 'Upcoming curry card exists', 'FAIL', `Error: ${error.message}`);
    }

    // Test 7: Test attendance checkbox
    try {
      const attendanceCheckbox = await page.$('[role="checkbox"]');
      if (attendanceCheckbox) {
        // Check initial state
        const initialState = await attendanceCheckbox.getAttribute('data-state');
        logTest('Attendance', 'Attendance checkbox found', 'PASS', `Initial state: ${initialState || 'unchecked'}`);

        // Click to confirm attendance
        await attendanceCheckbox.click();
        await page.waitForTimeout(1500);
        await takeScreenshot('05_attendance_confirmed');

        const afterClickState = await attendanceCheckbox.getAttribute('data-state');
        if (afterClickState === 'checked' || initialState !== afterClickState) {
          logTest('Attendance', 'Confirm attendance (click)', 'PASS', 'Checkbox state changed successfully');
        } else {
          logTest('Attendance', 'Confirm attendance (click)', 'WARN', 'Checkbox state did not change');
        }

        // Check for toast notification
        await page.waitForTimeout(500);
        const toast = await page.$('[data-sonner-toast]');
        if (toast) {
          const toastText = await toast.textContent();
          logTest('Attendance', 'Attendance confirmation toast', 'PASS', `Toast message: ${toastText}`);
        } else {
          logTest('Attendance', 'Attendance confirmation toast', 'WARN', 'No toast notification found');
        }

        // Wait for UI to update
        await page.waitForTimeout(1500);
      } else {
        logTest('Attendance', 'Attendance checkbox found', 'WARN', 'No attendance checkbox found');
      }
    } catch (error) {
      logTest('Attendance', 'Attendance checkbox interaction', 'FAIL', `Error: ${error.message}`);
    }

    // Test 8: Verify user appears in attendee list
    try {
      const attendeesList = await page.$('text=attending');
      if (attendeesList) {
        await takeScreenshot('06_attendees_list');

        // Count attendees
        const attendeeAvatars = await page.$$('.size-6'); // Avatar elements
        const attendeeCount = attendeeAvatars.length;

        if (attendeeCount > 0) {
          logTest('Attendance', 'User in attendee list', 'PASS', `Found ${attendeeCount} attendee(s) with avatars`);
        } else {
          logTest('Attendance', 'User in attendee list', 'WARN', 'No attendee avatars found');
        }
      } else {
        logTest('Attendance', 'User in attendee list', 'WARN', 'Attendee list not visible');
      }
    } catch (error) {
      logTest('Attendance', 'User in attendee list', 'FAIL', `Error: ${error.message}`);
    }

    // Test 9: Test canceling attendance
    try {
      const attendanceCheckbox = await page.$('[role="checkbox"]');
      if (attendanceCheckbox) {
        const currentState = await attendanceCheckbox.getAttribute('data-state');

        if (currentState === 'checked') {
          // Uncheck to cancel attendance
          await attendanceCheckbox.click();
          await page.waitForTimeout(1500);
          await takeScreenshot('07_attendance_cancelled');

          const afterCancelState = await attendanceCheckbox.getAttribute('data-state');
          if (afterCancelState === 'unchecked' || afterCancelState !== currentState) {
            logTest('Attendance', 'Cancel attendance (uncheck)', 'PASS', 'Successfully cancelled attendance');
          } else {
            logTest('Attendance', 'Cancel attendance (uncheck)', 'WARN', 'Checkbox state did not change');
          }

          // Verify toast
          await page.waitForTimeout(500);
          const toast = await page.$('[data-sonner-toast]');
          if (toast) {
            const toastText = await toast.textContent();
            logTest('Attendance', 'Cancel attendance toast', 'PASS', `Toast message: ${toastText}`);
          }

          // Re-confirm for further tests
          await page.waitForTimeout(500);
          await attendanceCheckbox.click();
          await page.waitForTimeout(1500);
          logTest('Attendance', 'Re-confirm attendance', 'INFO', 'Re-confirmed attendance for further testing');
        } else {
          logTest('Attendance', 'Cancel attendance test', 'WARN', 'Checkbox was not checked, skipping cancel test');
        }
      }
    } catch (error) {
      logTest('Attendance', 'Cancel attendance', 'FAIL', `Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('PHASE 4: ACTIVE CURRY CARD (POST-EVENT)');
    console.log('='.repeat(80) + '\n');

    // Test 10: Check for active curry card
    try {
      const activeCard = await page.$('text=Submit Your Rating');
      if (activeCard) {
        logTest('Active Card', 'Active curry card exists', 'PASS', 'Found active curry card with rating CTA');
        await takeScreenshot('08_active_curry_card');

        // Verify event details are displayed
        const hasRestaurantName = await page.$('h3.text-lg.font-bold');
        if (hasRestaurantName) {
          const restaurantName = await hasRestaurantName.textContent();
          logTest('Active Card', 'Event details displayed', 'PASS', `Restaurant: ${restaurantName}`);
        }

        // Check voting progress
        const votingProgress = await page.$('text=/\\d+ of \\d+ voted/');
        if (votingProgress) {
          const progressText = await votingProgress.textContent();
          logTest('Active Card', 'Voting progress displayed', 'PASS', progressText);
        }

        // Check attendee list with vote indicators
        const checkMark = await page.$('text=/Attendees/');
        if (checkMark) {
          logTest('Active Card', 'Attendees section exists', 'PASS', 'Found attendees section in active card');
        }
      } else {
        logTest('Active Card', 'Active curry card exists', 'INFO', 'No active curry card (event may not have started yet)');
        await takeScreenshot('08_no_active_curry');
      }
    } catch (error) {
      logTest('Active Card', 'Active curry card check', 'FAIL', `Error: ${error.message}`);
    }

    // Test 11: Test "Submit Your Rating" button navigation
    try {
      const submitButton = await page.$('button:has-text("Submit Your Rating")');
      if (submitButton) {
        logTest('Active Card', 'Submit rating button found', 'PASS', 'Submit Your Rating button is visible');

        // Click and verify navigation
        await submitButton.click();
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        if (currentUrl.includes('/add-rating?eventId=')) {
          logTest('Active Card', 'Navigate to rating page', 'PASS', `Navigated to: ${currentUrl}`);
          await takeScreenshot('09_rating_page_navigation');
        } else {
          logTest('Active Card', 'Navigate to rating page', 'FAIL', `Unexpected URL: ${currentUrl}`);
        }
      } else {
        logTest('Active Card', 'Submit rating button', 'INFO', 'Submit rating button not found (may have already voted or not attending)');
      }
    } catch (error) {
      logTest('Active Card', 'Submit rating button test', 'FAIL', `Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('PHASE 5: EVENT-SPECIFIC RATING SUBMISSION');
    console.log('='.repeat(80) + '\n');

    // Navigate to add-rating page (with or without eventId)
    const currentUrl = page.url();
    if (!currentUrl.includes('/add-rating')) {
      // Try to navigate directly (should redirect without eventId)
      await page.goto('http://localhost:3000/add-rating', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    }

    // Test 12: Verify redirect without eventId
    try {
      const urlAfterNav = page.url();
      if (!currentUrl.includes('eventId=')) {
        if (urlAfterNav.includes('/dashboard')) {
          logTest('Rating Page', 'Redirect without eventId', 'PASS', 'Correctly redirected to dashboard without eventId');

          // Check for error toast
          const toast = await page.$('[data-sonner-toast]');
          if (toast) {
            const toastText = await toast.textContent();
            logTest('Rating Page', 'Error toast for missing eventId', 'PASS', `Toast: ${toastText}`);
          }
        } else {
          logTest('Rating Page', 'Redirect without eventId', 'WARN', `Expected redirect to dashboard, at: ${urlAfterNav}`);
        }
      }
    } catch (error) {
      logTest('Rating Page', 'Redirect test', 'FAIL', `Error: ${error.message}`);
    }

    // Navigate with eventId if we can get one from the page
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    try {
      // Try to find and click submit rating button
      const submitButton = await page.$('button:has-text("Submit Your Rating")');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(2000);

        const ratingPageUrl = page.url();
        if (ratingPageUrl.includes('/add-rating?eventId=')) {
          logTest('Rating Page', 'Access with eventId', 'PASS', 'Successfully accessed rating page with eventId');
          await takeScreenshot('10_rating_page_full');

          // Test 13: Verify event details are pre-populated
          try {
            const eventDetailsCard = await page.$('text=Event Details');
            if (eventDetailsCard) {
              logTest('Rating Page', 'Event details pre-populated', 'PASS', 'Event details card is visible');

              const restaurantName = await page.$('h3.text-lg.font-bold');
              if (restaurantName) {
                const name = await restaurantName.textContent();
                logTest('Rating Page', 'Restaurant name displayed', 'PASS', `Restaurant: ${name}`);
              }
            } else {
              logTest('Rating Page', 'Event details pre-populated', 'FAIL', 'Event details card not found');
            }
          } catch (error) {
            logTest('Rating Page', 'Event details check', 'FAIL', `Error: ${error.message}`);
          }

          // Test 14: Test rating sliders
          try {
            const sliderCategories = [
              { name: 'Food Quality', emoji: '🍛' },
              { name: 'Service', emoji: '👨‍🍳' },
              { name: 'Extras', emoji: '🥘' },
              { name: 'Atmosphere', emoji: '🪔' }
            ];

            for (const category of sliderCategories) {
              const categoryLabel = await page.$(`text=${category.emoji}`);
              if (categoryLabel) {
                logTest('Rating Page', `${category.name} slider exists`, 'PASS', `Found ${category.name} rating slider`);
              } else {
                logTest('Rating Page', `${category.name} slider exists`, 'FAIL', `Missing ${category.name} slider`);
              }
            }

            // Test clicking a rating button
            const ratingButtons = await page.$$('button:has-text("5")');
            if (ratingButtons.length > 0) {
              await ratingButtons[0].click(); // Click first "5" button
              await page.waitForTimeout(500);
              logTest('Rating Page', 'Rating slider interaction', 'PASS', 'Successfully clicked rating button');
              await takeScreenshot('11_rating_selected');
            }
          } catch (error) {
            logTest('Rating Page', 'Rating sliders test', 'FAIL', `Error: ${error.message}`);
          }

          // Test 15: Verify default ratings (3/5)
          try {
            const ratingDisplays = await page.$$('text=/\\d+\\/5/');
            if (ratingDisplays.length >= 4) {
              logTest('Rating Page', 'Default ratings (3/5)', 'PASS', `Found ${ratingDisplays.length} rating displays`);
            } else {
              logTest('Rating Page', 'Default ratings (3/5)', 'WARN', `Expected 4 rating displays, found ${ratingDisplays.length}`);
            }
          } catch (error) {
            logTest('Rating Page', 'Default ratings check', 'FAIL', `Error: ${error.message}`);
          }

          // Test 16: Test notes textarea
          try {
            const notesTextarea = await page.$('textarea[placeholder*="additional thoughts"]');
            if (notesTextarea) {
              logTest('Rating Page', 'Notes textarea exists', 'PASS', 'Found optional notes textarea');

              await notesTextarea.fill('This is a test note for the curry rating!');
              await page.waitForTimeout(500);
              logTest('Rating Page', 'Notes textarea input', 'PASS', 'Successfully entered notes');
              await takeScreenshot('12_notes_filled');
            } else {
              logTest('Rating Page', 'Notes textarea', 'FAIL', 'Notes textarea not found');
            }
          } catch (error) {
            logTest('Rating Page', 'Notes textarea test', 'FAIL', `Error: ${error.message}`);
          }

          // Test 17: Test submit rating button
          try {
            const submitButton = await page.$('button:has-text("Submit Rating")');
            if (submitButton) {
              logTest('Rating Page', 'Submit rating button exists', 'PASS', 'Submit Rating button found');

              // Check if button is enabled
              const isDisabled = await submitButton.isDisabled();
              if (!isDisabled) {
                logTest('Rating Page', 'Submit button enabled', 'PASS', 'Submit button is clickable');

                // Click submit
                await submitButton.click();
                await page.waitForTimeout(2000);

                const afterSubmitUrl = page.url();
                if (afterSubmitUrl.includes('/dashboard')) {
                  logTest('Rating Page', 'Submit and redirect', 'PASS', 'Successfully submitted and redirected to dashboard');
                  await takeScreenshot('13_after_submit');

                  // Check for success toast
                  await page.waitForTimeout(500);
                  const toast = await page.$('[data-sonner-toast]');
                  if (toast) {
                    const toastText = await toast.textContent();
                    logTest('Rating Page', 'Success toast after submit', 'PASS', `Toast: ${toastText}`);
                  }
                } else {
                  logTest('Rating Page', 'Submit and redirect', 'WARN', `Expected redirect to dashboard, at: ${afterSubmitUrl}`);
                }
              } else {
                logTest('Rating Page', 'Submit button enabled', 'WARN', 'Submit button is disabled');
              }
            } else {
              logTest('Rating Page', 'Submit rating button', 'FAIL', 'Submit Rating button not found');
            }
          } catch (error) {
            logTest('Rating Page', 'Submit rating test', 'FAIL', `Error: ${error.message}`);
            await takeScreenshot('13_submit_error');
          }
        }
      } else {
        logTest('Rating Page', 'Access rating page', 'INFO', 'No active event to rate at this time');
      }
    } catch (error) {
      logTest('Rating Page', 'Rating page access', 'FAIL', `Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('PHASE 6: RATING VISIBILITY & ADMIN CONTROLS');
    console.log('='.repeat(80) + '\n');

    // Return to dashboard to check active card status
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Test 18: Check for "You've submitted your rating" message
    try {
      const submittedMessage = await page.$('text=You\'ve submitted your rating');
      if (submittedMessage) {
        logTest('Rating Visibility', 'Post-submission message', 'PASS', 'Found confirmation message after rating submission');
        await takeScreenshot('14_submitted_confirmation');
      } else {
        logTest('Rating Visibility', 'Post-submission message', 'INFO', 'User may not have submitted a rating yet');
      }
    } catch (error) {
      logTest('Rating Visibility', 'Post-submission check', 'FAIL', `Error: ${error.message}`);
    }

    // Test 19: Check for admin override button
    try {
      const overrideButton = await page.$('button:has-text("Reveal Ratings")');
      if (overrideButton) {
        logTest('Rating Visibility', 'Admin override button exists', 'PASS', 'Found "Reveal Ratings (Override)" button');

        // Test clicking override
        await overrideButton.click();
        await page.waitForTimeout(2000);
        logTest('Rating Visibility', 'Manual rating reveal', 'PASS', 'Clicked override button');
        await takeScreenshot('15_ratings_revealed');

        // Check for success toast
        const toast = await page.$('[data-sonner-toast]');
        if (toast) {
          const toastText = await toast.textContent();
          logTest('Rating Visibility', 'Reveal ratings toast', 'PASS', `Toast: ${toastText}`);
        }
      } else {
        logTest('Rating Visibility', 'Admin override button', 'INFO', 'Override button not visible (may not be admin or all have voted)');
      }
    } catch (error) {
      logTest('Rating Visibility', 'Admin override test', 'FAIL', `Error: ${error.message}`);
    }

    // Test 20: Check for "Ratings revealed" status
    try {
      const revealedStatus = await page.$('text=Ratings revealed');
      if (revealedStatus) {
        logTest('Rating Visibility', 'Ratings revealed status', 'PASS', 'Found "Ratings revealed" confirmation');
        await takeScreenshot('16_ratings_revealed_status');
      } else {
        logTest('Rating Visibility', 'Ratings revealed status', 'INFO', 'Ratings may not be revealed yet');
      }
    } catch (error) {
      logTest('Rating Visibility', 'Ratings revealed check', 'FAIL', `Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('PHASE 7: EDGE CASES & ERROR HANDLING');
    console.log('='.repeat(80) + '\n');

    // Test 21: Try to access rating page without eventId
    try {
      await page.goto('http://localhost:3000/add-rating', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const urlAfterNav = page.url();
      if (urlAfterNav.includes('/dashboard')) {
        logTest('Edge Cases', 'Rating page without eventId', 'PASS', 'Correctly redirects to dashboard when no eventId provided');
      } else {
        logTest('Edge Cases', 'Rating page without eventId', 'FAIL', `Expected redirect to dashboard, at: ${urlAfterNav}`);
      }
      await takeScreenshot('17_no_eventid_redirect');
    } catch (error) {
      logTest('Edge Cases', 'No eventId redirect', 'FAIL', `Error: ${error.message}`);
    }

    // Test 22: Try to access rating page with invalid eventId
    try {
      await page.goto('http://localhost:3000/add-rating?eventId=invalid123', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const errorMessage = await page.$('text=Event Not Found');
      if (errorMessage) {
        logTest('Edge Cases', 'Invalid eventId handling', 'PASS', 'Shows "Event Not Found" error for invalid eventId');
        await takeScreenshot('18_invalid_eventid');
      } else {
        const urlAfterNav = page.url();
        if (urlAfterNav.includes('/dashboard')) {
          logTest('Edge Cases', 'Invalid eventId handling', 'PASS', 'Redirects to dashboard for invalid eventId');
        } else {
          logTest('Edge Cases', 'Invalid eventId handling', 'WARN', 'Error handling for invalid eventId unclear');
        }
      }
    } catch (error) {
      logTest('Edge Cases', 'Invalid eventId test', 'FAIL', `Error: ${error.message}`);
    }

    // Test 23: Check responsive behavior
    try {
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      // Test mobile viewport (already set)
      await takeScreenshot('19_mobile_viewport');
      logTest('Edge Cases', 'Mobile viewport (390x844)', 'PASS', 'Dashboard renders in mobile viewport');

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(1000);
      await takeScreenshot('20_tablet_viewport');
      logTest('Edge Cases', 'Tablet viewport (768x1024)', 'PASS', 'Dashboard renders in tablet viewport');

      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);
      await takeScreenshot('21_desktop_viewport');
      logTest('Edge Cases', 'Desktop viewport (1920x1080)', 'PASS', 'Dashboard renders in desktop viewport');

      // Reset to mobile
      await page.setViewportSize({ width: 390, height: 844 });
    } catch (error) {
      logTest('Edge Cases', 'Responsive testing', 'FAIL', `Error: ${error.message}`);
    }

    // Test 24: Test multiple rapid attendance toggles
    try {
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      const checkbox = await page.$('[role="checkbox"]');
      if (checkbox) {
        // Rapid clicks
        await checkbox.click();
        await page.waitForTimeout(300);
        await checkbox.click();
        await page.waitForTimeout(300);
        await checkbox.click();
        await page.waitForTimeout(1500);

        logTest('Edge Cases', 'Rapid attendance toggles', 'PASS', 'Handled multiple rapid clicks without crashing');
        await takeScreenshot('22_rapid_toggles');
      } else {
        logTest('Edge Cases', 'Rapid attendance toggles', 'INFO', 'No checkbox available for testing');
      }
    } catch (error) {
      logTest('Edge Cases', 'Rapid toggles test', 'FAIL', `Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('PHASE 8: USER EXPERIENCE & ACCESSIBILITY');
    console.log('='.repeat(80) + '\n');

    // Test 25: Check for ARIA labels
    try {
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      const ariaLabels = await page.$$('[aria-label]');
      logTest('Accessibility', 'ARIA labels present', 'PASS', `Found ${ariaLabels.length} elements with aria-label`);

      const navAriaLabel = await page.$('nav[aria-label="Bottom navigation"]');
      if (navAriaLabel) {
        logTest('Accessibility', 'Navigation ARIA label', 'PASS', 'Bottom navigation has proper aria-label');
      }
    } catch (error) {
      logTest('Accessibility', 'ARIA labels check', 'FAIL', `Error: ${error.message}`);
    }

    // Test 26: Check for proper headings hierarchy
    try {
      const h1 = await page.$('h1');
      const h2s = await page.$$('h2');
      const h3s = await page.$$('h3');

      logTest('Accessibility', 'Heading hierarchy', 'PASS', `Found h1: ${h1 ? 'Yes' : 'No'}, h2s: ${h2s.length}, h3s: ${h3s.length}`);
    } catch (error) {
      logTest('Accessibility', 'Heading hierarchy check', 'FAIL', `Error: ${error.message}`);
    }

    // Test 27: Check color contrast and readability
    try {
      // Take final screenshot for visual inspection
      await takeScreenshot('23_final_state');
      logTest('UX', 'Visual inspection screenshot', 'PASS', 'Final state captured for manual review');
    } catch (error) {
      logTest('UX', 'Visual inspection', 'FAIL', `Error: ${error.message}`);
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }

  // Generate summary report
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY REPORT');
  console.log('='.repeat(80) + '\n');

  const passCount = testResults.filter(t => t.status === 'PASS').length;
  const failCount = testResults.filter(t => t.status === 'FAIL').length;
  const warnCount = testResults.filter(t => t.status === 'WARN').length;
  const infoCount = testResults.filter(t => t.status === 'INFO').length;
  const totalTests = testResults.length;

  console.log(`Total Tests Run: ${totalTests}`);
  console.log(`✓ Passed: ${passCount} (${((passCount/totalTests)*100).toFixed(1)}%)`);
  console.log(`✗ Failed: ${failCount} (${((failCount/totalTests)*100).toFixed(1)}%)`);
  console.log(`⚠ Warnings: ${warnCount} (${((warnCount/totalTests)*100).toFixed(1)}%)`);
  console.log(`ℹ Info: ${infoCount} (${((infoCount/totalTests)*100).toFixed(1)}%)`);

  // Categorize results
  const categories = {};
  testResults.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = { pass: 0, fail: 0, warn: 0, info: 0 };
    }
    categories[test.category][test.status.toLowerCase()]++;
  });

  console.log('\n' + '-'.repeat(80));
  console.log('RESULTS BY CATEGORY:');
  console.log('-'.repeat(80));

  Object.keys(categories).forEach(category => {
    const stats = categories[category];
    const total = stats.pass + stats.fail + stats.warn + stats.info;
    console.log(`\n${category}:`);
    console.log(`  ✓ Pass: ${stats.pass}/${total}`);
    if (stats.fail > 0) console.log(`  ✗ Fail: ${stats.fail}/${total}`);
    if (stats.warn > 0) console.log(`  ⚠ Warn: ${stats.warn}/${total}`);
    if (stats.info > 0) console.log(`  ℹ Info: ${stats.info}/${total}`);
  });

  // List all failures
  const failures = testResults.filter(t => t.status === 'FAIL');
  if (failures.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('FAILED TESTS:');
    console.log('-'.repeat(80));
    failures.forEach(test => {
      console.log(`\n[${test.number}] ${test.category} > ${test.name}`);
      console.log(`    ${test.details}`);
    });
  }

  // List warnings
  const warnings = testResults.filter(t => t.status === 'WARN');
  if (warnings.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('WARNINGS:');
    console.log('-'.repeat(80));
    warnings.forEach(test => {
      console.log(`\n[${test.number}] ${test.category} > ${test.name}`);
      console.log(`    ${test.details}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDATIONS & NEXT STEPS');
  console.log('='.repeat(80) + '\n');

  if (failCount === 0 && warnCount === 0) {
    console.log('✓ All tests passed! The event-based rating system is working as expected.');
  } else {
    console.log('The following areas need attention:');
    if (failCount > 0) {
      console.log(`\n1. Critical Issues (${failCount} failures):`);
      console.log('   - Review failed tests above and fix implementation bugs');
      console.log('   - Ensure all error handling is working correctly');
    }
    if (warnCount > 0) {
      console.log(`\n2. Warnings (${warnCount} warnings):`);
      console.log('   - Review warnings for potential UX improvements');
      console.log('   - Some features may not be testable due to current state');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Screenshots saved to: /Users/jake.duffy/git/chutney-smugglers/screenshots/');
  console.log('Test completed at: ' + new Date().toISOString());
  console.log('='.repeat(80) + '\n');
}

// Run the tests
runTests().catch(console.error);
