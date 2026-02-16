require('dotenv').config()
const meetingModel = require('../models/meeting')
const userModel = require('../models/user')
const investorModel = require('../models/investor')
const businessModel = require('../models/business')
const meetingLinks = require('../helper/meetingLinks') 
const meeting = require('../models/meeting')
const notificationModel = require('../models/notification')
const {notify} = require('../helper/notificationTemplate')



exports.createMeetingInvestor = async (req, res) => {
  try {
    const {id} = req.user
    const { meetingTitle, date, time, meetingType, note ,businessId , guest } = req.body;

    if(!meetingTitle || !date || !time || !meetingType || !guest || !businessId ){
      return res.status(403).json({ 
        message: 'Please make sure all fields are filled' 
      });
    }
    
    const Business = await businessModel.findOne({businessOwner:guest,id:businessId})
    
    const UserB = await userModel.findById(guest)
    if (!UserB) {
      return res.status(404).json({ 
        message: 'BusinessOwner not found' 
      });
    }
    const UserI = await investorModel.findById(id)
    if (!UserI) {
      return res.status(404).json({ 
        message: 'Investor not found' 
      });
    }else if( UserI.kycStatus === 'not provided' ){
      return res.status(401).json({
        message: 'Please submit your KYC for verification before you can schedule a meeting '
      })
    }else if( UserI.kycStatus === 'under review' ){
      return res.status(401).json({
        message: 'Your KYC is currently under review, please wait for it to be verified before you can schedule a meeting'
      })
    }
    const LINK = meetingLinks[Math.floor(Math.random() * meetingLinks.length)]
    
    const meeting = await meetingModel.create({
      host:id,
      guest,
      meetingTitle,
      meetingLink:LINK,
      date,
      time,
      meetingType,
      note,
      meetingStatus:"Awaiting Approval",
      businessOwnerName:UserB.fullName,
      hostName:UserI.fullName,
      businessName: Business.businessName
    });

    await notificationModel.create({
    userId:UserI,
    businessId:Business.id,
    title:`The meeting beteen you and ${UserB.fullName} `,
    description:`hello ${UserI.fullName} your meeting with ${UserB.fullName} about ${meetingTitle} to hold ${date} by ${time} has been scheduled and is awaiting approval .\n
    Thank you for putting your trust in TrustForge 👊😁`
    })

    res.status(201).json({
      message: 'Meeting created successfully',
      data: meeting
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating meeting ', 
      error: error.message 
    });
  }
};

exports.approveMeeting = async (req,res)=>{
  try {
    // const {id} = req.user
    const {meetingId}  = req.body
    const target = await meetingModel.findOne({_id:meetingId})
    
    if(!target){
      return res.status(404).json({
        message:"Oops it seems like the meeting does not exist "
      })
    }
    const Business = await businessModel.findOne({businessOwner:target.guest})
    await meetingModel.findByIdAndUpdate(meetingId,{meetingStatus:"Approved and Upcoming"})
    notify({
      userId:target.host,
      businessId:Business.id,
      title: 'meeting has been approved',
      description:`The meeting between you and ${target.businessOwnerName} has been approved and is upcoming`
    })
    notify({
      userId:target.guest,
      businessId:Business.id,
      title: 'meeting has been approved',
      description:`The meeting between you and ${target.hostName} has been approved and is upcoming`
    })
    res.status(200).json({
      message:"Approved meeting",
      data:target
    })
  } catch (error) {
    res.status(500).json({ 
      message: 'Error approving meeting', 
      error: error.message 
    });
  }
}

exports.rescheduleMeeting = async(req,res)=>{
  try {
    const {id} = req.user
    const {meetingId, date, time,note}  = req.body
    const target = await meetingModel.findOne({_id:meetingId})
    const user = await userModel.findById(id);
    const investor = await investorModel.findById(id)
    let rescheduleRole
    if(!target){
      return res.status(404).json({
        message:"Oops it seems like the meeting does not exist "
      })
    }
    if(!user && investor){
      rescheduleRole = investor.role
    }else if(!investor && user){
      rescheduleRole = user.role
    }

    await meetingModel.findByIdAndUpdate(meetingId,{date,time,meetingStatus:"Reschedule Requested",rescheduleRole,note})
    notify({
    userId:target.host,
    title:`Your meeting was rescheduled`,
    description:`hello ${target.hostName} your meeting was rescheduled.
    Thank you for putting your trust in TrustForge 👊😁`
    }) 
    notify({
    userId:target.guest,
    title:`Your meeting was rescheduled`,
    description:`hello ${target.businessOwnerName} your meeting was rescheduled.
    Thank you for putting your trust in TrustForge 👊😁`
    })
    res.status(200).json({
      message:"changes made awaiting approval",
      data:target
    })
  } catch (error) {
    res.status(500).json({ 
      message: 'Error approving meeting', 
      error: error.message 
    });
  }
}

exports.declineMeeting = async(req,res)=>{
  try {
    const {id} = req.user
    const {meetingId}  = req.body
    const target = await meetingModel.findOne({id:meetingId})

    if(!target){
      return res.status(404).json({
        message:"Oops it seems like the meeting does not exist "
      })
    }
    await meetingModel.findByIdAndUpdate(meetingId,{meetingStatus:"Declined"})
    notify({
    userId:target.host,
    title:`Your meeting was declined`,
    description:`hello ${target.hostName} your meeting was declined.
    Thank you for putting your trust in TrustForge 👊😁`
    }) 
    notify({
    userId:target.guest,
    title:`Your meeting was declined`,
    description:`hello ${target.businessOwnerName} your meeting was declined.
    Thank you for putting your trust in TrustForge 👊😁`
    }) 

    res.status(200).json({
      message:"Declined meeting",
      data:target
    })
  } catch (error) {
    res.status(500).json({ 
      message: 'Error declining meeting', 
      error: error.message 
    });
  }
}

exports.getAllMeetings = async (req, res) => {
  try {
    const meetings = await meetingModel.find();
    res.status(200).json({ 
      data: meetings 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching meetings', 
      error: error.message 
    });
  }
};

exports.getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await meetingModel.findById(id);

    if (!meeting) {
      return res.status(404).json({ 
        message: 'Meeting not found' 
      });
    }

    res.status(200).json({ 
      data: meeting 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching meeting', 
      error: error.message 
    });
  }
};

exports.getMeetingByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const investor = await investorModel.findById(userId)
    const user = await userModel.findById(userId)
        if(!user && investor){
            const meetings = await meetingModel.find({host:userId})
            return res.status(200).json({
                message:"investor meetings",
                meetings
            })
        }else if(!investor && user){
            const meetings = await meetingModel.find({guest:userId})
            return res.status(200).json({
                message:"User meetings",
                meetings
            })
        }else{
            return res.status(404).json({
                message:"User not found"
            })
        }
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching meeting', 
      error: error.message 
    });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { meetingTitle, date, time, meetingType, note } = req.body;

    const meeting = await meetingModel.findById(id);
    if (!meeting) {
      return res.status(404).json({ 
        message: 'Meeting not found' 
      });
    }

    await meeting.update({ meetingTitle, date, time, meetingType, note });

    res.status(200).json({
      message: 'Meeting updated successfully',
      data: meeting,
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating meeting', 
      error: error.message 
    });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await meetingModel.findById(id);
    if (!meeting) {
      return res.status(404).json({ 
        message: 'Meeting not found' 
      });
    }

    await meetingModel.findByIdAndDelete(id);

    res.status(200).json({ 
      message: 'Meeting deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting meeting', 
      error: error.message 
    });
  }
};

exports.concludeMeeting = async(req,res)=>{
   try {
    const {id} = req.user
    const {meetingId}  = req.body
    const target = await meetingModel.findOne({id:meetingId})

    if(!target){
      return res.status(404).json({
        message:"Oops it seems like the meeting does not exist "
      })
    }
    await meetingModel.findByIdAndUpdate(meetingId,{meetingStatus:"Concluded"})

    res.status(200).json({
      message:"meeting concluded",
      data:target
    })
  } catch (error) {
    res.status(500).json({ 
      message: 'Error concluding meeting', 
      error: error.message 
    });
  }
}

// exports.requestReschedule = async (req, res) => {
//   try {
//     const { id } = req.user;  
//     const { meetingId, date, time } = req.body; 
    
//     const meeting = await meetingModel.findOne({ where: { id: meetingId, guest: id } });

//     if (!meeting) {
//       return res.status(404).json({
//         message: "Meeting not found or you're not allowed to reschedule this meeting"
//       });
//     }


//     meeting.date = date;
//     meeting.time = time;
//     meeting.meetingStatus = "Reschedule Requested";
//     await meeting.save();

//     res.status(200).json({
//       message: "Reschedule request sent successfully. Waiting for investor's response.",
//       data: meeting
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error requesting reschedule",
//       error: error.message
//     });
//   }
// };



// exports.respondReschedule = async (req, res) => {
//   try {
//     const { id } = req.user; 
//     const { meetingId, action, date, time } = req.body; 
//     // action = "accept" | "decline" | "reschedule"

//     const meeting = await meetingModel.findOne({ where: { id: meetingId, host: id } });

//     if (!meeting) {
//       return res.status(404).json({ 
//         message: "Meeting not found or you're not the host of this meeting" 
//       });
//     }

    
//     if (action === "accept") {
//       meeting.meetingStatus = "Approved and Upcoming";
//     } else if (action === "decline") {
//       meeting.meetingStatus = "Declined";
//     } else if (action === "reschedule") {
//       meeting.date = date;
//       meeting.time = time;
//       meeting.meetingStatus = "Reschedule Requested";
//     } else {
//       return res.status(400).json({ message: "Invalid action type. Must be accept, decline, or reschedule." });
//     }

//     await meeting.save();

//     res.status(200).json({
//       message:`Meeting ${action}ed successfully.`,
//       data: meeting
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error responding to reschedule request",
//       error: error.message
//     });
//   }
// };

