const cron = require('node-cron');
const mongoose = require('mongoose');
const User = require('./models/user');
cron.schedule('0 0 * * *', async () => {
    console.log('🔁 Running daily streak & coin update...');
    try {
        const users = await User.find();
        for (let user of users) {
            for (let goal of user.goals) {
                if (!goal.didCheckInToday) {
                    if(goal.pause){
                        if(goal.pauseDay<=0){
                            goals.pause=false;
                            goal.pauseDay=0;
                        }else{
                            goal.pauseDay=goal.pauseDay-1;
                        }
                    }
                    else{
                        goal.streak=0;
                    }
                   
                }else{
                    goal.coin+=10;
                    user.coins+=10;
                }
                goal.didCheckInToday = false;
                goal.lastCheckin=Date.now();
                await user.save();
            }
        }
        console.log('✅ Daily update completed');
    } catch (err) {
        console.error('❌ Error in daily update:', err);
    }
});
