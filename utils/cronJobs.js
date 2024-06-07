const cron = require("node-cron");
const transactionModel = require("../models/transactionModel");
const userModel = require("../models/userModel");
const subAdminModel = require("../models/subAdminModel");
const salaryModel = require("../models/salaryModel");
const { paySalary } = require("./stripe");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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

cron.schedule("52 12 * * *", async () => {
  try {
    const subadmins = await subAdminModel.find({});

    for (let subadmin of subadmins) {
      if (subadmin.account_id) {
        const obj = {};
        const arr = [];
        let totalSalary = 0;
        for (let subdomain of subadmin.sub_domain) {
          let domain_wise_salary = 0;
          const startOfMonth = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          );
          const endOfMonth = new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          );
          const transactions = await transactionModel
            .find({
              subdomain,
              createdAt: {
                $gte: startOfMonth,
                $lt: endOfMonth,
              },
            })
            .lean();

          for (let transaction of transactions) {
            domain_wise_salary += transaction.amount;
          }
          domain_wise_salary =
            (subadmin.pay_percent / 100) * domain_wise_salary;
          obj.subdomain = subdomain;
          obj.amount = domain_wise_salary;
          obj.number_of_transaction = transactions.length;
          arr.push(obj);
          totalSalary += domain_wise_salary;
          domain_wise_salary = 0;
        }

        const transaction = await paySalary(
          totalSalary * 100,
          subadmin.account_id
        );

        await salaryModel.create({
          professor: subadmin._id,
          amount: totalSalary,
          area_wise: arr,
          transfer_id: transaction.id,
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
});
