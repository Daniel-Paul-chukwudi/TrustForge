// const { Sequelize, DataTypes, Model } = require('sequelize');
// // const sequelize = require('../Database/database');

// class admin extends Model {}

// admin.init(
//   {
//     id: {
//         allowNull: false,
//         primaryKey: true,
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4
//       },
//       fullName: {
//         type: DataTypes.STRING,
//         allowNull:false
//       },
//       role: {
//         type: DataTypes.STRING,
//         allowNull:false,
//         defaultValue:'admin'
//       },
//   },
//   {
//     sequelize, 
//     modelName: 'admins', 
//     timestamps:true,
//   }
// );

// module.exports = admin 