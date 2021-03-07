import { Socket } from 'socket.io';
import { Product } from '../db/models/product';
import { ProductInCart } from '../models/product-in-cart';

export const cart: Record<string, Record<string, number>> = {};

export const createUserCart = (userId: string) => {
  cart[userId] = {};
};

export const removeUserFromCart = (socket: Socket) => {
  if (cart[socket.id] !== undefined) {
    Object.keys(cart[socket.id]).forEach((productId: string) => {
      socket.broadcast.emit('update product in client', productId, -cart[socket.id][productId]);
    });
    delete cart[socket.id];
  }
};

export const checkoutUser = (userId: string) => {
  Object.keys(cart[userId]).forEach((productId: string) => {
    cart[userId][productId] = 0;
  });
};

export const addItemToCart = (userId: string, product: ProductInCart) => {
  cart[userId][product.id] = product.amount;
};

export const removeItemFromCart = (socket: Socket, productId: string) => {
  socket.broadcast.emit('update product in client', productId, -cart[socket.id][productId]);
  delete cart[socket.id][productId];
};

export const updateItemInCart = (socket: Socket, productId: string, amount: number) => {
  const broadcastAmount =
    amount > cart[socket.id][productId]
      ? amount - cart[socket.id][productId]
      : -(cart[socket.id][productId] - amount);
  cart[socket.id][productId] = amount;
  socket.broadcast.emit('update product in client', productId, broadcastAmount);
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

const productAmountInUserCart = (userId: string, productId: string) =>
  Object.keys(cart[userId]).find((id: string) => id === productId.toString())
    ? cart[userId][productId]
    : 0;
