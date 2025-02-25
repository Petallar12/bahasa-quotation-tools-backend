const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load environment variables
const app = express();
const PORT = 5000;
// Translation for plan names
// const planTranslation = {
//   Elite: "Elit",
//   Extensive: "Ekstensif",
//   Essential: "Esensial",
//   Core: "Inti",
//   "N/A": "Tidak Ada",
// };

// Middleware
app.use(cors({
  origin: '*' 
}));
app.use(bodyParser.json());

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com', // SMTP server
  port: 587, // Port for STARTTLS
  secure: false, // Use false for STARTTLS
  auth: {
    user: process.env.SMTP_USER, // SMTP user (from environment variable)
    pass: process.env.SMTP_PASS, // SMTP password (from environment variable)
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Verification Error:', error);
  } else {
    console.log('SMTP is working:', success);
  }
});
 
// Default route
app.get('/', (req, res) => {
  res.send('Quotation Tool Backend is running!');
});

// Email endpoint
app.post('/send-email', async (req, res) => {
  const { contactInfo, plans, totalPremium } = req.body;

  try {
    // Prepare the email content for the admin (your email)
    const emailContentForAdmin = `
   <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; font-size:14px;}
          h1 { color: #333; font-size: 18px; }
          h2 { color: #333; font-size: 15px; }
          th { background-color: #f2f2f2; color: black; padding: 10px; border: 1px solid #ddd; }
          td { padding: 12px; border: 1px solid #ddd;}
          table { border-collapse: collapse; width: 100%; }
        </style>
      </head>
      <body> 
        <h1>Informasi Kontak</h1>
        <p><strong>Nama Lengkap:</strong> ${contactInfo.fullName}</p>
        <p><strong>Nomor Kontak:</strong> ${contactInfo.contactNumber}</p>
        <p><strong>Alamat Email:</strong> ${contactInfo.emailAddress}</p>
        <p><strong>Negara Tempat Tinggal:</strong> ${contactInfo.country_residence}</p>
        <p><strong>Kewarganegaraan:</strong> ${contactInfo.nationality}</p>
        <p><strong>Area Cakupan:</strong> ${contactInfo.area_of_coverage}</p>
        <hr>
        <h1>Plans dan Premi</h1>
        <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th>Klien</th>
              <th>Rumah Sakit & Operasi</th>
              <th>Rawat Jalan</th>
              <th>Kehamilan</th>
              <th>Dental</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
          ${plans
            .map(
              (plan) => `
            <tr>
              <td>${plan.client}</td>
              <td>
                Plans: ${plan.hospitalSurgeryPlan}<br>
                Pemotongan: ${plan.hospitalSurgeryDeductible}<br>
                ${plan.hospitalSurgery.replace(/(\d+)/, (num) => parseFloat(num).toLocaleString('en-US'))}
              </td>
              <td>
                Plans: ${plan.outpatientPlan}<br>
                Co Ins.: ${plan.outpatientDeductible}<br>
                ${plan.outpatient.replace(/(\d+)/, (num) => parseFloat(num).toLocaleString('en-US'))}
              </td>
              <td>
                Plans: ${plan.maternityPlan}<br>
                ${plan.maternity.replace(/(\d+)/, (num) => parseFloat(num).toLocaleString('en-US'))}
              </td>
              <td>
                Plans: ${plan.dentalPlan}<br>
                ${plan.dental.replace(/(\d+)/, (num) => parseFloat(num).toLocaleString('en-US'))}
              </td>
              <td>
                 ${plan.subtotal.replace(/(\d+)/, (num) => parseFloat(num).toLocaleString('en-US'))}
              </td>
            </tr>
            `)
            .join('')}
        </tbody>
      </table>
    <h2>Total Premi: $${totalPremium.replace(/(\d+)/, (num) => parseFloat(num).toLocaleString('en-US'))}</h2></br>
    <p>www.asuransi-kesehatanku.co.id</p>
            </body>
    </html>
    `;

    // Send the email to the admin
    await transporter.sendMail({
      from: '"Luke Medikal" <no-reply@lukemedikal.co.id>', // Sender email
      to: 'webleads_test@medishure.com', // Your email
      subject: 'Luke Medikal Web Lead (April Indonesia)', // Email subject
      html: emailContentForAdmin, // Email content in HTML
    });

    // Prepare the thank-you email content for the user
   const emailContentForUser = `
     <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; font-size:14px;}
          h1 { color: #333; font-size: 18px; }
          h2 { color: #333; font-size: 15px; }
          th { background-color: #f2f2f2; color: black; padding: 10px; border: 1px solid #ddd; }
          td { padding: 12px; border: 1px solid #ddd;}
          table { border-collapse: collapse; width: 100%; }
        </style>
      </head>
      <body>
  <h1>Terima Kasih atas Aplikasi Anda!</h1>
    <p>Kepada ${contactInfo.fullName},</p>
    <p>Terima kasih telah mengirimkan aplikasi Anda! Kami telah menerima detail Anda dan akan segera menghubungi Anda.</p>

  <hr>
  <h1>Plans dan Premi Anda</h1>
  <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;">
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th>Klien</th>
        <th>Rumah Sakit & Operasi</th>
        <th>Rawat Jalan</th>
        <th>Kehamilan</th>
        <th>Dental</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${plans
        .map(
          (plan) => `
          <tr>
            <td>${plan.client.split('(')[0]} (${plan.client.includes('Male') ? 'Laki-laki' : 'Perempuan'}, ${plan.client.match(/\d+/)[0]})</td>
            <td>
                Plans: ${plan.hospitalSurgeryPlan}<br>
               Pemotongan: ${plan.hospitalSurgeryDeductible}<br>
              ${plan.hospitalSurgery.replace(/(\d+)/, (num) => parseFloat(num).toLocaleString('en-US'))}
            </td>
            <td>
                Plans: ${plan.outpatientPlan}<br>
              Deductible: ${plan.outpatientDeductible}<br>
              ${plan.outpatient.replace(/(\d+)/, (num) => parseFloat(num).toLocaleString('en-US'))}
            </td>
            <td>
                Plans: ${plan.maternityPlan}<br>
              ${plan.maternity.replace(/(\d+)/, (num) => parseFloat(num).toLocaleString('en-US'))}
            </td>
            <td>
                Plans: ${plan.dentalPlan}<br>
              ${plan.dental.replace(/(\d+)/, (num) => parseFloat(num).toLocaleString('en-US'))}
            </td>
            <td>
              ${plan.subtotal.replace(/(\d+)/, (num) => parseFloat(num).toLocaleString('en-US'))}
            </td>
          </tr>
        `)
        .join('')}
    </tbody>
  </table>
    <h2>Total Premi: $${totalPremium.replace(/(\d+)/, (num) => parseFloat(num).toLocaleString('en-US'))}</h2>
    </br><p>www.asuransi-kesehatanku.co.id </p>
  </body>
</html>
`;
    // Send the thank-you email to the user
    await transporter.sendMail({
      from: '"Luke Medikal" <no-reply@lukemedikal.co.id>', // Sender email
      to: contactInfo.emailAddress, // User's email
      subject: 'Thank you for your application', // Email subject
      html: emailContentForUser, // Email content in HTML
    });

    // Send a success response
    res.status(200).send({ message: 'Emails sent successfully' });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send({ message: 'Error sending email', error });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
