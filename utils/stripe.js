const dotenv = require("dotenv");
dotenv.config({
  path: "./config/config.env",
});

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const express = require("express");
const router = express.Router();
const transactionModel = require("../models/transactionModel");
const userModel = require("../models/userModel");
const { s3UploadPdf } = require("./s3");
const { sendInvoice } = require("./sendEmail");

const stripeFunction = async (
  price,
  validity,
  userId,
  planId,
  subdomain,
  plan_type,
  redirect_url
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],

        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: "title",

                metadata: {
                  validity,
                  userId,
                  planId,
                  subdomain,
                  plan_type,
                },
              },
              unit_amount: price * 100,
            },
            quantity: 1,
          },
        ],
        metadata: {
          validity,
          userId,
          planId,
          subdomain,
          plan_type,
        },
        mode: "payment",
        success_url: `${redirect_url}/#/menu/my-account`,
        cancel_url: `${redirect_url}/#/menu/payment-failed`,
      });

      resolve(session);
    } catch (error) {
      reject(error);
    }
  });
};

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let data;
    let eventType;

    let webhookSecret;
    webhookSecret = process.env.WEBHOOK_SECRET;

    if (webhookSecret) {
      let event;
      let signature = req.headers["stripe-signature"];
      const payload = req.body;

      try {
        event = stripe.webhooks.constructEvent(
          payload,
          signature,
          webhookSecret
        );

        console.log("webhook verified", event);
      } catch (err) {
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }
      data = event.data.object;
      eventType = event.type;
    } else {
      data = req.body.data.object;
      eventType = req.body.type;
    }

    if (eventType === "checkout.session.async_payment_succeeded") {
      console.log("Succeded", data);
    }

    if (eventType === "checkout.session.async_payment_failed") {
      console.log("Failed", data);
    }

    if (eventType === "checkout.session.completed") {
      let result = new Date();
      result = result.setDate(
        result.getDate() + parseInt(data.metadata.validity)
      );

      const transaction = await transactionModel.create({
        plan_id: data.payment_intent,
        user: data.metadata.userId,
        subdomain: data.metadata.subdomain,
        gateway: "Stripe",
        payment_id: data.id,
        amount: data.amount_total / 100,
        status: "Active",
        validity: parseInt(data.metadata.validity),
        expiry: result,
        plan_type: data.metadata.plan_type,
      });

      const user = await userModel.findById(data.metadata.userId);
      const buffer = await sendInvoice(user, transaction, "Euro");
      const link = await s3UploadPdf(buffer, user._id);
      user.is_active_plan = true;
      await user.save();
      transaction.invoice_url = link.Location.split(".com")[1];
      await transaction.save();
    }

    res.status(200).end();
  }
);

const addBankDetails = async (
  country,
  email = "shobhitchoudhary745@gmail.com",
  customerId
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const connect = await stripe.accounts.create({
        country: country,
        metadata: {
          customerId: customerId,
        },
        individual: {
          email: email,
        },
        type: "express",
        capabilities: {
          card_payments: {
            requested: true,
          },
          transfers: {
            requested: true,
          },
        },
        business_type: "individual",
        business_profile: {
          url: "https://scienda.com",
        },
      });

      await stripe.accounts.listExternalAccounts(connect.id);

      const account = await stripe.accountLinks.create({
        account: connect.id,
        refresh_url: "https://example.com/reauth",
        return_url: "https://example.com/return",
        type: "account_onboarding",
      });

      resolve({
        accountId: connect.id,
        accountLink: account,
      });
    } catch (error) {
      console.error("Error creating account:", error);
      reject(error.message);
    }
  });
};

const generateLoginLink = async (bankAccountId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const login = await stripe.accounts.createLoginLink(bankAccountId);

      resolve(login);
    } catch (error) {
      console.log(error);
      reject(error.message);
    }
  });
};

const paySalary = async (totalAmount, accountId) => {
  return new Promise(async (resolve, reject) => {
    // console.log("idd", accountId, typeof accountId);
    try {
      const transfer = await stripe.transfers.create({
        amount: totalAmount,
        currency: "usd",
        destination: accountId,
        description: "Transfer to Professor",
      });
      resolve(transfer);
    } catch (error) {
      console.error("Error creating transfer:", error);
      reject(error.message);
    }
  });
};

const payRefund = async (refundAmount, paymentIntentId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: refundAmount,
      });
      resolve(refund);
    } catch (error) {
      reject({ error: error.message });
    }
  });
};

module.exports = {
  stripeFunction,
  router,
  addBankDetails,
  generateLoginLink,
  paySalary,
  payRefund,
};
