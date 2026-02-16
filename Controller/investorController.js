
require('dotenv').config()
const userModel = require('../models/user')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const {verify,forgotPassword,verify2,forgotPassword2} = require('../Middleware/emailTemplates')
const sendEmail = require('../Middleware/Bmail')
const investorModel = require('../models/investor')
// const agreementModel = require('../models/agreement')
// const saveModel = require("../models/save")
// const businessModel = require('../models/business')
// const meetingModel = require('../models/meeting')
// const notificationModel = require('../models/notification')
// const kycModel = require('../models/kyc-investor')



exports.makeDeal = async (req,res)=>{
    try {
        const investorId = req.user.id
        const businessId = req.params.id

        const business = await businessModel.findOne({id:businessId})
        if(!business){
          return res.status(404).json({
            message:"business not found"
          })
        }

        const deal = await agreementModel.create({
            investorId,
            businessOwner:business.businessOwner,
            businessId,
            agreementStatus:"meetup"
        })
        res.status(201).json({
            message: `Meeting between ${investorId} and ${businessId} created`,
            data:deal
        })


    } catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message
        })
    }
}

exports.investorResendOtp = async (req,res)=>{
  try {
    const { email } = req.body
    const user = await investorModel.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(404).json({
        message: 'Investor not found',
      })
    }

    const newOtp = Math.floor(1000 + Math.random() * 900000).toString()
    user.otp = newOtp
    user.otpExpiredAt = Date.now() + 1000 * 60 * 5 // 2 minutes later
    await user.save()

    const emailOptions = {
      email: user.email,
      subject: 'OTP Resent',
      html: verify(newOtp, user.fullName),
    }

    await sendEmail(emailOptions)

    res.status(200).json({
      message: 'OTP resent successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.signUp = async (req, res, next) => {
  try {
    const { fullName, phoneNumber,email,subscriptionTier, password,confirmPassword } = req.body
    const user = await userModel.findOne({ email: email.toLowerCase() })
    const investor = await investorModel.findOne({email:email.toLowerCase()})
    
    
    if (user !== null) {
      return res.status(403).json({
        message: 'email already exists, Log in to your account',
      })
      return next(createError(404, "User not found"));
    }else if(investor !==null){
      return res.status(403).json({
        message: 'email already exists, Log in to your account',
      })
    }
    
    if(password !== confirmPassword){   
      return res.status(403).json({
        message:"Passwords dont match"
      })
    }
    let choice
    if (subscriptionTier === 'growth' ){
      choice = {
        SubT:subscriptionTier,
        SD:Date.now(),
        ED:(Date.now() + 1000 * 60 * 60 * 24 * 7),
        VA:10
      }
    }else if ( subscriptionTier === 'premium'){
      choice = {
        SubT:subscriptionTier,
        SD:Date.now(),
        ED:(Date.now() + 1000 * 60 * 60 * 24 * 7),
        VA: 15
      }
    }else {
      choice = {
        SubT:'free',
      }
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const otp = Math.round(Math.random() * 1e6)//6 digits
      .toString()
      .padStart(6, '0')

    const newUser = new investorModel({
      fullName,
      phoneNumber,
      password: hashedPassword,
      viewAllocation:choice.VA ?? 5,
      subscribed:true,
      subscriptionTier: choice.SubT,
      subscriptionStart:choice.SD ?? 0,
      subscriptionEnd:choice.ED ?? 0,
      email:email.toLowerCase(),
      otp: otp,
      otpExpiredAt:(Date.now() + 1000 * 300)
    })
    
    await newUser.save()
    
    const verifyMail = {
      email:newUser.email,
      subject:`Please verify your email ${newUser.fullName}`,
      html:verify2(newUser.fullName,newUser.otp)
    }
    sendEmail(verifyMail)


    return res.status(201).json({
      message: 'investor created successfully',
      data: newUser,

    })
  } catch (error) {
    next(error)
  }
}

exports.fundingHistory = async (req,res)=>{
  try {
    const {id} = req.user
    const investments = await agreementModel.find({investorId:id,agrementStatus:"ongoing"})
    let response
    let ans = []
    let business
    let totInvestment = 0 
    for (const x of investments){
      (x.businessId)
      response = {
        businessId:business.id,
        businessName:x.businessName,
        businessModel:business.businessModel,
        businessOwnerName:business.businessOwnerName,
        investmentAmount:x.totalInvestment,
        status:x.agrementStatus,
        date:x.createdAt,
      }
      ans.push(response)
      totInvestment += x.totalInvestment

    }

    res.status(200).json({
      message:"all of the users investments",
      totalInvestment:totInvestment,
      activeInvestments:investments.length ?? 0,
      investments:ans
    })
    
  } catch (error) {
    res.status(500).json({
      message:"internal server error getting funding history",
      error:error.message
    })
  }
}

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    // Find user by email
    const user = await investorModel.findOne( { email: email.toLowerCase() } );
    
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    //  Check OTP
    if (Date.now() > user.otpExpiredAt) {
      return res.status(400).json({ message: 'OTP Expired' });
    }
    
    
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    //  Update verification
    Object.assign(user, {
      otp: null,
      otpExpiredAt: 0,
      isVerified: true
    });
    await user.save();
     const token = await jwt.sign({id:user.id},process.env.JWT_SECRET)
        return res.status(200).json({ 
          message: 'Email verified successfully',
          data:user ,
          role:user.role,
          kycStatus:user.kycStatus,
          token,
        });
  } catch (error) {
    next(error);
  }
};

exports.logininvestor = async (req, res, next) => {
    try {
        const { email, password } = req.body;
    
    const user = await investorModel.findOne({ email: email.toLowerCase() } );
    if (user === null) {
      return res.status(404).json({ 
        message: 'Invalid login details' });
    }
    if(user.isVerified === false){
      return res.status(401).json({
        message:"Please verify your account"
      })
    }
    
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email},
      process.env.JWT_SECRET);


    const response = {
      id:user.id,
      role:user.role,
      kycStatus:user.kycStatus
    }
    
   
    return res.status(200).json({
      message: 'Login successful',
      data:response,
      token,
      
    });
  } catch (error) {
    next(error);
  }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await userModel.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    const newOtp = Math.floor(1000 + Math.random() * 9000).toString()
    user.otp = newOtp
    user.otpExpiredAt = new Date(Date.now() + 1000 * 60 * 2) // 2 minutes later
    await user.save()

    const emailOptions = {
      email: user.email,
      subject: 'OTP Resent',
      html: verify2(newOtp, user.firstName),
    }

    await sendEmail(emailOptions)

    res.status(200).json({
      message: 'OTP resent successfully',
      newOtp
    })
  } catch (error) {
    next(error)
  }
}

exports.changePassword = async (req, res, next) => {
  try {
    const { id } = req.user; 
    const { oldPassword, newPassword, confirmPassword } = req.body;
    
    // (id);
    if (!user) {
      return res.status(404).json({
        message: "Investor not found",
      });
    }

    const checkOldPassword = await bcrypt.compare(oldPassword, user.password);
    if (!checkOldPassword) {
      return res.status(400).json({
        message: "Old password incorrect",
      });
    }

    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password mismatch",
      });
    }

    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();
    
   
   
    return res.status(200).json({
      message: "Password changed successfully",
      data:user
    });
  } catch (error) {
    console.error("Change password error:", error);
    next(error);
  }
};

exports.forgotPassword = async (req,res) => {
    try {
      const {email} = req.body
      const user = await userModel.findOne({email:email.toLowerCase()});
      const investor = await investorModel.findOne({email:email.toLowerCase()});
      if (!user && investor) {
        const token = jwt.sign({id:investor.id}, process.env.JWT_SECRET,{
          expiresIn:'10m',
          });
        const link = `https://thetrustforge.vercel.app/reset-password/${token}`
        // `${req.protocol}://${req.get('host')}/reset-password/${token}`   
        await sendEmail({email,
        subject:'Password reset link',
        html:forgotPassword2(link,investor.fullName)});

        return res.status(404).json({
            message:'password reset email sent successfully',link
        })
      }else if(user && !investor){
        const token = jwt.sign({id:user.id}, process.env.JWT_SECRET,{
          expiresIn:'10m',
        });
        const link = `https://thetrustforge.vercel.app/resetpassword/${token}`
        // `${req.protocol}://${req.get('host')}/reset-password/${token}`   
         await sendEmail({email,
          subject:'Password reset link',
          html:forgotPassword2(link,user.fullName)});

          return res.status(200).json({
          message:'password reset email sent successfully',link
          })
      }else{
        return res.status(404).json({
          message:"investor not found"
          })
      }

    } catch (error) {
    res.status(500).json({
        message:'internal server errror',
        error:error.message
    })
    }
}

exports.resetPassword = async (req,res) => {
  try {
      const {token} = req.params;
    const {newPassword, confirmPassword} = req.body;
    if (newPassword !== confirmPassword) {
      return res.status(404).json({
          message:'passwords do not match'
      });
    } 
     const decoded = jwt.verify(token, process.env.JWT_SECRET)
     if(decoded === null){
      return res.status(403).json({
          message:"invalid token or token expired",
          error:error
      })
     }

    const user = await investorModel.findOne({id:decoded.id});
    if (!user) {
      return res.status(404).json({
          message:'investor not found'
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await  bcrypt.hash(newPassword, salt);

    await user.update({password:hash})

      res.status(200).json({
          message:'password reset successful, try and login again',
          data:user
      });
  }catch(error){
      res.status(500).json({
          message:'internal server error',
          error:error.message
      })
  }
};

exports.getAll = async (req,res)=>{
    try {
        const users = await investorModel.find()

        res.status(200).json({
            message:"All investor in the database",
            count:users.length,
            data: users
        })
        
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        })
    }
};

exports.getOne = async(req,res)=>{
  try {
        const id  = req.params.id
        (id)
        const savedBusinesses = await saveModel.find({userId:id})
        const meetings = await meetingModel.find({host:id})
        const notifications = await notificationModel.find({userId:id})
        const kyc = await kycModel.findOne({userId:id})
        
        const response = {
          user,
          savecount:savedBusinesses.length,
          savedBusinesses,
          meetings,
          notifications,
          kyc
        }


        res.status(200).json({
            message:"The investor in the database",
            data: response
        })
        
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        })
    }
}

exports.deleteUser = async (req,res)=>{
  try {
    const {email} = req.body
    const user = await investorModel.findOne({email:email.toLowerCase()})
    if(!user){
      return res.status(404).json({
        message:"the guy no dey DB"
      })
    }else{
      const user = await investorModel.findByIdAndDelete({id:user._id})
      user.destroy()
      res.status(200).json({
      message:"i don commot am"
    })}
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    })
  }
}

// exports.subscriptionBypass = async (req,res)=>{
//   try {
//     const {id} = req.body
//     (id)

//     user.subscribed = true 
//     user.viewAllocation = 1
//     await user.save()
//     res.status(200).json({
//       message:"stuff",
//       data:user
//     })

//   } catch (error) {
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message
//     })
//   }
// }


