const express = require("express");
const routes = express.Router();
const { integration, monitorFreshdesk} = require("../controllers/freshdesk")



routes.get("/integration-spec", integration);
routes.post("/tick", monitorFreshdesk)

module.exports = routes;