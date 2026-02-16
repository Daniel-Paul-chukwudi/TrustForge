const notificationModel = require('../models/notification')


exports.createNofification = async (req,res)=>{
    try {
        const {userId,businessId,title,description} =req.body
        const notify = await notificationModel.create({
            userId,
            businessId,
            title,
            description
        })
        res.status(201).json({
            message:"notification created",
            data:notify
        })
    } catch (error) {
        res.status(500).json({ 
            message: 'internal server error', 
            error: error.message 
        });
    }
}


exports.markAllRead = async (req,res)=>{
    try {
        const {id} = req.user
        console.log(id);
        
        await notificationModel.updateMany({userId:id},{status:'read'})
        res.status(200).json({
            message:"all notifications marked as read"
        })
    } catch (error) {
        res.status(500).json({ 
            message: 'internal server error', 
            error: error.message 
        });
    }
}

exports.allNotifications = async (req,res)=>{
    try {
        const notifications = await notificationModel.find()
        res.status(200).json({
            message:"all the notifications in the db",
            notifications
        })
    } catch (error) {
        res.status(500).json({ 
            message: 'internal server error', 
            error: error.message 
        });
    }
}

exports.oneNotification = async(req,res)=>{
    try {
        const {notificationId} = req.body
        const notification = await notificationModel.findById(notificationId)
        if (!notification){
            return res.status(404).json({
            message:"notification not found"
        })
        }
        res.status(200).json({
            message:"notification found",
            data: notification
        })
    } catch (error) {
        res.status(500).json({ 
            message: 'internal server error', 
            error: error.message 
        });
    }
}

exports.readOneNotification = async(req,res)=>{
    try {
        const { notificationId } = req.body;

        const notification = await notificationModel.findByIdAndUpdate(
        notificationId,
        { status: "read" },
        { new: true }
        );

        if (!notification) {
        return res.status(404).json({
            message: "Notification not found"
        });
        }

        res.status(200).json({
        message: "Notification marked as read",
        notification
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'internal server error', 
            error: error.message 
        });
    }
}

exports.allNotificationsById = async (req,res)=>{
    try {
        const {id} = req.user
        const notificationsUnread = await notificationModel.find({userId:id,status:'unread'})
        const notificationsRead = await notificationModel.find({userId:id,status:'read'})
        res.status(200).json({
            message:`all the notifications in the db for this user`,
            read:notificationsRead,
            unread:notificationsUnread
        })
    } catch (error) {
        res.status(500).json({ 
            message: 'internal server error', 
            error: error.message 
        });
    }
}

exports.deleteNotification = async (req,res)=>{
    try {
        const notificationId = req.params.id
        const notifications = await notificationModel.findByIdAndDelete({id:notificationId})
        res.status(200).json({
            message:"notification deleted"
        })
    } catch (error) {
        res.status(500).json({ 
            message: 'internal server error', 
            error: error.message 
        });
    }
}

exports.deleteAllNotifications = async (req,res)=>{
    try {
        const id = req.user
        const notifications = await notificationModel.deleteMany({userId:id,status:'read'})
        res.status(200).json({
            message:"notifications deleted"
        })
    } catch (error) {
        res.status(500).json({ 
            message: 'internal server error', 
            error: error.message 
        });
    }
}