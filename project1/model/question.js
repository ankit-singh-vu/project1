const mongoose = require("mongoose");
const moment = require("moment");

const question = mongoose.Schema(
    {
        name:{
            type:String
        },
        // Category_id:{
        //     type:String
        // },
        Category_id: { type: mongoose.Schema.Types.ObjectId, ref: "category" },
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
  question.virtual("createdOn").get(function () {
    const generateTime = moment(this.createdAt).format("DD-MM-YYYY h:m:ss A");
    return generateTime;
  });
  
  // Virtual for date generation
  question.virtual("updatedOn").get(function () {
    const generateTime = moment(this.updatedAt).format("DD-MM-YYYY h:m:ss A");
    return generateTime;
  });
  
  module.exports = mongoose.model('question',question);
