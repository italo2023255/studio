import mongoose from 'mongoose';

const MONGODB_URI = process.env.DATABASE_URL!;

if (!MONGODB_URI) {
  throw new Error("DATABASE_URL não definida.");
}

const dbConnect = async () => {
  if (mongoose.connections[0].readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};

export default dbConnect;
