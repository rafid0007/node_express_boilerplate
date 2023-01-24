import mongoose from "mongoose";
const Schema = mongoose.Schema;
import bcrypt from "bcrypt";

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, sparse: true },
  phone: {type: Number, required: true, unique: true, sparse: true},
  password: { type: String, required: true, select: false },
  refresh_tokens: {
    type: [{ type: String }],
    select: false,
  }
});

UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export default mongoose.model("User", UserSchema);
