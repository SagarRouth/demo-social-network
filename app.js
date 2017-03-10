const express       =    require('express');
const bodyParser    =    require('body-parser');
const cookieParser  =    require('cookie-parser');
const session       =    require('express-session');
const mongoose      =    require('mongoose');
const logger        =    require('morgan');
const customLogger  =    require('./libs/customLogger');
const fs            =    require('fs');
const path          =    require('path');
const auth          =    require('./middleware/auth');

const app           =    express();

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
//initialization of session
app.use(session({
  name               :   'myCustomCookie',
  secret             :   'awesomeApp',
  resave             :   true,
  httpOnly           :   true,
  saveUninitialized  :   true,
  cookie             :   {secure : false}
}));

//make the userId available to the templates
app.use(function (req, res, next) {
  if(req.session.user && req.session.user._id)
    res.locals.currentUser = true;
  else
    res.locals.currentUser = false;
  next();
});

var dbPath = 'mongodb://localhost/catchupDb';
//create a db connection
mongoose.connect(dbPath);
mongoose.connection.once('open', function () {
  customLogger('Info', 'Entry Point', __filename, 'database connection opened');
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

  //middleware for handling session
  app.use(auth.setLoggedInUser(mongoose.model('User')));

  //default route
  /*
  app.get('/', function (req, res) {
      return res.redirect('/users/login');
  });*/

  app.use((err, req, res, next) => {
    console.log('error handler-', err);
    res.status(err.status);
    res.send(err);
  });

} catch (error) {
  console.log(error);
} finally {
  //start the server and listen on port 3000
  app.listen(3000, function () {
    customLogger('Info', 'Entry Point', __filename, 'server started and listening on port 3000');
  });
}
