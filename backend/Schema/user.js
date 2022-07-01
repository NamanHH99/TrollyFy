const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required!!']
    },
    email: {
        type: String,
        required: [true, 'Email is required!!'],
        unique: true, // Email should be unique
        // validator module will validator if the email entered exists or not
        validate: [validator.isEmail, 'Please enter valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Atleast 8 characters are required.'],
        // select: false // To not show password whenever we want to display the user
    },
    // avatar picture of the user
    avatar: {
        public_id: {
            type: String,
            // required: true
        },
        url: {
            type: String,
            // required: true
        }
    },
    role: {
        type: String,
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String, // If the user wants to reset its password a token will be mailed to the user
    resetPasswordExpire: Date  // Till when the token is valid
})
 module.exports = userSchema;
