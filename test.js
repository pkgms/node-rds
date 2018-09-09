'use strict';

const Model = require('./index').mysql;
Model.config = function () {
    return {
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'o2otest',
    };
};

class Test extends Model {

}

const test = new Test();
test.where('id', 19).first().then(res => {
    console.log(res);
});