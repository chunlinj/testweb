// 商品描述接口
export interface ProductDescription {
  intro: string;
  format: string;
  promise: string;
  advantages: string[];
  notices: string[];
}

// 商品推荐接口
export interface ProductRecommendation {
  productId: string;
  sortOrder: number;
}

// 商品接口
export interface Product {
  _id?: string;
  title: string;
  price: number;
  stock: number;
  limitNum: number;
  type: string;
  shareType: string;
  validity: string;
  hotLabel: boolean;
  shareLabel: boolean;
  status: number;
  description: ProductDescription;
  recommendations?: ProductRecommendation[];
  createdAt?: Date;
  updatedAt?: Date;
} 