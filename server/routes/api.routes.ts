import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { categoryController } from '../controllers/category.controller.js';
import { userController } from '../controllers/user.controller.js';
import { orderController } from '../controllers/order.controller.js';

export const apiRouter = Router();

// --- PRODUCT ROUTES ---
apiRouter.route('/products')
  .post(productController.createProduct)
  .get(productController.getProducts);

apiRouter.route('/products/:id')
  .get(productController.getProductById)
  .put(productController.updateProduct)
  .delete(productController.deleteProduct);

// --- CATEGORY ROUTES ---
apiRouter.route('/categories')
  .post(categoryController.createCategory)
  .get(categoryController.getCategories);

apiRouter.route('/categories/:idOrSlug')
  .get(categoryController.getCategoryByIdOrSlug);

apiRouter.route('/categories/:id')
  .put(categoryController.updateCategory)
  .delete(categoryController.deleteCategory);

// --- USER ROUTES ---
apiRouter.route('/users')
  .post(userController.createUser)
  .get(userController.getUsers);

apiRouter.route('/users/:id')
  .get(userController.getUserById)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

// --- ORDER ROUTES ---
apiRouter.route('/orders')
  .post(orderController.createOrder)
  .get(orderController.getOrders);

apiRouter.route('/orders/:id')
  .get(orderController.getOrderById)
  .put(orderController.updateOrder)
  .delete(orderController.deleteOrder);

export default apiRouter;
