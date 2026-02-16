const userModel = require('../models/user')
const businessModel = require('../models/business')
const notify = require('../helper/notificationTemplate')

exports.subEnder = async ()=>{
    try {
        const check = Date.now()
        const users = await userModel.find()
        let clear = []
        for (const x of users){
            if(x.subscriptionEnd < check && x.subscriptionEnd !== null && x.subscriptionTier !== 'free'){
                clear.push(x)
            }
        }
        if(clear.length > 0){
        await userModel.UpdateMany({id: clear.map((i)=> i.id)},{subscriptionTier:'free',subscriptionEnd:0,subscriptionStart:0, renew:true},)
        await businessModel.updateMany({businessOwner: clear.map((i)=> i.id)},{subscriptionTier:'free'})
        for(const y of clear){
            notify({
                userId:y.id,
                title:"Subscription Expired",
                description:`hello ${y.fullname} your subscription has expired ,please renew your subscription to regain access to the various subscription tier bonuses and previledges. Thank you and have a great day .TrustForge Team`
            })
        }
        }

       
    } catch (error) {
        console.log(error.message);
        
    }
}

exports.subReminder = async ()=>{
    try {
        const check = Date.now()
        const users = await userModel.find()
        let clear = []
        for (const x of users){
            if((x.subscriptionEnd - (1000*60*60*24)) < check && x.subscriptionEnd !== null && x.subscriptionTier !== 'free'){
                clear.push(x)
            }
        }
        for(const y of clear){
            notify({
                userId:y.id,
                title:"Subscription end reminder",
                description:`hello ${y.fullname} your subscription ends in 24 hours ,please renew your subscription to avoid demotion of subscription tier and loss of tier bonuses and previledges. Thank you and have a great day. TrustForge Team`
            })
        }
        
        
        // await users.update({})
    } catch (error) {
        console.log(error.message);
    }
}
