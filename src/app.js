const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");
const alertRoutes = require("./routes/alertRoutes");
const missingPersonRoutes = require("./routes/missingPersonRoutes");
const chatRoutes = require("./routes/chatRoutes")
const securityCompanyRoutes = require("./routes/securityCompanyRoutes");
const userSecurityCompanyRoutes = require("./routes/userSecurityCompanyRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Salema API running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/missing-person", missingPersonRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/security-companies",securityCompanyRoutes);
app.use("/api/user-security-companies",userSecurityCompanyRoutes);

module.exports = app;