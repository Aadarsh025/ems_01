const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    department: { type: String, required: true, trim: true, maxlength: 60 },
    role: { type: String, required: true, trim: true, maxlength: 80 },
    salary: { type: Number, required: true, min: [1, 'Salary must be greater than 0'] },
    joinDate: { type: Date, required: true },
  },
  { timestamps: true }
);

employeeSchema.index({ name: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ joinDate: -1 });

module.exports = mongoose.model('Employee', employeeSchema);
