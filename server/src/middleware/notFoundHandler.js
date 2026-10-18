module.exports = (req, res, next) => {
  res.status(404).json({ message: 'The requested API endpoint does not exist.' });
};
