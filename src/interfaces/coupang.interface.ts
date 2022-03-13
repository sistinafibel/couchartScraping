export interface ICategoryList {
  readonly name: string;
  readonly discountPrice: number;
  readonly price: number;
  readonly url: string;
  readonly attribs: {
    readonly iteamId: string;
    readonly productId: string;
    readonly vendorItemId: string;
  };
  readonly imageUrl: string;
  readonly rating: {
    readonly starPoint: number;
    readonly total: number;
  };
}
