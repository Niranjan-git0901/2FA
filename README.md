# 2FA Authentication Demo

A simple Node.js 2FA demo with email OTP and Google Authenticator support.

## Features

- User registration and login with MongoDB
- Email OTP verification using Nodemailer
- Google Authenticator QR setup and TOTP verification using `speakeasy`
- Random dashboard redirect after successful verification
- Styled front-end pages for login, registration, 2FA method selection, and verification

## Requirements

- Node.js 18+ or compatible
- MongoDB running locally on `mongodb://127.0.0.1:27017/2FA`

## Install

```bash
cd c:\Users\Dell\OneDrive\Desktop\2FA
npm install
```

## Configure

The app currently uses hard-coded Gmail credentials in `server.js` for sending OTP emails. For production, replace these values with environment variables and a secure transport.

Example in `server.js`:

```js
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your-email@gmail.com",
    pass: "your-email-app-password"
  }
});
```

## Run

```bash
node server.js
```

Then open:

- `http://localhost:3000/register` to create a new user
- `http://localhost:3000/login` to sign in

## Flow

1. Register or login
2. After login, choose a 2FA method on `/method`
   - Email OTP
   - Google Authenticator
3. If Email OTP is selected, you are redirected to `/verify`
4. If Google Authenticator is selected, you receive a QR code at `/setup-qr`
5. Enter the 6-digit code from the authenticator app to complete verification

## Project files

- `server.js` - Express server, route handling, OTP and TOTP logic
- `models/user.js` - Mongoose user schema with `secret` support for TOTP
- `views/` - Front-end HTML/EJS pages
  - `login.html`
  - `register.html`
  - `method.html`
  - `verify.html`
  - `setup-qr.ejs`
  - `dashboard1.html`
  - `dashboard2.html`
  - `dashboard3.html`

## Notes

- The current setup stores the Google Authenticator secret in MongoDB under the user document.
- If you scan the QR code multiple times in Google Authenticator, you may see duplicate entries. Scan only once and use the `2FA Security` entry.
- For better security, add password hashing and environment-based configuration.
