var express = require('express');
var router = express.Router();
var http = require('http');

// mysql
var mysql = require('mysql');
var mysqlCon = mysql.createConnection({
    host: "cs527.c7ftzzwu1edi.us-east-1.rds.amazonaws.com",
    user: "cs527_group4",
    password: "bestfriend1",
    database: 'NCAA',
});

mysqlCon.connect(function (err) {
    if (err) throw err;
    console.log("MySQL Connected!");
});


// redshift
// var Redshift = require('node-redshift');

// var redshiftConn =  new Redshift({
//     user: 'cs527',
//     database: 'dev',
//     password: 'Bestfriend776',
//     port: '5439',
//     host: 'cs527.chm4o2ryw9ps.us-east-1.redshift.amazonaws.com',
// }, {rawConnection: true});

// redshiftConn.connect(function(err){
//     if(err) throw err;
//     else{
//         console.log('Redshift Connected!');
//     }
// });

var MongoClient = require('mongodb').MongoClient;
var uri = "mongodb+srv://cc1607:bestfriend@cluster0-atpu3.mongodb.net/test?retryWrites=true";
var client = new MongoClient(uri, {useNewUrlParser: true});
client.connect(function (err, db) {
    if (err) {
        console.log('mongodb fails');
    }
    console.log('mongodb connected')
});


/* GET home page. */
router.get('/', function (req, res) {
    res.sendFile('views/home.html', {'root': '.'});
});

router.post('/mysql', function (req, res, next) {
    console.log('mysql');
    let sqlText = req.body.sqlText;
    console.log(sqlText);
    mysqlCon.query(sqlText, function (err, result, fields) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
});

router.post('/redshift', function (req, res) {
    console.log('route mongodb');
    let sqlText = req.body.sqlText;
    console.log(sqlText);
    let obj = convert(sqlText);
    console.log(obj);
    console.log(obj['cols']);
    // obj = {'databaseName': 'NCAA', 'collectionName':'Seasons','cols':{}};
    client.db('NCAA').collection(obj['table_name']).find(obj['condition'], {projection: obj['cols']}).limit(obj['limit']).toArray(function (err, result) {
        if (err) {
            console.log('err occurs');
            res.send(err);
        } else {
            res.send(result);
        }
    });
});

module.exports = router;

var convert = function (sql) {
    // remove heading and tailing white spaces
    var sql = sql.trim();
    // remove tailing ;
    var sql = sql.split(';')[0];
    var select_strs = sql.split('select');
    var after_select = select_strs[1].trim();
    var from_strs = after_select.split('from');
    var cols = from_strs[0].trim();
    var tmp = cols.split(',');
    cols = [];
    tmp.forEach(function (element) {
        cols.push(element.trim())
    });
    var cols_dict = {};
    cols.forEach(function (element) {
        cols_dict[element] = 1
    });
    cols_dict['_id'] = 0;
    var after_from = from_strs[1].trim();
    var where_strs = after_from.split('where');
    var table = where_strs[0].trim();
    if (where_strs.length > 1) {
        var after_where = where_strs[1].trim();
        var col_strs = after_where.split('=');
        var col = col_strs[0].trim();
        var value = col_strs[1].trim();
        var condition = {};
        condition[col] = value;
        return {
            'table_name': table,
            'cols': cols_dict,
            'condition': condition,
            'limit': 100000
        };
    }
    return {
        'table_name': table,
        'cols': cols_dict,
        'limit': 100000,
        'condition': {}
    };
};







