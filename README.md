# node-rds
sql model

# Start to use
> npm install @zctod/node-rds

# Create a model 
test.js
```javascript
const Model = require('@zctod/node-rds').mysql;
class Test extends Model {

    static table() {
        return 'test';
    }
    
    static config() {
        return {
            host: '127.0.0.1',
            user: 'root',
            password: '',
            database: 'test',
        };
    }
}

const test = new Test();
test.get().then(res => {
  console.log(res);
});
```

# Related other models
```javascript
class User extends Model {

}

class Test extends Model {
    
    user() {
        return this.hasOne(new User(), 'id', 'uid');
    }
    users() {
        return this.hasMany(new User(), 'id', 'uid');
    }
}

const test = new Test();
test.with('user').get().then(res => {
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
