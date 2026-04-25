function enrichUser(user) {
  return {
    ...user,

    flags: {
      isActive: user.status === "active",
      isBlocked: user.status === "blocked",
      isDeleted: user.status === "deleted",
    },

    safety: {
      isSafe: user.riskScore < 30,
      riskLevel:
        user.riskScore < 30
          ? "low"
          : user.riskScore < 70
          ? "medium"
          : "high",
      requiresReview: user.riskScore >= 70,
    },
  };
}

module.exports = { enrichUser };