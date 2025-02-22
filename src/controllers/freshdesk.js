const integration_data = require("../telex-integration-config.json");
const { getPriorityLabel } = require("../utils/ticket-priority-label");
const {
  getLastSentTicketId,
  updateLastSentTicketId,
} = require("../utils/previous-ticket");
const axios = require("axios");

//integration spec file
const integration = (req, res) => {
  return res.json(integration_data);
};

//fetch ticket from freshdesk
const monitorFreshdesk = async (req, res) => {
  const { return_url, settings } = req.body;
  const api_key = settings.find(
    (setting) => setting.label === "API Key"
  )?.default;
  const freshdesk_domain = settings.find(
    (setting) => setting.label === "Freshdesk Domain"
  )?.default;
  if (!api_key || !freshdesk_domain) {
    return res.status(400).json({ error: "Settings is required" });
  }

  let freshdeskResponse;
  //fetch ticket from freshdesk
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
    console.log(
      "The latest ticket is the same as the last sent ticket. Skipping notification."
    );
    return res
      .status(200)
      .json({ status: "success", message: "No new ticket to notify" });
  }

  const priorityLabel = getPriorityLabel(latestTicket.priority);
  const created_at = latestTicket.created_at.toISOString().split(".")[0].replace("T", " ").slice(0, 16);
  const ticketMessage =
    `ID: ${latestTicket.id}\n` +
    `Subject: ${latestTicket.subject}\n` +
    `Priority: ${priorityLabel}\n` +
    `Created At: ${created_at}`;

console.log("Ticket message:", ticketMessage)
  const telexFormat = {
    message: ticketMessage,
    username: "Freshdesk Bot",
    event_name: "New Ticket Alert",
    status: "success",
  };

  console.log("Sending notification to Telex:", telexFormat);

  try {
    await axios.post(return_url, telexFormat, {
      headers: { "Content-Type": "application/json" },
    });
    // Update the last sent ticket ID
    updateLastSentTicketId(latestTicket.id);
    res.status(202).json({
      status: "success",
      message: "notification sent to telex",
    });
  } catch (err) {
    console.error("Failed to send notification to Telex:", err.message);
    return res.status(500).json({ error: "Failed to send notification" });
  }
};

module.exports = { integration, monitorFreshdesk };
