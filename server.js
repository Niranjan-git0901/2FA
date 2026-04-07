const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const User = require("./models/user");
const nodemailer = require("nodemailer");

const qrcode = require("qrcode");
const speakeasy = require("speakeasy");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("views"));
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: true
}));
const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/2FA")
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err));

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/views/login.html");
});
// Show register page
app.get("/register", (req, res) => {
    res.sendFile(__dirname + "/views/register.html");
});

// Handle register
app.post("/register", async (req, res) => {
    const { username, password, email } = req.body;

    const newUser = new User({ username, password, email });
    await newUser.save();

    req.session.userId = newUser._id;
    req.session.email = newUser.email;
    req.session.username = newUser.username;
    req.session.authMethod = null;

    res.redirect("/method");
});
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username, password });

    if (user) {
        req.session.userId = user._id;
        req.session.email = user.email;
        req.session.username = user.username;
        req.session.authMethod = null;

        res.redirect("/method");
    } else {
        res.send("Invalid Login ❌");
    }
});

app.get("/method", (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(__dirname + "/views/method.html");
});

app.post("/send-email-otp", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
        return res.redirect('/login');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.otp = otp;
    req.session.authMethod = 'email';

    await sendOTP(user.email, otp);
    res.redirect("/verify");
});

app.get("/setup-qr", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
        return res.redirect('/login');
    }

    let secret = user.secret;
    if (!secret) {
        const generated = speakeasy.generateSecret({ name: `2FA Security (${user.email})` });
        secret = generated.base32;
        user.secret = secret;
        await user.save();
    }

    const otpauthUrl = speakeasy.otpauthURL({
        secret,
        label: `2FA Security:${user.email}`,
        issuer: '2FA Security',
        encoding: 'base32'
    });

    const qrCode = await qrcode.toDataURL(otpauthUrl);
    req.session.authMethod = 'qr';

    res.render("setup-qr", { qrCode, secret });
});

// Show OTP page
app.get("/verify", (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    if (!req.session.authMethod) {
        return res.redirect('/method');
    }

    if (req.session.authMethod === 'qr') {
        return res.redirect('/setup-qr');
    }

    res.sendFile(__dirname + "/views/verify.html");
});

// Verify OTP / Authenticator code
app.post("/verify", async (req, res) => {
    const userOtp = req.body.otp;

    if (req.session.authMethod === 'email') {
        if (userOtp === req.session.otp) {
            const dashboards = ["/dashboard1", "/dashboard2", "/dashboard3"];
            const randomDashboard = dashboards[Math.floor(Math.random() * dashboards.length)];

            res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>OTP Verified</title>
</head>
<body>
    <script>
        alert("OTP verified");
        window.location = "${randomDashboard}";
    </script>
</body>
</html>`);
        } else {
            res.send("Invalid OTP ❌");
        }
        return;
    }

    if (req.session.authMethod === 'qr') {
        const user = await User.findById(req.session.userId);
        if (!user || !user.secret) {
            return res.send("Authenticator not set up yet ❌");
        }

        const verified = speakeasy.totp.verify({
            secret: user.secret,
            encoding: 'base32',
            token: userOtp,
            window: 1
        });

        if (verified) {
            const dashboards = ["/dashboard1", "/dashboard2", "/dashboard3"];
            const randomDashboard = dashboards[Math.floor(Math.random() * dashboards.length)];
            return res.redirect(randomDashboard);
        }

        return res.send("Invalid OTP ❌");
    }

    res.send("No verification method selected ❌");
});

app.get("/dashboard1", (req, res) => {
    res.sendFile(__dirname + "/views/dashboard1.html");
});

app.get("/dashboard2", (req, res) => {
    res.sendFile(__dirname + "/views/dashboard2.html");
});

app.get("/dashboard3", (req, res) => {
    res.sendFile(__dirname + "/views/dashboard3.html");
});

async function sendOTP(email, otp) {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "niranjan.n0901@gmail.com",
            pass: "gmxoytmywtcjvqxt"
        }
    });

    let mailOptions = {
        from: "your_email@gmail.com",
        to: email,
        subject: "Your OTP Code",
        text: "Your OTP is: " + otp
    };

    await transporter.sendMail(mailOptions);
}

app.listen(3000, () => {
    console.log("Server started on http://localhost:3000/register");
});