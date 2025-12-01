/**
 * Manual Testing Checklist Script
 * Opens browser and provides interactive testing guidance
 */

const { chromium } = require('playwright');

async function manualTestingGuide() {
  console.log('\n' + '='.repeat(80));
  console.log('MANUAL TESTING GUIDE - Event-Based Rating System');
  console.log('='.repeat(80) + '\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500  // Slow down actions for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  const page = await context.newPage();

  try {
    console.log('Step 1: Opening http://localhost:3000/dashboard...\n');
    await page.goto('http://localhost:3000/dashboard', { timeout: 60000, waitUntil: 'load' });

    console.log('✓ Page loaded. Waiting 5 seconds for you to check the page...\n');
    await page.waitForTimeout(5000);

    // Check if we're still on dashboard or got redirected
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}\n`);

    if (currentUrl.includes('/onboarding') || currentUrl.includes('/signin') || currentUrl.includes('/auth')) {
      console.log('⚠️  Note: You were redirected to authentication/onboarding.');
      console.log('    Please complete authentication manually in the browser window.');
      console.log('    Once you reach the dashboard, press Enter here to continue...\n');

      // Wait for user input
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      await new Promise(resolve => {
        readline.question('Press Enter when you are on the dashboard: ', () => {
          readline.close();
          resolve();
        });
      });

      // Try to go to dashboard again
      await page.goto('http://localhost:3000/dashboard', { timeout: 30000, waitUntil: 'load' });
      await page.waitForTimeout(2000);
    }

    console.log('\n' + '='.repeat(80));
    console.log('AUTOMATED INSPECTION & SCREENSHOT CAPTURE');
    console.log('='.repeat(80) + '\n');

    // Ensure screenshots directory
    const fs = require('fs');
    const screenshotDir = '/Users/jake.duffy/git/chutney-smugglers/screenshots';
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Capture dashboard
    console.log('📸 Capturing dashboard screenshot...');
    await page.screenshot({ path: `${screenshotDir}/01_dashboard_main.png`, fullPage: true });
    console.log('✓ Saved: 01_dashboard_main.png\n');

    // Check for bottom navigation
    console.log('Checking navigation bar...');
    const navLinks = await page.$$('nav[aria-label="Bottom navigation"] a');
    console.log(`✓ Found ${navLinks.length} navigation tabs`);

    if (navLinks.length === 4) {
      console.log('✓ PASS: Navigation has 4 tabs (expected)');
    } else {
      console.log(`✗ FAIL: Expected 4 tabs, found ${navLinks.length}`);
    }

    // Check for no plus button
    const plusButton = await page.$('nav button:has-text("+")');
    if (!plusButton) {
      console.log('✓ PASS: No center plus button found\n');
    } else {
      console.log('✗ FAIL: Plus button still exists in navigation\n');
    }

    // Check for upcoming curry card
    console.log('Checking for upcoming curry card...');
    const upcomingCard = await page.$('text=I\'m attending this curry');
    if (upcomingCard) {
      console.log('✓ Found upcoming curry card with attendance checkbox');
      await page.screenshot({ path: `${screenshotDir}/02_upcoming_curry_card.png`, fullPage: true });
      console.log('📸 Saved: 02_upcoming_curry_card.png\n');

      // Test attendance checkbox
      console.log('Testing attendance checkbox...');
      const checkbox = await page.$('[role="checkbox"]');
      if (checkbox) {
        const initialState = await checkbox.getAttribute('data-state');
        console.log(`  Initial state: ${initialState || 'unchecked'}`);

        console.log('  Clicking checkbox to confirm attendance...');
        await checkbox.click();
        await page.waitForTimeout(2000);

        await page.screenshot({ path: `${screenshotDir}/03_attendance_confirmed.png`, fullPage: true });
        console.log('  📸 Saved: 03_attendance_confirmed.png');

        const afterClickState = await checkbox.getAttribute('data-state');
        console.log(`  After click state: ${afterClickState || 'unchecked'}`);

        if (afterClickState !== initialState) {
          console.log('  ✓ PASS: Checkbox state changed');
        } else {
          console.log('  ✗ WARN: Checkbox state did not change');
        }

        // Check for toast
        await page.waitForTimeout(500);
        const toast = await page.$('[data-sonner-toast]');
        if (toast) {
          const toastText = await toast.textContent();
          console.log(`  ✓ Toast notification: "${toastText}"`);
        }

        // Test unchecking
        console.log('\n  Testing cancel attendance...');
        await page.waitForTimeout(1000);
        await checkbox.click();
        await page.waitForTimeout(2000);

        await page.screenshot({ path: `${screenshotDir}/04_attendance_cancelled.png`, fullPage: true });
        console.log('  📸 Saved: 04_attendance_cancelled.png');

        // Re-check for further testing
        await page.waitForTimeout(1000);
        await checkbox.click();
        await page.waitForTimeout(2000);
        console.log('  ✓ Re-confirmed attendance for further testing\n');
      } else {
        console.log('✗ No checkbox found\n');
      }

      // Check attendees list
      console.log('Checking attendees list...');
      const attendeesSection = await page.$('text=attending');
      if (attendeesSection) {
        const attendeeAvatars = await page.$$('img[alt], .size-6');
        console.log(`✓ Found attendees section with ${attendeeAvatars.length} avatars\n`);
      } else {
        console.log('⚠️  Attendees list not visible\n');
      }
    } else {
      console.log('⚠️  No upcoming curry card found');
      console.log('   (You may need to create an event first)\n');
    }

    // Check for active curry card
    console.log('Checking for active curry card...');
    const activeCard = await page.$('text=Submit Your Rating');
    if (activeCard) {
      console.log('✓ Found active curry card with "Submit Your Rating" button');
      await page.screenshot({ path: `${screenshotDir}/05_active_curry_card.png`, fullPage: true });
      console.log('📸 Saved: 05_active_curry_card.png\n');

      // Test navigation to rating page
      console.log('Testing "Submit Your Rating" button...');
      await activeCard.click();
      await page.waitForTimeout(3000);

      const ratingPageUrl = page.url();
      if (ratingPageUrl.includes('/add-rating?eventId=')) {
        console.log(`✓ PASS: Navigated to rating page: ${ratingPageUrl}`);
        await page.screenshot({ path: `${screenshotDir}/06_rating_page.png`, fullPage: true });
        console.log('📸 Saved: 06_rating_page.png\n');

        // Test rating page elements
        console.log('Testing rating page elements...');

        const eventDetails = await page.$('text=Event Details');
        if (eventDetails) {
          console.log('  ✓ Event details card found');
        }

        const sliders = await page.$$('text=/\\d+\\/5/');
        console.log(`  ✓ Found ${sliders.length} rating sliders`);

        const notesTextarea = await page.$('textarea');
        if (notesTextarea) {
          console.log('  ✓ Notes textarea found');
          await notesTextarea.fill('This is a test note!');
          await page.waitForTimeout(500);
          console.log('  ✓ Filled notes textarea');
        }

        // Click a rating button
        const rating5Buttons = await page.$$('button:has-text("5")');
        if (rating5Buttons.length > 0) {
          await rating5Buttons[0].click();
          await page.waitForTimeout(500);
          console.log('  ✓ Clicked rating button (5 stars for first category)');
          await page.screenshot({ path: `${screenshotDir}/07_rating_filled.png`, fullPage: true });
          console.log('  📸 Saved: 07_rating_filled.png\n');
        }

        // Test submit button (but don't click it unless user wants)
        const submitButton = await page.$('button:has-text("Submit Rating")');
        if (submitButton) {
          const isDisabled = await submitButton.isDisabled();
          if (isDisabled) {
            console.log('  ⚠️  Submit button is disabled');
          } else {
            console.log('  ✓ Submit button is enabled and ready to click');
            console.log('\n  ⚠️  NOTE: Not automatically submitting to avoid duplicate submissions.');
            console.log('     You can manually click "Submit Rating" in the browser if needed.\n');
          }
        }

        // Go back to dashboard
        await page.goto('http://localhost:3000/dashboard', { waitUntil: 'load' });
        await page.waitForTimeout(2000);
      } else {
        console.log(`✗ FAIL: Expected navigation to /add-rating, got: ${ratingPageUrl}\n`);
      }
    } else {
      console.log('⚠️  No active curry card found');
      console.log('   (Event may not have started yet)\n');
    }

    // Test edge case: navigate to rating page without eventId
    console.log('Testing edge case: accessing /add-rating without eventId...');
    await page.goto('http://localhost:3000/add-rating', { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    const urlAfterNoEventId = page.url();
    if (urlAfterNoEventId.includes('/dashboard')) {
      console.log('✓ PASS: Correctly redirected to dashboard');

      // Check for error toast
      await page.waitForTimeout(500);
      const errorToast = await page.$('[data-sonner-toast]');
      if (errorToast) {
        const toastText = await errorToast.textContent();
        console.log(`✓ Error toast displayed: "${toastText}"`);
      }
    } else {
      console.log(`✗ FAIL: Expected redirect to dashboard, at: ${urlAfterNoEventId}`);
    }
    await page.screenshot({ path: `${screenshotDir}/08_no_eventid_redirect.png`, fullPage: true });
    console.log('📸 Saved: 08_no_eventid_redirect.png\n');

    // Test invalid eventId
    console.log('Testing edge case: invalid eventId...');
    await page.goto('http://localhost:3000/add-rating?eventId=invalid123', { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    const errorMessage = await page.$('text=Event Not Found');
    if (errorMessage) {
      console.log('✓ PASS: Shows "Event Not Found" error');
    } else {
      const urlAfterInvalid = page.url();
      if (urlAfterInvalid.includes('/dashboard')) {
        console.log('✓ PASS: Redirected to dashboard for invalid eventId');
      } else {
        console.log(`⚠️  Unclear error handling: ${urlAfterInvalid}`);
      }
    }
    await page.screenshot({ path: `${screenshotDir}/09_invalid_eventid.png`, fullPage: true });
    console.log('📸 Saved: 09_invalid_eventid.png\n');

    // Test responsive viewports
    console.log('Testing responsive behavior...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    // Mobile (current)
    await page.screenshot({ path: `${screenshotDir}/10_mobile_viewport.png`, fullPage: true });
    console.log('📸 Saved: 10_mobile_viewport.png (390x844)');

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${screenshotDir}/11_tablet_viewport.png`, fullPage: true });
    console.log('📸 Saved: 11_tablet_viewport.png (768x1024)');

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${screenshotDir}/12_desktop_viewport.png`, fullPage: true });
    console.log('📸 Saved: 12_desktop_viewport.png (1920x1080)\n');

    // Reset to mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    // Check accessibility
    console.log('Checking accessibility...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const ariaLabels = await page.$$('[aria-label]');
    console.log(`✓ Found ${ariaLabels.length} elements with aria-label`);

    const h1 = await page.$('h1');
    const h2s = await page.$$('h2');
    const h3s = await page.$$('h3');
    console.log(`✓ Heading structure: h1: ${h1 ? '1' : '0'}, h2s: ${h2s.length}, h3s: ${h3s.length}\n`);

    // Final screenshot
    await page.screenshot({ path: `${screenshotDir}/13_final_state.png`, fullPage: true });
    console.log('📸 Saved: 13_final_state.png\n');

    console.log('\n' + '='.repeat(80));
    console.log('TESTING COMPLETE!');
    console.log('='.repeat(80) + '\n');
    console.log(`Screenshots saved to: ${screenshotDir}/`);
    console.log('\nBrowser will remain open for 60 seconds for manual inspection.');
    console.log('Press Ctrl+C to close immediately, or wait for automatic closure.\n');

    // Keep browser open for manual testing
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\n✓ Browser closed. Testing complete.\n');
  }
}

manualTestingGuide().catch(console.error);
