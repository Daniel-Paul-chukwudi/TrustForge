const mongoose = require('mongoose');

const saveSchema =new mongoose.Schema({
      userId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      businessId:{
        type: mongoose.Schema.Types.ObjectId,
      },
  },
  {
    timestamps:true,
  }
);

const saveModel = mongoose.model('saves', saveSchema);

module.exports = saveModel; 