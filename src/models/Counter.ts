import mongoose, { Schema, model, models } from "mongoose";

const counterSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },

    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Counter = models.Counter || model("Counter", counterSchema);

export default Counter;