const mongoose = require('mongoose');

const likeSchema =new mongoose.Schema({
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'investors'          
    },
      businessId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'businesses'
      },


  },
  { 
    timestamps:true,
  }
);

const likeModel = mongoose.model('likes', likeSchema);

module.exports = likeModel; 