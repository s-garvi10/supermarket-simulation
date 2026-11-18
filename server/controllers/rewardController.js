import * as rewardService from '../services/rewardService.js';

export async function getAllRewards(req, res, next) {
  try {
    const rewards = await rewardService.getAllRewards();
    res.json(rewards);
  } catch (err) {
    next(err);
  }
}

export async function getRewardById(req, res, next) {
  try {
    const reward = await rewardService.getRewardById(req.params.id);
    if (!reward) {
      return res.status(404).json({ error: 'Reward not found.' });
    }
    res.json(reward);
  } catch (err) {
    next(err);
  }
}

export async function createReward(req, res, next) {
  try {
    const { name, points_cost, discount, description, is_active } = req.body;
    const created = await rewardService.createReward({
      name,
      points_cost,
      discount,
      description,
      is_active,
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function updateReward(req, res, next) {
  try {
    const { name, points_cost, discount, description, is_active } = req.body;
    const updated = await rewardService.updateReward(req.params.id, {
      name,
      points_cost,
      discount,
      description,
      is_active,
    });
    if (!updated) {
      return res.status(404).json({ error: 'Reward not found.' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function toggleRewardStatus(req, res, next) {
  try {
    const updated = await rewardService.toggleRewardStatus(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Reward not found.' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
