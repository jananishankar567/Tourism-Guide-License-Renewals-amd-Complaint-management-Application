const mongoose = require("mongoose");

const applicantSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        mobile: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        accountType: {
            type: String,
            enum: ["Guide", "Tourist"],
            default: "Guide",
            index: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Applicant", applicantSchema);