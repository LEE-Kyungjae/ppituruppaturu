const { chromium } = require('playwright');

async function testSwaggerUIDetailed() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        console.log('Navigating to Swagger UI...');
        await page.goto('http://localhost:8080/swagger/index.html', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for Swagger UI to load
        await page.waitForSelector('.swagger-ui', { timeout: 30000 });

        // Try to expand one of the API endpoints to see more details
        console.log('Expanding API endpoints for detailed view...');

        // Click on the first endpoint to expand it
        const firstEndpoint = await page.$('.opblock .opblock-summary');
        if (firstEndpoint) {
            await firstEndpoint.click();
            await page.waitForTimeout(2000); // Wait for expansion
        }

        // Try to expand the auth/login endpoint specifically
        const loginEndpoint = await page.$('[data-path="/auth/login"]');
        if (loginEndpoint) {
            await loginEndpoint.click();
            await page.waitForTimeout(2000);
        }

        // Take screenshot with expanded view
        await page.screenshot({
            path: '/Users/ze/work/pp/pp-backend/swagger_ui_detailed_screenshot.png',
            fullPage: true
        });

        // Check for models/schemas
        console.log('Checking for API models/schemas...');
        const models = await page.evaluate(() => {
            const modelElements = document.querySelectorAll('.models .model-container');
            return Array.from(modelElements).map(model => {
                const title = model.querySelector('.model-title')?.textContent?.trim();
                return title;
            }).filter(Boolean);
        });

        console.log('Models found:', models);

        // Check for example values and schemas
        const hasExamples = await page.evaluate(() => {
            return document.querySelectorAll('.example, .model-example').length > 0;
        });

        console.log('Has example values:', hasExamples);

        console.log('✅ Detailed Swagger UI test completed');
        console.log('✅ Screenshot with expanded view saved');

    } catch (error) {
        console.error('❌ Error in detailed test:', error.message);
    } finally {
        await browser.close();
    }
}

testSwaggerUIDetailed();