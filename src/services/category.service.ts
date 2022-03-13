import CategorySql from '../sql/category.sql';

class CategoryService {
  private categorySql = new CategorySql();

  public async categoryCk(): Promise<boolean> {
    const categoryCk = await this.categorySql.categoryCk();
    return categoryCk;
  }

  public async categoryToOne(): Promise<any> {
    const mainList = await this.categorySql.categoryToOne();
    return mainList.rowData;
  }

  public async updateCategoryStatus(idx: number, processCode: number): Promise<void> {
    await this.categorySql.updateCategoryStatus(idx, processCode);
  }

  public async resetCategory(): Promise<void> {
    await this.categorySql.resetCategory();
  }

  public async itemlistHistoryCopy(): Promise<void> {
    await this.categorySql.itemlistHistoryCopy();
  }

  public async itemListMainCopy(): Promise<void> {
    await this.categorySql.itemListMainCopy();
  }
}

export default CategoryService;
