const Employee = require('../models/Employee');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SORTABLE = ['name', 'department', 'role', 'salary', 'joinDate', 'createdAt'];

// GET /api/employees?search=&department=&sortBy=&order=&page=&limit=
exports.getEmployees = async (req, res, next) => {
  try {
    const { search = '', department = '', sortBy = 'createdAt', order = 'desc' } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const filter = {};
    if (search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ name: rx }, { role: rx }, { department: rx }];
    }
    if (department) filter.department = department;

    const sortField = SORTABLE.includes(sortBy) ? sortBy : 'createdAt';
    const sort = { [sortField]: order === 'asc' ? 1 : -1, _id: 1 };

    const [data, total, departments] = await Promise.all([
      Employee.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Employee.countDocuments(filter),
      Employee.distinct('department'),
    ]);

    res.json({ data, total, page, pages: Math.max(Math.ceil(total / limit), 1), departments: departments.sort() });
  } catch (err) {
    next(err);
  }
};

exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    next(err);
  }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    next(err);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted', id: employee._id });
  } catch (err) {
    next(err);
  }
};
