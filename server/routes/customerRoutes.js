import { Router } from 'express';
import * as customerController from '../controllers/customerController.js';
import { validateCustomer } from '../middleware/validator.js';

const router = Router();

router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', validateCustomer, customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);

export default router;
