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


router.post('/redshift', function (request, response) {
    console.log('route mongodb');
    let sqlText = request.body.sqlText;
    console.log(sqlText);

    // spider
    var querystring = require('querystring');
    var http = require('http');
    var cheerio = require('cheerio');
    const postData = querystring.stringify({
        'MySQLQuery': sqlText
    });

    const options = {
        hostname: 'www.querymongo.com',
        path: '/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        // console.log(`STATUS: ${res.statusCode}`);
        // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            // console.log(chunk)
            var $ = cheerio.load(chunk);
            var text = $('#mongoQuery').text().trim();
            // empty text
            if (!text) {
                return
            }
            // console.log('text:' + text);
            var condition = {};
            var result_dict = {};
            // select * from table => db.table.find()
            if (!text.includes('find()')) {
                console.log('text:' + text);
                tmp = text.split('find(')[1].split(')')[0].trim();
                tmp = '[' + tmp + ']';
                tmp_arr = JSON.parse(tmp);
                console.log('tmp_arr:' + JSON.stringify(tmp_arr));
                condition = tmp_arr[0];
                if (!sqlText.includes('*')) {
                    result_dict = tmp_arr[1];
                }
            }
            result_dict['_id'] = 0;
            console.log('condition:' + JSON.stringify(condition));
            console.log('result_dict:' + JSON.stringify(result_dict));
            let obj = convert(sqlText);
            client.db('NCAA').collection(obj['table_name']).find(condition, {projection: result_dict}).limit(obj['limit']).toArray(function (err, result) {
                if (err) {
                    console.log('err occurs');
                    response.send(err);
                } else {
                    response.send(result);
                }
            });

        });
        res.on('end', () => {
            // console.log('No more data in response.');
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    // Write data to request body
    req.write(postData);
    req.end();
    // spider
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
    return {
        'table_name': table,
        'cols': cols_dict,
        'limit': 100000,
    };
};







