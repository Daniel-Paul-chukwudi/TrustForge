const mongoose = require('mongoose');

const kycbusinessownerSchema =new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    fullName: {
        type: String,
        required: true,
      trim: true
    },
    dateOfBirth: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    nationality: {
      type: String,
      required: true,
      trim: true
    },
    residentialAddress: {
        type: String,
        required: true,
        trim : true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    accountName: {
        type: String,
        required: true,
        trim: true
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true
    },
    accountType: {
        type: String,
        required: true,
        trim: true
    },
    bankName: {
        type: String,
        required: true,
        trim: true
    },
    profilePic: {
      imageUrl: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    governmentId: {
      imageUrl: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    proofOfAddress: {
      imageUrl: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

const kycbusinessownerModel = mongoose.model('kycbusinessowners', kycbusinessownerSchema);

module.exports = kycbusinessownerModel; 
