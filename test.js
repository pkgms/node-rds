'use strict';

const Model = require('./index');

class Account extends Model {

    static table() {
        return 'cst006';
    }
}

class Test extends Model {

    static table() {
        return 'cst001';
    }

    account() {
        return this.hasOne(new Account(), 'cid', 'cid');
    }
}

const test = new Test();
test.where('cid', 19).first().then(res => {
    console.log(res);
    res.rc_token = 111;
    res.save(true).then(result => {
        console.log(result);
    });
});