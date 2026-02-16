const mongoose = require('mongoose');

const notificationSchema =new mongoose.Schema({
      userId:{
        type: mongoose.Schema.Types.ObjectId,
        
      },
      businessId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'businesses'
      },
      title:{
        type: String,
        trim: true
      },
      description:{
        type: String,
        trim: true
      },
      status:{
        type: String,
        enum: ['unread','read'],
        default:'unread'
      } 
  },
  {
    timestamps:true,
  }
);

const notificationModel = mongoose.model('notifications', notificationSchema);

module.exports = notificationModel; 