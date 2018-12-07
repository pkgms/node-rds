const mysql = require('mysql2/promise');

class Server {

    constructor(options) {
        this.options = options;
        if (options.pool === true) {
            this.pool = mysql.createPool(this.options);
        }
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
        const [res] = await this.connection.query(sqlString, values);
        this.end();
        if (Array.isArray(res) && res.length === 0) {
            return null;
        }
        return res;
    }

    async beginTransaction() {
        await this.connection.beginTransaction();
    }

    async commit() {
        await this.connection.commit();
        this.end();
    }

    async rollback() {
        await this.connection.rollback();
        this.end();
    }
}

module.exports = Server;
