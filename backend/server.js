const express = require("express");

const cors = require("cors");
const http = require("http");

const connectDB = require("./config/connectDB.js");
const authRoutes = require("./routes/authRoutes.js");
const aiRoutes = require("./routes/aiRoutes.js");
const setupWebSocket = require("./socket");

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Routes
app.use("/", authRoutes);
app.use("/api/ai", aiRoutes);
// Create HTTP server
const server = http.createServer(app);

// Attach WebSocket
const socketApi = setupWebSocket(server);
app.set("socketApi", socketApi);

// Connect DB and start server
connectDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(` Server + WebSocket running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error(" Failed to connect to MongoDB", err);
    });