const mongoose = require("mongoose");
const moment = require("moment");

const category = mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },
    status: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true }
);

// Virtual for date generation
category.virtual("createdOn").get(function () {
  const generateTime = moment(this.createdAt).format("DD-MM-YYYY h:m:ss A");
  return generateTime;
});

// Virtual for date generation
category.virtual("updatedOn").get(function () {
  const generateTime = moment(this.updatedAt).format("DD-MM-YYYY h:m:ss A");
  return generateTime;
});

module.exports = mongoose.model("category", category);
