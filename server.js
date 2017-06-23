var https = require('https');
var http = require('http');
var FileStreamRotator = require('file-stream-rotator');
var express = require('express');
var morgan = require('morgan');
var fs = require('fs');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var hbs = require('hbs');
var config = require('./config/config.js');
var checkHost = require('./oauth/checkHost.js');

var mongoose =require('./config/mongoose.js')
var db = mongoose();

// https cert
// var SSLoptions = {
//   cert: fs.readFileSync('./cert/private.pem'),
//   key: fs.readFileSync('./cert/cert.key')
// };

var app = express();

// view
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', hbs.__express);

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/static', express.static(path.join(__dirname, 'dist/static')));

var logDirectory = path.join(__dirname, 'log');

fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

var accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: path.join(logDirectory, 'access-%DATE%.log'),
  frequency: 'daily',
  verbose: false
});
app.use(morgan('combined', {stream: accessLogStream}));

// 路由组
var index = require('./routes/index.js');
var account = require('./routes/admin/account.js');
var article = require('./routes/admin/article.js');
var clientArticle = require('./routes/client/article.js');
// 注册路由
app.get('/test', (req, res) => {
  var host = req.headers.host
  console.log(host);
  if (config.adminhost === host) {
    res.send(config.adminhost);
  } else {
    res.send(host);
  }
});
// admin api
app.use('/api/account', checkHost, account);
app.use('/api/article', checkHost, article);

// Browser api
app.use('/article', clientArticle);
app.use('/', index);

app.use(function(req, res, next) {
  res.status(404);
  try {
    return res.send('Not Found');
  } catch (e) {
    console.log('404 not found');
  }
});

app.use(function(err, req, res, next) {
  if(err) { return next(); }
  res.status(500);
  try {
    return res.send(err.message || 'server error');
  } catch (e) {
    console.log('500 server error');
  }
});

var port = process.env.PORT || '80';

http.createServer(app).listen(port);
// https.createServer(SSLoptions, app).listen(443);



// var https = require('https');
// var fs = require('fs');
// var options = {
//   cert: fs.readFileSync('./cert/213983559830254.pem', 'utf-8'),
//   key: fs.readFileSync('./cert/213983559830254.key', 'utf-8')
// };
// console.log(options);
// var a = https.createServer(options, function (req, res) {
//   console.log(options);
//   res.writeHead(200);
//   res.end("hello world\n");
// }).listen(443);