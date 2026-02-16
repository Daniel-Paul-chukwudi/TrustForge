const mongoose = require('mongoose');

const userSchema =new mongoose.Schema({
      fullName: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        trim: true
      },
      phoneNumber:{
        type: String,
        required: true,
      },
      password: {
        type: String,
        required: true
      },
      isVerified:{
        type: Boolean,
        required: true,
        default: false
      },
      isGoogle:{
        type: Boolean,
        required: true,
        default: false
      },
      role:{
        type: String,
        required: true,
        default:"BusinessOwner"
      },
      subscribed:{
        type: Boolean,
        default: false
      },
      subscriptionTier:{
        type: String,
        enum: ['free','growth','premium'],
        default:'free'
      },
      renew:{
        type: Boolean,
        default: false
      },
      subscriptionStart:{
        type: Number,
      },
      subscriptionEnd:{
        type: Number
      },
      otp:{
        type: String,
      },
      otpExpiredAt:{
        type: Number
      },
      kycStatus:{
        type: String,
        enum: ['not provided','under review','verified'],
        default:'not provided'
      }
  },
  {
    timestamps:true,
  }
);

const userModel = mongoose.model('users', userSchema);

module.exports = userModel; 