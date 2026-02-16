const mongoose = require('mongoose');

const meetingSchema =new mongoose.Schema({
      host:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'investors'
      },
      guest:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
      },
      meetingLink:{
        type: String
      },
      hostName:{
        type: String
      },
      businessOwnerName:{
        type: String
      },
      businessName:{
        type: String
      },
      rescheduleRole:{
        type: String
      },
      meetingTitle: {
        type: String,
        required: true,
      },
      date:{
        type: String,
        required: true
      },
      time: {
        type: String,
        required: true
      },
      meetingType:{
        type: String,
      },
      note:{
        type: String,
      },
      meetingStatus:{
        type: String,
        enum: ['Awaiting Approval','Approved and Upcoming','Reschedule Requested','Declined','Concluded'],
        default: 'Awaiting Approval'
      }
      
      
  },
  { 
    timestamps:true,
  }
);

const meetingModel = mongoose.model('meetings', meetingSchema);

module.exports = meetingModel; 