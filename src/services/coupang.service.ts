/* eslint-disable no-await-in-loop */
import axios, { AxiosPromise } from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../utils/systemlogger';
import { ICategoryList } from '../interfaces/coupang.interface';
import CoupangSql from '../sql/coupang.sql';
import CategoryService from './category.service';
import Slack from '../utils/slack';

class CoupangService {
  private coupangSql = new CoupangSql();

  private cateogoryService = new CategoryService();

  private timeOut(time: number) {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(true), time * 1000);
    });
  }

  private async coupangAxios(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let axiosData;
      const source = axios.CancelToken.source();
      setTimeout(() => {
        if (axiosData) {
          source.cancel();
          reject(new Error('타임아웃 발생'));
        }
      }, 12000);

      const config = {
        method: 'get',
        url: `${url}`,
        headers: {
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
        },
        timeout: 10000,
        withCredentials: true,
      };
      axios(config as any)
        .then(data => {
          axiosData = data;
          resolve(axiosData);
        })
        .catch(error => reject(error));
    });
  }

  public async urlCategoryList(url: string): Promise<ICategoryList[]> {
    const html = await this.coupangAxios(url);
    const $ = cheerio.load(html.data);
    const iteamList = [];

    $('.baby-product-link').each((index, elem) => {
      iteamList.push({
        name: $(elem).find('.name').text().trim(),
        discountPrice: Number($(elem).find('.base-price').text().trim().replace(/,/gi, '')),
        price: Number($(elem).find('.price-value').text().trim().replace(/,/gi, '')),
        url: elem.attribs.href,
        attribs: {
          iteamId: elem.attribs['data-item-id'],
          productId: elem.attribs['data-product-id'],
          vendorItemId: elem.attribs['data-vendor-item-id'],
        },
        imageUrl: $(elem).find('.image > img')[0].attribs.src,
        rating: {
          starPoint: Number($(elem).find('.rating').text()),
          total: Number($(elem).find('.rating-total-count').text().replace(/\(|\)/gi, '')),
        },
      });
    });

    return iteamList;
  }

  public async testUrl(url: string): Promise<void> {
    const categoryList = await this.urlCategoryList(url);
    console.log(categoryList);
  }

  public async getCategoryList(catagoryCode: number, page: number): Promise<ICategoryList[]> {
    // https://www.coupang.com/np/categories/498704?listSize=60&filterType=rocket_wow%2Ccoupang_global&page=3
    log(`https://www.coupang.com/np/campaigns/82/components/${catagoryCode}?listSize=60&page=${page}&filterType=rocket%2C`, true);
    const categoryList = await this.urlCategoryList(`https://www.coupang.com/np/campaigns/82/components/${catagoryCode}?listSize=60&page=${page}&filterType=rocket%2C`);
    return categoryList;
  }

  /**
   * 쿠팡에 지정된 ID값 기준으로 가격 정보를 모두 긁어옵니다.
   */
  public async mainScraping(idx: number, catagoryCode: number): Promise<boolean> {
    let page = 1;
    for (;;) {
      try {
        const list = await this.getCategoryList(catagoryCode, page);
        if (list.length <= 0) {
          await this.cateogoryService.updateCategoryStatus(idx, 2); // 작업 완료
          break;
        }
        list.forEach(async x => {
          await this.coupangSql.addCoupangIteam(x, catagoryCode);
        });
        page += 1;
        await this.timeOut(4);
      } catch (error) {
        console.log(error.name);
        Slack.message('오류', `오류 메세지 : ${error.name}`, 2);

        if (error.response && error.response.status === 500) {
          await this.cateogoryService.updateCategoryStatus(idx, 3);
          break;
        }

        log('-- 타임아웃 발생으로 다시 시작', true);
        log(error, true);
        await this.timeOut(10);
      }
    }

    return true;
  }
}

export default CoupangService;
