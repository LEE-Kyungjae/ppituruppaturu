const { chromium } = require('playwright');
const fs = require('fs');

async function comprehensiveSwaggerAnalysis() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Set viewport to ensure consistent screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });

    try {
        console.log('🚀 Starting comprehensive Swagger UI analysis...');

        // Navigate to Swagger UI
        console.log('📡 Navigating to Swagger UI...');
        await page.goto('http://localhost:8080/swagger/index.html', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for Swagger UI to fully load
        await page.waitForSelector('.swagger-ui', { timeout: 30000 });
        await page.waitForTimeout(3000); // Additional wait for dynamic content

        // Take initial screenshot
        console.log('📸 Taking full page screenshot...');
        await page.screenshot({
            path: '/Users/ze/work/pp/pp-backend/swagger_comprehensive_overview.png',
            fullPage: true
        });

        // Get comprehensive API endpoint information
        console.log('🔍 Analyzing API endpoints...');
        const apiAnalysis = await page.evaluate(() => {
            const results = {
                totalEndpoints: 0,
                categories: {},
                endpoints: [],
                gameEndpoints: [],
                backofficeEndpoints: [],
                authEndpoints: [],
                userEndpoints: [],
                paymentEndpoints: [],
                gameServerEndpoints: []
            };

            // Find all operation blocks
            const operations = document.querySelectorAll('.opblock');
            results.totalEndpoints = operations.length;

            // Analyze each endpoint
            operations.forEach((op, index) => {
                const method = op.querySelector('.opblock-summary-method')?.textContent?.trim();
                const path = op.querySelector('.opblock-summary-path')?.textContent?.trim();
                const summary = op.querySelector('.opblock-summary-description')?.textContent?.trim() || '';

                // Get the tag/category from parent section
                let category = 'uncategorized';
                let categoryElement = op.closest('.opblock-tag-section');
                if (categoryElement) {
                    const tagHeader = categoryElement.querySelector('.opblock-tag');
                    if (tagHeader) {
                        category = tagHeader.textContent.trim();
                    }
                }

                const endpoint = {
                    index: index + 1,
                    method: method?.toUpperCase() || 'UNKNOWN',
                    path: path || 'unknown-path',
                    summary: summary,
                    category: category
                };

                results.endpoints.push(endpoint);

                // Categorize endpoints by type
                if (!results.categories[category]) {
                    results.categories[category] = [];
                }
                results.categories[category].push(endpoint);

                // Categorize by functionality
                const pathLower = path?.toLowerCase() || '';
                const summaryLower = summary.toLowerCase();

                if (pathLower.includes('/game') || pathLower.includes('/match') || pathLower.includes('/room') ||
                    summaryLower.includes('game') || summaryLower.includes('match') || summaryLower.includes('room')) {
                    results.gameEndpoints.push(endpoint);
                }

                if (pathLower.includes('/admin') || pathLower.includes('/backoffice') ||
                    summaryLower.includes('admin') || summaryLower.includes('관리')) {
                    results.backofficeEndpoints.push(endpoint);
                }

                if (pathLower.includes('/auth') || pathLower.includes('/login') || pathLower.includes('/token') ||
                    summaryLower.includes('auth') || summaryLower.includes('login') || summaryLower.includes('token')) {
                    results.authEndpoints.push(endpoint);
                }

                if (pathLower.includes('/user') || pathLower.includes('/profile') ||
                    summaryLower.includes('user') || summaryLower.includes('profile')) {
                    results.userEndpoints.push(endpoint);
                }

                if (pathLower.includes('/payment') || pathLower.includes('/billing') || pathLower.includes('/purchase') ||
                    summaryLower.includes('payment') || summaryLower.includes('billing') || summaryLower.includes('purchase')) {
                    results.paymentEndpoints.push(endpoint);
                }

                if (pathLower.includes('/ws') || pathLower.includes('/websocket') || pathLower.includes('/socket') ||
                    summaryLower.includes('websocket') || summaryLower.includes('socket')) {
                    results.gameServerEndpoints.push(endpoint);
                }
            });

            return results;
        });

        // Get API spec information
        const specInfo = await page.evaluate(() => {
            const title = document.querySelector('.info .title')?.textContent?.trim() || 'No title';
            const version = document.querySelector('.info .version')?.textContent?.trim() || 'No version';
            const description = document.querySelector('.info .description')?.textContent?.trim() || 'No description';
            const baseUrl = document.querySelector('.info .base-url')?.textContent?.trim() || 'No base URL';

            return { title, version, description, baseUrl };
        });

        // Expand some key endpoints for detailed screenshots
        console.log('🔍 Expanding key endpoints for detailed view...');

        // Try to expand first few endpoints from different categories
        const expandTargets = [
            '[data-path*="/auth"]',
            '[data-path*="/game"]',
            '[data-path*="/user"]',
            '[data-path*="/admin"]'
        ];

        for (const target of expandTargets) {
            try {
                const element = await page.$(target);
                if (element) {
                    await element.click();
                    await page.waitForTimeout(1000);
                }
            } catch (e) {
                // Continue if element not found
            }
        }

        // Take detailed screenshot with expanded endpoints
        console.log('📸 Taking detailed screenshot with expanded endpoints...');
        await page.screenshot({
            path: '/Users/ze/work/pp/pp-backend/swagger_detailed_expanded.png',
            fullPage: true
        });

        // Check for models/schemas
        console.log('📋 Analyzing API models and schemas...');
        const models = await page.evaluate(() => {
            const modelElements = document.querySelectorAll('.models .model-container, .model-box');
            return Array.from(modelElements).map(model => {
                const title = model.querySelector('.model-title, .model-name')?.textContent?.trim();
                const properties = Array.from(model.querySelectorAll('.property')).map(prop => {
                    const name = prop.querySelector('.prop-name')?.textContent?.trim();
                    const type = prop.querySelector('.prop-type')?.textContent?.trim();
                    return { name, type };
                });
                return { title, properties };
            }).filter(model => model.title);
        });

        // Generate comprehensive report
        const report = {
            timestamp: new Date().toISOString(),
            specInfo,
            totalEndpoints: apiAnalysis.totalEndpoints,
            categories: Object.keys(apiAnalysis.categories).map(cat => ({
                name: cat,
                count: apiAnalysis.categories[cat].length,
                endpoints: apiAnalysis.categories[cat]
            })),
            functionalGroups: {
                game: apiAnalysis.gameEndpoints,
                backoffice: apiAnalysis.backofficeEndpoints,
                auth: apiAnalysis.authEndpoints,
                user: apiAnalysis.userEndpoints,
                payment: apiAnalysis.paymentEndpoints,
                gameServer: apiAnalysis.gameServerEndpoints
            },
            allEndpoints: apiAnalysis.endpoints,
            models: models,
            screenshots: [
                'swagger_comprehensive_overview.png',
                'swagger_detailed_expanded.png'
            ]
        };

        // Save detailed JSON report
        fs.writeFileSync(
            '/Users/ze/work/pp/pp-backend/swagger_analysis_report.json',
            JSON.stringify(report, null, 2)
        );

        // Print comprehensive console report
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE SWAGGER UI ANALYSIS REPORT');
        console.log('='.repeat(80));

        console.log(`\n📈 OVERVIEW:`);
        console.log(`   Title: ${specInfo.title}`);
        console.log(`   Version: ${specInfo.version}`);
        console.log(`   Total API Endpoints: ${apiAnalysis.totalEndpoints}`);
        console.log(`   API Categories: ${Object.keys(apiAnalysis.categories).length}`);
        console.log(`   Models/Schemas: ${models.length}`);

        console.log(`\n📂 API CATEGORIES:`);
        Object.keys(apiAnalysis.categories).forEach(cat => {
            console.log(`   • ${cat}: ${apiAnalysis.categories[cat].length} endpoints`);
        });

        console.log(`\n🎮 FUNCTIONAL GROUPS:`);
        console.log(`   • Gaming Platform APIs: ${apiAnalysis.gameEndpoints.length}`);
        console.log(`   • Backend Office APIs: ${apiAnalysis.backofficeEndpoints.length}`);
        console.log(`   • Authentication APIs: ${apiAnalysis.authEndpoints.length}`);
        console.log(`   • User Management APIs: ${apiAnalysis.userEndpoints.length}`);
        console.log(`   • Payment APIs: ${apiAnalysis.paymentEndpoints.length}`);
        console.log(`   • Game Server APIs: ${apiAnalysis.gameServerEndpoints.length}`);

        console.log(`\n🔍 DETAILED ENDPOINT LIST:`);
        apiAnalysis.endpoints.forEach(endpoint => {
            console.log(`   ${endpoint.index.toString().padStart(2, '0')}. ${endpoint.method.padEnd(6)} ${endpoint.path} - ${endpoint.summary}`);
        });

        if (apiAnalysis.gameEndpoints.length > 0) {
            console.log(`\n🎯 KEY GAMING PLATFORM APIs:`);
            apiAnalysis.gameEndpoints.forEach(endpoint => {
                console.log(`   • ${endpoint.method} ${endpoint.path} - ${endpoint.summary}`);
            });
        }

        if (apiAnalysis.backofficeEndpoints.length > 0) {
            console.log(`\n🏢 BACKEND OFFICE APIs:`);
            apiAnalysis.backofficeEndpoints.forEach(endpoint => {
                console.log(`   • ${endpoint.method} ${endpoint.path} - ${endpoint.summary}`);
            });
        }

        if (models.length > 0) {
            console.log(`\n📋 API MODELS/SCHEMAS:`);
            models.forEach(model => {
                console.log(`   • ${model.title} (${model.properties.length} properties)`);
            });
        }

        console.log(`\n📸 SCREENSHOTS GENERATED:`);
        console.log(`   • swagger_comprehensive_overview.png (Full overview)`);
        console.log(`   • swagger_detailed_expanded.png (Detailed with expanded endpoints)`);

        console.log(`\n💾 REPORT SAVED:`);
        console.log(`   • swagger_analysis_report.json (Detailed JSON report)`);

        console.log('\n' + '='.repeat(80));
        console.log('✅ COMPREHENSIVE ANALYSIS COMPLETE');
        console.log('='.repeat(80));

        return report;

    } catch (error) {
        console.error('❌ Error during analysis:', error.message);

        // Take error screenshot
        try {
            await page.screenshot({
                path: '/Users/ze/work/pp/pp-backend/swagger_error_analysis.png',
                fullPage: true
            });
            console.log('Error screenshot saved');
        } catch (e) {
            console.error('Failed to take error screenshot');
        }

        throw error;
    } finally {
        await browser.close();
    }
}

// Run the analysis
comprehensiveSwaggerAnalysis().catch(console.error);