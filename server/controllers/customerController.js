import * as customerService from '../services/customerService.js';

export async function getAllCustomers(req, res, next) {
  try {
    const customers = await customerService.getAllCustomers();
    res.json(customers);
  } catch (err) {
    next(err);
  }
}

export async function getCustomerById(req, res, next) {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    res.json(customer);
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req, res, next) {
  try {
    const { name, email, phone } = req.body;
    const result = await customerService.createCustomer(name, email, phone);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    const { name, email, phone } = req.body;
    const updated = await customerService.updateCustomer(req.params.id, name, email, phone);
    if (!updated) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
