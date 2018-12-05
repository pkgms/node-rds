'use strict';

const Model = require('./index').mysql;
Model.config = function () {
    return {
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'test',
    };
};

class Users extends Model {}

const users = new Users();
users.create({
    openid: new Date().valueOf(),
}).then(res => {
    console.log(res);
});
