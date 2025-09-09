const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv");
const submissionRoutes = require("./routes/Submission.route.js");
const uploadRoutes = require("./routes/Upload.route.js");

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const mongoUri =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecoledger";

// Add CORS middleware before routes
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Add body parser middleware
app.use(express.json());

// Register routes - moved up before starting the server
app.get("/", (req, res) => {
    res.send("Mangrove Monitoring API is running");
});

app.use("/api/submissions", submissionRoutes);
app.use("/api/uploads", uploadRoutes);

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    process.exit(1);
});

// Connect to MongoDB
mongoose
    .connect(mongoUri)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("Couldn't connect to MongoDB", err));

// Start the server
server.listen(port, () => {
    console.log(`API is running on port ${port} - ${process.env.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection! 💥 Shutting down...");
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
