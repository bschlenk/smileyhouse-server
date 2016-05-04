'use strict';

const isEmail = require('email-validator').validate;

module.exports = {
    validateUsername: username => /^\w{3,16}$/.test(username),
    validatePassword: pass => /^\w{5,16}$/.test(pass),
    validateEmail: email => isEmail(email),
};
