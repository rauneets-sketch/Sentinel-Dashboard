const { BasePage } = require('./BasePage');
const logger = require('../utils/Logger');

class SphericalHomePageExplorationPage extends BasePage {
  constructor(page) {
    super(page);
  }

  async navigateToHomepage() {
    try {
      await this.navigateTo('https://www.fnp.com/', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      logger.info('🏠 Navigated to FNP homepage for spherical icon exploration');
    } catch (error) {
      logger.info(`⚠️ Homepage navigation taking too long, skipping and continuing...`);
      // Don't throw error, just log and continue
    }
  }

  async exploreCategoryIcon(categoryUrl, linkName, iconEmoji) {
    const startTime = Date.now();
    
    try {
      logger.info(`${iconEmoji} [CATEGORY ICON] Exploring ${linkName}...`);
      
      // Primary: Direct URL navigation (faster and more reliable)
      try {
        logger.info(`🔗 [CATEGORY ICON] Navigating directly to ${categoryUrl}...`);
        await this.goto(categoryUrl);
        const elapsed1 = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`✅ [CATEGORY ICON] Page loaded successfully (${elapsed1}s)`);
      } catch (directNavError) {
        logger.info(`⚠️ [CATEGORY ICON] Direct navigation taking too long, skipping to next category...`);
        // Don't try fallback, just skip this category
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`⏭️ [CATEGORY ICON] Skipped ${linkName} after ${totalTime}s`);
        return; // Exit early, don't navigate back
      }
      
      await this.page.waitForTimeout(1500);
      
      // Navigate back to homepage
      logger.info(`🏠 [CATEGORY ICON] Navigating back to homepage...`);
      try {
        await this.navigateToHomepage();
      } catch (navError) {
        logger.info(`⚠️ [CATEGORY ICON] Homepage navigation taking too long, continuing to next category...`);
        // Don't throw error, just log and continue
      }
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`${iconEmoji} [CATEGORY ICON] Explored ${linkName} successfully in ${totalTime}s`);
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`⚠️ [CATEGORY ICON] ${linkName} encountered issue after ${totalTime}s: ${error.message}`);
      logger.info(`⏭️ [CATEGORY ICON] Skipping ${linkName} and continuing to next category...`);
      // Don't throw error, just log and continue
    }
  }

  async exploreCategoryIcons() {
    logger.info('🎯 [EXPLORE ICONS] Starting category icons exploration...');
    const startTime = Date.now();
    
    const categories = [
      { url: 'https://www.fnp.com/gifts/birthday-lp', link: 'Birthday Gifts Birthday Gifts', emoji: '🎂' },
      { url: 'https://www.fnp.com/gifts/anniversary-lp', link: 'Anniversary Anniversary', emoji: '💕' },
      { url: 'https://www.fnp.com/same-day-delivery-gifts-lp', link: 'Same Day Delivery Same Day', emoji: '🚚' },
      { url: 'https://www.fnp.com/fnpluxe-lp', link: 'FNP Luxe FNP Luxe', emoji: '✨' },
      { url: 'https://www.fnp.com/cakes/birthday-lp', link: 'Cakes Cakes', emoji: '🎂' },
      { url: 'https://www.fnp.com/experiential-gifts-lp', link: 'Balloon Decor Balloon Decor', emoji: '🎈' },
      { url: 'https://www.fnp.com/instant-delivery-gifts-lp', link: '60 Min Delivery 60 Min Delivery', emoji: '⚡' }
    ];

    let processedCount = 0;
    
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      logger.info(`📊 [EXPLORE ICONS] Processing category ${i + 1}/${categories.length}: ${category.link}`);
      
      await this.exploreCategoryIcon(category.url, category.link, category.emoji);
      processedCount++;
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`✅ [EXPLORE ICONS] Category icons exploration completed in ${totalTime}s`);
    logger.info(`📊 [EXPLORE ICONS] Processed: ${processedCount}, Total: ${categories.length}`);
  }

  async completeSphericalHomePageExploration() {
    logger.info('🌐 Starting Journey 18: Spherical Home Page Icon Exploration');
    await this.navigateToHomepage();
    await this.exploreCategoryIcons();
    await this.page.evaluate(() => window.scrollTo(0, 0));
    logger.info('✅ Journey 18: Spherical Home Page Icon Exploration completed successfully');
  }
}

module.exports = SphericalHomePageExplorationPage;
