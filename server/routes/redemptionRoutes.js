import { Router } from 'express';
import * as redemptionController from '../controllers/redemptionController.js';
import { validateRedemption } from '../middleware/validator.js';

const router = Router();

router.get('/', redemptionController.getAllRedemptions);
router.post('/', validateRedemption, redemptionController.createRedemption);

export default router;
