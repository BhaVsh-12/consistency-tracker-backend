const jwt = require("jsonwebtoken");

const protectRoute = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const bearer = token.split(" ");
  if (bearer.length !== 2 || bearer[0] !== "Bearer") {
    return res.status(401).json({ message: "Invalid token format. Expected 'Bearer <token>'" });
  }

  try {

    const decoded = jwt.verify(bearer[1], process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error); // Log the full error
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = protectRoute;