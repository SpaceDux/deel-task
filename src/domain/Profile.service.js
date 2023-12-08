const { Op, Profile, Job } = require("../model");
const { getUnpaidJobs } = require("./Job.service");

/**
 * @description Deposit funds into a profile
 * @param {*} profileId
 * @param {*} amount
 * @returns {Profile} profile
 */
async function depositFunds(profileId, amount) {
  try {
    if (amount <= 0) throw new Error("You can't deposit a negative amount");
    const profile = await Profile.findOne({
      where: {
        id: profileId,
      },
    });
    if (!profile) throw new Error("Profile not found");

    // Get balance existing, and check the amount owed in jobs.
    // Lets catch the error of there being no unpaid jobs
    try {
      const jobs = await getUnpaidJobs(profile);
      if (!jobs.length) {
        throw new Error(
          "You don't have any unpaid jobs, so you can't deposit."
        );
      }
    } catch (error) {
      throw new Error("You don't have any unpaid jobs, so you can't deposit.");
    }

    // Calculate the amount owed via a reduce function
    const amountOwed = jobs.reduce((acc, job) => {
      return acc + job.price;
    }, 0);

    // Current balance + amount to deposit
    const newBalance = profile.balance + amount;

    // Check if the amount to deposit less then the amount owed + 25%
    if (newBalance > amountOwed * 1.25)
      throw new Error("You're trying to deposit too much.");

    // Update the balance
    await profile.update({ balance: newBalance });

    return profile;
  } catch (error) {
    console.error("Error in depositFunds", error);
    throw error;
  }
}

module.exports = { depositFunds };
