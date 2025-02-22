const getPriorityLabel = (priority) => {
    const priorityMap = {
      1: "Low",
      2: "Medium",
      3: "High",
      4: "Urgent",
    };
    return priorityMap[priority] || "Unknown";
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
  });
};

module.exports = { getPriorityLabel, formatDate}