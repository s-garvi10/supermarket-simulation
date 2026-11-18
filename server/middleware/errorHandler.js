export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // PostgreSQL Unique Constraint Violation
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'A record with these details already exists.',
      detail: err.detail,
    });
  }

  // PostgreSQL Foreign Key Violation
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Referenced record was not found.',
      detail: err.detail,
    });
  }

  // PostgreSQL Check Constraint Violation
  if (err.code === '23514') {
    return res.status(400).json({
      error: 'Value violates a database validation constraint.',
      detail: err.detail,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
  });
}
