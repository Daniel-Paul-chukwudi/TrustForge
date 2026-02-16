const userModel = require('../models/user')
const otpGen = require('otp-generator')
const businessModel = require('../models/business')
const axios = require('axios')
const paymentModel = require('../models/payment')
const investorModel = require('../models/investor')
const agreementModel = require('../models/agreement')
const notificationModel = require('../models/notification')
const meetingModel = require('../models/meeting')
const {investmentNotificationMail}= require('../Middleware/emailTemplates')
const {notify} = require('../helper/notificationTemplate')
const sendEmail = require('../Middleware/Bmail')







exports.initializeSubscriptionPaymentInvestor = async (req, res) => {
  try {
      const { id } = req.user;
      const user = await investorModel.findById(id);
      const code = await otpGen.generate(12, { upperCaseAlphabets: false, lowerCaseAlphabets: true, digits: true, specialChars: false })
      const ref = `TF-${code}-INS`
      const {price} = req.body
      
      
      if (user === null) {
        return res.status(404).json({
        message: 'Investor not found'
      })
    }
    // const link = `https://thetrustforge.vercel.app/investor/subscription-success?id=${user.id}&fullName=${user.fullName}&referenceId=${ref}&amount=${price}`
    
    const redirect_url = `https://thetrustforge.vercel.app/dashboard/investor/subscription-success?id=${encodeURIComponent(
      user.id
    )}&fullName=${encodeURIComponent(user.fullName)}&reference=${encodeURIComponent(
      ref
    )}&amount=${encodeURIComponent(price)}`;

    const paymentData = {
      amount: price,
      currency: 'NGN',
      reference: ref,
      redirect_url,
      customer: {
        email: user.email,
        name: `${user.fullName}`
      }
    }
    // console.log(paymentData);
    
    
    const { data } = await axios.post('https://api.korapay.com/merchant/api/v1/charges/initialize', paymentData, {
      headers: {
        Authorization: `Bearer ${process.env.KORA_SECRET_KEY}`
      }
    });
    
    
    // `https://thetrustforge.vercel.app/investor/subscription-success/:id/:fullName/:referenceId/:amount`
    // `https://thetrustforge.vercel.app/payment-success/${user.id}/${user.fullName}/${ref}/${price}`
    const payment = new paymentModel({
      userId: id,
      paymentType:'subscription',
      reference: ref,
      price,
      userType:"investor"
    });

    if (data?.status === true) {
      await payment.save();
    }
    // const link = data?.data?.checkout_url
    // res.redirect(link)
    res.status(200).json({
      message: 'Payment Initialized successfuly',
      data: {
        reference: data?.data?.reference,
        url: data?.data?.checkout_url
      },
      payment,
      paymentData
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error initializing payment: ' + error.message,
      error: error.response?.data
    })
  }
};

exports.initializeSubscriptionPaymentBusinessOwner = async (req, res) => {
  try {
      const { id } = req.user;
      const user = await userModel.findById(id);
      const code = await otpGen.generate(12, { upperCaseAlphabets: false, lowerCaseAlphabets: true, digits: true, specialChars: false })
      const ref = `TF-${code}-BOS`
      const {price} = req.body

      

    if (user === null) {
      return res.status(404).json({
        message: 'user not found'
      })
    }
    // const link = `https://thetrustforge.vercel.app/business_owner/subscription-success?id=${user.id}&fullName=${user.fullName}&referenceId=${ref}&amount=${price}`
    // `https://thetrustforge.vercel.app/payment-success/${user.id}/${user.fullName}/${ref}/${price}`
    // `id=${user.id}&fullName=${user.fullName}&referenceId=${ref}&amount=${price}`

    const redirect_url = `https://thetrustforge.vercel.app/dashboard/business_owner/subscription-success?id=${encodeURIComponent(
      user.id
    )}&fullName=${encodeURIComponent(user.fullName)}&reference=${encodeURIComponent(
      ref
    )}&amount=${encodeURIComponent(price)}`;

    const paymentData = {
      amount: price,
      currency: 'NGN',
      reference: ref,
      redirect_url,
      customer: {
        email: user.email,
        name: `${user.fullName}`
      }
    }
    // console.log(paymentData);
    

    const { data } = await axios.post('https://api.korapay.com/merchant/api/v1/charges/initialize', paymentData, {
      headers: {
        Authorization: `Bearer ${process.env.KORA_SECRET_KEY}`
      }
    });

    const payment = new paymentModel({
      userId: id,
      paymentType:'subscription',
      reference: ref,
      price,
      userType:"businessOwner"
    });

    if (data?.status === true) {
      await payment.save();
    }

    // const link = data?.data?.checkout_url
    // res.redirect(link)
    res.status(200).json({
      message: 'Payment Initialized successfuly',
      data: {
        reference: data?.data?.reference,
        url: data?.data?.checkout_url
      },
      payment,
      paymentData
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error initializing payment: ' + error.message,
      error: error.response?.data
    })
  }
};

// exports.initializeInvestementPaymentInvestor = async (req, res) => {
//   try {
//       const { id } = req.user;
//       const user = await investorModel.findById(id);
//       const code = await otpGen.generate(12, { upperCaseAlphabets: false, lowerCaseAlphabets: true, digits: true, specialChars: false })
//       const ref = `TF-${code}-ININ`
//       const {price,businessId} = req.body
//       const business = await businessModel.findById(businessId)
      

//     // if (user === null) {
//     //   return res.status(404).json({
//     //     message: 'User not found'
//     //   })
//     // }else if( user.kycStatus === 'not provided' ){
//     //   return res.status(401).json({
//     //     message: 'Please submit your KYC for verification before you can make an investment'
//     //   })
//     // }else if( user.kycStatus === 'under review' ){
//     //   return res.status(401).json({
//     //     message: 'Your KYC is currently under review, please wait for it to be verified before you can make an investment'
//     //   })
//     // }
    
//     const diff = business.fundingSought - business.fundRaised
//     if(diff === 0){
//       return res.status(403).json({
//         message:"funding goal for this business already met"
//       })
//     }else if(price > diff){
//       return res.status(403).json({
//         message:`you can only invest ${diff} in order to meet the funding goal`
//       })
//     }
    
    
//     const link = `https://thetrustforge.vercel.app/dashboard/investor/payment-success?id=${user.id}&fullName=${user.fullName}&reference=${ref}&amount=${price}`
//     // const link3 = `https://thetrustforge.vercel.app/dashboard/investor/payment-success/4a277227-e3d3-4a59-8b1f-fcbe085b79f1/paula/TF-dv4l5vgxsgop-ININ/100000`
    
    
    
    
//     // const link2 = `https://thetrustforge.vercel.app/dashboard/investor/payment-success?id=${user.id}&investorName=${user.fullName}&reference=${ref}&amount=${price}`
    
    
    
    

//     const paymentData = {
//       amount: price,
//       currency: 'NGN',
//       reference: ref,
//       redirect_url:`https://thetrustforge.vercel.app/dashboard/investor/payment-success?id=${user.id}&fullName=${user.fullName}&reference=${ref}&amount=${price}`,
//       customer: {
//         email: user.email,
//         name: `${user.fullName}`
//       }
//     }

//     const { data } = await axios.post('https://api.korapay.com/merchant/api/v1/charges/initialize', paymentData, {
//       headers: {
//         Authorization: `Bearer ${process.env.KORA_SECRET_KEY}`
//       }
//     });

//     const payment = new paymentModel({
//       userId: id,
//       paymentType:'investment',
//       reference: ref,
//       price,
//       userType:"investor",
//       businessId
//     });

//     if (data?.status === true) {
//       await payment.save();
//     }

//     // const link = data?.data?.checkout_url
//     // res.redirect(link)
//     res.status(200).json({
//       message: 'Payment Initialized successfuly',
//       data: {
//         reference: data?.data?.reference,
//         url: data?.data?.checkout_url
//       },
//       payment,
//       paymentData
//     })
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error initializing payment: ' + error.message,
//       error: error.response?.data
//     })
//   }
// };

exports.initializeInvestementPaymentInvestor = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await investorModel.findById(id);
    const code = otpGen.generate(12, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: true,
      digits: true,
      specialChars: false,
    });
    const ref = `TF-${code}-ININ`;
    const { price, businessId } = req.body;
    const business = await businessModel.findById(businessId);
    const meeting = await meetingModel.findOne({businessName:business.businessName,host:id,meetingStatus:'Concluded'})
    // console.log(meeting);
    
    // if(!meeting){
    //   return res.status(401).json({
    //     message:`You need to have a meeting with the business owner before you can make an investment`
    //   })
    // }
    if(price < 10000 ){
      return res.status(403).json({
        message:"The minimum amount you can invest is 10,000"
      })
    }else if (price > 900000){
      return res.status(403).json({
        message:"The maximum amount you can invest is 900,000"
      })
    }

    const diff = business.fundingSought - business.fundRaised;
    if (diff === 0) {
      return res.status(403).json({
        message: "Funding goal for this business already met",
      });
    } else if (price > diff) {
      return res.status(403).json({
        message: `You can only invest ${diff} to meet the funding goal`,
      });
    }

    const redirect_url = `https://thetrustforge.vercel.app/dashboard/investor/payment-success?id=${encodeURIComponent(
      user.id
    )}&fullName=${encodeURIComponent(user.fullName)}&reference=${encodeURIComponent(
      ref
    )}&amount=${encodeURIComponent(price)}`;

    const paymentData = {
      amount: price,
      currency: "NGN",
      reference: ref,
      redirect_url,
      customer: {
        email: user.email,
        name: user.fullName,
      },
    };

    const { data } = await axios.post(
      "https://api.korapay.com/merchant/api/v1/charges/initialize",
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${process.env.KORA_SECRET_KEY}`,
        },
      }
    );

    const payment = new paymentModel({
      userId: id,
      paymentType: "investment",
      reference: ref,
      price,
      userType: "investor",
      businessId,
    });

    if (data?.status === true) {
      await payment.save();
    }

    res.status(200).json({
      message: "Payment Initialized successfully",
      data: {
        reference: data?.data?.reference,
        url: data?.data?.checkout_url,
      },
      payment,
      paymentData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error initializing payment: " + error.message,
      error: error.response?.data,
    });
  }
};
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;
    console.log(reference);
    
    const payment = await paymentModel.findOne({reference})
    // console.log(payment);
    
    if (payment === null) {
      return res.status(404).json({
        message: 'Payment not found'
      })
    }
    const { data } = await axios.get(`https://api.korapay.com/merchant/api/v1/charges/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.KORA_SECRET_KEY}`
      }
    })

    // console.log(data)
    if (data?.status === true && data?.data?.status === "success") {
      payment.status = 'Successful'
      await payment.save();
      res.status(200).json({
        message: 'Payment Verified Successfully'
      })
    } else{
      payment.status = 'Failed'
      await payment.save();
      res.status(200).json({
        message: 'Payment Failed'
      })
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error verifying payment: ' + error.message
    })
  }
};

exports.getAll = async (req,res)=>{
    try {
       const payments = await paymentModel.find()
       res.status(200).json({
        message:"all payments",
        data:payments
       })
    } catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message
        })
    }
}

exports.webHook = async (req, res) => {
  try {
    const { event , data } = req.body;
    const payment = await paymentModel.findOne({ reference:data.reference });
    if (payment === null) {
      return res.status(404).json({
        message: 'Payment not found'
      })
    }

    // const { data } = await axios.get(`https://api.korapay.com/merchant/api/v1/charges/${reference}`, {
    //   headers: {
    //     Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`
    //   }
    // })
    // data example
    // {
    // reference: 'TF-9gequ4em9mk6-BO',
    // payment_reference: 'TF-9gequ4em9mk6-BO',
    // currency: 'NGN',
    // amount: 10044,
    // fee: 140.36,
    // payment_method: 'card',
    // status: 'success'
    // }

    // console.log(data)
    // console.log(payment);
    
    if ( event === "charge.success"){

      payment.status = 'Successful'
      await payment.save();
      console.log(payment);
        if (payment.paymentType === 'subscription'){
            if(payment.userType === 'investor'){
              const targetI = await investorModel.findById(payment.userId)
              if(payment.price === 10000){
                targetI.subscribed = true
                targetI.subscriptionTier = 'growth'
                targetI.viewAllocation = 10
                targetI.subscriptionStart = Date.now() 
                targetI.subscriptionEnd = (Date.now() + 1000 * 60 * 60 * 2)
                targetI.renew = false
                // targetI.subscriptionEnd = (Date.now() + 1000 * 60 * 60 * 24 * 30)
                await targetI.save()
                notify({
                userId:payment.userId,
                businessId,
                title:`Your subscription was successful `,
                description:`hello ${targetI.fullName} your subscription was successful and you have been allocated 10 view points.
                Thank you for putting your trust in TrustForge 👊😁`
                  })
              }else if(payment.price === 20000){
                targetI.subscribed = true
                targetI.subscriptionTier = 'premium'
                targetI.viewAllocation = 10
                targetI.subscriptionStart = Date.now() 
                targetI.renew = false
                targetI.subscriptionEnd = (Date.now() + 1000 * 60 * 60 * 2)
                // targetI.subscriptionEnd = (Date.now() + 1000 * 60 * 60 * 24 * 30)
                await targetI.save()
                notify({
                userId:payment.userId,
                businessId,
                title:`Your subscription was successful `,
                description:`hello ${targetI.fullName} your subscription was successful and you have been allocated 15 view points.
                Thank you for putting your trust in TrustForge 👊😁`
                  })
              }
              
            }else if(payment.userType === 'businessOwner'){
              const targetB = await userModel.findById(payment.userId)
              // const business = await businessModel.findAll({where:{businessOwner:payment.userId}})
              if(payment.price === 10000){
                targetB.subscribed = true
                targetB.subscriptionTier = 'growth'
                targetB.subscriptionStart = Date.now() 
                // targetB.subscriptionEnd = (Date.now() + 1000 * 60 * 60 * 2)
                targetB.renew = false
                targetB.subscriptionEnd = (Date.now() + 1000 * 60 * 60 * 24 * 30)
                await targetB.save()
                businessModel.updateMany({businessOwner:payment.userId},{subscriptionTier:'growth'})
              }else if(payment.price === 20000){
                targetB.subscribed = true
                targetB.subscriptionTier = 'premium'
                targetB.subscriptionStart = Date.now() 
                // targetB.subscriptionEnd = (Date.now() + 1000 * 60 * 60 * 2)
                targetB.subscriptionEnd = (Date.now() + 1000 * 60 * 60 * 24 * 30)
                await targetB.save()
                businessModel.updateMany({businessOwner:payment.userId},{subscriptionTier:'premium'})
              }
              await notificationModel.create({
              userId:payment.userId,
              businessId,
              title:`Your subscription was successful `,
              description:`hello ${targetB.fullName} your subscription was successful and your business has been added to the promoted section.
              Thank you for putting your trust in TrustForge`
              })
            }
        }else if(payment.paymentType === 'investment'){
          
          const targetI = await investorModel.findById(payment.userId)
          targetI.totalInvestment += payment.price
          // console.log(targetI);
          await targetI.save()
          const Business = await businessModel.findById(payment.businessId)
          Business.fundRaised += payment.price
          Business.save()
          const targetB = await userModel.findById(Business.businessOwner)
          await notificationModel.create({
          userId:payment.userId,
          businessId:payment.businessId,
          title:`Your investment was successful `,
          description:`hello ${targetI.fullName} your investment payment into ${Business.businessName} was successful .
          Thank you for putting your trust in TrustForge 👊😁`
            })
          await notificationModel.create({
          userId:Business.businessOwner,
          businessId:payment.businessId,
          title:`You just got an investor `,
          description:`hello ${Business.businessOwnerName} your ${Business.businessName} was just funded with the sum of ${payment.price} by ${targetI.fullName}.
          Thank you for putting your trust in TrustForge 👊😁`
            })
          
          const targetBusiness = await agreementModel.findOne({businessId:payment.businessId,investorId:targetI.id})
          if(targetBusiness){
            await agreementModel.update({businessName:Business.businessName},{totalInvestment: targetBusiness.totalInvestment += payment.price,agrementStatus:"ongoing"},
            {where:{businessId:payment.businessId,investorId:targetI.id}})
          }else{
            await agreementModel.create({
              businessName:Business.businessName,
              businessOwnerName:Business.businessOwnerName,
              investorId:payment.userId,
              businessOwner:Business.businessOwner,
              businessId:payment.businessId,
              totalInvestment:payment.price,
              agrementStatus:"ongoing"
            })
          }
          const notificationMail = {
            email:targetB.email,
            subject:`Congratulations on recent funding ${targetB.fullName}`,
            html:investmentNotificationMail(targetB.fullName,targetI.fullName,Business.businessName)
          }
          await sendEmail(notificationMail)
          
        }
      res.status(200).json({
        message: 'Payment Verified Successfully',

      })

    } else if (event === "charge.failed"){
      payment.status = 'Failed'
      await payment.save();
      res.status(200).json({
        message: 'Payment Failed via webhook'
      })
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error verifying payment via webhook' + error.message
    })
  }
};