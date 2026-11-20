const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

async function recordDemo() {
  const framesDir = path.resolve(__dirname, '../temp_frames');
  const outputVideo = path.resolve(__dirname, '../demo_walkthrough.mp4');

  if (fs.existsSync(framesDir)) {
    fs.rmSync(framesDir, { recursive: true, force: true });
  }
  fs.mkdirSync(framesDir, { recursive: true });

  console.log('[Video Recorder] Launching Chrome via Puppeteer-Core...');
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
  const client = await page.createCDPSession();

  let frameCount = 0;
  client.on('Page.screencastFrame', async (params) => {
    try {
      frameCount++;
      const framePath = path.join(
        framesDir,
        `frame_${String(frameCount).padStart(5, '0')}.jpg`
      );
      fs.writeFileSync(framePath, Buffer.from(params.data, 'base64'));
      await client.send('Page.screencastFrameAck', { sessionId: params.sessionId });
    } catch {
      // Ignore frame ack errors during shutdown
    }
  });

  // Start Screencast at 15 FPS (everyNthFrame: 1 or 2)
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 85,
    everyNthFrame: 1,
  });

  console.log('[Video Recorder] Screencast recording started...');

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  try {
    // 1. Visit Login Page
    console.log('[Scene 1] Welcome & Login Screen...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await sleep(2000);

    // 2. Click "Demo Patient"
    console.log('[Scene 2] Quick-Fill Demo Patient...');
    const demoPatientBtn = await page.waitForSelector('button ::-p-text(Demo Patient)');
    await demoPatientBtn.click();
    await sleep(1500);

    // Click Sign In
    const signInBtn = await page.waitForSelector('button[type="submit"]');
    await signInBtn.click();
    await page.waitForSelector('::-p-text(Recorded Readings)');
    await sleep(2500);

    // 3. Scroll & Explore Dashboard
    console.log('[Scene 3] Exploring Dashboard & Historical Readings...');
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await sleep(2000);

    // Test Pagination (Click Next)
    console.log('[Scene 3b] Testing Pagination Controls...');
    const nextBtn = await page.waitForSelector('button ::-p-text(Next)');
    await nextBtn.click();
    await sleep(2000);

    // Click Previous
    const prevBtn = await page.waitForSelector('button ::-p-text(Previous)');
    await prevBtn.click();
    await sleep(1500);

    // 4. Test Clinical Validation Error
    console.log('[Scene 4] Triggering Clinical Validation Boundary Alert...');
    await page.evaluate(() => window.scrollTo({ top: 120, behavior: 'smooth' }));
    await sleep(1000);

    const glucoseInput = await page.waitForSelector('input[placeholder="e.g. 115"]');
    await glucoseInput.type('850');
    await sleep(1000);

    const addReadingBtn = await page.waitForSelector('button ::-p-text(Add Reading)');
    await addReadingBtn.click();
    await sleep(2500); // Let the red error alert show clearly

    // 5. Add a Valid Reading
    console.log('[Scene 5] Submitting a Valid Reading (115 mg/dl)...');
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="e.g. 115"]');
      if (input) input.value = '';
    });
    await glucoseInput.type('115');
    await sleep(1000);
    await addReadingBtn.click();
    await sleep(2500); // Let the green success alert show clearly

    // 6. Reports & Trends Tab
    console.log('[Scene 6] Navigating to Reports & Clinical Trends...');
    const reportsNav = await page.waitForSelector('button ::-p-text(Reports & Trends)');
    await reportsNav.click();
    await page.waitForSelector('::-p-text(Glucose Analytics & Reports)');
    await sleep(2000);

    // Scroll through Reports & Recharts Chart
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await sleep(3500);

    // 7. Logout and Access Doctor Portal
    console.log('[Scene 7] Demonstrating Doctor Role & RBAC Portal...');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(1000);

    const logoutBtn = await page.waitForSelector('button ::-p-text(Logout)');
    await logoutBtn.click();
    await page.waitForSelector('::-p-text(Welcome to Sweety)');
    await sleep(1500);

    // Log in as Demo Doctor
    const demoDoctorBtn = await page.waitForSelector('button ::-p-text(Demo Doctor)');
    await demoDoctorBtn.click();
    await sleep(1000);

    // View Doctor Portal
    await page.waitForSelector('::-p-text(Doctor Clinician Portal)');
    await sleep(2000);

    // Trigger BullMQ Reminder Job directly in UI
    console.log('[Scene 7b] Triggering BullMQ Compliance Check from UI...');
    const bullBtn = await page.waitForSelector('button ::-p-text(Run BullMQ Compliance Reminder Job)');
    await bullBtn.click();
    await sleep(2500); // Let the green success alert show

    // Scroll down in Doctor Portal to view assigned patients and reports
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await sleep(3500);

    console.log('[Video Recorder] Walk-through completed! Captured', frameCount, 'frames.');
  } catch (err) {
    console.error('[Video Recorder Error]', err);
  } finally {
    try {
      await client.send('Page.stopScreencast');
    } catch {}
    await browser.close();
  }

  // Encode frames to MP4 using FFmpeg
  console.log('[Video Recorder] Encoding frames to MP4 via FFmpeg...');
  try {
    const ffmpegCmd = `ffmpeg -y -framerate 15 -i "${framesDir}/frame_%05d.jpg" -c:v libx264 -pix_fmt yuv420p -crf 22 -preset fast "${outputVideo}"`;
    execSync(ffmpegCmd, { stdio: 'inherit' });
    console.log('[Video Recorder] Successfully generated:', outputVideo);

    // Clean up temporary frames directory
    fs.rmSync(framesDir, { recursive: true, force: true });
    console.log('[Video Recorder] Cleaned up temporary frames.');
  } catch (encodeErr) {
    console.error('[FFmpeg Error]', encodeErr);
  }
}

recordDemo();
