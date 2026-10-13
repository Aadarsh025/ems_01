const mongoose = require('mongoose');

exports.validateEmployee = (req, res, next) => {
  const { name, department, role, salary, joinDate } = req.body;
  const errors = {};

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100)
    errors.name = 'Name must be 2-100 characters';
  if (typeof department !== 'string' || !department.trim())
    errors.department = 'Department is required';
  if (typeof role !== 'string' || !role.trim())
    errors.role = 'Role is required';

  const sal = Number(salary);
  if (salary === '' || salary == null || Number.isNaN(sal) || sal <= 0)
    errors.salary = 'Salary must be a positive number';

  const date = new Date(joinDate);
  if (!joinDate || Number.isNaN(date.getTime())) errors.joinDate = 'A valid join date is required';
  else if (date > new Date()) errors.joinDate = 'Join date cannot be in the future';

  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  req.body = { name: name.trim(), department: department.trim(), role: role.trim(), salary: sal, joinDate: date };
  next();
};

exports.validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid employee id' });
  }
  next();
};
