import * as membershipService from '../services/membershipService.js';

export async function getAllMemberships(req, res, next) {
  try {
    const memberships = await membershipService.getAllMemberships();
    res.json(memberships);
  } catch (err) {
    next(err);
  }
}

export async function getMembershipByCustomerId(req, res, next) {
  try {
    const membership = await membershipService.getMembershipByCustomerId(req.params.customerId);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found for customer.' });
    }
    res.json(membership);
  } catch (err) {
    next(err);
  }
}

export async function lookupMember(req, res, next) {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter q is required.' });
    }
    const match = await membershipService.lookupMember(query);
    if (!match) {
      return res.status(404).json({ error: 'Member not found.' });
    }
    res.json(match);
  } catch (err) {
    next(err);
  }
}
