const { chromium } = require('playwright');

async function openWebsite() {
  console.log('🌐 삐뚜루빠뚜루 웹사이트 열기 시작...');

  const browser = await chromium.launch({
    headless: false,  // 브라우저 창이 보이도록
    slowMo: 1000     // 느리게 실행하여 확인 가능
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📍 서버 연결 시도: http://152.67.201.101:3000');

    // 프론트엔드 페이지 열기
    await page.goto('http://152.67.201.101:3000', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ 웹페이지 로드 성공!');

    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);

    // 메인 요소들 확인
    const elements = await page.$$eval('*', els =>
      els.slice(0, 10).map(el => el.tagName).join(', ')
    );
    console.log(`🔍 페이지 요소들: ${elements}`);

    // 스크린샷 촬영
    await page.screenshot({
      path: '/Users/ze/work/pp/ppituru-screenshot.png',
      fullPage: true
    });
    console.log('📸 스크린샷 저장: /Users/ze/work/pp/ppituru-screenshot.png');

    // 5초 동안 브라우저 유지
    console.log('⏱️  5초 후 브라우저가 닫힙니다...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);

    // 백엔드 API 시도
    console.log('🔄 백엔드 API 연결 시도...');
    try {
      await page.goto('http://152.67.201.101:8080/health', { timeout: 10000 });
      const content = await page.textContent('body');
      console.log('🏥 백엔드 상태:', content);
    } catch (apiError) {
      console.error('❌ 백엔드 연결 실패:', apiError.message);
    }
  }

  await browser.close();
  console.log('🏁 브라우저 종료 완료');
}

openWebsite().catch(console.error);
