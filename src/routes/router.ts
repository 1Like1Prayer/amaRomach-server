import * as Router from 'koa-router';
import * as productController from '../controllers/products-controller';
import { addErrorMiddlewares } from '../middlewares/error-middleware';

export const productRouter = new Router();
addErrorMiddlewares(productRouter);
productRouter.get('/products', productController.getProducts);
productRouter.get('/products/:id', productController.getProductById);
productRouter.post('/product', productController.addProduct);
productRouter.put('/products/:id', productController.editProduct);
productRouter.delete('/product/:id', productController.deleteProduct);
productRouter.post('/checkout', productController.checkOut);
