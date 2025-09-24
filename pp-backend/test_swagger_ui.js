const { chromium } = require('playwright');

async function testSwaggerUI() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        console.log('Navigating to Swagger UI...');
        await page.goto('http://localhost:8080/swagger/index.html', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for Swagger UI to load
        console.log('Waiting for Swagger UI to load...');
        await page.waitForSelector('.swagger-ui', { timeout: 30000 });

        // Take a screenshot
        console.log('Taking screenshot...');
        await page.screenshot({
            path: '/Users/ze/work/pp/pp-backend/swagger_ui_screenshot.png',
            fullPage: true
        });

        // Check for API endpoints
        console.log('Checking for API endpoints...');

        // Look for operation blocks (API endpoints)
        const operations = await page.$$('.opblock');
        console.log(`Found ${operations.length} API operations`);

        // Get all operation summaries/paths
        const apiEndpoints = await page.evaluate(() => {
            const endpoints = [];
            const operations = document.querySelectorAll('.opblock');

            operations.forEach(op => {
                const method = op.querySelector('.opblock-summary-method')?.textContent?.trim();
                const path = op.querySelector('.opblock-summary-path')?.textContent?.trim();
                const summary = op.querySelector('.opblock-summary-description')?.textContent?.trim();

                if (method && path) {
                    endpoints.push({
                        method: method,
                        path: path,
                        summary: summary || 'No description'
                    });
                }
            });

            return endpoints;
        });

        console.log('\n=== API Endpoints Found ===');
        apiEndpoints.forEach(endpoint => {
            console.log(`${endpoint.method.toUpperCase()} ${endpoint.path} - ${endpoint.summary}`);
        });

        // Check for different categories/tags
        console.log('\n=== Checking for API Categories ===');
        const tags = await page.evaluate(() => {
            const tagElements = document.querySelectorAll('.opblock-tag-section h3, .opblock-tag-section h4');
            return Array.from(tagElements).map(tag => tag.textContent.trim());
        });

        console.log('API Categories/Tags found:');
        tags.forEach(tag => console.log(`- ${tag}`));

        // Check for any error messages
        console.log('\n=== Checking for Errors ===');
        const errorMessages = await page.evaluate(() => {
            const errors = [];

            // Check for common error indicators
            const errorSelectors = [
                '.swagger-ui .errors-wrapper',
                '.swagger-ui .error',
                '.loading-container .loading',
                '.info .title'
            ];

            errorSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el.textContent.includes('error') || el.textContent.includes('Error')) {
                        errors.push(el.textContent.trim());
                    }
                });
            });

            return errors;
        });

        if (errorMessages.length > 0) {
            console.log('Error messages found:');
            errorMessages.forEach(error => console.log(`- ${error}`));
        } else {
            console.log('No error messages found');
        }

        // Check if Swagger spec loaded successfully
        const specInfo = await page.evaluate(() => {
            const title = document.querySelector('.info .title')?.textContent?.trim();
            const version = document.querySelector('.info .version')?.textContent?.trim();
            const description = document.querySelector('.info .description')?.textContent?.trim();

            return {
                title: title || 'No title found',
                version: version || 'No version found',
                description: description || 'No description found'
            };
        });

        console.log('\n=== Swagger Spec Info ===');
        console.log(`Title: ${specInfo.title}`);
        console.log(`Version: ${specInfo.version}`);
        console.log(`Description: ${specInfo.description}`);

        console.log('\n=== Test Summary ===');
        console.log(`✅ Swagger UI loaded successfully`);
        console.log(`✅ Found ${apiEndpoints.length} API endpoints`);
        console.log(`✅ Found ${tags.length} API categories`);
        console.log(`✅ Screenshot saved to swagger_ui_screenshot.png`);

        if (apiEndpoints.length === 0) {
            console.log('⚠️  Warning: No API endpoints found - this might indicate an issue');
        }

    } catch (error) {
        console.error('❌ Error testing Swagger UI:', error.message);

        // Take screenshot even if there's an error
        try {
            await page.screenshot({
                path: '/Users/ze/work/pp/pp-backend/swagger_ui_error_screenshot.png',
                fullPage: true
            });
            console.log('Error screenshot saved to swagger_ui_error_screenshot.png');
        } catch (screenshotError) {
            console.error('Failed to take error screenshot:', screenshotError.message);
        }
    } finally {
        await browser.close();
    }
}

testSwaggerUI();