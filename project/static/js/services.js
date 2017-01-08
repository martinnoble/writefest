angular.module('myApp').factory('ProducerService',
  ['$q', '$timeout', '$http',
  function ($q, $timeout, $http) {

    var producerdata = {};

    // return available functions for use in controllers
    return ({
      readData: readData,
      getData: getData
    });

    function readData() {
        // create a new instance of deferred
        var deferred = $q.defer();

        $http.get('/api/producer')
            // handle success
            .success(function (data) {
                producerdata = data;
                deferred.resolve();
            })
            // handle error
            .error(function (data) {
                producerdata = {};
                deferred.reject();
            });

        // return promise object
        return deferred.promise;
    }
    
    function getData() {
        return producerdata;
    }
}]);


angular.module('myApp').factory('RatingService',
  ['$q', '$timeout', '$http',
  function ($q, $timeout, $http) {

    var ratingdata = {};

    // return available functions for use in controllers
    return ({
      readData: readData,
      getData: getData,
      update: update
    });

    function readData() {
        // create a new instance of deferred
        var deferred = $q.defer();

        $http.get('/api/rating')
            // handle success
            .success(function (data) {
                ratingdata = data;
                deferred.resolve();
            })
            // handle error
            .error(function (data) {
                ratingdata = {};
                deferred.reject();
            });

        // return promise object
        return deferred.promise;
    }
    
    function update(script, data) {
        // create a new instance of deferred
        
        var deferred = $q.defer();
        
        $http.post('/api/rating', {script: script, data: data})
            .success(function (data, status) {
          if(status === 200 && data.result){
            deferred.resolve();
          } else {
            deferred.reject();
          }
        })
        // handle error
        .error(function (data) {
          deferred.reject();
        });
        
        return deferred.promise;
    }
    
    function getData() {
        return ratingdata;
    }
}]);


angular.module('myApp').factory('ScriptService',
  ['$q', '$timeout', '$http',
  function ($q, $timeout, $http) {

    var scriptdata = {};

    // return available functions for use in controllers
    return ({
      readData: readData,
      getData: getData,
      update: update
    });

    function readData() {
        // create a new instance of deferred
        var deferred = $q.defer();

        $http.get('/api/script')
            // handle success
            .success(function (data) {
                scriptdata = data;
                deferred.resolve();
            })
            // handle error
            .error(function (data) {
                scriptdata = {};
                deferred.reject();
            });

        // return promise object
        return deferred.promise;
    }
    
    function update(data, action) {
        // create a new instance of deferred
        
        var deferred = $q.defer();
        
        $http.post('/api/script', {action: action, data: data})
            .success(function (data, status) {
          if(status === 200 && data.result){
            deferred.resolve();
          } else {
            deferred.reject();
          }
        })
        // handle error
        .error(function (data) {
          deferred.reject();
        });
        
        return deferred.promise;
    }
    
    function getData() {
        return scriptdata;
    }
}]);


angular.module('myApp').factory('AdminService',
  ['$q', '$timeout', '$http',
  function ($q, $timeout, $http) {

    var admindata = {};

    // return available functions for use in controllers
    return ({
      readData: readData,
      getData: getData,
      update: update
    });

    function readData() {
        // create a new instance of deferred
        var deferred = $q.defer();

        $http.get('/api/admin')
            // handle success
            .success(function (data) {
                admindata = data;
                deferred.resolve();
            })
            // handle error
            .error(function (data) {
                admindata = {};
                deferred.reject();
            });

        // return promise object
        return deferred.promise;
    }
    
    function getData() {
        return admindata;
    }
    
    function update(type, data, action) {
        // create a new instance of deferred
        console.log(action);
        var deferred = $q.defer();
        $http.post('/api/admin/' + type, {action: action, data: data})
            .success(function (data, status) {
          if(status === 200 && data.result){
            deferred.resolve();
          } else {
            deferred.reject();
          }
        })
        // handle error
        .error(function (data) {
          deferred.reject();
        });
        
        return deferred.promise;
    }

}]);

angular.module('myApp').factory('AuthService',
  ['$q', '$timeout', '$http',
  function ($q, $timeout, $http) {

    // create user variable
    var user = {logged_in: false, name: "", user_type: ""};

    // return available functions for use in controllers
    return ({
      isLoggedIn: isLoggedIn,
      login: login,
      logout: logout,
      register: register,
      getUserStatus: getUserStatus,
      getUserName: getUserName,
      isAdmin: isAdmin,
      isProducer: isProducer,
      isUser: isUser,
      isAuthor: isAuthor
    });

    function isLoggedIn() {
      return user.logged_in;
    }

    function getUserName() {
        return user.name;
    }
    
    function isAdmin() {
        return user.user_type == 'admin';
    }
    
    function isProducer() {
        return user.user_type == 'producer' || isAdmin();
    }

    function isUser() {
        return user.user_type == 'user' || isProducer();
    }
    
    function isAuthor() {
        return user.user_type == 'author';
    }

    function login(email, password) {

      // create a new instance of deferred
      var deferred = $q.defer();

      // send a post request to the server
      $http.post('/api/login', {email: email, password: password})
        // handle success
        .success(function (data, status) {
          if(status === 200 && data.result){
            user.logged_in = true;
            user.name = data.name;
            user.user_type = data.user_type;
            deferred.resolve();
          } else {
            user.logged_in = false;
            user.name = '';
            user.user_type = '';
            deferred.reject();
          }
        })
        // handle error
        .error(function (data) {
          user.logged_in = false;
          user.name = '';
          user.user_type = '';
          deferred.reject();
        });

      // return promise object
      return deferred.promise;

    }

    function logout() {

      // create a new instance of deferred
      var deferred = $q.defer();

      // send a get request to the server
      $http.get('/api/logout')
        // handle success
        .success(function (data) {
          user.logged_in = false;
          deferred.resolve();
        })
        // handle error
        .error(function (data) {
          user.logged_in = false;
          deferred.reject();
        });

      // return promise object
      return deferred.promise;

    }

    function register(name, email, password) {

      // create a new instance of deferred
      var deferred = $q.defer();

      // send a post request to the server
      $http.post('/api/register', {name: name, email: email, password: password})
        // handle success
        .success(function (data, status) {
          if(status === 200 && data.result){
            deferred.resolve();
          } else {
            deferred.reject();
          }
        })
        // handle error
        .error(function (data) {
          deferred.reject();
        });

      // return promise object
      return deferred.promise;

    }

    function getUserStatus() {
      return $http.get('/api/status')
      // handle success
      .success(function (data) {
        if(data.logged_in){
          user.logged_in = true;
          user.name = data.name;
          user.user_type = data.user_type;
        } else {
          user.logged_in = false;
          user.name = '';
          user.user_type = '';
        }
      })
      // handle error
      .error(function (data) {
        user.logged_in = false;
        user.name = '';
        user.user_type = '';
      });
    }



}]);
