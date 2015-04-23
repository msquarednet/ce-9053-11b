//configuration
var app = angular.module("myWorld", ['ngRoute']);
app.run(function(AuthSvc){
  AuthSvc.setUser();
});

app.config(function($routeProvider, $locationProvider){
  $routeProvider
    .when("/", {
      controller: "HomeCtrl",
      templateUrl: "/templates/home.html"
    })
    .when("/people", {
      controller: "PeopleCtrl",
      templateUrl: "/templates/people.html"
    })
    .when("/things", {
      controller: "ThingsCtrl",
      templateUrl: "/templates/things.html"
    })
    .when("/login", {
      controller: "LoginCtrl",
      templateUrl: "/templates/login.html"
    });
    
    $locationProvider.html5Mode(true);
});
// services
app.factory("AuthSvc", function($window, $q, $http){
  var _user = {
    authenticated: function(){
      return this.username != null;
    } 
  };
  return {
    authenticate: authenticate,
    setUser: setUser,
    logout: logout,
    user: _user,
    getToken: getToken
  }; 
  
  function getToken(){
    return $window.sessionStorage.getItem("token"); 
  }
  function logout(){
    delete _user.username;
    $window.sessionStorage.removeItem("token");
  }
  
  function setUser(){
    if(!$window.sessionStorage.getItem("token"))
      return;
    var dfd = $q.defer();
    $http.get("/api/session/" + $window.sessionStorage.getItem("token")).then(
      function(result){
        _user.username = result.data.username;
         dfd.resolve(result.data); 
      }
    );
    return dfd.promise;
  }
  
  function authenticate(user){
    var dfd = $q.defer();
    $http.post("/api/sessions", user).then(
      function(result){
        window.sessionStorage.setItem("token", result.data);
        setUser().then(function(result2){
          dfd.resolve(_user); 
        });
      },
      function(result){
        dfd.reject(result.data.error);
      }
    );
    return dfd.promise;
  }
});

app.factory("PeopleSvc", function($q, $http, AuthSvc ){
  return {
    user: AuthSvc.user,
    getPeople: function(){
      var dfd = $q.defer();
      $http.get("/api/people").then(function(result){
        dfd.resolve(result.data);
      });
      return dfd.promise;
    },
    insertPerson: function(person){
      var dfd = $q.defer();  
      $http.post("/api/people/" + AuthSvc.getToken(), person).then(
        function(result){
          console.log(result);
          dfd.resolve(result.data);
        },
        function(result){
          dfd.reject(result.data);
        }
      );
      return dfd.promise;
    }
  };
});
app.factory("NavSvc", function(){
  var _tabs = [
    {
      title: "Home",
      path: "/",
      active: true
    },
    {
      title: "People",
      path: "/people"
    },
    {
      title: "Things",
      path: "/things"
    }
  ];
  return {
    tabs: _tabs,
    setTab: function(title){
      _tabs.forEach(function(tab){
        if(tab.title == title) 
          tab.active = true;
        else
          tab.active = false;
      });
    }
  };
});

//controllers
app.controller("LoginCtrl", function($scope, $location, AuthSvc){
  if(AuthSvc.user.authenticated())
    $location.path("/");
  $scope.user = {};
  
  $scope.login = function(){
    AuthSvc.authenticate($scope.user).then(
      function(){
        $location.path("/"); 
      },
      function(error){
        $scope.token = null;
        $scope.error = error;
      }
    );
  };
});
app.controller("NavCtrl", function($scope, NavSvc, AuthSvc){
  $scope.tabs = NavSvc.tabs;
  $scope.user = AuthSvc.user;
  $scope.logout = function(){
    AuthSvc.logout();
  };
});

app.controller("HomeCtrl", function($scope, NavSvc){
  console.log("in home control");
  NavSvc.setTab("Home");
  $scope.message = "I am the home control"; 
});

app.controller("PeopleCtrl", function($scope, NavSvc, PeopleSvc){
  NavSvc.setTab("People");
  $scope.inserting = {};
  $scope.message = "I am the people control";
  $scope.user = PeopleSvc.user;
  $scope.insert = function(){
    PeopleSvc.insertPerson($scope.inserting).then(
      function(person){
        $scope.success = "Insert successful for " + person.name;
        $scope.error = null;
        $scope.inserting = {};
        activate();
      },
      function(error){
        $scope.error = error;
        $scope.success = null;
      }
    );
  };
  function activate(){
    PeopleSvc.getPeople().then(function(people){
      $scope.people = people;
    });
  }
  activate();
});

app.controller("ThingsCtrl", function($scope, NavSvc){
  NavSvc.setTab("Things");
  $scope.message = "I am the things control";
});

app.controller("FooCtrl", function($scope){
  var rnd = Math.random();
  console.log(rnd);
  $scope.message = rnd; 
});

//directives
app.directive("myWorldNav", function(){
  return {
    restrict: "E",
    templateUrl: "/templates/nav.html",
    controller: "NavCtrl",
    scope: {}
  }
});
app.directive("foo", function(){
  return {
    restrict: "EA",
    templateUrl: "/templates/foo.html",
    controller: "FooCtrl",
    scope: {}
  }; 
});