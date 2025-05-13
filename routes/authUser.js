const express = require("express");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const protectRoute = require("../middleware/protectRoute");
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, fullName: name });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const userData = user.toObject();
    delete userData.password; // Remove password before sending user data

 
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: userData }); // Send token and user data
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.put("/addgoal", protectRoute, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { title } = req.body;
    if (!title || typeof title !== 'string' || title.trim() === "") {
      return res.status(400).json({ message: "Title is required and must be a non-empty string" });
    }

    const newGoal = {
      title,
      start: new Date(),
    };

    user.goals.push(newGoal); 
    await user.save(); 
    res.status(200).json({ message: "Goal added successfully", goals: user.goals });
  } catch (error) {
    console.error("Error adding goal:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.put("/checkin", protectRoute, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const { goalId } = req.body;
        const goal = user.goals.find((goal) => goal._id?.toString() === goalId);
        if (!goal) {
            return res.status(404).json({ message: "Goal not found" });
        }
        if (!goal.didCheckInToday) {
            goal.streak += 1;
        } else {
            return res.status(200).json({ message: "you alredy check in" });
        }
        if (goal.streak > user.topstreak) {
            user.topstreak = goal.streak;
            user.toprank=getRankByDay(goal.streak);
        }
        goal.lastCheckin = Date.now(); 
        goal.didCheckInToday=true;
        await user.save();
        res.status(200).json({ message: "Check-in successful", goal, global: { coins: user.coins, topstreak: user.topstreak } });

    } catch (error) {
        console.error("Error during check-in:", error);
        res.status(500).json({ message: "Something went wrong during check-in." });
    }
});
router.put("/resetstreak", protectRoute, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { goalId } = req.body;
        const goal = user.goals.find((goal) => goal._id.toString() === goalId);
        if (!goal) {
            return res.status(404).json({ message: "Goal not found" });
        }

        goal.streak = 0;
        goal.didCheckInToday = false; 
        goal.lastCheckin = Date.now();
        await user.save();
        res.status(200).json({ message: "Streak reset successfully", goal });
    } catch (error) {
        console.error("Error during streak reset:", error);
        res.status(500).json({ message: "Something went wrong while resetting the streak." });
    }
});
router.get("/goals", protectRoute, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('goals');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ goals: user.goals });

    } catch (error) {
        console.error("Error fetching goals:", error);
        res.status(500).json({ message: "Something went wrong while fetching your goals." });
    }
});
router.delete("/deletegoal", protectRoute, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { goalId } = req.body;

        // Find the index of the goal to be deleted
        const goalIndex = user.goals.findIndex((goal) => goal._id.toString() === goalId);

        if (goalIndex === -1) {
            return res.status(404).json({ message: "Goal not found" });
        }

        
        const deletedGoal = user.goals.splice(goalIndex, 1)[0];

        await user.save();

        res.status(200).json({ message: "Goal Deleted Successfully", goal: deletedGoal });

    } catch (error) {
        console.error("Error deleting goal:", error);
        res.status(500).json({ message: "Something went wrong while deleting the goal." });
    }
});
router.put("/pausegoal", protectRoute, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const { goalId } = req.body;
        const {day}=req.body;
        const goal = user.goals.find((goal) => goal._id.toString() === goalId);
        if (!goal) {
            return res.status(404).json({ message: "Goal not found" });
        }
        if (day*50>user.coins){
            return res.status(400).json({message:"you do not have enough coins four pause"});
        }
        goal.pause=true;
        goal.pauseDay=day;
        goal.pausedUntil=Date.now()+day*24*60*60*1000;
        user.coins-=day*50;
        await user.save();
        res.status(200).json({ message: "Goal pause successfully", goal });
    } catch (error) {
        console.error("Error during streak reset:", error);
        res.status(500).json({ message: "Something went wrong while resetting the streak." });
    }
});
router.put("/resumegoal", protectRoute, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const { goalId } = req.body;
        const goal = user.goals.find((goal) => goal._id.toString() === goalId);
        if (!goal) {
            return res.status(404).json({ message: "Goal not found" });
        }
        goal.pause=false;
        goal.pauseDay=0;
        goal.pausedUntil=Date.now();
        await user.save();
        res.status(200).json({ message: "Goal Resume successfully", goal });
    } catch (error) {
        console.error("Error during streak reset:", error);
        res.status(500).json({ message: "Something went wrong while resetting the streak." });
    }
});
function getRankByDay(day) {
  if (day >= 1 && day <= 6) return "Mortal";
  else if (day >= 7 && day <= 13) return "Soldier";
  else if (day >= 14 && day <= 29) return "Warrior";
  else if (day >= 30 && day <= 59) return "Champion";
  else if (day >= 60 && day <= 89) return "Veteran";
  else if (day >= 90 && day <= 179) return "Master";
  else if (day >= 180 && day <= 364) return "Grandmaster";
  else if (day >= 365 && day <= 729) return "Legend";
  else if (day >= 730) return "Primordial";
  else return "Mortal";
}
router.get("/global",protectRoute,async(req,res)=>{
  try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const global={
          coins:user.coins,
          topstreak:user.topstreak,
          toprank:user.toprank
        }
        res.status(200).json({global});
    } catch (error) {
        console.error("Error during streak reset:", error);
        res.status(500).json({ message: "Something went wrong while resetting the streak." });
    }
})
module.exports = router;
