<<<<<<< HEAD
// pages/api/user/historico.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
// Correctly import authOptions from the app router setup
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; 

// Define a type for your history items if you have one from your types/index.ts
// For now, using 'any' as a placeholder, ideally you'd import IAnsweredQuestion or similar
type HistoryItem = any; 

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HistoryItem[] | { error: string }>
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (req.method === 'GET') {
    // TODO: Implement logic to fetch history data for the logged-in user
    // This would involve querying a database based on session.user.id or email.
    // Client-side localStorage history is not accessible here.
    // This API route is a placeholder for future backend integration if history moves to a database.

    // Placeholder data:
    const placeholderHistory: HistoryItem[] = [];

    return res.status(200).json(placeholderHistory);
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }
=======
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
>>>>>>> d1ec33f6534020bf31a656cfcf5c365f0cb0de0f
}
