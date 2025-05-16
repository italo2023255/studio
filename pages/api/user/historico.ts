import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "../../../lib/mongodb";
import User from "../../../models/User";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Não autorizado" });

  await dbConnect();

  const user = await User.findOne({ email: session.user.email });
  return res.status(200).json(user.questoesRespondidas || []);
}
