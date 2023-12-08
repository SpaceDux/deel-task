const { Job, Contract, Profile, Op, sequelize } = require("../model");

/**
 * @description Fetch a list of unpaid jobs for a client OR contractor
 * @returns {Job[]} jobs - list of jobs
 */
async function getUnpaidJobs(profile) {
  try {
    const jobs = await Job.findAll({
      include: {
        model: Contract,
        include: ["Client", "Contractor"],
        as: "Contract",
      },
      where: {
        paid: {
          [Op.not]: true, // We do this as some data includes paid=null
        },
        [Op.or]: [
          { "$Contract.ContractorId$": profile.id },
          { "$Contract.ClientId$": profile.id },
        ],
        "$Contract.status$": {
          [Op.not]: "terminated",
        },
      },
    });
    if (!jobs.length) throw new Error("No unpaid jobs found");

    // Map the jobs to remove the contractors balance
    const result = jobs.map((row) => {
      const job = row.toJSON();
      delete job.Contract.Contractor.balance;
      delete job.Contract.Client.balance;
      return job;
    });

    return result;
  } catch (error) {
    console.error("Error in GET /jobs/unpaid", error);
    throw error;
  }
}

/**
 * @description Make a payment for a job
 * @param {Number} jobId
 * @param {Object} profile
 * @returns {Job} job - updated job
 */
async function makeJobPayment(jobId, profile) {
  try {
    const trx = await sequelize.transaction(async () => {
      // Find the job & all its relationships
      let job = await Job.findOne({
        include: {
          model: Contract,
          include: ["Client", "Contractor"],
          as: "Contract",
        },
        where: {
          id: jobId,
          paid: {
            [Op.not]: true, // We do this as some data includes paid=null
          },
          "$Contract.ClientId$": profile.id, // Only the client can make the payment
          "$Contract.status$": {
            [Op.not]: "terminated",
          },
        },
      });
      if (!job) throw new Error("Job not found");

      // Get the contractor & client
      const contractor = job.Contract.Contractor;
      const client = job.Contract.Client;

      // Check the contractor and client exist, this should never happen, but safety first.
      if (!contractor || !client)
        throw new Error("Contractor or client not found");

      // Check the client is the one making the payment
      // Additional safety check, this should never happen
      if (client.id !== profile.id)
        throw new Error("You are not authorised to make this payment");

      // Check the clients balance is greater than the job price
      if (client.balance < job.price) throw new Error("Insufficient funds");

      // Update the balances
      const newClientBalance = client.balance - job.price;
      const newContractorBalance = contractor.balance + job.price;

      // Update the records accordingly
      await client.update({ balance: newClientBalance });
      await contractor.update({ balance: newContractorBalance });

      // Update the job
      await job.update({ paid: true });

      // Update the result to remove the contractors balance
      job = job.toJSON();
      delete job.Contract.Contractor.balance;

      // Return the job
      return job;
    });

    return {
      success: true,
      job: trx,
    };
  } catch (error) {
    console.error("Error in GET /jobs/unpaid", error);
    throw error;
  }
}

module.exports = { getUnpaidJobs, makeJobPayment };
