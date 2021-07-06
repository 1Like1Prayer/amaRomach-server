import { ApolloError } from 'apollo-server';
import { Types } from 'mongoose';
import { Product } from '../../db/models/product';

export const cart: Record<string, Record<string, number>> = {};

export const createUserCart = (userId: string) => {
  if (!cart.hasOwnProperty(userId)) {
    cart[userId] = {};
  }
};

export const removeUserFromCart = (userId: string) => {
  const productsToRemove: Record<string, number> = {};
  if (cart[userId] !== undefined) {
    Object.keys(cart[userId]).forEach((productId: string) => {
      productsToRemove[productId] = -cart[userId][productId];
    });
    delete cart[userId];
  }
  return productsToRemove;
};

export const checkoutUser = (userId: string) => {
  cart[userId] = {};
};

export const addItemToCart = (userId: string, productId: Types.ObjectId) => {
  createUserCart(userId);
  cart[userId][productId.toString()] = 1;
};

export const removeItemFromCart = (userId: string, productId: string) => {
  if (!cart.hasOwnProperty(userId)) {
    throw new ApolloError('User ID is not valid');
  }
  if (!cart[userId].hasOwnProperty(productId)) {
    throw new ApolloError('Product does not exist in user`s cart');
  }
  const amount = -cart[userId][productId];
  delete cart[userId][productId];
  return amount;
};

export const updateItemInCart = (userId: string, productId: string, amount: number) => {
  if (!cart.hasOwnProperty(userId)) {
    throw new ApolloError('User ID is not valid');
  }
  const broadcastAmount =
    amount > cart[userId][productId]
      ? amount - cart[userId][productId]
      : -(cart[userId][productId] - amount);
  cart[userId][productId] = amount;
  return broadcastAmount;
};

export const reduceCart = (products: Product[]) => {
  return products.map((product: Product) => {
    if (product.amount !== undefined) {
      product.amount = Object.keys(cart).reduce(
        (amount: number, userId: string) =>
          (amount -= productAmountInUserCart(userId, product._id)),
        product.amount,
      );
    }
    return product;
  });
};

const productAmountInUserCart = (userId: string, productId: Types.ObjectId) =>
  Object.keys(cart[userId]).find((id: string) => id === productId.toString())
    ? cart[userId][productId.toString()]
    : 0;
