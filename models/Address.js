const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    label: {
        type: DataTypes.STRING,
        defaultValue: 'Home'
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address_line: {
        type: DataTypes.STRING,
        allowNull: false
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    province: {
        type: DataTypes.STRING,
        allowNull: true
    },
    postal_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'addresses',
    timestamps: true
});

module.exports = Address;