module.exports = (err, req, res, next) => {
  console.error(err);
  
  // Custom structured errors based on what was passed
  const status = err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';

  res.status(status).json({ message });
};
