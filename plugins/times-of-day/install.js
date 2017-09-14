var mongo = require('../../frontend/express/node_modules/mongoskin'),
    async = require('../../api/utils/async.min.js'),
    fs = require('fs'),
    path = require("path"),
    countlyConfig = require('../../frontend/express/config');

console.log("Installing plugin");


console.log("Creating needed directories");
var dir = path.resolve(__dirname, '');
fs.mkdir(dir+'/../../frontend/express/public/folder', function(){});

console.log("Modifying database");
var dbName;
if (typeof countlyConfig.mongodb === "string") {
    dbName = countlyConfig.mongodb;
} else if ( typeof countlyConfig.mongodb.replSetServers === 'object'){
    countlyConfig.mongodb.db = countlyConfig.mongodb.db || 'countly';
    //mongodb://db1.example.net,db2.example.net:2500/?replicaSet=test
    dbName = countlyConfig.mongodb.replSetServers.join(",")+"/"+countlyConfig.mongodb.db;
} else {
    dbName = (countlyConfig.mongodb.host + ':' + countlyConfig.mongodb.port + '/' + countlyConfig.mongodb.db);
}
if(dbName.indexOf("mongodb://") !== 0){
    dbName = "mongodb://"+dbName;
}

var countlyDb = mongo.db(dbName);

countlyDb.collection('apps').find({}).toArray(function (err, apps) {

    if (!apps || err) {
        console.log("No apps to upgrade");
        countlyDb.close();
        return;
    }
    function upgrade(app, done){
        console.log("Adding indexes to " + app.name);
        countlyDb.collection('app_users' + app._id).ensureIndex({"name":1},done);
    }
    async.forEach(apps, upgrade, function(){
        console.log("Plugin installation finished");
        countlyDb.close();
    });
});