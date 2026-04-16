/**
 * Centralized Error Handler Middleware
 * 
 * Catches all errors thrown in route handlers and sends
 * a consistent JSON error response. This avoids duplicating
 * try-catch blocks in every route.
 * 
 * Alternative: Individual try-catch in each route — rejected
 * because it leads to inconsistent error responses and duplicate code.
 */

function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this value already exists'
    });
  }

  // MySQL foreign key error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      error: 'Invalid reference',
      message: 'Referenced record does not exist'
    });
  }

  // Validation errors (custom)
  if (err.status === 400) {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }

  // Not found errors (custom)
  if (err.status === 404) {
    return res.status(404).json({
      error: 'Not Found',
      message: err.message
    });
  }

  // Default server error
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  });
}

module.exports = errorHandler;
