module.exports = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const errors = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid value for ' + err.path });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' });

  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
};
