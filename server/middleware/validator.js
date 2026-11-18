export function validateCustomer(req, res, next) {
  const { name, phone } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Customer name is required.' });
  }
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return res.status(400).json({ error: 'Customer phone number is required.' });
  }
  next();
}

export function validateReward(req, res, next) {
  const { name, points_cost, discount } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Reward name is required.' });
  }
  if (points_cost == null || isNaN(Number(points_cost)) || Number(points_cost) <= 0) {
    return res.status(400).json({ error: 'Points cost must be a positive number.' });
  }
  if (discount == null || isNaN(Number(discount)) || Number(discount) < 0) {
    return res.status(400).json({ error: 'Discount must be a valid number.' });
  }
  next();
}

export function validatePurchase(req, res, next) {
  const { cashierName, grossAmount, paymentMethod } = req.body;
  if (!cashierName || typeof cashierName !== 'string' || !cashierName.trim()) {
    return res.status(400).json({ error: 'Cashier name is required.' });
  }
  if (grossAmount == null || isNaN(Number(grossAmount)) || Number(grossAmount) < 0) {
    return res.status(400).json({ error: 'Gross amount must be a positive number.' });
  }
  if (!paymentMethod || !['UPI', 'Card', 'Cash'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Payment method must be one of: UPI, Card, Cash.' });
  }
  next();
}

export function validateRedemption(req, res, next) {
  const { customerId, rewardId } = req.body;
  if (!customerId || !rewardId) {
    return res.status(400).json({ error: 'Both customerId and rewardId are required.' });
  }
  next();
}
