// pages/api/user/add-questao.ts

import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await dbConnect();

  try {
    const user = await User.findOne({ email: session.user?.email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // exemplo de adicionar uma questão respondida
    const { questao } = req.body;
    if (!questao) {
      return res.status(400).json({ error: "Missing questao field" });
    }

    user.questoesRespondidas.push(questao);
    await user.save();

    return res.status(200).json({ message: "Questao added successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
