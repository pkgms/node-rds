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
test.with('account').get(3).then(res => {
    console.log(res);
});