const mongoose = require("mongoose");

const sessionSchema = mongoose.Schema(
  {
    _id: {
      type: String,
      required: ["true", "an sid must be provided"]
    },
    data: Object,
    expires: Date,
    userId: String,
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("Session", sessionSchema)

