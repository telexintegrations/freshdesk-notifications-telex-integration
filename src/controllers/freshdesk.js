const integration_data = require("../telex-integration-config.json");
const { getPriorityLabel, formatDate } = require("../utils/ticket-priority-label");
const {
  getLastSentTicketId,
  updateLastSentTicketId,
} = require("../utils/previous-ticket");
const axios = require("axios");
const default_api_key = process.env.API_KEY;
const default_freshdesk_domain = process.env.FRESHDESK_DOMAIN;

// Constants
const NO_NEW_TICKET_MESSAGE = "No new ticket to notify";
const NEW_TICKET_EVENT_NAME = "New Ticket";
const NO_NEW_TICKET_EVENT_NAME = "No New Ticket";
const SUCCESS_STATUS = "success";
const CONTENT_TYPE_JSON = { "Content-Type": "application/json" };

// Integration spec file
const integration = (req, res) => {
  return res.json(integration_data);
};

// Function to send notification to Telex
const sendTelexNotification = async (return_url, telexFormat, res, successMessage) => {
  try {
    await axios.post(return_url, telexFormat, {
      headers: { "Content-Type": "application/json" },
    });
    return res.status(202).json({
      status: "success",
      message: successMessage,
    });
  } catch (err) {
    console.error("Failed to send notification to Telex:", err.message);
    return res.status(500).json({ error: "Failed to send notification" });
  }
};

// Fetch ticket from Freshdesk
const monitorFreshdesk = async (req, res) => {
  const { return_url, settings } = req.body;
  const api_key = settings.find(
    (setting) => setting.label === "API Key"
  )?.default || default_api_key;
  const freshdesk_domain = settings.find(
    (setting) => setting.label === "Freshdesk Domain"
  )?.default || default_freshdesk_domain;

  if (!api_key || !freshdesk_domain) {
    return res.status(400).json({ error: "API Key and Freshdesk Domain are required" });
  }

  let freshdeskResponse;
  try {
    freshdeskResponse = await axios.get(
      `https://${freshdesk_domain}/api/v2/tickets`,
      {
        auth: {
          username: api_key,
          password: "X",
        },
        params: {
          order_by: "created_at",
          per_page: 1,
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch ticket:", error.message);
    return res.status(500).json({ error: "Failed to fetch ticket" });
  }

  const latestTicket = freshdeskResponse.data[0];
  if (!latestTicket) {
    console.log("No tickets found.");
    return res.status(404).json({ error: "No tickets found" });
  }

  const lastSentTicketId = getLastSentTicketId();

  // Check if the latest ticket is the same as the last sent ticket
  if (latestTicket.id === lastSentTicketId) {
    const telexFormat = {
      message: "No new ticket to notify",
      username: "Freshdesk Bot",
      event_name: "No New Ticket",
      status: "success",
    };

    console.log("Sending notification to Telex:", telexFormat);
    return sendTelexNotification(return_url, telexFormat, res, "No new ticket to notify, notification sent to telex");
  }

  const priorityLabel = getPriorityLabel(latestTicket.priority);
  const created_at = new Date(latestTicket.created_at);

  const ticketMessage =
    `ID: ${latestTicket.id}\n` +
    `Subject: ${latestTicket.subject}\n` +
    `Priority: ${priorityLabel}\n` +
    `Created At: ${formatDate(created_at)}`;

  console.log("Ticket message:", ticketMessage);
  const telexFormat = {
    message: ticketMessage,
    username: "Freshdesk Bot",
    event_name: "New Ticket",
    status: "success",
  };

  console.log("Sending notification to Telex:", telexFormat);
  updateLastSentTicketId(latestTicket.id);
  return sendTelexNotification(return_url, telexFormat, res, "notification sent to telex");
};

module.exports = { integration, monitorFreshdesk };
