/**
 * Centralized Error Handling Middleware
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({ error: `Not Found - ${req.method} ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  console.error('[Global Error]', err.stack || err.message);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error'
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
