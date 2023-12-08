const { Contract, Op } = require("../model");

/**
 * @description Fetch a contract by id belonging to a client OR contractor
 * @param {Number} id
 * @param {Object} profile
 * @returns
 */
async function getContractById(id, profile) {
  try {
    const contract = await Contract.findOne({
      include: ["Client", "Contractor", "Jobs"],
      where: {
        id,
        [Op.or]: [{ ClientId: profile.id }, { ContractorId: profile.id }],
      },
    });
    if (!contract) throw new Error("Contract not found");
    return contract;
  } catch (error) {
    console.error("Error in GET /contracts/:id", error);
    throw error;
  }
}

/**
 * @description Fetch a list of contracts belonging to a client OR contractor. Excluding terminated.
 * @param {Object} profile
 * @returns
 */
async function getAllContractsByProfile(profile) {
  try {
    const contracts = await Contract.findAll({
      include: ["Client", "Contractor", "Jobs"],
      where: {
        [Op.or]: [{ ClientId: profile.id }, { ContractorId: profile.id }],
        status: {
          [Op.ne]: "terminated",
        },
      },
    });
    if (!contracts.length) throw new Error("No contracts found");
    return contracts;
  } catch (error) {
    console.error("Error in GET /contracts", error);
    throw error;
  }
}

module.exports = { getContractById, getAllContractsByProfile };
