const fs = require("fs");
const path = require("path");
const lastSentTicketIdFilePath = path.join(__dirname, "./previous-ticket.json");

// Function to read the last sent ticket ID from the file
const getLastSentTicketId = () => {
  try {
    const data = fs.readFileSync(lastSentTicketIdFilePath, "utf8");
    const json = JSON.parse(data);
    return json.lastSentTicketId;
  } catch (error) {
    console.error("Failed to read last sent ticket ID:", error.message);
    return null;
  }
};

// Function to update the last sent ticket ID in the file
const updateLastSentTicketId = (ticketId) => {
  try {
    const data = JSON.stringify({ lastSentTicketId: ticketId }, null, 2);
    fs.writeFileSync(lastSentTicketIdFilePath, data, "utf8");
  } catch (error) {
    console.error("Failed to update last sent ticket ID:", error.message);
  }
};


module.exports = { getLastSentTicketId, updateLastSentTicketId }