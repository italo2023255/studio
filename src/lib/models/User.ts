// src/lib/models/User.ts

import mongoose, { Schema, models, model } from "mongoose";

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  questoesRespondidas: { type: [String], default: [] },
}, { timestamps: true });

const User = models.User || model("User", userSchema);

export default User;
