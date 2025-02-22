const getPriorityLabel = (priority) => {
    const priorityMap = {
      1: "Low",
      2: "Medium",
      3: "High",
      4: "Urgent",
    };
    return priorityMap[priority] || "Unknown";
};

module.exports = { getPriorityLabel}