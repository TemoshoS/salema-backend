const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// =====================================================
// Base Email Function
// =====================================================

const sendEmail = async ({
  to,
  subject,
  text,
  html,
}) => {
  await transporter.sendMail({
    from: `"Salema Security" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};
// =====================================================
// 1. New User Registration
// Sends to User
// =====================================================
const sendUserLoginOtpEmail = async (user, otp) => {
  const subject = "Salema Login Verification Code";

  const text = `
Hello ${user.fullName},

Your Salema login verification code is:

${otp}

This code will expire in 5 minutes.

If you did not attempt to log in, please secure your account.

Regards,
Salema Security
`;

  const html = `
    <h2>Login Verification</h2>

    <p>Hello <strong>${user.fullName}</strong>,</p>

    <p>Your Salema login verification code is:</p>

    <h1>${otp}</h1>

    <p>This code will expire in <strong>5 minutes</strong>.</p>

    <p>
      If you did not attempt to log in, please secure your account.
    </p>

    <br />

    <p>
      Regards,<br />
      <strong>Salema Security</strong>
    </p>
  `;

  await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

// =====================================================
// OTP
// Reset Password
// =====================================================
const sendUserPasswordResetEmail = async (user, otp) => {
  const subject = "Salema Password Reset";

  const text = `
Hello ${user.fullName},

Your Salema password reset code is:

${otp}

This code will expire in 5 minutes.

If you did not request a password reset, please ignore this email.

Regards,
Salema Security
`;

  const html = `
    <h2>Password Reset</h2>

    <p>Hello <strong>${user.fullName}</strong>,</p>

    <p>Your Salema password reset code is:</p>

    <h1>${otp}</h1>

    <p>This code will expire in <strong>5 minutes</strong>.</p>

    <p>
      If you did not request a password reset, please ignore this email.
    </p>

    <br />

    <p>
      Regards,<br />
      <strong>Salema Security</strong>
    </p>
  `;

  await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};
// =====================================================
// 1. New Security Company Registration
// Sends to ADMIN
// =====================================================

const sendCompanyRegistrationEmail = async (company) => {

  const subject =
    "New Security Company Registration - Approval Required";

  const text = `
A new security company has registered on Salema.

Company Details
----------------------------

Company Name: ${company.companyName}
Email: ${company.email}
Phone Number: ${company.phoneNumber}
PSIRA Company Number: ${company.psiraCompanyNumber}
Registration Number: ${company.registrationNumber}
Address: ${company.address}
Contact Person: ${company.contactPerson}

Status: Pending Approval

Please review this company from the Salema Admin Dashboard.
`;

  const html = `
    <h2>New Security Company Registration</h2>

    <p>A new security company has registered on Salema and requires your approval.</p>

    <h3>Company Details</h3>

    <table cellpadding="8" cellspacing="0" border="1">
      <tr>
        <td><strong>Company Name</strong></td>
        <td>${company.companyName}</td>
      </tr>

      <tr>
        <td><strong>Email</strong></td>
        <td>${company.email}</td>
      </tr>

      <tr>
        <td><strong>Phone Number</strong></td>
        <td>${company.phoneNumber}</td>
      </tr>

      <tr>
        <td><strong>PSIRA Company Number</strong></td>
        <td>${company.psiraCompanyNumber}</td>
      </tr>

      <tr>
        <td><strong>Registration Number</strong></td>
        <td>${company.registrationNumber}</td>
      </tr>

      <tr>
        <td><strong>Address</strong></td>
        <td>${company.address}</td>
      </tr>

      <tr>
        <td><strong>Contact Person</strong></td>
        <td>${company.contactPerson}</td>
      </tr>

      <tr>
        <td><strong>Status</strong></td>
        <td>Pending Approval</td>
      </tr>
    </table>

    <br />

    <p>
      Please log in to the Salema Admin Dashboard to review this registration.
    </p>
  `;

  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject,
    text,
    html,
  });
};


// =====================================================
// 2. Company Approved
// Sends to SECURITY COMPANY
// =====================================================

const sendCompanyApprovedEmail = async (company) => {

  const subject =
    "Salema Security Company Account Approved";

  const text = `
Dear ${company.contactPerson},

Your security company registration has been approved by the Salema administrator.

Company: ${company.companyName}

You can now log in to your Salema Security Company account.

Regards,
Salema Security
`;

  const html = `
    <h2>Security Company Account Approved</h2>

    <p>
      Dear <strong>${company.contactPerson}</strong>,
    </p>

    <p>
      Your security company registration has been approved by the
      Salema administrator.
    </p>

    <p>
      <strong>Company:</strong> ${company.companyName}
    </p>

    <p>
      You can now log in to your Salema Security Company account.
    </p>

    <br />

    <p>
      Regards,<br />
      <strong>Salema Security</strong>
    </p>
  `;

  await sendEmail({
    to: company.email,
    subject,
    text,
    html,
  });
};


// =====================================================
// 3. Company Rejected
// Sends to SECURITY COMPANY
// =====================================================

const sendCompanyRejectedEmail = async (
  company,
  reason = "Please contact the Salema administrator for more information."
) => {

  const subject =
    "Salema Security Company Registration Update";

  const text = `
Dear ${company.contactPerson},

Unfortunately, your security company registration has not been approved.

Company: ${company.companyName}

Reason:
${reason}

If you believe this was a mistake, please contact the Salema administrator.

Regards,
Salema Security
`;

  const html = `
    <h2>Security Company Registration Update</h2>

    <p>
      Dear <strong>${company.contactPerson}</strong>,
    </p>

    <p>
      Unfortunately, your security company registration has not been approved.
    </p>

    <p>
      <strong>Company:</strong> ${company.companyName}
    </p>

    <h3>Reason</h3>

    <p>
      ${reason}
    </p>

    <p>
      If you believe this was a mistake, please contact the
      Salema administrator.
    </p>

    <br />

    <p>
      Regards,<br />
      <strong>Salema Security</strong>
    </p>
  `;

  await sendEmail({
    to: company.email,
    subject,
    text,
    html,
  });
};


// =====================================================
// 4. Login OTP
// Sends to SECURITY COMPANY
// =====================================================

const sendLoginOtpEmail = async (company, otp) => {

  const subject =
    "Salema Security Company Login OTP";

  const text = `
Hello ${company.contactPerson},

Your Salema Security Company login verification code is:

${otp}

This code will expire in 5 minutes.

If you did not attempt to log in, please secure your account.

Regards,
Salema Security
`;

  const html = `
    <h2>Login Verification</h2>

    <p>
      Hello <strong>${company.contactPerson}</strong>,
    </p>

    <p>
      Your Salema Security Company login verification code is:
    </p>

    <h1>${otp}</h1>

    <p>
      This code will expire in <strong>5 minutes</strong>.
    </p>

    <p>
      If you did not attempt to log in, please secure your account.
    </p>

    <br />

    <p>
      Regards,<br />
      <strong>Salema Security</strong>
    </p>
  `;

  await sendEmail({
    to: company.email,
    subject,
    text,
    html,
  });
};


// =====================================================
// 5. Password Reset OTP
// Sends to SECURITY COMPANY
// =====================================================

const sendPasswordResetEmail = async (company, otp) => {

  const subject =
    "Salema Security Company Password Reset";

  const text = `
Hello ${company.contactPerson},

Your Salema Security Company password reset code is:

${otp}

This code will expire in 5 minutes.

If you did not request a password reset, please ignore this email.

Regards,
Salema Security
`;

  const html = `
    <h2>Password Reset</h2>

    <p>
      Hello <strong>${company.contactPerson}</strong>,
    </p>

    <p>
      Your Salema Security Company password reset code is:
    </p>

    <h1>${otp}</h1>

    <p>
      This code will expire in <strong>5 minutes</strong>.
    </p>

    <p>
      If you did not request a password reset, please ignore this email.
    </p>

    <br />

    <p>
      Regards,<br />
      <strong>Salema Security</strong>
    </p>
  `;

  await sendEmail({
    to: company.email,
    subject,
    text,
    html,
  });
};


// =====================================================
// 6. Resend Login OTP
// =====================================================

const sendResendOtpEmail = async (company, otp) => {

  const subject =
    "Salema Security Company Verification Code";

  const text = `
Hello ${company.contactPerson},

Here is your new Salema Security Company verification code:

${otp}

This code will expire in 5 minutes.

Regards,
Salema Security
`;

  const html = `
    <h2>New Verification Code</h2>

    <p>
      Hello <strong>${company.contactPerson}</strong>,
    </p>

    <p>
      Here is your new Salema Security Company verification code:
    </p>

    <h1>${otp}</h1>

    <p>
      This code will expire in <strong>5 minutes</strong>.
    </p>

    <br />

    <p>
      Regards,<br />
      <strong>Salema Security</strong>
    </p>
  `;

  await sendEmail({
    to: company.email,
    subject,
    text,
    html,
  });
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  sendEmail,
  sendUserLoginOtpEmail,
  sendUserPasswordResetEmail,
  sendCompanyRegistrationEmail,
  sendCompanyApprovedEmail,
  sendCompanyRejectedEmail,
  sendLoginOtpEmail,
  sendPasswordResetEmail,
  sendResendOtpEmail,
};