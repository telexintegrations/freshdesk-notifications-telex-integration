const axios = require("axios");
const { getLastSentTicketId, updateLastSentTicketId } = require("../utils/previous-ticket");
const { getPriorityLabel, formatDate } = require("../utils/ticket-priority-label");
const { monitorFreshdesk } = require("../controllers/freshdesk");

jest.mock("axios");
jest.mock("../utils/previous-ticket", () => ({
  getLastSentTicketId: jest.fn(),
  updateLastSentTicketId: jest.fn(),
}));
jest.mock("../utils/ticket-priority-label", () => ({
  getPriorityLabel: jest.fn(),
  formatDate: jest.fn(),
}));

describe("send freshdesk ticket notification to telex", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        return_url: "http://mock-url.com",
        settings: [
          { label: "API Key", default: "mock-api-key" },
          { label: "Freshdesk Domain", default: "mock.freshdesk.com" },
        ],
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  //  Missing API Key or Domain
  it("should return 400 if API Key or Freshdesk Domain is missing", async () => {
    req.body.settings = []; // Simulate missing settings

    await monitorFreshdesk(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Settings is required" });
  });

  // Freshdesk API Failure
  it("should return 500 if Freshdesk API request fails", async () => {
    axios.get.mockRejectedValue(new Error("Freshdesk API error")); // Simulate API failure

    await monitorFreshdesk(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch ticket" });
  });

  //  No Tickets Found
  it("should return 404 if no tickets are found", async () => {
    axios.get.mockResolvedValue({ data: [] });

    await monitorFreshdesk(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "No tickets found" });
  });

  //  No New Tickets (Same Ticket ID as Last Sent)
  it("should return 200 if the latest ticket is the same as the last sent ticket", async () => {
    getLastSentTicketId.mockReturnValue(123); // Mock last ticket ID
    axios.get.mockResolvedValue({ data: [{ id: 123, priority: 2 }] });

    await monitorFreshdesk(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "No new ticket to notify",
    });
  });

  //  New Ticket Found → Send Notification to Telex
  it("should send a notification if a new ticket is found", async () => {
    getLastSentTicketId.mockReturnValue(122); // Mock previous ticket ID
    axios.get.mockResolvedValue({
      data: [{ id: 123, subject: "Test Ticket", priority: 2, created_at: "2025-02-22T10:00:00Z" }],
    });
    getPriorityLabel.mockReturnValue("Medium");
    formatDate.mockReturnValue("02/22/2025"); // Mock formatted date
    axios.post.mockResolvedValue({}); // Simulate successful notification

    await monitorFreshdesk(req, res);

    expect(axios.post).toHaveBeenCalledWith("http://mock-url.com", expect.objectContaining({
      message: expect.stringContaining("ID: 123"),
      message: expect.stringContaining("Created At: 02/22/2025"), // Validate formatted date
      event_name: "New Ticket Alert",
    }), expect.any(Object));
    expect(updateLastSentTicketId).toHaveBeenCalledWith(123);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "notification sent to telex",
    });
  });

  //  Telex API Failure (Fails After New Ticket is Found)
  it("should return 500 if notification to Telex fails", async () => {
    getLastSentTicketId.mockReturnValue(122);
    axios.get.mockResolvedValue({
      data: [{ id: 123, subject: "Test Ticket", priority: 2, created_at: "2025-02-22T10:00:00Z" }],
    });
    getPriorityLabel.mockReturnValue("Medium");
    formatDate.mockReturnValue("02/22/2025"); // Mock formatted date
    axios.post.mockRejectedValue(new Error("Telex API error")); // Simulate failure in notification

    await monitorFreshdesk(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to send notification" });
  });
});
