
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const demoUsers = [
  {
    name: 'HR Admin',
    email: 'admin@company.com',
    password: 'Password@123',
    role: 'admin',
  },
  {
    name: 'Manager',
    email: 'manager@company.com',
    password: 'Password@123',
    role: 'manager',
  },
  {
    name: 'Employee',
    email: 'employee@company.com',
    password: 'Password@123',
    role: 'employee',
  },
];

async function seedUsers() {
  try {
    await connectDB();

    for (const userData of demoUsers) {
      const existingUser = await User.findOne({
        email: userData.email,
      });

      if (existingUser) {
        console.log(`Already exists: ${userData.email}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(
        userData.password,
        10
      );

      await User.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
      });

      console.log(`Created ${userData.role}: ${userData.email}`);
    }

    console.log('\nUser seeding completed successfully!');
  } catch (error) {
    console.error('User seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedUsers();
