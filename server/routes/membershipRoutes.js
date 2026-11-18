import { Router } from 'express';
import * as membershipController from '../controllers/membershipController.js';

const router = Router();

router.get('/', membershipController.getAllMemberships);
router.get('/lookup', membershipController.lookupMember);
router.get('/customer/:customerId', membershipController.getMembershipByCustomerId);

export default router;
