
angular.module('myApp').controller('loginController',
  ['$scope', '$location', 'AuthService',
  function ($scope, $location, AuthService) {

    $scope.login = function () {

      // initial values
      $scope.error = false;
      $scope.disabled = true;

      // call login from service
      AuthService.login($scope.loginForm.email, $scope.loginForm.password)
        // handle success
        .then(function () {
          $location.path('/author');
          $scope.username = AuthService.getUserName();
          $scope.disabled = false;
          $scope.loginForm = {};
          
          $scope.user = {admin: AuthService.isAdmin(), loggedin: AuthService.isLoggedIn(), user: AuthService.isUser(), producer: AuthService.isProducer(), author: AuthService.isAuthor()};
          
        })
        // handle error
        .catch(function () {
          $scope.error = true;
          $scope.username = "";
          $scope.errorMessage = "Invalid username and/or password";
          $scope.disabled = false;
          $scope.loginForm = {};
        });

    };

}]);


angular.module('myApp').controller('authorController',
  ['$scope', '$location', 'AuthService',
  function ($scope, $location, AuthService) {

    

}]);

angular.module('myApp').controller('producerController',
  ['$scope', '$location', 'AuthService',
  function ($scope, $location, AuthService) {

    

}]);

angular.module('myApp').controller('ratingController',
  ['$scope', '$location', 'RatingService', 'filterFilter', '$route',
  function ($scope, $location, RatingService, filterFilter, $route) {

    console.log("Rating controller starting");

    RatingService.readData()
        .then(function() {
            $scope.ratingdata = RatingService.getData();
            $scope.selectedScript = null;
            
            $scope.pageTitle = "Rate";
            
            $scope.ratingStatus = [
                        { 'id' : 'none', 'description' : 'Not Rated'}, 
                        { 'id' : 'partial', 'description' : 'Partial Rating'},
                        { 'id' : 'full', 'description' : 'Fully Rated'}
                        ];
            
            $scope.answersType1 = [
                       { 'id': 4, 'answer':'Excellent' },
                       { 'id': 3, 'answer':'Good' },
                       { 'id': 2, 'answer':'Satisfactory' },
                       { 'id': 1, 'answer':'Needs Work' },
                       { 'id': 0, 'answer':'N/A' }
                    ];
            
            $scope.answersType2 = [
                       { 'id': 4, 'answer':'Definitely' },
                       { 'id': 3, 'answer':'Probably' },
                       { 'id': 2, 'answer':'Maybe' },
                       { 'id': 1, 'answer':'No' },
                       { 'id': 0, 'answer':'Not Rated' }
                    ];
            
            console.log($scope.ratingdata.ratings);
            
            qType2 = filterFilter($scope.ratingdata.questions, {type: 2})[0];

            console.log(qType2);
            
            for (i=0; i < $scope.ratingdata.scripts.length; i++) {
            
                script = $scope.ratingdata.scripts[i];
                console.log("script:");
                console.log(script);
                
                notSetFinalRatings = filterFilter($scope.ratingdata.ratings, {question_id: qType2.id, script_id: script.id, rating: 0}, true);
                allRatings = filterFilter($scope.ratingdata.ratings, {script_id: script.id}, true);
                
                console.log("not final: " + notSetFinalRatings.length);
                console.log("all: " + allRatings.length);
                
                if (notSetFinalRatings.length == 0 && allRatings.length > 0) {
                    script.rated = 'full';
                } else if (allRatings.length > 0) {
                    script.rated = 'partial';
                } else {
                    script.rated = 'none';
                }
                
            }
            
            
            $scope.initRating = function(script) {
            
                $scope.currentScript = script;
                
                selectedScript = filterFilter($scope.ratingdata.scripts, {id: script})[0];
            
                $scope.pageTitle = "Rate:" + selectedScript.name;
            
                $scope.currentRating = {};
            
                console.log(filterFilter($scope.ratingdata.ratings, {script_id: script}))
            
                for (i=0; i < $scope.ratingdata.questions.length; i++) {
                
                    questionId = $scope.ratingdata.questions[i].id;
                
                    ratings = filterFilter($scope.ratingdata.ratings, {question_id: questionId, script_id: script});

                    ratingVal = 0;
                    if (ratings.length) {
                        ratingVal = ratings[0].rating;
                    } 
                    
                    $scope.currentRating[questionId] = ratingVal;
                
                }

                console.log($scope.currentRating);

            
            }
            
            $scope.saveRating = function() {
            
                script = $scope.currentScript;
                data = $scope.currentRating;
                
                RatingService.update(script, data)
                            .then(function () {
                                $route.reload();
                            })
                            .catch(function () {
                                $scope.error = true;
                                $scope.errorMessage = "Something went wrong!";
                                $scope.disabled = false;
                                $scope.registerForm = {};
                            });
            
            }
            
            $scope.cancelRating = function() {
                $scope.currentScript = null;
                $scope.pageTitle = "Rate";
            }
            
           
            console.log($scope.ratingdata);
        })
        //handle non-admin user
        .catch(function() {
            //redirect back to home
            $location.path('/');
        });

}]);

angular.module('myApp').controller('scriptController',
  ['$scope', '$location', 'ScriptService', '$route', 'Upload', '$timeout',
  function ($scope, $location, ScriptService, $route, Upload, $timeout) {

    ScriptService.readData()
        .then(function() {
            $scope.scriptdata = ScriptService.getData();
            
            activeSeason = $scope.scriptdata.seasons[$scope.scriptdata.seasons.length-1].id;
            
            $scope.filterBy = {season: activeSeason}
            $scope.filterUpdate = function() {
               
                for (var key in $scope.filterBy) {
                    if ($scope.filterBy[key] == null) {
                        $scope.filterBy[key] = "";
                    }
                }
             
                console.log($scope.filterBy);
                
            }
            
            
            $scope.sortBy = 'id';
            $scope.sortReverse = false;
            $scope.newScript = {name: '', season: 1, author: -1, filename: '', status: 1}
            
            $scope.addScript = false;
            $scope.editing = false;
            $scope.editingData = [];
            
            for (var i = 0; i < 100; i++) {
                $scope.editingData[i] = false;
            }
            
            $scope.modify = function(data){
                $scope.editingData[data.id] = true;
                $scope.editing = true;
            };
            
            $scope.cancel = function(data){
                $route.reload();
            };
            
            
            $scope.update = function(data, action){
            
                console.log(data);
            
                if (!data.file) {
                    
                    ScriptService.update(data, action)
                            .then(function () {
                                $route.reload();
                            })
                            .catch(function () {
                                $scope.error = true;
                                $scope.errorMessage = "Something went wrong!";
                                $scope.disabled = false;
                                $scope.registerForm = {};
                            });
                    
                } else {
        
                    data.file.upload = Upload.upload({
                      url: '/api/file',
                      data: {username: $scope.username, file: data.file},
                    });

                    data.file.upload.then(function (response) {
                      $timeout(function () {
                        data.file.result = response.data;
                        console.log("Upload complete");
                        console.log(data.file);
        
                
                        data.tempfilename = data.file.result.filename;
                        data.filename = data.file.name;
                
        
                        ScriptService.update(data, action)
                            .then(function () {
                                $route.reload();
                            })
                            .catch(function () {
                                $scope.error = true;
                                $scope.errorMessage = "Something went wrong!";
                                $scope.disabled = false;
                                $scope.registerForm = {};
                            });
                
                
                
                      });
                    }, function (response) {
                      if (response.status > 0)
                        $scope.errorMsg = response.status + ': ' + response.data;
                    }, function (evt) {
                      // Math.min is to fix IE which reports 200% sometimes
                      data.file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                    });
                    
                }                
                
                    
            }
            
            console.log($scope.scriptdata);
        })
        //handle non-admin user
        .catch(function() {
            //redirect back to home
            $location.path('/');
        });

}]);

angular.module('myApp').controller('logoutController',
  ['$scope', '$location', 'AuthService',
  function ($scope, $location, AuthService) {

    $scope.logout = function () {

      // call logout from service
      AuthService.logout()
        .then(function () {
          $location.path('/');
        });

    };

}]);

angular.module('myApp').controller('registerController',
  ['$scope', '$location', 'AuthService',
  function ($scope, $location, AuthService) {

    $scope.register = function () {

      // initial values
      $scope.error = false;
      $scope.disabled = true;

      // call register from service
      AuthService.register($scope.registerForm.name, 
			   $scope.registerForm.email,
                           $scope.registerForm.password)
        // handle success
        .then(function () {
          $location.path('/login');
          $scope.disabled = false;
          $scope.registerForm = {};
        })
        // handle error
        .catch(function () {
          $scope.error = true;
          $scope.errorMessage = "Something went wrong!";
          $scope.disabled = false;
          $scope.registerForm = {};
        });

    };

}]);


angular.module('myApp').controller('adminController',
  ['$scope', '$location', 'AuthService', 'AdminService', '$route',
  function ($scope, $location, AuthService, AdminService, $route) {

    console.log("Admin controller started");
   
    AdminService.readData()
        .then(function() {
            $scope.admindata = AdminService.getData();
            
            $scope.questiontypes = [
                {id: 1, type: 'Normal'},
                {id: 2, type: 'Final Vote'}
            ];
            
            
            $scope.editingData = [];
            for (var i = 0; i < 100; i++) {
                $scope.editingData[i] = false;
            }
            
            $scope.modify = function(data){
                $scope.editingData[data.id] = true;
            };
            
            $scope.cancel = function(data){
                $route.reload();
            };
            
            $scope.newQuestion = {id: 0, question: ''};
            $scope.newUser = {id: 0, name: '', email: '', user_type: 0, password: ''};
            
            
            $scope.update = function(type, data, action){
                AdminService.update(type, data, action)
                    .then(function () {
                        $route.reload();
                    })
                    .catch(function () {
                        $scope.error = true;
                        $scope.errorMessage = "Something went wrong!";
                        $scope.disabled = false;
                        $scope.registerForm = {};
                    });
                    
            }
            
            console.log($scope.admindata);
        })
        //handle non-admin user
        .catch(function() {
            //redirect back to home
            $location.path('/');
        });
}]);
