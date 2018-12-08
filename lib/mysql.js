const mysql = require('mysql2/promise');

class Server {

    constructor(options, isBeginTransaction) {
        this.options = options;
        if (options.pool === true) {
            this.pool = mysql.createPool(this.options);
        }
        this.isBeginTransaction = isBeginTransaction === true;
    }

    async connect() {
        let connection;
        let pool = !!this.pool;
        if (pool) {
            connection = await this.pool.getConnection();
        } else {
            connection = await mysql.createConnection(this.options);
        }
        this.connection = connection;
    }

    end() {
        if (this.pool) {
            this.connection.release();
        } else {
            this.connection.destroy();
        }
        delete this.connection;
    }

    async query(sqlString, values) {
        await this.connect();
        if (!this.connection) {
            return;
        }
        let res;
        if (this.isBeginTransaction === true) {
            await this.connection.beginTransaction();
            [res] = await this.connection.query(sqlString, values);
        } else {
            [res] = await this.connection.query(sqlString, values);
            this.end();
        }
        if (Array.isArray(res) && res.length === 0) {
            return null;
        }
        return res;
    }

    beginTransaction() {
        this.isBeginTransaction = true;
    }

    async commit() {
        if (this.connection) {
            await this.connection.commit();
            this.end();
        }
    }

    async rollback() {
        if (this.connection) {
            await this.connection.rollback();
            this.end();
        }
    }
}

module.exports = Server;
