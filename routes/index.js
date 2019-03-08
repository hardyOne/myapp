var express = require('express');
var router = express.Router();

// mysql
var mysql = require('mysql');
var mysqlCon = mysql.createConnection({
    host: "cs527.c7ftzzwu1edi.us-east-1.rds.amazonaws.com",
    user: "cs527_group4",
    password: "bestfriend",
    database: 'NCAA',
});

mysqlCon.connect(function (err) {
    if (err) throw err;
    console.log("MySQL Connected!");
});


// redshift
var Redshift = require('node-redshift');

var redshiftConn =  new Redshift({
    user: 'cs527',
    database: 'dev',
    password: 'Bestfriend776',
    port: '5439',
    host: 'cs527.chm4o2ryw9ps.us-east-1.redshift.amazonaws.com',
}, {rawConnection: true});

redshiftConn.connect(function(err){
    if(err) throw err;
    else{
        console.log('Redshift Connected!');
    }
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
    console.log('redshift');
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

module.exports = router;





