require('dotenv').config()
const  cloudinary  = require('../config/cloudinary')
const fs = require('fs')
const business = require('../models/business')
const businessModel = require('../models/business')
const userModel = require('../models/user')
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET
const likeModel = require('../models/like')
const viewModel = require('../models/view')
const saveModel = require('../models/save')
const ticketModel = require('../models/supportticket')
const agreementModel = require('../models/agreement')
const notificationModel = require('../models/notification')
const investorModel = require('../models/investor')

exports.createBusiness = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      businessName,
      description,
      industry,
      yearFounded,
      businessModel,
      revenueModel,
      targetMarket,
      fundingStage,
      fundingSought,
      currentRevenue,
      pitchDeck,
      businessRegistrationCertificate
      
    } = req.body;
    const Bcheck = await business.findOne({businessName:businessName})
    const businessCount = await business.find({businessOwner: userId})
    const user = await userModel.findById(userId)

    // if(user.kycStatus === 'not provided'){
    //   return res.status(401).json({
    //     message: 'Please submit your KYC for verification before you can create a business '
    //   })
    // }else if(user.kycStatus === 'under review'){
    //   return res.status(401).json({
    //     message: 'Your KYC is currently under review, please wait for it to be verified before you can create a business'
    //   })
    // }


    const pitchD = req.files.pitchDeck
    const businessReg = req.files.businessRegistrationCertificate

    if(!pitchD && businessReg){
      fs.unlinkSync(businessReg[0].path)
      return res.status(400).json({
        message:"Please submit both documents for review"
      })
    }else if(pitchD && !businessReg){
      fs.unlinkSync(pitchD[0].path)
      return res.status(400).json({
        message:"Please submit both documents for review"
      })
    }else if(!pitchD && !businessReg){
      fs.unlinkSync(pitchD[0].path)
      fs.unlinkSync(businessReg[0].path)
      return res.status(400).json({
        message:"Please submit both documents for review"
      })
    }

    if(user.subscriptionTier === 'free' && businessCount.length == 1 ){
      fs.unlinkSync(pitchD[0].path)
      fs.unlinkSync(businessReg[0].path)
      return res.status(401).json({
        message:'Sorry you have already reached the maximum number of businesses for this subscription tier. Please upgrade in order to add more businesses.'
      })
    }else if (user.subscriptionTier === 'growth' && businessCount.length == 3){
      fs.unlinkSync(pitchD[0].path)
      fs.unlinkSync(businessReg[0].path)
      return res.status(401).json({
        message:'Sorry you have already reached the maximum number of businesses for this subscription tier. Please upgrade in order to add more businesses.'
      })
    }else if (user.subscriptionTier === 'premium' && businessCount.length == 5){
      fs.unlinkSync(pitchD[0].path)
      fs.unlinkSync(businessReg[0].path)
      return res.status(401).json({
        message:'Sorry you have already reached the maximum number of businesses possible.'
      })
    }
    

    if(Bcheck){
      fs.unlinkSync(pitchD[0].path)
      fs.unlinkSync(businessReg[0].path)
      return res.status(403).json({
        message:"A business with this name already exists"
      })
    }else {
    let file
    if(!pitchD || !businessReg){
      fs.unlinkSync(pitchD[0].path)
      fs.unlinkSync(businessReg[0].path)
      return res.status(403).json({
        message:"some of the neccesary fields are missing"
      })
    }else{
    file = pitchD[0]
    
    const responseP = await cloudinary.uploader.upload(file.path, {resource_type: "auto"})
    fs.unlinkSync(file.path)

    file = businessReg[0]
    const responseB = await cloudinary.uploader.upload(file.path, {resource_type: "auto"})
    fs.unlinkSync(file.path)

    const newBusiness = new business({
      businessName,
      description,
      industry,
      yearFounded,
      businessModel,
      revenueModel,
      targetMarket,
      fundingStage,
      fundingSought,
      currentRevenue,
      subscriptionTier:user.subscriptionTier,
      pitchDeck:responseP.secure_url,
      businessRegisterationCertificate:responseB.secure_url,
      pitchDeckPublicId:responseP.public_id,
      businessRegisterationCertificatePublicId:responseB.public_id,
      businessOwner: userId,
      businessOwnerName:user.fullName
    });
    await newBusiness.save()
    await notificationModel.create({
      userId,
      businessId:newBusiness.id,
      title:`Your ${businessName} has been created successfully`,
      description:`hello ${user.fullName} your business has been created but is currently under review , once verified it will be live.\n
      Thank you for putting your trust in TrustForge 👊😁`
    })

    res.status(201).json({
      message: "Business created successfully",
      data: newBusiness
    });
    }
  }

  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.likeBusiness = async (req, res) => {
  try {
    const { businessId } = req.body;
    const { id } = req.user;

    const business = await businessModel.findById(businessId);
    const user = await investorModel.findById(id)
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const likeCheck = await likeModel.findOne( { userId: id, businessId } )

    if (likeCheck) {
      business.likeCount -= 1;
      await business.save();
      await likeModel.findByIdAndDelete(likeCheck._id)
      return res.status(200).json({
        message: "Unliked successfully",
        businesslikes: business.likeCount
      });
    } else {
      await likeModel.create({ userId: id, businessId });
      business.likeCount += 1;
      await business.save();
      await notificationModel.create({
      userId:business.businessOwner,
      businessId,
      title:`someone just liked your business`,
      description:`hello ${business.businessOwnerName} an investor just liked your business hopefully this like will turn into an investment.\n 
      TrustForge Team 👊😁`
      })
      return res.status(200).json({
        message: "Liked successfully",
        businesslikes: business.likeCount
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.viewBusiness = async (req, res) => {
  try {
    const { businessId } = req.body;
    const { id } = req.user;

    const user = await investorModel.findById(id);
    const business = await businessModel.findById(businessId);

    if (!business) return res.status(404).json({ message: "Business not found" });

    const viewCheck = await viewModel.findOne( { userId: id, businessId } )

    if (user.subscribed === false) {
      return res.status(401).json({
        message:`Hello ${user.fullName}, your subscription has expired please subscribe to continue`
      });
    }

    if (!viewCheck) {
      await viewModel.create({ userId: id, businessId });
      business.viewCount += 1;
      await business.save();
      user.viewAllocation -= 1;
      if (user.viewAllocation <= 0) user.subscribed = false;
      await user.save();
    }
    await notificationModel.create({
      userId:business.businessOwner,
      businessId,
      title:`someone just viewed your business`,
      description:`hello ${business.businessOwnerName} an investor just viewed your business hope they are convinced into making an investment.\n 
      TrustForge Team 👊😁`
      })

    return res.status(200).json({
      message: "Viewed successfully",
      businessviews: business.viewCount,
      data: business
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.saveBusiness = async (req, res) => {
  try {
    const { businessId } = req.body;
    const { id } = req.user;

    const business = await businessModel.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const saveCheck = await saveModel.findOne( { userId: id, businessId } )

    if (saveCheck) {
      await saveModel.findByIdAndDelete( saveCheck._id)
      return res.status(200).json({
        message: "Unsaved successfully"
      });
    } else {
      await saveModel.create({ userId: id, businessId });
      await notificationModel.create({
      userId:business.businessOwner,
      businessId,
      title:`someone just saved your business`,
      description:`hello ${business.businessOwnerName} an investor just saved your business, you are one step closer to securing an investment.\n 
      TrustForge Team 👊😁`
      })
      return res.status(200).json({
        message: "Saved successfully",
        data: business
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.getBusiness = async (req, res) => {
  try {
    const businesses = await businessModel.find({businessStatus:'verified'});
    // let target
    // let premium = []
    // let growth = []
    // let free = []
    // for (const x of businesses){
    //   target = await userModel.findById(x.businessOwner)
    //   if (target.subscriptionTier !== 'premium' && target.subscriptionTier !== 'growth'){
    //     free.push(x)
    //   }else if(target.subscriptionTier !== 'premium' && target.subscriptionTier === 'growth'){
    //     growth.push(x)
    //   }else{
    //     premium.push(x)
    //   }
    // }

    res.status(200).json({
      message: "All businesses retrieved successfully",
      data:businesses
      
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.getOneById = async (req, res) => {
  try {
    const id = req.params.id;
    const target = await businessModel.findById(id);
    let remaining
    if (!target) {
      return res.status(404).json({ message: "Business not found" });
    }

    let diff
    if (target.fundRaised > target.fundingSought){
       diff = 0
    }else if(target.fundRaised < target.fundingSought){
       diff =  target.fundingSought - target.fundRaised
    }
    
    
    const interests = await agreementModel.find({businessId:id})
    if(diff <= 0 ){
      remaining = 0
      return res.status(200).json({
      message: "Business found",
      data: target,
      remaining,
      investorIntrests:interests,
      investorCount:interests.length
    });
    }else{
      return res.status(200).json({
      message: "Business found",
      data: target,
      remaining:diff,
      investorIntrests:interests,
      investorCount:interests.length
    });
    }
    
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.getByIndustry = async (req, res) => {
  try {
    const { industry } = req.query;
    const targets = await businessModel.find( { industry: industry } )
    res.status(200).json({
      message:`Businesses in the ${industry} industry`,
      data: targets
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


exports.updateB = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    const business = await businessModel.findById(id);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    await businessModel.findByIdAndUpdate(business._id,{updates});
    res.status(200).json({
      message: "Business updated successfully",
      data: business
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.deleteB = async(req,res)=>{
    try {
        const id = req.params.id
        const target = await businessModel.findById(id)
        if(!target){
          return res.status(404).json({
            message:"business not found"
          })
        }
        await businessModel.findByIdAndDelete(target._id)
        res.status(200).json({
            message:"Business data deleted successfully",
        })

    } catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message
        })
    }
}

exports.requestDelete = async(req,res)=>{
    try {
        const {id} = req.user
        const {businessId} = req.body
        const newTicket  = await ticketModel.create({
            userId:id,
            title:"Request to delete business",
            businessId,
            ticketStatus:"open"
        })
        res.status(201).json({
            message:"Your support Ticket has been created, you should recieve a response soon",
            data:newTicket
        })

    } catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message
        })
    }
}