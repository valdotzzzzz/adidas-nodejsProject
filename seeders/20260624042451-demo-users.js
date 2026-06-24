'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up (queryInterface, Sequelize) {
    // Pre-hash passwords so they are compatible with your login authentication system
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    return queryInterface.bulkInsert('users', [
      // ==========================================
      // ADMINISTRATIVE ACCOUNT (1)
      // ==========================================
      {
        name: 'System Administrator',
        email: 'admin@adidas.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // ==========================================
      // STAFF ACCOUNT (1)
      // ==========================================
      {
        name: 'Store Staff',
        email: 'staff@adidas.com',
        password: hashedPassword,
        role: 'staff',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // ==========================================
      // CUSTOMER ACCOUNTS (3)
      // ==========================================
      {
        name: 'Gean Valdez',
        email: 'gean@customer.com',
        password: hashedPassword,
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Jane Doe',
        email: 'jane@customer.com',
        password: hashedPassword,
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Mark Reyes',
        email: 'mark@customer.com',
        password: hashedPassword,
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {
      ignoreDuplicates: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert migration framework: Clears the explicitly seeded test accounts
    return queryInterface.bulkDelete('users', {
      email: [
        'admin@adidas.com',
        'staff@adidas.com',
        'gean@customer.com',
        'jane@customer.com',
        'mark@customer.com'
      ]
    }, {});
  }
};