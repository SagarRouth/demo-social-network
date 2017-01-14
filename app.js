var express      =  require('express');
var bodyParser   =  require('body-parser');
var cookieParser =  require('cookie-parser');
var session      =  require('express-session');
var mongoose     =  require('mongoose');
var logger       =  require('morgan');
var fs           =  require('fs');
var path         =  require('path');
//var jade         =  require('jade');

var app = express();
//set templating engine
app.set('view engine', 'jade');
//set views folder
app.set('views', path.join(__dirname, '/app/views'));

//middleware for logging
app.use(logger('dev'));
//middleware for processing incoming http-requests
app.use(bodyParser.json({limit:'10mb', extended:true}));
app.use(bodyParser.urlencoded({limit:'10mb', extended:true}));
app.use(cookieParser());
//middleware for session handling
app.use(session({
  secret          :   'myAppSecret',
  resave          :   true,
  saveUnitialized :   true,
  cookie          :   {secure : false}
}));
//middleware for templating engine


var dbPath = 'mongodb://localhost/catchupDb';
//create a db connection
mongoose.connect(dbPath);
mongoose.connection.once('open', function () {
  console.log("database connection opened");
});

try {
  //dynamically load the models
  fs.readdirSync('./app/models').forEach(function (fileName) {
    if(fileName.indexOf('.js')>-1)
      require(path.join(__dirname,'./app/models',fileName));
  });

  //dynamically load the controllers
  fs.readdirSync('./app/controllers').forEach(function (fileName) {
    if(fileName.indexOf('.js')>-1){
      var route = require(path.join(__dirname,'./app/controllers',fileName));
      route.controller(app);
    }
  });
} catch (error) {
  console.log(error.message);
} finally {
  //start the server and listen on port 3000
  app.listen(3000, function () {
    console.log('server started and listening on port 3000');
  });
}
