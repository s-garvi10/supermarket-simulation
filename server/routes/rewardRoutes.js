import { Router } from 'express';
import * as rewardController from '../controllers/rewardController.js';
import { validateReward } from '../middleware/validator.js';

const router = Router();

router.get('/', rewardController.getAllRewards);
router.get('/:id', rewardController.getRewardById);
router.post('/', validateReward, rewardController.createReward);
router.put('/:id', validateReward, rewardController.updateReward);
router.patch('/:id/toggle', rewardController.toggleRewardStatus);

export default router;
