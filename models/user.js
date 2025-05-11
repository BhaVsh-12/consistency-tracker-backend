const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, default: "" },
    goals: [
        {   goalId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
            title: { type: String, required: true },
            streak: { type: Number, default: 0 },
            start: { type: Date, default: Date.now },
            coin: { type: Number, default: 0 },
            lastCheckin:{type:Date,default:Date.now},
            didCheckInToday:{type:Boolean,default:false},
            pause:{type:Boolean,default:false},
            pauseDay:{type:Number,default:0},
            pausedUntil:{type:Date,default:Date.now}
        }
    ],
    coins: { type: Number, default: 0 },
    toprank: {
        type: String,
        default: "Mortal",
        enum: ["Mortal", "Soldier", "Warrior", "Champion", "Veteran", "Master", "Grandmaster", "Legend", "Primordial"]
    },
    topstreak: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
module.exports = User;
