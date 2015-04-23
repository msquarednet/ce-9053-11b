var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var jwt = require("jwt-simple");

var SECRET = "foo";

var PersonSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true }
});

var Person = mongoose.model("Person", PersonSchema);

var UserSchema = new mongoose.Schema({
  username: String,
  password: String
});

var User = mongoose.model("User", UserSchema);

mongoose.connect("mongodb://localhost/my_world");
mongoose.connection.once("open", function(){
  console.log("i am connected");
});


var app = express();

app.locals.pretty = true;

app.set("view engine", "jade");

app.use(express.static(__dirname + "/client"));

app.use(bodyParser.json());

app.use(function(req, res, next){
  req.foo = Math.random().toString();
  next();
});

var paths = ["/", "/people", "/things", "/login"];

paths.forEach(function(path){
  app.get(path, function(req, res, next){
    res.render("index");
  });
});

//api
app.get("/api/session/:token", function(req, res){
  try{
    var decoded = jwt.decode(req.params.token, SECRET);
    User.findById(decoded._id, function(err, user){
      res.send(user); 
    });
  }
  catch(ex){
    
  }
});

app.post("/api/sessions", function(req, res){
  if(!req.body.password) 
    return res.status(500).send({error: "No password??"});
  User.findOne(req.body, function(err, user){
    if(user){
      var _user = {
        _id: user._id
      };
      return res.send(jwt.encode(_user, SECRET));
    }
    else
      return res.status(401).send({"error": "no user found"});
  }); 
});
app.get("/api/people", function(req, res){
  Person.find({}).sort("name").exec(function(err, people){
    res.send(people);
  }); 
});

app.delete("/api/people/:id", function(req, res){
  Person.remove({_id: req.params.id}).exec(function(){
    res.send({deleted: true});
  });
})
app.post("/api/people/:token", function(req, res){
  try{
    jwt.decode(req.params.token, SECRET) 
  }
  catch(ex){
    return res.status(401).send({ error: "bad boy"});
  }
  Person.create(req.body, function(err, person){
    if(err){
      res.status(500).send(err); 
    }
    else{
      res.send(person); 
    }
  });
});


app.listen(process.env.PORT);