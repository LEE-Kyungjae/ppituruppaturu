const { chromium } = require('playwright');

async function investigateSwagger() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Listen for network requests
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      timestamp: new Date().toISOString()
    });
  });

  // Listen for network responses
  const networkResponses = [];
  page.on('response', response => {
    networkResponses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      timestamp: new Date().toISOString()
    });
  });

  try {
    console.log('Navigating to Swagger UI...');
    await page.goto('http://localhost:8080/swagger/index.html', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(3000);

    // Take initial screenshot
    console.log('Taking initial screenshot...');
    await page.screenshot({
      path: '/Users/ze/work/pp/pp-frontend/swagger-initial.png',
      fullPage: true
    });

    // Check if there are any error messages visible on the page
    console.log('Checking for error messages...');
    const errorElements = await page.$$eval('[class*="error"], [class*="Error"], .swagger-ui .error',
      elements => elements.map(el => ({
        className: el.className,
        textContent: el.textContent.trim(),
        innerHTML: el.innerHTML
      }))
    );

    // Check for any loading indicators
    const loadingElements = await page.$$eval('[class*="loading"], [class*="Loading"]',
      elements => elements.map(el => ({
        className: el.className,
        textContent: el.textContent.trim()
      }))
    );

    // Try to find the main Swagger container and see what's inside
    const swaggerContent = await page.evaluate(() => {
      const swaggerContainer = document.querySelector('.swagger-ui');
      if (swaggerContainer) {
        return {
          hasContent: swaggerContainer.children.length > 0,
          innerHTML: swaggerContainer.innerHTML.substring(0, 1000), // First 1000 chars
          textContent: swaggerContainer.textContent.trim().substring(0, 500)
        };
      }
      return { hasContent: false, innerHTML: '', textContent: '' };
    });

    // Check if there's a specific error about loading the spec
    const specError = await page.evaluate(() => {
      const errorText = document.body.textContent;
      if (errorText.includes('Failed to load API definition') ||
          errorText.includes('Unable to render') ||
          errorText.includes('500') ||
          errorText.includes('Internal Server Error')) {
        return errorText;
      }
      return null;
    });

    // Try to manually check the /swagger/doc.json endpoint
    console.log('Checking /swagger/doc.json endpoint...');
    try {
      const docResponse = await page.goto('http://localhost:8080/swagger/doc.json');
      const docStatus = docResponse.status();
      let docContent = '';

      if (docStatus === 200) {
        docContent = await docResponse.text();
      } else {
        docContent = `HTTP ${docStatus}: ${docResponse.statusText()}`;
      }

      // Go back to swagger UI
      await page.goto('http://localhost:8080/swagger/index.html');
      await page.waitForTimeout(2000);

      console.log('Doc.json response status:', docStatus);
      console.log('Doc.json content preview:', docContent.substring(0, 200));

    } catch (docError) {
      console.log('Error checking doc.json:', docError.message);
    }

    // Take final screenshot
    await page.screenshot({
      path: '/Users/ze/work/pp/pp-frontend/swagger-final.png',
      fullPage: true
    });

    // Print results
    console.log('\n=== INVESTIGATION RESULTS ===\n');

    console.log('Console Messages:');
    consoleMessages.forEach(msg => {
      console.log(`  [${msg.type.toUpperCase()}] ${msg.text}`);
      if (msg.location) {
        console.log(`    Location: ${msg.location.url}:${msg.location.lineNumber}`);
      }
    });

    console.log('\nNetwork Requests:');
    networkRequests.forEach(req => {
      console.log(`  ${req.method} ${req.url}`);
    });

    console.log('\nNetwork Responses:');
    networkResponses.forEach(res => {
      console.log(`  ${res.status} ${res.statusText} - ${res.url}`);
    });

    console.log('\nError Elements Found:');
    if (errorElements.length > 0) {
      errorElements.forEach(error => {
        console.log(`  Class: ${error.className}`);
        console.log(`  Text: ${error.textContent}`);
        console.log(`  HTML: ${error.innerHTML.substring(0, 200)}`);
      });
    } else {
      console.log('  No error elements found');
    }

    console.log('\nLoading Elements:');
    if (loadingElements.length > 0) {
      loadingElements.forEach(loading => {
        console.log(`  Class: ${loading.className}`);
        console.log(`  Text: ${loading.textContent}`);
      });
    } else {
      console.log('  No loading indicators found');
    }

    console.log('\nSwagger Container Content:');
    console.log(`  Has Content: ${swaggerContent.hasContent}`);
    console.log(`  Text Content: ${swaggerContent.textContent}`);
    if (swaggerContent.innerHTML) {
      console.log(`  HTML Preview: ${swaggerContent.innerHTML.substring(0, 300)}...`);
    }

    if (specError) {
      console.log('\nSpec Loading Error:');
      console.log(`  ${specError.substring(0, 500)}`);
    }

  } catch (error) {
    console.error('Error during investigation:', error);
    await page.screenshot({
      path: '/Users/ze/work/pp/pp-frontend/swagger-error.png',
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

investigateSwagger().catch(console.error);