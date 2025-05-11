require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authUser = require("./routes/authUser");
const protectRoute = require("./middleware/protectRoute");

const app = express();
const corsOptions = {
  origin: ['http://localhost:5173','https://consistency-tracker-phi.vercel.app'], 
  methods: 'GET, POST, PUT, DELETE, OPTIONS',
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Connect to the database
connectDB()
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process on database connection failure
  });
require('./cronJob');
app.get('/ping', (req, res) => {
  res.send('pong');
});
// Use the routes
app.use("/user/api/auth", authUser);
app.get("/user/api/protected", protectRoute, (req, res) => {
  res.json({ message: "Access granted to client protected data" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Error: ${err.message}`);
  process.exit(1);
});