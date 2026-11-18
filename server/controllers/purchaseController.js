import * as purchaseService from '../services/purchaseService.js';

export async function getAllPurchases(req, res, next) {
  try {
    const purchases = await purchaseService.getAllPurchases();
    res.json(purchases);
  } catch (err) {
    next(err);
  }
}

export async function createPurchase(req, res, next) {
  try {
    const {
      customerId,
      cashierName,
      grossAmount,
      rewardId,
      paymentMethod,
      notes,
      items,
    } = req.body;

    const purchase = await purchaseService.createPurchase({
      customerId: customerId || null,
      cashierName,
      grossAmount,
      rewardId: rewardId || null,
      paymentMethod,
      notes,
      items: items || [],
    });

    res.status(201).json(purchase);
  } catch (err) {
    next(err);
  }
}
