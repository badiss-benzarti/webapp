export interface Order {
  _id: string;
  productId: number;
  quantity: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}
