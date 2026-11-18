import { Router } from 'express';
import customerRoutes from './customerRoutes.js';
import membershipRoutes from './membershipRoutes.js';
import rewardRoutes from './rewardRoutes.js';
import purchaseRoutes from './purchaseRoutes.js';
import redemptionRoutes from './redemptionRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import healthRoutes from './healthRoutes.js';
import { resetDatabase } from '../controllers/analyticsController.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/customers', customerRoutes);
router.use('/memberships', membershipRoutes);
router.use('/rewards', rewardRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/redemptions', redemptionRoutes);
router.post('/reset', resetDatabase);

export default router;
