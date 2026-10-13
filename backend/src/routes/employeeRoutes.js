const router = require('express').Router();
const c = require('../controllers/employeeController');
const { protect, allowRoles } = require('../middleware/auth');
const { validateEmployee, validateId } = require('../middleware/validate');

router.use(protect); // every employee route needs a valid token

router.get('/', c.getEmployees);
router.get('/:id', validateId, c.getEmployee);

// Only HR admins can change data
router.post('/', allowRoles('admin'), validateEmployee, c.createEmployee);
router.put('/:id', allowRoles('admin'), validateId, validateEmployee, c.updateEmployee);
router.delete('/:id', allowRoles('admin'), validateId, c.deleteEmployee);

module.exports = router;
