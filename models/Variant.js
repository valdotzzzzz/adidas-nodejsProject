const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Variant = sequelize.define('Variant', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    colorway: {
        type: DataTypes.STRING,
        allowNull: false
    },
    size_type: {
        type: DataTypes.ENUM('US', 'UK', 'EU'),
        defaultValue: 'US',
        allowNull: false
    },
    size_value: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: false
    },
    stock_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    }
}, {
    tableName: 'variants',
    timestamps: true
});

module.exports = Variant;