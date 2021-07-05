import { UserInputError } from 'apollo-server';
import { Product, ProductModel } from '../../db/models/product';
import { ProductInCart } from '../../models/product-in-cart';

export const checkoutProduct = async (
  cartProduct: ProductInCart,
  session: any,
  productsAfterCheckout: Product[],
) => {
  const product = await ProductModel.findOne({ _id: cartProduct.id }).session(session);
  if (!product) {
    throw new UserInputError("Product Doesn't Exist");
  }
  if (cartProduct.amount <= product.amount) {
    const updatedProduct = await ProductModel.findOneAndUpdate(
      { _id: cartProduct.id },
      { amount: product.amount - cartProduct.amount },
      { new: true, session },
    );
    productsAfterCheckout.push(updatedProduct);
  } else {
    throw new UserInputError('checkout amount exceeding the product current available amount');
  }
};
