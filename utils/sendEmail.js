const dotenv = require("dotenv");
dotenv.config({ path: "../config/config.env" });

const fs = require("fs");
const sg = require("@sendgrid/mail");
const api = process.env.SENDGRIP_API;
sg.setApiKey(api);
const PDFDocument = require("pdfkit");
const path = require("path");


function numberToWords(number) {
  // Check for invalid input
  if (number < 1 || number > 9999) {
    throw new Error("Number must be between 1 and 9999");
  }

  // Define arrays for ones, tens, and teens
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  // Separate thousands, hundreds, tens, and ones digits
  const thousands = Math.floor(number / 1000);
  const hundreds = Math.floor((number % 1000) / 100);
  const tensDigit = Math.floor((number % 100) / 10);
  const onesDigit = number % 10;

  // Build the word representation
  let words = "";

  // Add thousands part
  if (thousands > 0) {
    words += numberToWords(thousands) + " Thousand ";
  }

  // Add hundreds part
  if (hundreds > 0) {
    words += ones[hundreds] + " Hundred ";
  }

  // Add tens and ones parts
  if (tensDigit > 0) {
    if (tensDigit === 1 && onesDigit > 0) {
      words += teens[onesDigit - 1];
    } else {
      words += tens[tensDigit];
      if (onesDigit > 0) {
        words += " " + ones[onesDigit];
      }
    }
  } else if (onesDigit > 0) {
    words += ones[onesDigit];
  }

  // Remove trailing space
  words = words.trim();

  return words;
}

exports.sendVerificationCode = async (email, code) => {
  try {
    const mailOptions = {
      from: "namaskaram@stringgeo.com",
      to: email,
      subject: "Your Account Verification Code",
      html: `<div style="font-family: 'Arial', sans-serif; text-align: center; background-color: #f4f4f4; margin-top: 15px; padding: 0;">

      <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #333333;">Account Verification Code</h1>
        <p style="color: #666666;">Your verification code is:</p>
        <p style="font-size: 24px; font-weight: bold; color: #009688; margin: 0;">${code}</p>
        <p style="color: #666666;">Use this code to verify your Account</p>
      </div>

      <div style="color: #888888;">
        <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team String Geo</span></p>
      </div>
    
    </div>`,
    };
    await sg.send(mailOptions);
  } catch (error) {
    console.log(error);
  }
};

exports.sendForgotPasswordCode = async (name, email, code) => {
  try {
    const mailOptions = {
      from: "namaskaram@stringgeo.com",
      to: email,
      subject: "Password Reset Code",
      html: `<div style="font-family: 'Arial', sans-serif; text-align: center; background-color: #f4f4f4; margin-top: 15px; padding: 0;">

      <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #333333;">Hey ${name}! You have requested Password Reset Code</h1>
        <p style="color: #666666;">Your Password Reset Code is:</p>
        <p style="font-size: 24px; font-weight: bold; color: #009688; margin: 0;">${code}</p>
        <p style="color: #666666;">
          If you did not request a password reset, please ignore this email.
        </p>
      </div>

      <div style="color: #888888;">
        <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team String Geo</span></p>
      </div>
    
    </div>`,
    };
    await sg.send(mailOptions);
  } catch (error) {
    console.log(error);
  }
};

exports.sendInvoice = async (user, transaction, currency) => {
  return new Promise((resolve, reject) => {
    const imagePath = path.join(__dirname, "/logo.png");
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(`${user._id}.pdf`);
    const formatDateTime = (dateTimeString) => {
      const dateTime = new Date(dateTimeString);
      const month = dateTime.toLocaleString("default", { month: "short" });
      const day = dateTime.getDate();
      let year = dateTime.getFullYear();
      const monthNumber = dateTime.getMonth();
      if (monthNumber < 3) {
        year = year - 1 + " - " + year;
      } else {
        year = year + " - " + (year + 1);
      }
      const time = dateTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      return `${day} ${month}, ${year}`;
    };

    doc.font("Helvetica");

    doc.rect(50, 50, 500, 650).stroke();

    doc.image(imagePath, 330, 70, { width: 200, height: 60 });

    doc.fontSize(12).text("STRING ART PRIVATE LIMITED", 70, 150);
    doc.text("GSTIN - 37ABICS6540H1Z2", 70, 170);
    doc.text("Mobile - 7022022728", 70, 190);
    doc.text("Email - namaskaram@stringgeo.com", 70, 210);
    doc.moveDown(2);
    doc.font("Helvetica-Bold").fontSize(24).text("Tax Invoice", {
      align: "center",
    });

    let xColumn1 = 70;
    let yColumn1 = doc.y + 10;

    let xColumn2 = 300;
    let yColumn2 = doc.y + 10;

    doc.moveDown(4);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text("Billing To: " + user.name, xColumn1, yColumn1, { lineGap: 5 })
      .text("Contact No: " + user.mobile, xColumn1, doc.y, { lineGap: 5 })
      .text("Email Id: " + user.email, xColumn1, doc.y, { lineGap: 10 });

    doc
      .text(
        "Transaction Date: " + formatDateTime(transaction.createdAt),
        xColumn2,
        yColumn2,
        {
          align: "right",
          lineGap: 5,
        }
      )
      .text("Transaction Id: " + transaction.payment_id, xColumn2, doc.y, {
        align: "right",
        lineGap: 10,
      });

    

    const tableMarginTop = 52;
    const borderWidth = 1;
    const cellPadding = 8;
    const columnWidths = [6, 3, 3, 3];

    const tableData =
      currency === "Rupee"
        ? [
            [
              "Description",
              "SAC Code",
              `Amount ${currency === "Rupee" ? "(Rs.)" : "($)"}`,
            ],
            [
              "Basic (Monthly)",
              "998433",
              parseFloat(0.82 * transaction.amount).toFixed(2),
            ],
            [
              "IGST @ 18%",
              "",
              parseFloat(0.18 * transaction.amount).toFixed(2),
            ],
            ["Invoice Total", "", transaction.amount],
          ]
        : [
            [
              "Description",
              "SAC Code",
              `Amount ${currency === "Rupee" ? "(Rs.)" : "($)"}`,
            ],
            ["Invoice Total", "", transaction.amount],
          ];

    const tableHeight = tableData.length * (borderWidth * 2 + cellPadding * 2);
    let tableTop = doc.y + tableMarginTop;
    doc.lineWidth(borderWidth);

    for (let i = 0; i < tableData.length; i++) {
      // if (currency === "Dollar" && (i == 1 || i == 2)) continue;
      let rowTop = tableTop + i * (borderWidth * 2 + cellPadding * 2);
      for (let j = 0; j < tableData[i].length; j++) {
        let cellLeft = 70 + j * 150;
        let cellWidth = 150;
        let cellHeight = borderWidth * 2 + cellPadding * 2;
        doc.rect(cellLeft, rowTop, cellWidth, cellHeight).stroke();
        doc.text(
          tableData[i][j],
          cellLeft + cellPadding,
          rowTop + borderWidth + 3.5
        );
      }
    }

    doc.moveDown(1);
    doc
      .fontSize(10)
      .text(
        `Amount in words : ${currency === "Rupee" ? "(INR)" : "(Dollar)"} ` +
          numberToWords(transaction.amount),
        70
      )
      .text(
        "Note: The subscription amount is inclusive Goods and Service tax (GST) at rate of 18%.",
        70
      )
      .text("Reverse Charge Applicability: No", 70)
      .text("See Terms and Conditions on the www.stringgeo.com website", 70);

    doc.moveDown(4);

    doc
      .fontSize(12)
      .text("This is System generated invoice", { align: "center" })
      .moveDown(0.4)
      .text("STRING ART PRIVATE LIMITED", {
        align: "center",
        bold: true,
        marginBottom: 10,
      })
      .moveDown(0.4)
      .text("D NO 85-40-4/4, F S-1, SRI SARASWATHI NIVAS APPT,", {
        align: "center",
        marginBottom: 10,
      })
      .moveDown(0.4)
      .text("RAJAHMUNDRY, East Godavari,", {
        align: "center",
        marginBottom: 10,
      })
      .moveDown(0.4)
      .text("Andhra Pradesh, India, 533101", {
        align: "center",
        marginBottom: 10,
      });

    doc.end();
    doc.pipe(writeStream);

    writeStream.on("finish", () => {
      fs.readFile(`${user._id}.pdf`, async (err, data) => {
        if (err) {
          console.log(err);
        } else {
          const msg = {
            to: user.email,
            from: "namaskaram@stringgeo.com",
            subject: "Sending an Invoice",
            html: `<div style="font-family: 'Arial', sans-serif; text-align: center; background-color: #f4f4f4; margin-top: 15px; padding: 0;">

                <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                  <h1 style="color: #333333;">Hey ${user.name}! Your Payment of ${transaction.amount} has been done successfully</h1>
                  <p style="color: #666666;">You have now access to our paid content.</p>
                  <p style="color: #666666;">
                    If you did not request this mail, please ignore this email.
                  </p>
                </div>

                <div style="color: #888888;">
                  <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team String Geo</span></p>
                </div>

              </div>`,
            attachments: [
              {
                content: data.toString("base64"),
                filename: `${user.name}.pdf`,
                path: `${user._id}.pdf`,
                encoding: "base64",
              },
            ],
          };

          try {
            await sg.send(msg);
            // console.log(data);
            fs.unlink(`${user._id}.pdf`, (err) => {});
            resolve(data);
          } catch (error) {
            console.log(error);
            reject(error);
          }
        }
      });
    });
  });
};

exports.sendBulkEmail = async (emails, subject, description) => {
  return sg.sendMultiple({
    to: emails,
    from: "namaskaram@stringgeo.com",
    subject: `${subject}`,
    text: `${description}`,
  });
};

