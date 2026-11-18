import * as redemptionService from '../services/redemptionService.js';

export async function getAllRedemptions(req, res, next) {
  try {
    const redemptions = await redemptionService.getAllRedemptions();
    res.json(redemptions);
  } catch (err) {
    next(err);
  }
}

export async function createRedemption(req, res, next) {
  try {
    const { customerId, rewardId } = req.body;
    const redemption = await redemptionService.createRedemption(customerId, rewardId);
    res.status(201).json(redemption);
  } catch (err) {
    next(err);
  }
}
