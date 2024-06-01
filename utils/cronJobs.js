const cron = require("node-cron");
const transactionModel = require("../models/transactionModel");
const userModel = require("../models/userModel");

cron.schedule("0 0 * * *", async () => {
  try {
    const expiredTransations = await transactionModel.find({
      expiry: { $lte: new Date() },
      status: "Active",
    });
    await expiredTransations.updateMany(
      { _id: { $in: expiredTransations.map((order) => order._id) } },
      { status: "Expire" }
    );
    for (const transaction of expiredTransations) {
      const user = await userModel.findById(transaction.user);
      if (user) {
        user.is_active_plan = false;
        await user.save();
      }
    }
  } catch (error) {
    console.log(error);
  }
});
