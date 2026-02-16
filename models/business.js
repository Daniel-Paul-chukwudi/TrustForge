const mongoose = require('mongoose');

const businessSchema =new mongoose.Schema({
    businessName: {
      type: String,
      required: true,
      trim: true
    },
    industry: {
      type: String,
      required: true,
      trim: true
      
    },
    description: {
      type: String,
      required: true,
      trim: true
      
    },
    yearFounded: {
      type: Number
      
    },
    businessModel: {
      type: String,
      required: true,
      trim: true
      
    },
    revenueModel: {
      type: String,
      required: true,
      trim: true
      
    },
    targetMarket: {
      type: String,
      required: true,
      trim: true
      
    },
    fundingStage: {
      type: String,
      required: true,
      trim: true
      
    },
    fundingSought: {
      type: Number
      
    },
    currentRevenue: {
      type: Number
      
    },
    pitchdeck: {
      imageUrl: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    businessRegisterationCertificate: {
      imageUrl: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    fundRaised: {
      type: Number,
      default: 0
    },
    likeCount: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    },
    businessOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    businessOwnerName:{
      type: String,
      required: true,
      trim: true
    },
    businessStatus:{
      type: String,
      enum: ['under review','verified'],
      default:'under review'
    },
    businessViewCount:{
      type: Number,
      default:0
    },
    businessViewStatus:{
      type: String,
      enum: ['active','disabled'],
      default:'active'
    },
    subscriptionTier:{
      type: String,
      enum: ['free','growth','premium'],
      default:'free'
    }
  },
  {
    timestamps: true
  }
);

const businessModel = mongoose.model('businesses', businessSchema);

module.exports = businessModel; 