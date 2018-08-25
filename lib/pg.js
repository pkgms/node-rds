const {Pool, Client} = require('pg');

class Server {

    constructor(options) {
        this.options = options;
        if (options.pool === true) {
            this.pool = new Pool(this.options);
        }
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
        const res = await this.connection.query(sqlString, values);
        this.end();
        if (res.rowCount > 0) {
            if (Array.isArray(res.rows) && res.rows.length > 0) {
                return res.rows;
            }
            return true;
        } else {
            return null;
        }
    }
}

module.exports = Server;