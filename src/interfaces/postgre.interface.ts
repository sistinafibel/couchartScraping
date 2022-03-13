export interface IPostgreSqlReturn {
  rowCount: number;
  rows: Array<any>;
  jsondata: any;
  message?: string;
}

export interface ISqlReturn<T> {
  rowCount: number;
  rowData: T;
}

export interface ISqlJsonReturn<T> {
  rowCount: number;
  rowData: { list: Array<T> };
}

export interface ISqlArrayReturn<T> {
  rowCount: number;
  rowData: Array<T>;
}
