// backend/models/userModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const bcrypt = require('bcryptjs');

const User = sequelize.define(
  'User',
  {
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    update_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    profile_type: {
      type: DataTypes.ENUM('Admin', 'Registered', 'Guest'),
      defaultValue: 'Guest',
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    password_salt: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email_verification: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    security_update_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    permissions_override: {
      type: DataTypes.JSON, // requires MySQL 5.7+
      allowNull: true,
    },
    last_template_id: {  //to link the saved template
      type: DataTypes.STRING(24),
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: false, // we already have update_time
    hooks: {
      // Hash password before create
      beforeCreate: async (user) => {
        const salt = await bcrypt.genSalt(10);
        user.password_salt = salt;
        // NOTE: we expect password_hash to contain the *plain* password on create
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
        user.security_update_time = new Date();
        user.update_time = new Date();
      },
      // Hash password before update *if it changed*
      beforeUpdate: async (user) => {
        if (user.changed('password_hash')) {
          const salt = await bcrypt.genSalt(10);
          user.password_salt = salt;
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
          user.security_update_time = new Date();
        }
        user.update_time = new Date();
      },
    },
  }
);

// Instance method for login checks
User.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password_hash);
};

module.exports = User;
