const { Op, Job, sequelize, Contract } = require("../model");

/**
 * @description Fetch the best paying role from profiles/jobs
 */
async function getBestRole(startDate, endDate) {
  try {
    if (!startDate || !endDate)
      throw new Error("You must provide a startDate and endDate");

    const result = await Job.findAll({
      attributes: [
        "$Contract.Contractor.profession$",
        [sequelize.fn("sum", sequelize.col("price")), "total"],
      ],
      include: {
        model: Contract,
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      },
      group: ["$Contract.Contractor.profession$"],
      order: [[sequelize.col("total"), "DESC"]],
      limit: 1,
    });

    return result;
  } catch (error) {
    console.error("Error in getBestRole", error);
    throw error;
  }
}

module.exports = { getBestRole };
