const { Sequelize, DataTypes, Model } = require('sequelize');
const mongoose = require('mongoose');

const supportticketSchema =new mongoose.Schema({
      userId:{
        type: mongoose.Schema.Types.ObjectId,
      },
      businessId:{
        type: mongoose.Schema.Types.ObjectId,
      },
      title:{
        type: String,
        trim: true
      },
      description:{
        type: String,
        trim: true
      },
      ticketStatus:{
        type: String,
        enum: ['open','under review','closed'],
        default:'open'
      }
      
      
  },
  {
    timestamps:true,
  }
);

const supportticketModel = mongoose.model('supporttickets', supportticketSchema);

module.exports = supportticketModel; 