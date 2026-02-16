const mongoose = require('mongoose');

const agreementSchema =new mongoose.Schema({
      investorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'investors'
      },
      businessName:{
        type: String,
        required: true,
        trim: true
      },
      businessOwner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
      },
      businessOwnerName:{
        type: String,
        required: true,
        trim: true
      },
      businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'businesses'
      },
      totalInvestment:{
        type: Number
      },
      agrementStatus:{
        type: String,
        enum: ['meetup','negociation','ongoing','finalized'],
        default:"meetup"
      },

  },
  {
    timestamps:true,
  }
);

const agreementModel = mongoose.model('agreements', agreementSchema);

module.exports = agreementModel; 