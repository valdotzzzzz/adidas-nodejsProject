const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductImage = sequelize.define('ProductImage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    image_path: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'product_images',
    timestamps: true
});

module.exports = ProductImage;