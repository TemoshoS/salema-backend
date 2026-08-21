const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const securityRoutes = require("./routes/securityRoutes");
const contactRoutes = require("./routes/contactRoutes");
const alertRoutes = require("./routes/alertRoutes");
const missingPersonRoutes = require("./routes/missingPersonRoutes");
const chatRoutes = require("./routes/chatRoutes")
const securityCompanyRoutes = require("./routes/securityCompanyRoutes");
const securityOfficerRoutes = require("./routes/securityOfficerRoutes");
const userSecurityCompanyRoutes = require("./routes/userSecurityCompanyRoutes");
const adminRoutes = require("./routes/adminRoutes");
const branchRoutes = require("./routes/branchRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Salema API running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/missing-person", missingPersonRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/security-company",securityCompanyRoutes);
app.use("/api/security-company/officers",securityOfficerRoutes);
app.use("/api/user-security-companies",userSecurityCompanyRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/branches", branchRoutes);

module.exports = app;