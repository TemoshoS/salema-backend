const mongoose = require("mongoose");


const securityCompanySchema = new mongoose.Schema(
{
    companyName:{
        type:String,
        required:true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    phoneNumber:{
        type:String,
        required:true
    },

    psiraCompanyNumber:{
        type:String,
        required:true,
        unique:true
    },


    registrationNumber:{
        type:String,
        required:true,
        unique:true
    },


    address:{
        type:String,
        required:true
    },


    contactPerson:{
        type:String,
        required:true
    },


    password:{
        type:String,
        required:true
    },


    role:{
        type:String,
        default:"security_company"
    },
    approvalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      
      approvedAt: {
        type: Date,
        default: null,
      },


    otp:String,

    otpExpires:Date,


    isVerified:{
        type:Boolean,
        default:false
    },


    lastOtpVerifiedAt:{
        type:Date,
        default:null
    }

},
{
 timestamps:true
});


module.exports = mongoose.model(
"SecurityCompany",
securityCompanySchema
);