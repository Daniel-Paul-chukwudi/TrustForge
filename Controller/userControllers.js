require('dotenv').config()
const userModel = require('../models/user')
const businessModel = require('../models/business')
const saveModel = require('../models/save')
const meetingModel = require('../models/meeting')
const investorModel = require('../models/investor')
const jwt = require('jsonwebtoken')
const {verify,forgotPassword,verify2,forgotPassword2}= require('../Middleware/emailTemplates')
const sendEmail = require('../Middleware/Bmail')
const bcrypt = require('bcrypt')
const agreementModel = require('../models/agreement')
const notificationModel = require('../models/notification')
const paymentModel = require('../models/payment')
const kycModel = require('../models/kyc-businessOwner')


exports.signUp = async (req, res, next) => {
  try {
    const { fullName, phoneNumber, email,subscriptionTier, password,confirmPassword } = req.body
    const user = await userModel.findOne({email: email.toLowerCase() })
    const investor = await investorModel.findOne({email:email.toLowerCase()})
    // console.log(user);

    if( !fullName|| !phoneNumber || !email || !password || !confirmPassword ){
      return res.status(403).json({
        message: 'fill all required filleds to continue',
      })
    }   
    
    // if (user !== null) {
    //   return res.status(403).json({
    //     message: 'email already exists, Log in to your account',
    //   })
    //   return next(createError(404, "User not found"));
    // }else if(investor !==null){
    //   return res.status(403).json({
    //     message: 'email already exists, Log in to your account',
    //   })
    // }
    if(password !== confirmPassword){   
      return res.status(403).json({
        message:"Passwords don,t match"
      })
    }
    let choice
    if (subscriptionTier === 'growth' || subscriptionTier === 'premium'){
      choice = {
        SubT:subscriptionTier,
        SD:Date.now(),
        ED:(Date.now() + 1000 * 60 * 60 * 24 * 7)
      }
    }else {
      choice = {
        SubT:'free',
      }
    }
    //add a check for renew

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const otp = Math.round(Math.random() * 1e6)//6 digits
      .toString()
      .padStart(6, '0')

    const newUser = new userModel({
      fullName,
      phoneNumber,
      password: hashedPassword,
      email:email.toLowerCase(),
      subscribed:true,
      subscriptionTier: choice.SubT,
      subscriptionStart:choice.SD ?? 0,
      subscriptionEnd:choice.ED ?? 0,
      otp: otp,
      otpExpiredAt:(Date.now() + 1000 * 300)
    })
    // console.log(newUser);
    
    //Date.now() + 1000 * 120
    await newUser.save()
    const verifyMail = {
      email:newUser.email,
      subject:`Please verify your email ${newUser.fullName}`,
      html:verify2(newUser.fullName,newUser.otp)
    }
    sendEmail(verifyMail)

    return res.status(201).json({
      message: 'User created successfully',
      data: newUser,

    })
  } catch (error) {
    next(error)
  }
}

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    const user = await userModel.findOne({ email: email.toLowerCase() });
    
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }    

    // if (Date.now() > user.otpExpiredAt) {
    //   return res.status(400).json({ message: 'OTP Expired' });
    // }
    
    
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    
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

exports.loginUser = async (req, res, next) => {
      
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({  email: email.toLowerCase()  });
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
    
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
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

exports.userResendOtp = async (req, res, next) => {
  
  try {
    const { email } = req.body
    const user = await userModel.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    const newOtp = Math.floor(1000 + Math.random() * 900000).toString()
    user.otp = newOtp
    user.otpExpiredAt = Date.now() + 1000 * 60 * 5 // 2 minutes later
    await user.save()

    const emailOptions = {
      email: user.email,
      subject: 'OTP Resent',
      html: verify2(newOtp, user.fullName),
    }

    await sendEmail(emailOptions)

    res.status(200).json({
      message: 'OTP resent successfully',
      otp:newOtp
    })
  } catch (error) {
    next(error)
  }
}

exports.changePassword = async (req, res, next) => {
  const { id } = req.user; 
  const { oldPassword, newPassword, confirmPassword } = req.body;
  
  try {
    
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
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
        const link = `https://thetrustforge.vercel.app/resetpassword/${token}`
        // `${req.protocol}://${req.get('host')}/reset-password/${token}`   
        await sendEmail({
        email,
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
          message:"user not found"
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

    const user = await userModel.findOne({id:decoded.id});
    const investor = await investorModel.findOne({id:decoded.id});
    if (user && !investor) {
      const salt = await bcrypt.genSalt(10);
      const hash = await  bcrypt.hash(newPassword, salt);
      await user.update({password:hash})
      res.status(200).json({
          message:'password reset successful, try and login again',
          data:user
      });
    }else if (investor && !user){
      const salt = await bcrypt.genSalt(10);
      const hash = await  bcrypt.hash(newPassword, salt);
      await investor.update({password:hash})
      res.status(200).json({
          message:'password reset successful, try and login again',
          data:investor
      });
    }else{
      res.status(404).json({
          message:"User not found"
      });
    }
    
  }catch(error){
      res.status(500).json({
          message:'internal server error',
          error:error.message
      })
  }
};

exports.getAll = async (req,res)=>{
    try {
        const users = await userModel.find()

        res.status(200).json({
            message:"All users in the database",
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
        const user = await userModel.findById(id)
        // console.log(user);
        
        // const savedBusinesses = await saveModel.findAll({userId:id})
        // console.log(savedBusinesses);
        
        const businesses = await businessModel.findAll({businessOwner:id})
        let totalLikes = 0
        let totalViews = 0
        businesses.forEach((x)=>{
          totalLikes += x.likeCount
          totalViews += x.viewCount
        })
    
        const meetings = await meetingModel.findAll({guest:id})
        const agreements = await agreementModel.findAll({businessOwner:id})
        const notifications = await notificationModel.findAll({userId:id})
        const kyc = await kycModel.findOne({userId:id})
        const response = {
          user,
          businesscount:businesses.length,
          totalLikes,
          totalViews,
          businesses,
          meetings,
          investorInterests:agreements.length,
          notifications,
          kyc
        }


        res.status(200).json({
            message:"The user in the database",
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
    const user = await userModel.findOne({email:email.toLowerCase()})
    if(!user){
      return res.status(404).json({
        message:"the guy no dey DB"
      })
    }else{
      await businessModel.deleteMany({businessOwner:user._id})
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

exports.fundingHistory = async (req,res)=>{
  try {
    const {id} = req.user
    const {businessId} = req.params
    // const investments = await agreementModel.findAll({businessOwner:id,businessId: businessId})
    const funds = await paymentModel.find({businessId: businessId,paymentType:'investment',status:'Successful'})
    let ans = []
    let response
    let investor
    for(const x of funds) {
      investor = await investorModel.findById(x.userId)
      // console.log(investor);
      response = {
        investorName:investor?.fullName ?? 'Anonymous',
        amount: x.price,
        date:x.createdAt
      }
      ans.push(response)
    }


    res.status(200).json({
      message:"all of the business investors",
      data: ans
    })
    
  } catch (error) {
    res.status(500).json({
      message:"internal server error. Error getting funding history ",
      error:error.message
    })
  }
}


