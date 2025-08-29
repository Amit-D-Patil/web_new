import mongoose from "mongoose";

const bhishiSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    transactions: [
        {
            date: { type: Date, default: Date.now },
            type: { type: String, enum: ["deposit", "redeem"], required: true },
            amount: { type: Number, required: true },
            notes: String
        }
    ],
    balance: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export default mongoose.model("Bhishi", bhishiSchema);
