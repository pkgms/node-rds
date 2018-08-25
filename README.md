# node-rds
sql model

# Start to use
> npm install @zctod/node-rds

# Create a model 
test.js
```javascript
const Model = require('@zctod/node-rds');
class Test extends Model {

    static table() {
        return 'test';
    }
    
    static config() {
        return {
            host: '127.0.0.1',
            user: 'root',
            password: 'root',
            database: 'bby',
        };
    }
}

const test = new Test();
test.get().then(res => {
  console.log(res);
});
```

# API

first: test.first()   
get: test.get(num)   
create: test.create(obj)   
insert: test.insert(arr)   
update: test.update(obj)   
delete: test.delete()   
where: test.where(field, op, value)    
select: test.select(...fields)   
orderBy: test.orderBy(field, 'ASC')   
limit: test.limit(10, 1)   
join: test.leftJoin(tablename, tablename.field, test.field)   
leftJoin: test.leftJoin(tablename, tablename.field, test.field)   
rightJoin: test.leftJoin(tablename, tablename.field, test.field)   
