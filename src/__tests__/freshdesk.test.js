const { monitorFreshdesk } = require("../controllers/freshdesk");
const axios = require("axios");
const {
  getLastSentTicketId,
  updateLastSentTicketId,
} = require("../utils/previous-ticket");
const { getPriorityLabel, formatDate } = require("../utils/ticket-priority-label");

jest.mock("axios");
jest.mock("../utils/previous-ticket", () => ({
  getLastSentTicketId: jest.fn(),
  updateLastSentTicketId: jest.fn(),
}));
jest.mock("../utils/ticket-priority-label", () => ({
  getPriorityLabel: jest.fn(),
  formatDate: jest.fn(),
}));


describe("Monitor Freshdesk", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        return_url: "https://example.com/callback",
        settings: [
          { label: "API Key", default: "test_api_key" },
          { label: "Freshdesk Domain", default: "test_domain" },
        ],
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return 400 if API Key or Freshdesk Domain is missing", async () => {
    req.body.settings = [];
    await monitorFreshdesk(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "API Key and Freshdesk Domain are required" });
  });

  it("should return 500 if fetching tickets fails", async () => {
    axios.get.mockRejectedValue(new Error("Fetch error"));
    await monitorFreshdesk(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch ticket" });
  });

  it("should return 404 if no tickets are found", async () => {
    axios.get.mockResolvedValue({ data: [] });
    await monitorFreshdesk(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "No tickets found" });
  });

  it("should send 'No New Ticket' notification if latest ticket ID matches last sent ticket ID", async () => {
    axios.get.mockResolvedValue({ data: [{ id: 123 }] });
    getLastSentTicketId.mockReturnValue(123);
    axios.post.mockResolvedValue({});

    await monitorFreshdesk(req, res);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "No new ticket to notify, notification sent to telex",
    });
  });

  it("should send 'New Ticket' notification if latest ticket ID is new", async () => {
    axios.get.mockResolvedValue({ data: [{ id: 456, subject: "Test", priority: 2, created_at: "2025-02-23T10:00:00Z" }] });
    getLastSentTicketId.mockReturnValue(123);
    getPriorityLabel.mockReturnValue("High");
    formatDate.mockReturnValue("2025-02-23 10:00:00");
    axios.post.mockResolvedValue({});

    await monitorFreshdesk(req, res);

    expect(updateLastSentTicketId).toHaveBeenCalledWith(456);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "notification sent to telex",
    });
  });

  it("should return 500 if sending notification to Telex fails", async () => {
    axios.get.mockResolvedValue({ data: [{ id: 456, subject: "Test", priority: 2, created_at: "2025-02-23T10:00:00Z" }] });
    getLastSentTicketId.mockReturnValue(123);
    getPriorityLabel.mockReturnValue("High");
    formatDate.mockReturnValue("2025-02-23 10:00:00");
    axios.post.mockRejectedValue(new Error("Telex error"));

    await monitorFreshdesk(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to send notification" });
  });
});
