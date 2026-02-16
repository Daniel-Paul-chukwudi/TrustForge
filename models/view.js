const mongoose = require('mongoose');

const viewSchema =new mongoose.Schema({
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

const viewModel = mongoose.model('views', viewSchema);

module.exports = viewModel; 