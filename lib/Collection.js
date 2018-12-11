class Collection{

    constructor(model, data) {
        this.model = model;
        this.data = data;
    }

    async handle() {
        const model = this.model;
        const data = this.data;
        const withData = model.options._withData;
        if (!model) {
            return;
        }
        let withDataStatus = false;
        if (Array.isArray(withData) && withData.length > 0) {
            withDataStatus = true;
        }
        const collect = [];
        for (let v of data) {
            let Model = new model._server.model;
            let originObj = {};
            for (let k in v) {
                if (v.hasOwnProperty(k)) {
                    Model[k] = v[k];
                    originObj[k] = v[k];
                }
            }
            Model._server.origin = originObj;
            collect.push(Model);
            if (withDataStatus) {
                for (let val of withData) {
                    !val.data ? val.data = [] : null;
                    val.data.push(v[val.ownerKey]);
                }
            }
        }
        if (withDataStatus) {
            let withObj = {};
            for (let v of withData) {
                v.model = typeof v.model === 'function' ? (new v.model) : v.model;
                const result = await v.model.where(v.foreignKey, 'in', v.data).get();
                withObj[v.str] = {
                    foreignKey: v.foreignKey,
                    ownerKey: v.ownerKey,
                    unique: v.unique,
                    str: v.str,
                    result: {},
                };
                if (result) {
                    let obj = {};
                    for (let d of result.data) {
                        if (v.unique) {
                            obj[d[v.foreignKey]] = d;
                        } else {
                            !obj.hasOwnProperty(d[v.foreignKey]) ? obj[d[v.foreignKey]] = [] : null;
                            obj[d[v.foreignKey]].push(d);
                        }
                    }
                    withObj[v.str].result = obj;
                }
            }
            for (let k in withObj) {
                if (withObj.hasOwnProperty(k) && withObj[k].result !== {}) {
                    for (let v of collect) {
                        const ownerKey = withObj[k].ownerKey;
                        v[withObj[k].str] = withObj[k].result[v[ownerKey]] || (!withObj[k].unique ? [] : null);
                    }
                }
            }
        }
        if (collect.length > 0) {
            this.data = collect;
        }
        delete this.options;
    }

}

module.exports = Collection;
