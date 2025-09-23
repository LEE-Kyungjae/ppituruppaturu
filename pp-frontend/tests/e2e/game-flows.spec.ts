import { test, expect } from '@playwright/test';

test.describe('Critical Game Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to games page and display game list', async ({ page }) => {
    // Click on games navigation
    await page.click('text=게임');

    // Should be on games page
    await expect(page).toHaveURL('/games');

    // Should display game categories
    await expect(page.locator('text=물리 게임')).toBeVisible();
    await expect(page.locator('text=AI 게임')).toBeVisible();

    // Should have game cards
    const gameCards = page.locator('[data-testid="game-card"]');
    await expect(gameCards).toHaveCount(14); // Based on sitemap, we have 14 games
  });

  test('should play AI Paint Battle game', async ({ page }) => {
    // Navigate to AI Paint Battle
    await page.goto('/games/ai-paint-battle');

    // Check page title
    await expect(page).toHaveTitle('AI Paint Battle - PittuRu PpattuRu');

    // Should display game header
    await expect(page.locator('text=AI Paint Battle')).toBeVisible();

    // Should show game status
    await expect(page.locator('text=상태:')).toBeVisible();

    // Should display canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('width', '800');
    await expect(canvas).toHaveAttribute('height', '600');

    // Should show performance monitor
    await expect(page.locator('text=FPS:')).toBeVisible();
    await expect(page.locator('text=MEM:')).toBeVisible();

    // Should show brush tools
    await expect(page.locator('text=Brush Tools')).toBeVisible();
    await expect(page.locator('button:has-text("NEON")')).toBeVisible();
    await expect(page.locator('button:has-text("GLOW")')).toBeVisible();

    // Test brush selection
    const glowBrush = page.locator('button:has-text("GLOW")');
    await glowBrush.click();
    await expect(glowBrush).toHaveClass(/bg-cyber-pink/);

    // Test glitch mode toggle
    const glitchButton = page.locator('button:has-text("GLITCH OFF")');
    await glitchButton.click();
    await expect(page.locator('button:has-text("GLITCH ON")')).toBeVisible();

    // Test canvas clear
    const clearButton = page.locator('button:has-text("CLEAR CANVAS")');
    await clearButton.click();

    // Test game end
    const endGameButton = page.locator('button:has-text("게임 종료")');
    await endGameButton.click();

    // Should show game finished modal
    await expect(page.locator('text=게임 종료!')).toBeVisible();
  });

  test('should play Physics Jump game', async ({ page }) => {
    // Navigate to Physics Jump
    await page.goto('/games/physics-jump');

    // Should load the page
    await expect(page).toHaveURL('/games/physics-jump');

    // Page should not have critical errors
    const errorMessages = page.locator('text=Error');
    await expect(errorMessages).toHaveCount(0);
  });

  test('should access cross-platform physics jump game', async ({ page }) => {
    // Navigate to cross-platform game
    await page.goto('/games/cross-platform-physics-jump');

    // Should load the page
    await expect(page).toHaveURL('/games/cross-platform-physics-jump');

    // Page should not crash
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle game navigation flow', async ({ page }) => {
    // Start from home
    await page.goto('/');

    // Go to games page
    await page.click('text=게임');
    await expect(page).toHaveURL('/games');

    // Click on a specific game (AI Paint Battle)
    const paintBattleCard = page.locator('[href="/games/ai-paint-battle"]').first();
    await paintBattleCard.click();

    // Should be on game page
    await expect(page).toHaveURL('/games/ai-paint-battle');

    // Go back to games list using navigation
    const gamesListButton = page.locator('button:has-text("게임 목록")');
    await gamesListButton.click();

    // Should be back on games page
    await expect(page).toHaveURL('/games');
  });

  test('should display performance monitor across games', async ({ page }) => {
    const gamesToTest = [
      '/games/ai-paint-battle',
      '/games/physics-jump',
      '/games/memory-match'
    ];

    for (const gameUrl of gamesToTest) {
      await page.goto(gameUrl);

      // Should display FPS counter
      await expect(page.locator('text=FPS:')).toBeVisible({ timeout: 5000 });

      // FPS should be a reasonable number (not NaN or 0)
      const fpsText = await page.locator('text=FPS:').textContent();
      const fpsValue = parseInt(fpsText?.split(':')[1] || '0');
      expect(fpsValue).toBeGreaterThan(0);
      expect(fpsValue).toBeLessThan(200); // Sanity check
    }
  });

  test('should handle mobile responsive design', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    await page.goto('/games');

    // Should display mobile-friendly layout
    const gameGrid = page.locator('.grid');
    await expect(gameGrid).toBeVisible();

    // Navigate to a game
    await page.goto('/games/ai-paint-battle');

    // Canvas should be visible and responsive
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Control panel should be stacked on mobile
    const controlPanel = page.locator('.control-panel');
    await expect(controlPanel).toBeVisible();
  });

  test('should maintain game state during navigation', async ({ page }) => {
    await page.goto('/games/ai-paint-battle');

    // Toggle glitch mode
    const glitchButton = page.locator('button:has-text("GLITCH OFF")');
    await glitchButton.click();
    await expect(page.locator('button:has-text("GLITCH ON")')).toBeVisible();

    // Navigate away and back
    await page.goto('/games');
    await page.goto('/games/ai-paint-battle');

    // Glitch mode should be reset (new game instance)
    await expect(page.locator('button:has-text("GLITCH OFF")')).toBeVisible();
  });

  test('should handle WebSocket connection status', async ({ page }) => {
    await page.goto('/games/ai-paint-battle');

    // Should show connection status
    const connectionStatus = page.locator('text=CONNECTED, text=DISCONNECTED');
    await expect(connectionStatus).toBeVisible({ timeout: 5000 });

    // Should display room information if connected
    const roomInfo = page.locator('text=ROOM:');
    await expect(roomInfo).toBeVisible({ timeout: 10000 });
  });

  test('should load all critical pages without errors', async ({ page }) => {
    const criticalPages = [
      '/',
      '/games',
      '/games/ai-paint-battle',
      '/games/physics-jump',
      '/games/cross-platform-physics-jump',
      '/chat',
      '/shop'
    ];

    for (const url of criticalPages) {
      await page.goto(url);

      // Check for JavaScript errors
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      // Wait for page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Should not have critical errors
      expect(errors.filter(error =>
        !error.includes('favicon') &&
        !error.includes('Warning')
      )).toHaveLength(0);

      // Page should have content
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });
});