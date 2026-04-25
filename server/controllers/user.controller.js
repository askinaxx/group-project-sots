const { enrichUser } = require("../services/user.service");

async function getUser(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: Number(req.params.id) },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json(enrichUser(user));
}

module.exports = { getUser };