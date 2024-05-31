const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const express = require("express");
const router = express.Router();
const transactionModel = require("../models/transactionModel");
const userModel = require("../models/userModel");
const { s3UploadPdf } = require("./s3");
const { sendInvoice } = require("./sendEmail");

const stripeFunction = async (price, validity, userId, planId, subdomain) => {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],

        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "title",

                metadata: {
                  validity,
                  userId,
                  planId,
                  subdomain,
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
        },
        mode: "payment",
        success_url: `https://scienda-user.netlify.app/#/menu/my-account`,
        cancel_url: `http://localhost:4000/cancel.html`,
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
      result = result.setDate(result.getDate() + data.metadata.validity);

      const transaction = await transactionModel.create({
        plan_id: data.metadata.planId,
        user: data.metadata.userId,
        gateway: "Stripe",
        payment_id: data.id,
        amount: data.amount_total / 100,
        status: "Success",
        validity: result,
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

module.exports = { stripeFunction, router };
