import * as mongoose from 'mongoose';

export interface ProductInterface extends mongoose.Document {
    name: string;
    description: string;
    price: number;
    amount: number;
}

const productSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
}, { versionKey: false });

export const Product = mongoose.model<ProductInterface>('Product', productSchema);
