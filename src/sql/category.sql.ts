import * as db from '../database/postgre.db';
import { IPostgreSqlReturn, ISqlArrayReturn } from '../interfaces/postgre.interface';

class CategorySql {
  // 최종 진행중인 프로세스가 어디까지 온건지 결과 받기
  public async categoryCk(): Promise<boolean> {
    const sql = `
      SELECT idx FROM main.category c 
      WHERE is_process = ANY('{0,1}') 
      `;

    const sqlValue = [];
    const queryData: IPostgreSqlReturn = await db.query(sql, sqlValue);

    return queryData.rowCount === 0;
  }

  public async categoryToOne(): Promise<ISqlArrayReturn<any>> {
    const sql = `
    SELECT 
      idx,
      coupang_category AS "coupangCategory",
      name
    FROM main.category
    WHERE is_process = 0 
    ORDER BY idx ASC 
    LIMIT 1 `;

    const sqlValue = [];
    const queryData: IPostgreSqlReturn = await db.query(sql, sqlValue);

    return {
      rowCount: queryData.rowCount,
      rowData: queryData.rows[0],
    };
  }

  public async updateCategoryStatus(idx: number, processCode: number): Promise<void> {
    // 0 : 기본 , 1 : 진행중 , 2: 완료, 3: ERROR
    const sql = `
      UPDATE main.category SET (is_process , updatedate) = ($2, now())
      WHERE idx = $1
    `;

    const sqlValue = [idx, processCode];
    await db.query(sql, sqlValue);
  }

  public async resetCategory(): Promise<void> {
    const sql = `
      UPDATE main.category SET is_process = 0
      WHERE (now() + '-1 days' > updatedate)
    `;
    await db.query(sql, []);

    const sql2 = `DELETE FROM main.itemlist`;
    await db.query(sql2, []);
  }

  // 가격 정보 업데이트
  public async itemlistHistoryCopy(): Promise<void> {
    const sql = `
      WITH itemView AS (
        SELECT * FROM main.main_itemlist i 
        WHERE (coupang_id , idx) in (
            SELECT coupang_id, max (idx) FROM main.main_itemlist GROUP BY coupang_id
        )
        ORDER BY idx DESC
      )
      INSERT INTO main.itemlist_history (coupang_id, price, writedate)
      SELECT coupang_id, price, writedate FROM itemView
    `;
    await db.query(sql, []);
  }

  // 복제 후 관리 용도
  public async itemListMainCopy(): Promise<void> {
    await db.transactionsBegin();

    // 과거 데이터에서 변동된 데이터, 또는 추가되는 데이터 제거
    const sql = `
      WITH itemView AS (
        SELECT * FROM main.itemlist i 
        WHERE (coupang_id , idx) in (
          SELECT coupang_id, max (idx) FROM main.itemlist GROUP BY coupang_id
        )
        ORDER BY idx DESC
      ),
      itemDelete AS (
        SELECT mi.idx FROM itemView iv
        JOIN main.main_itemlist mi
        ON mi.coupang_id = iv.coupang_id
      )
      DELETE FROM main.main_itemlist mi2 
      WHERE mi2.idx IN (SELECT idx FROM itemDelete)
    `;
    await db.transactionsQuery(sql, []);

    const sql2 = `
      WITH itemView AS (
        SELECT * FROM main.itemlist i 
        WHERE (coupang_id , idx) in (
          SELECT coupang_id, max (idx) FROM main.itemlist GROUP BY coupang_id
        )
        ORDER BY idx DESC
      ),
      itemInsert AS (
        SELECT * FROM itemView iv
        LEFT JOIN main.main_itemlist mi
        ON mi.coupang_id = iv.coupang_id
        WHERE mi.idx IS NULL
      )
      INSERT INTO main.main_itemlist (coupang_id, coupang_category, category, title, main_content, sub_content, discount_price, price, review_star, review_count, images, reward_url)
      SELECT coupang_id, coupang_category, category,  title, main_content, sub_content, discount_price, price, review_star, review_count, images, reward_url FROM itemView
    `;
    await db.transactionsQuery(sql2, []);
    await db.transactionsCommit();
  }
}

export default CategorySql;
