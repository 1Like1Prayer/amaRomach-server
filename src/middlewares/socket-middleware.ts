import { Socket } from 'socket.io';
import {
  addItemToCart,
  checkoutUser,
  createUserCart,
  removeItemFromCart,
  removeUserFromCart,
  updateItemInCart,
} from '../cache/cart';
import { logger } from '../utils/logs/logger';

export const socketMiddleware = (socket: Socket, next: any) => {
  socket.on('connected', () => {
    logger.info(`inside socket connected -${socket.id}`);
    createUserCart(socket.id);
  });

  socket.on('add to cart', (productId) => {
    addItemToCart(socket.id, { id: productId, amount: 0 });
  });

  socket.on('remove from cart', (productId: string) => {
    removeItemFromCart(socket, productId);
  });

  socket.on('update product in cart', (productId: string, amount: number) => {
    updateItemInCart(socket, productId, amount);
  });

  socket.on('checkout', () => checkoutUser(socket.id));

  socket.on('disconnect', () => {
    logger.info(`socket disconnected - ${socket.id}`);
    removeUserFromCart(socket);
  });
  next();
};
