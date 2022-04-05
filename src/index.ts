import cron from 'node-cron';
import { log } from './utils/systemlogger';
import CoupangService from './services/coupang.service';
import CategoryService from './services/category.service';
import Slack from './utils/slack';
import { performance } from 'node:perf_hooks';

const coupangService = new CoupangService();

const categoryService = new CategoryService();

Slack.setUrl(process.env.SLACK_KEY);

async function allCoupangScraping() {
  const categoryInfo = await categoryService.categoryToOne();

  if (categoryInfo) {
    await categoryService.updateCategoryStatus(categoryInfo.idx, 1); // 작업중
    log(`${categoryInfo.name} (${categoryInfo.coupangCategory}) 시작`, true);

    await coupangService.mainScraping(categoryInfo.idx, categoryInfo.coupangCategory);

    log(`${categoryInfo.name} (${categoryInfo.coupangCategory}) 완료`, true);
    allCoupangScraping();
  } else {
    log('모든 작업이 완료되었습니다', true);
    Slack.message('안내', '모든 크롤링 작업이 완료되었습니다.', 0);
    const categoryCk = await categoryService.categoryCk();
    if (categoryCk) {
      let t0 = performance.now();
      await categoryService.itemListMainCopy();
      let t1 = performance.now();

      log('메인으로 복사합니다.', true);
      Slack.message('안내', `메인으로 파일 복사를 완료하였습니다.\n ${(t1 - t0).toFixed(5)} ms`, 0);

      t0 = performance.now();
      await categoryService.itemlistHistoryCopy();
      t1 = performance.now();

      log('히스토리로 카피 작업을 진행합니다.', true);
      Slack.message('안내', `히스토리 카피 작업 진행을 완료했습니다. \n ${(t1 - t0).toFixed(5)} ms`, 0);
    }
  }
}

export async function coupangScrapingCron(): Promise<void> {
  log('쿠* 스크래핑 준비 완료', true);
  Slack.message('안내', `쿠* 스크래핑 준비 완료`, 0);

  cron.schedule(`00 00 00 * * *`, async () => {
    // 카테고리 초기화
    Slack.message('안내', `매일 12시 스크래핑을 시작합니다.`, 0);
    await categoryService.resetCategory();
    await allCoupangScraping();
  });
}

export async function coupangScraping(): Promise<void> {
  log('쿠* 강제 스크래핑 준비 완료', true);
  Slack.message('안내', `쿠* 강제 스크래핑 준비 완료`, 0);

  // 카테고리 초기화
  await categoryService.resetCategory();
  await allCoupangScraping();
}

// coupangService.testUrl(`https://www.coupang.com/np/campaigns/82/components/194176`);

// 강제 크롤링 테스트
// coupangScraping();

// 실제 크롤링 모드
// coupangScrapingCron();

(async () => {
  if (process.env.SCRAPING_MODE === 'production') {
    coupangScrapingCron();
  } else if (process.env.SCRAPING_MODE === 'forced') {
    coupangScraping();
  } else {
    coupangService.testUrl(`https://www.coupang.com/np/campaigns/82/components/194176`);
  }
})();
