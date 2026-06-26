'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Look up all products so we can reference their real IDs by style_code
    //    (safer than hardcoding IDs, since they can shift between environments)
    const products = await queryInterface.sequelize.query(
      `SELECT id, style_code FROM products;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Helper: find a product's real DB id from its style_code
    const idFor = (styleCode) => {
      const match = products.find(p => p.style_code === styleCode);
      if (!match) {
        throw new Error(`Seeder error: no product found with style_code ${styleCode}`);
      }
      return match.id;
    };

    // Standard US adult shoe size run, used for most products
    const standardSizes = [8, 8.5, 9, 9.5, 10, 10.5, 11];

    // Smaller size run for kids' shoes
    const kidsSizes = [3, 3.5, 4, 4.5, 5, 5.5, 6];

    const variants = [];

    // Helper: push a full size run for one product + colorway combo
    function addSizeRun(styleCode, colorway, sizes, stockFn) {
      sizes.forEach((size, i) => {
        variants.push({
          product_id: idFor(styleCode),
          colorway: colorway,
          size_type: 'US',
          size_value: size,
          stock_level: stockFn(i),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    }

    // A simple varied stock pattern so some sizes show low-stock / out-of-stock states
    const normalStock = (i) => [10, 15, 20, 5, 0, 12, 8][i % 7];

    // ==========================================
    // RUNNING
    // ==========================================
    addSizeRun('HQ6339', 'Core Black / Solar Lemon', standardSizes, normalStock);
    addSizeRun('HQ6339', 'Cloud White / Grey', standardSizes, normalStock);

    addSizeRun('IF2364', 'Core Black', standardSizes, normalStock);

    addSizeRun('GX9777', 'Core Black / Solar Lemon / Solar Purple', standardSizes, normalStock);
    addSizeRun('GX9777', 'Cloud White / Core Black', standardSizes, normalStock);

    addSizeRun('IG8320', 'Pink / White', standardSizes, normalStock);

    addSizeRun('F36308', 'Core Black', standardSizes, normalStock);

    addSizeRun('IF7881', 'Blue / White', kidsSizes, normalStock);

    addSizeRun('ID7335', 'Grey / Pink', standardSizes, normalStock);

    // ==========================================
    // LIFESTYLE
    // ==========================================
    addSizeRun('B75807', 'Core Black / Cloud White', standardSizes, normalStock);

    addSizeRun('HQ6893', 'Cloud White / Gold Metallic', standardSizes, normalStock);
    addSizeRun('HQ6893', 'Core Black', standardSizes, normalStock);

    addSizeRun('EG4958', 'Cloud White / Core Black', standardSizes, normalStock);

    addSizeRun('FY7756', 'Cloud White / Core Black / Blue', standardSizes, normalStock);

    addSizeRun('HP4316', 'Core Black / Carbon', standardSizes, normalStock);

    addSizeRun('HQ8708', 'Core Black / Off White', standardSizes, normalStock);

    addSizeRun('HP2201', 'Cloud White / Green', standardSizes, normalStock);

    // ==========================================
    // BASKETBALL
    // ==========================================
    addSizeRun('HQ1419', 'Core Black / Solar Red', standardSizes, normalStock);

    addSizeRun('ID5660', 'Cloud White / Core Black', standardSizes, normalStock);

    addSizeRun('IE8325', 'Core Black / Gold', standardSizes, normalStock);

    addSizeRun('IF5600', 'Navy / Orange', standardSizes, normalStock);

    addSizeRun('G58623', 'Core Black / Pink', standardSizes, normalStock);

    addSizeRun('GZ2341', 'Grey / Core Black', standardSizes, normalStock);

    addSizeRun('GW7235', 'Core Black / Blue', kidsSizes, normalStock);

    return queryInterface.bulkInsert('variants', variants, {});
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('variants', null, {});
  }
};