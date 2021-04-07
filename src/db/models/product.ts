import * as mongoose from 'mongoose';

export interface Product extends mongoose.Document {
  name: string;
  description: string;
  imagePath: string;
  price: number;
  amount: number;
  rating: number;
}

const productSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: false },
    description: { type: String, required: true },
    imagePath: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    rating: { type: Number, required: true },
  },
  { versionKey: false },
);

export const ProductModel = mongoose.model<Product>('Product', productSchema);
