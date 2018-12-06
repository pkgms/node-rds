'use strict';

const Model = require('./index').mysql;
Model.config = function () {
    return {
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'answer',
    };
};

class User extends Model {

    static isPostfix() {
        return true;
    }
}

const users = new User();
users.first().then(res => {
    console.log(res);
});
