import * as analyticsService from '../services/analyticsService.js';

export async function getAnalytics(req, res, next) {
  try {
    const stats = await analyticsService.getAnalytics();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function resetDatabase(req, res, next) {
  try {
    const result = await analyticsService.resetDatabase();
    res.json({
      message: 'Database reset successfully.',
      ...result,
    });
  } catch (err) {
    next(err);
  }
}
