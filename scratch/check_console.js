const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    console.log("Navigating...");
    try {
        await page.goto('http://localhost:4173/commercial-forecast', { waitUntil: 'networkidle0' });
        console.log("Loaded!");
    } catch(e) {
        console.log("Goto error:", e);
    }
    
    await browser.close();
})();
