import * as db from '../database/postgre.db';
import { ICategoryList } from '../interfaces/coupang.interface';

class CoupangSql {
  public async addCoupangIteam(iteamData: ICategoryList, categoryCode: number): Promise<void> {
    const sql = `INSERT INTO main.itemlist (coupang_id, coupang_category, category, title, discount_price, price, review_star, review_count, images)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
    await db.query(sql, [iteamData.attribs.iteamId, categoryCode, categoryCode, iteamData.name, iteamData.discountPrice, iteamData.price, iteamData.rating.starPoint, iteamData.rating.total, iteamData.imageUrl]);
  }
}

export default CoupangSql;
