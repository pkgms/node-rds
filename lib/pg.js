const {Pool, Client} = require('pg');

class Server {

    constructor(options, isBeginTransaction) {
        this.options = options;
        if (options.pool === true) {
            this.pool = new Pool(this.options);
        }
        this.isBeginTransaction = isBeginTransaction === true;
    }

    async connect() {
        let connection;
        let pool = !!this.pool;
        if (pool) {
            connection = await this.pool.connect();
        } else {
            connection = new Client(this.options);
            await connection.connect();
        }
        this.connection = connection;
    }

    end() {
        if (this.pool) {
            this.connection.release();
        } else {
            this.connection.end();
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
            await this.connection.query('BEGIN');
            res = await this.connection.query(sqlString, values);
        } else {
            res = await this.connection.query(sqlString, values);
            this.end();
        }
        if (res.rowCount > 0) {
            if (Array.isArray(res.rows) && res.rows.length > 0) {
                return res.rows;
            }
            return true;
        } else {
            return null;
        }
    }

    async beginTransaction() {
        this.isBeginTransaction = true;
    }

    async commit() {
        if (this.connection) {
            await this.connection.query('COMMIT');
            this.end();
        }
    }

    async rollback() {
        if (this.connection) {
            await this.connection.query('ROLLBACK');
            this.end();
        }
    }
}

module.exports = Server;
