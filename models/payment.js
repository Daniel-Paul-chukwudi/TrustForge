const mongoose = require('mongoose');

const paymentSchema =new mongoose.Schema({
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      businessId:{
        type: mongoose.Schema.Types.ObjectId,
      },
      paymentType:{
        type: String,
        enum: ['subscription','investment'],
        
      },
      userType:{
        type: String,
        enum: ['businessOwner','investor'],
        
      },
      price: {
        type: Number,
      
      },
      reference: {
        type: String,
        
      },
      status: {
        type: String,
        enum: ['Pending', 'Successful', 'Failed'],
        default: 'Pending'
      }



  },
  {
    timestamps:true,
  }
);

const paymentModel = mongoose.model('payments', paymentSchema);

module.exports = paymentModel; 