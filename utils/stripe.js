const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const express = require("express");
const router = express.Router();

const stripeFunction = async (price, validity, userId) => {
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
              },
              unit_amount: price * 100,
            },
            quantity: 1,
          },
        ],
        metadata: {
          validity,
          userId,
        },
        mode: "payment",
        success_url: `http://localhost:4000/success.html`,
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
      console.log("Completed", data);
    }
    res.status(200).end();
  }
);

module.exports = { stripeFunction, router };
