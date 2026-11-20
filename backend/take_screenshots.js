const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function captureScreenshots() {
  const screenshotsDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('[Browser QA] Launching Chrome via Puppeteer-Core...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1440,900',
    ],
    defaultViewport: {
      width: 1440,
      height: 900,
    },
  });

  const page = await browser.newPage();

  try {
    // 1. Screenshot Login Page
    console.log('[Browser QA] Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.screenshot({
      path: path.join(screenshotsDir, '01_login_page.png'),
      fullPage: false,
    });
    console.log('[Browser QA] Captured 01_login_page.png');

    // 2. Click "Demo Patient" button and login
    console.log('[Browser QA] Logging in as Demo Patient...');
    const demoPatientBtn = await page.waitForSelector('button ::-p-text(Demo Patient)');
    await demoPatientBtn.click();
    await new Promise((r) => setTimeout(r, 400));

    // Click Sign In
    const signInBtn = await page.waitForSelector('button[type="submit"]');
    await signInBtn.click();

    // Wait for Dashboard
    await page.waitForSelector('::-p-text(Recorded Readings)');
    await new Promise((r) => setTimeout(r, 1000));

    // Screenshot Dashboard
    await page.screenshot({
      path: path.join(screenshotsDir, '02_patient_dashboard.png'),
      fullPage: false,
    });
    console.log('[Browser QA] Captured 02_patient_dashboard.png');

    // 3. Trigger Clinical Validation Error
    console.log('[Browser QA] Testing clinical validation...');
    const glucoseInput = await page.waitForSelector('input[placeholder="e.g. 115"]');
    await glucoseInput.type('850'); // Value > 600

    const addReadingBtn = await page.waitForSelector('button ::-p-text(Add Reading)');
    await addReadingBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // Screenshot Validation Error
    await page.screenshot({
      path: path.join(screenshotsDir, '03_validation_error.png'),
      fullPage: false,
    });
    console.log('[Browser QA] Captured 03_validation_error.png');

    // 4. Navigate to Reports & Trends
    console.log('[Browser QA] Navigating to Reports & Trends...');
    const reportsNav = await page.waitForSelector('a[href="/reports"], button ::-p-text(Reports & Trends)');
    await reportsNav.click();
    await page.waitForSelector('::-p-text(Glucose Analytics & Reports)');
    await new Promise((r) => setTimeout(r, 1200));

    // Screenshot Reports & Analytics
    await page.screenshot({
      path: path.join(screenshotsDir, '04_reports_and_charts.png'),
      fullPage: false,
    });
    console.log('[Browser QA] Captured 04_reports_and_charts.png');

    // 5. Logout and Login as Demo Doctor
    console.log('[Browser QA] Logging in as Demo Doctor...');
    const logoutBtn = await page.waitForSelector('button ::-p-text(Logout)');
    await logoutBtn.click();
    await page.waitForSelector('::-p-text(Welcome to Sweety)');
    await new Promise((r) => setTimeout(r, 600));

    // Click Demo Doctor button (auto-fills and submits)
    const demoDoctorBtn = await page.waitForSelector('button ::-p-text(Demo Doctor)');
    await demoDoctorBtn.click();

    // Wait for Doctor Portal
    await page.waitForSelector('::-p-text(Assigned Patients)');
    await new Promise((r) => setTimeout(r, 1200));

    // Screenshot Doctor Portal
    await page.screenshot({
      path: path.join(screenshotsDir, '05_doctor_portal.png'),
      fullPage: false,
    });
    console.log('[Browser QA] Captured 05_doctor_portal.png');

    console.log('\n[Browser QA] ALL 5 SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('[Browser QA Error]', err);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
