const Collection = require('./Collection');
const Server = require('./mysql');
const OP_ACCEPT = ['=', '<>', '>', '>=', '<', '<=', 'like', 'in', 'not in', 'between', 'not between'];

class MysqlQuery {

    getClass() {
        return this.constructor;
    }

    static table() {
        return null;
    }

    static config() {
        return {
            host: '127.0.0.1',
            user: 'root',
            password: 'root',
            database: 'test',
        };
    }

    static _originObj() {
        return null;
    }

    _getOptions() {
        if (!this.options) {
            const table = this.getClass().table() || this.getClass().name.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/, '');
            this.options = {
                server: new Server(this.getClass().config()),
                _table: table,
                _query: '',
                _values: [],
                _method: 'SELECT',
                _fields: [],
                _insertFields: [],
                _insertPlaceholder: [],
                _updatePlaceholder: [],
                _wherePlaceholder: [],
                _whereValues: [],
                _orderPlaceholder: [],
                _limitPlaceholder: [],
                _joinPlaceholder: [],
                _withData: [],
            }
        }
    }

    _clearOptions() {
        delete this.options;
    }

    async get(num, sql = false) {
        this._getOptions();
        typeof num === 'number' ? this.limit(num) : sql = num;
        this.build();
        if (sql) {
            let sql = this.options._query;
            const values = this.options._values;
            return [sql, values];
        }
        const res = await this.options.server.query(this.options._query, this.options._values);
        if (this.options._method === 'SELECT' && num !== 1) {
            const collection = new Collection(this.constructor, res, this.options);
            await collection.handle();
            return collection.data ? collection : null;
        } else {
            const withData = this.options._withData;
            delete this.options;
            if (Array.isArray(res) && res.length > 0) {
                let originObj = {};
                for (let k in res[0]) {
                    if (res[0].hasOwnProperty(k)) {
                        this[k] = res[0][k];
                        originObj[k] = res[0][k];
                    }
                }
                this.getClass()._originObj = function () {
                    return JSON.parse(JSON.stringify(originObj));
                };
                for (let v of withData) {
                    const model = v.model.where(v.foreignKey, this[v.ownerKey]);
                    this[v.str] = v.unique ? await model.first() : await model.get();
                }
                return this;
            }
            return res;
        }
    }

    getSql() {
        this.buildQuery();
        return {
            query: this._query,
            values: this._values
        };
    }

    async first(sql = false) {
        return await this.get(1, sql);
    }

    async paginate(page, pageSize, sql = false) {
        page = page || 1;
        pageSize = pageSize || 10;
        this.limit((page - 1) * pageSize, pageSize);
        return await this.get(sql);
    }

    async count() {
        this._getOptions();
        this.options._fields = ['COUNT(*) as count'];
        const res = await this.first();
        return res.count;
    }

    async insert(obj, sql = false) {
        this._getOptions();
        this.options._method = 'INSERT';
        let arr = [];
        if (Array.isArray(obj)) {
            arr = obj;
        } else {
            arr.push(obj);
        }
        let fields = [], status = false;
        for (let v of arr) {
            let insert = [];
            for (let key in v) {
                if (v.hasOwnProperty(key)) {
                    !status ? fields.push(`\`${key}\``) : null;
                    insert.push('?');
                    this.options._values.push(v[key]);
                }
            }
            this.options._insertPlaceholder.push(insert);
            status = true;
        }
        this.options._insertFields = fields;
        return await this.get(sql);
    }

    async create(obj, sql = false) {
        const res = await this.insert(obj, sql);
        return res[0];
    }

    async update(obj, sql = false) {
        this._getOptions();
        this.options._method = 'UPDATE';
        const originObj = this.getClass()._originObj();
        if (originObj && this.options._whereValues.length === 0) {
            for (let key in originObj) {
                if (originObj.hasOwnProperty(key)) {
                    this.where(key, originObj[v]);
                }
            }
        }
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                let index = this.options._values.length + this.options._whereValues.length + 1;
                this.options._updatePlaceholder.push(`\`${key}\` = ?`);
                this.options._values.push(obj[key]);
            }
        }
        return await this.get(sql);
    }

    async save(sql) {
        this._clearOptions();
        this._getOptions();
        this.options._method = 'UPDATE';
        const originObj = this.getClass()._originObj();
        const keys = Object.keys(originObj);
        if (keys && this.options._whereValues.length === 0) {
            for (let v of keys) {
                this.where(v, originObj[v]);
            }
        }
        for (let key of keys) {
            if (this.hasOwnProperty(key)) {
                let index = this.options._values.length + this.options._whereValues.length + 1;
                this.options._updatePlaceholder.push(`\`${key}\` = ?`);
                this.options._values.push(this[key]);
            }
        }
        return await this.get(sql);
    }

    async delete(sql = false) {
        this._getOptions();
        this.options._method = 'DELETE';
        const originObj = this.getClass()._originObj();
        const keys = Object.keys(originObj);
        if (keys && this.options._whereValues.length === 0) {
            for (let v of keys) {
                this.where(v, originObj[v]);
            }
        }
        return await this.get(sql);
    }

    select(...fields) {
        this._getOptions();
        for (let field of fields) {
            if (field.indexOf('.*') > 0) {
                this.options._fields.push(`\`${field.replace('.', '`.')}`);
            } else if (Array.isArray(field)) {
                const [name, alias] = field;
                this.options._fields.push(`\`${name.replace('.', '`.`')}\` AS \`${alias}\``);
            } else {
                this.options._fields.push(`\`${field.replace('.', '`.`')}\``);
            }
        }
        return this;
    }

    where(key, op, value) {
        this._getOptions();
        key = key.replace('.', '`.`');
        if (value === undefined) {
            value = op;
            op = '=';
        }
        if (OP_ACCEPT.indexOf(op) < 0) {
            throw new Error('Build query with invalid operator');
        }
        if (Array.isArray(value)) {
            if (op === 'between' || op === 'not between') {
                this.options._wherePlaceholder.push(`\`${key}\` ${op.toLocaleUpperCase()} ? AND ?`);
                this.options._whereValues.push([value[0], value[1]]);
            } else if (op === 'in' || op === 'not in') {
                const placeholder = [...value].fill('?');
                for (let i = 0; i < value.length; i++) {
                    this.options._whereValues.push(value[i]);
                }
                this.options._wherePlaceholder.push(`\`${key}\` ${op.toLocaleUpperCase()} (${placeholder.join()})`);
            }
        } else if (value === null) {
            if (op === '=') {
                this.options._wherePlaceholder.push(`\`${key}\` IS NULL`);
            } else if (op === '<>') {
                this.options._wherePlaceholder.push(`\`${key}\` IS NOT NULL`);
            }
        } else {
            this.options._wherePlaceholder.push(`\`${key}\` ${op} ?`);
            this.options._whereValues.push(value);
        }
        return this;
    }

    orderBy(key, type = 'ASC') {
        this._getOptions();
        this.options._orderPlaceholder.push(`\`${key.replace('.', '`.`')}\` ${type.toLocaleUpperCase()}`);
        return this;
    }

    limit(start, end = null) {
        this._getOptions();
        let limitStr = ` LIMIT ${start}`;
        if (end) {
            limitStr += `, ${end}`;
        }
        this.options._limitPlaceholder = limitStr;
        return this;
    }

    join(type = 'INNER', table, foreignKey, op, ownerKey) {
        this._getOptions();
        if (!ownerKey) {
            ownerKey = op;
            op = '=';
        }
        this.options._joinPlaceholder += ` ${type} JOIN \`${table}\` ON \`${foreignKey.replace('.', '`.`')}\` ${op} \`${ownerKey.replace('.', '`.`')}\``;
        return this;
    }

    leftJoin(table, foreignKey, op, ownerKey) {
        return this.join('LEFT', table, foreignKey, op, ownerKey);
    }

    rightJoin(table, foreignKey, op, ownerKey) {
        return this.join('RIGHT', table, foreignKey, op, ownerKey);
    }

    build() {
        this._getOptions();
        if (!this.options._table || typeof this.options._table !== 'string')
            throw new Error('Build query with invalid table name');
        let query = '';
        let whereStatus = true, orderStatus = false, limitStatus = false;
        switch (this.options._method) {
            case 'SELECT':
                orderStatus = true;
                limitStatus = true;
                const fields = this.options._fields.length > 0 ? this.options._fields : ['*'];
                query += `SELECT ${fields.join()} FROM \`${this.options._table}\` ${this.options._joinPlaceholder}`;
                break;
            case 'INSERT':
                whereStatus = false;
                let insertArr = [];
                for (let v of this.options._insertPlaceholder) {
                    insertArr.push(`(${v.join(',')})`);
                }
                query += `INSERT INTO \`${this.options._table}\` (${this.options._insertFields.join(',')}) VALUES ${insertArr.join(',')} `;
                break;
            case 'UPDATE':
                query += `UPDATE \`${this.options._table}\` SET ${this.options._updatePlaceholder.join(',')}`;
                break;
            case 'DELETE':
                query += `DELETE FROM \`${this.options._table}\``;
                break;
            default:
                break;
        }
        if (whereStatus && this.options._wherePlaceholder.length > 0) {
            let whereValue;
            for (let v of this.options._wherePlaceholder) {
                whereValue ? whereValue += ` AND ${v}` : whereValue = `${v}`;
            }
            query += ` WHERE ${whereValue}`;
        }
        if (orderStatus && this.options._orderPlaceholder.length > 0) {
            query += ` ORDER BY ${this.options._orderPlaceholder.join(', ')}`;
        }
        if (limitStatus && this.options._limitPlaceholder) {
            query += this.options._limitPlaceholder;
        }
        query += ';';
        this.options._query = query;
        this.options._values = this.options._whereValues.concat(this.options._values);
    }

    with(...models) {
        if (!models) {
            return this;
        }
        this._getOptions();
        let func, res;
        for (let str of models) {
            func = 'this.' + str + '()';
            res = eval(func);
            res.str = str;
            this.options._withData.push(res);
        }
        return this;
    }

    hasOne(model, foreignKey, ownerKey) {
        return { model, foreignKey, ownerKey, unique: true };
    }

    hasMany(model, foreignKey, ownerKey) {
        return { model, foreignKey, ownerKey, unique: false };
    }

}

exports = module.exports = MysqlQuery;
