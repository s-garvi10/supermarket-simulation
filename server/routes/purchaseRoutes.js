import { Router } from 'express';
import * as purchaseController from '../controllers/purchaseController.js';
import { validatePurchase } from '../middleware/validator.js';

const router = Router();

router.get('/', purchaseController.getAllPurchases);
router.post('/', validatePurchase, purchaseController.createPurchase);

export default router;
