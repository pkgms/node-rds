const pgQuery = require('./pgQuery');
const mysqlQuery = require('./mysqlQuery');

module.exports = {
    pg: class Model extends pgQuery{},
    mysql: class Model extends mysqlQuery{},
};