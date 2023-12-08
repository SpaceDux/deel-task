const express = require("express");
const bodyParser = require("body-parser");
const { sequelize } = require("./model");
const { getProfile } = require("./middleware/getProfile");
const app = express();
app.use(bodyParser.json());
app.set("sequelize", sequelize);
app.set("models", sequelize.models);

// Custom business functions
const {
  getContractById,
  getAllContractsByProfile,
} = require("./domain/Contract.service");
const { getUnpaidJobs, makeJobPayment } = require("./domain/Job.service");
const { depositFunds } = require("./domain/Profile.service");
const { getBestRole } = require("./domain/Admin.service");

// Contracts
/**
 * @description Fetch a contract by id
 * @param {Number} id
 * @returns {Contract} contract
 */
app.get("/contracts/:id", getProfile, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await getContractById(id, req.profile);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

/**
 * @description Fetch a list of contracts excluding those that have been terminated
 * @returns {Contract[]} contracts - list of contracts
 */
app.get("/contracts", getProfile, async (req, res) => {
  try {
    const result = await getAllContractsByProfile(req.profile);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Jobs
/**
 * @description Fetch a list of unpaid jobs for a client OR contractor
 * @returns {Job[]} jobs - list of jobs
 */
app.get("/jobs/unpaid", getProfile, async (req, res) => {
  try {
    const jobs = await getUnpaidJobs(req.profile);
    res.json(jobs);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

/**
 * @description Make a payment for a job
 * @param {Number} jobId
 * @param {Object} profile
 * @returns {Job} job - updated job
 */
app.post("/jobs/:jobId/pay", getProfile, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const result = await makeJobPayment(jobId, req.profile);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Profiles
/**
 * @description Fetch logged in user.
 * @returns {Profile} profile
 */
app.get("/profile", getProfile, async (req, res) => {
  try {
    res.status(200).json(req.profile);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

/**
 * @description Deposit funds into a profile
 * @param {Number} amount
 * @returns {Profile} profile
 */
app.post("/balances/deposit", getProfile, async (req, res) => {
  try {
    const amount = req.body.amount;
    const result = await depositFunds(req.profile.id, amount);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Admin
/**
 * @description Fetch the best paying role from profiles/jobs
 */
app.get("/admin/best-role", async (req, res) => {
  try {
    const startDate = req.query.start;
    const endDate = req.query.end;
    const result = await getBestRole(startDate, endDate);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = app;
