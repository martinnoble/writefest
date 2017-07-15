
angular.module('myApp').controller('lostController',
	['$scope', '$location', 'AuthService', 
  function ($scope, $location, AuthService) {
	  
      $scope.reset = function () {

	$scope.$emit('clear');
	  	// call login from service
        AuthService.reset($scope.resetForm.email)
        // handle success
        .then(function () {
	  $scope.$emit("info", "We've sent an email with instructions on how to reset your password");
          $scope.disabled = false;
        })
        // handle error
        .catch(function () {
	  $scope.$emit("error", "Something went wrong trying to reset your password - please check the email address entered");
          $scope.disabled = false;
        });

	  
      }
  }
]);


angular.module('myApp').controller('resetController',
	['$scope', '$location', 'AuthService', '$routeParams',
  function ($scope, $location, AuthService, $routeParams) {
	  
      $scope.reset = function () {
	  	// call login from service
        
	      if ($scope.resetForm.password != $scope.resetForm.passwordconfirm) {
		$scope.$emit("error", "Passwords don't match");
	      }
	      else
	      {

	        console.log($routeParams);
		email = $routeParams.email;
		key = $routeParams.key;


		AuthService.reset(email, key, $scope.resetForm.password)
        	// handle success
        	.then(function () {
		  console.log("reset complete - redirect to login");
		  $location.url("/login/resetcomplete");
	          $scope.disabled = false;
	        })
	        // handle error
       	 	.catch(function () {
	  	  $scope.$emit("error", "Something went wrong trying to reset your password");
        	  $scope.disabled = false;
        	});

	      }

	  
      }
  }
]);


angular.module('myApp').controller('loginController',
  ['$scope', '$location', 'AuthService', '$routeParams',
  function ($scope, $location, AuthService, $routeParams) {

	//handle showing status messages on the login screen
      if ($routeParams.status == 'activated') {
	$scope.$emit('info', "Account activated - please login below");
      }
      if ($routeParams.status == 'resetcomplete') {
	$scope.$emit("info", "Your password has been reset - you can now use it to log in");
      }

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
	  $scope.$emit("error", "Login failed - please check your username and password, and that your account is activated");
          $scope.username = "";
          $scope.disabled = false;
          $scope.loginForm = {};
        });

    };

}]);

angular.module('myApp').controller('homeController',
  ['$scope', '$location', 'ContentService',
  function ($scope, $location, ContentService) {

        $scope.showeditor = false;

	ContentService.read("home")
		.then(function () {
			$scope.htmlcontent = ContentService.getHtml();
                    })
                    .catch(function () {
                        $scope.$emit('error', "Failed to read page content");
                    });

	$scope.savecontent = function () {
		ContentService.write("home", $scope.htmlcontent)
		.then(function () {
			$scope.htmlcontent = ContentService.getHtml();
			$scope.$emit("info", "Content updated");
                    })
                    .catch(function () {
                        $scope.$emit('error', "Failed to save page content");
                    });

	}


}]);


angular.module('myApp').controller('authorController',
  ['$scope', '$location', 'AuthService',
  function ($scope, $location, AuthService) {


}]);


angular.module('myApp').controller('accountController',
  ['$scope', '$location', 'AuthService', 'AccountService', '$route',
  function ($scope, $location, AuthService, AccountService, $route) {

      $scope.updateUser = function () {


        if ($scope.user.newPass != $scope.user.newPassConfirm) {
                $scope.$emit('error', "New passwords don't match");
        } else {
                AccountService.update($scope.user)
                    .then(function () {

                        AuthService.logout()
                        .then(function () {
                          $location.path('/login');
                        });
                    })
                    .catch(function () {
                        $scope.$emit('error', "Failed to update account");
                        $scope.disabled = false;
                        $scope.registerForm = {};
                    });
        }
    }


}]);

angular.module('myApp').controller('producerController',
  ['$scope', '$location', 'ProducerService', 'filterFilter', '$filter',
  function ($scope, $location, ProducerService, filterFilter, $filter) {

    ProducerService.readData()
        .then(function() {
        
            var otherWeight = 0.2;
        
            $scope.producerdata = ProducerService.getData();
            
            $scope.mode = 'status';
            $scope.stats = 'off';
            $scope.ratingInfo = 'off';
            $scope.authorInfo = 'off';
            $scope.sortBy = 'average';
            $scope.sortReverse = true;
            
            
            $scope.scriptDetail = function(script){
                $scope.activeScript = script;
                $scope.activeComments = filterFilter($scope.producerdata.comments, {script_id: script.id}, true);
                $('#modalScript').modal('show');
            }
            
            $scope.greaterThan = function(prop, val){
                return function(item){
                  return item[prop] > val;
                }
            }
            
            
            
            
            for (j=0; j < $scope.producerdata.users.length; j++) {
                user = $scope.producerdata.users[j];
                user.total = 0;
            }
            
            for (i=0; i < $scope.producerdata.scripts.length; i++) {
            
                script = $scope.producerdata.scripts[i];
                
                script.ratingTotal = 0;
                script.otherTotal = 0;
                script.totalDuration = 0;
                
                script.ratings = 0;
                script.others = 0;
                script.durations = 0;
                
                for (j=0; j < $scope.producerdata.users.length; j++) {
                
                    user = $scope.producerdata.users[j];
                
                    finalRatings = filterFilter($scope.producerdata.ratings, {script_id: script.id, user_id: user.id, question_id: $scope.producerdata.finalQId}, true);
                
                    if (finalRatings.length > 0) {
                        user.total++;
                        script.ratingTotal += finalRatings[0].rating;
                        script.ratings++;

                        otherRatings = filterFilter($scope.producerdata.ratings, {script_id: script.id, user_id: user.id}, true);

                        if (otherRatings.length > 0) {
                            for (k=0; k < otherRatings.length; k++) {
                                if (otherRatings[k].rating > 0 && otherRatings[k].question_id != $scope.producerdata.finalQId) {
                                    script.otherTotal += otherRatings[k].rating;
                                    script.others++;
                                }
                            }
                        }

                        comments = filterFilter($scope.producerdata.comments, {script_id: script.id, user_id: user.id}, true);

                        if (comments.length > 0) {
                            script.durations++;
                            script.totalDuration += comments[0].duration;
                        }

                    }


                    
                }
                
                finalAverage = 0;
                otherAverage = 0;
                
                if (script.durations == 0) {
                    script.averageDuration = 0;
                } else {
                    script.averageDuration = script.totalDuration / script.durations;
                }
                
                if (script.ratings == 0) {
                    finalAverage = 0;
                    
                } else {
                    finalAverage = script.ratingTotal / script.ratings;
                }
                
                if (script.others == 0) {
                    otherAverage = 0;
                } else {
                    otherAverage = script.otherTotal / script.others;
                }

                script.average = finalAverage;
                    
                sumOfSquareRatingDifs = 0;
                sumOfSquareDurDifs = 0;
                
                for (j=0; j < $scope.producerdata.users.length; j++) {
            
                    user = $scope.producerdata.users[j];
            
                    
                    finalRatings = filterFilter($scope.producerdata.ratings, {script_id: script.id, user_id: user.id, question_id: $scope.producerdata.finalQId}, true);
                
                    if (finalRatings.length > 0 && finalRatings[0].rating > 0) {
                        sumOfSquareRatingDifs += Math.pow(finalRatings[0].rating - finalAverage, 2);

                        otherRatings = filterFilter($scope.producerdata.ratings, {script_id: script.id, user_id: user.id}, true);

                        if (otherRatings.length > 0) {
                            for (k=0; k < otherRatings.length; k++) {
                                if (otherRatings[k].rating > 0 && otherRatings[k].question_id != $scope.producerdata.finalQId) {
                                    sumOfSquareRatingDifs += Math.pow(otherRatings[k].rating - otherAverage, 2);
                                }
                            }
                        }


                        ratings = filterFilter($scope.producerdata.ratings, {script_id: script.id, user_id: user.id}, true);

                        if (ratings.length > 0 && ratings[0].rating > 0) {
                            sumOfSquareRatingDifs += Math.pow(ratings[0].rating - script.average, 2);
                        }

                        comments = filterFilter($scope.producerdata.comments, {script_id: script.id, user_id: user.id}, true);

                        if (comments.length > 0) {
                            sumOfSquareDurDifs += Math.pow(comments[0].duration - script.averageDuration, 2);
                        }
                    }
                    

                }
                
                script.ratingSD = Math.sqrt(sumOfSquareRatingDifs / (script.ratings + script.others) );
                script.durationSD = Math.sqrt(sumOfSquareDurDifs / script.durations);
                    
                
                script.average = (((script.average / 3) * (1-otherWeight)) + ((otherAverage / 4) * otherWeight)) * 10;
                
            }
        
            $scope.producerdata.scripts = $filter('orderBy')($scope.producerdata.scripts, 'average', true);
            for (i=0; i < $scope.producerdata.scripts.length; i++) {
            
                script = $scope.producerdata.scripts[i];
                script.rank = i+1;
                script.rankequal = false;
                
                if (i > 0){
                    prevscript = $scope.producerdata.scripts[i-1];
                    
                    if ($filter('number')(script.average, 2) == $filter('number')(prevscript.average, 2)) {
                        prevscript.rankequal = true;
                        script.rankequal = true;
                        script.rank = prevscript.rank;
                    }   
                }

            }
            
        })
        //handle non-admin user
        .catch(function() {
            //redirect back to home
            $location.path('/');
        });
}]);

angular.module('myApp').controller('ratingController',
  ['$scope', '$location', 'RatingService', 'filterFilter', '$route',
  function ($scope, $location, RatingService, filterFilter, $route) {


    RatingService.readData()
        .then(function() {
            $scope.ratingdata = RatingService.getData();
            $scope.selectedScript = null;
            
            $scope.pageTitle = "Rate";
            
             
            qType2 = filterFilter($scope.ratingdata.questions, {type: 2})[0];

             
            for (i=0; i < $scope.ratingdata.scripts.length; i++) {
            
                script = $scope.ratingdata.scripts[i];
                
                finalRating = filterFilter($scope.ratingdata.ratings, {question_id: qType2.id, script_id: script.id}, true);
                allRatings = filterFilter($scope.ratingdata.ratings, {script_id: script.id}, true);
                


                if (finalRating.length > 0) {
                    script.rated = 'full';
                    script.rating = filterFilter($scope.answersType2, {id: finalRating[0].rating}, true)[0].answer;
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
            
                for (i=0; i < $scope.ratingdata.questions.length; i++) {
                
                    questionId = $scope.ratingdata.questions[i].id;
                
                    ratings = filterFilter($scope.ratingdata.ratings, {question_id: questionId, script_id: script}, true);

                    ratingVal = null;
                    if (ratings.length) {
                        ratingVal = ratings[0].rating;
                    } 
                    
                    $scope.currentRating[questionId] = ratingVal;
                
                }
                
                selectedComments = filterFilter($scope.ratingdata.comments, {script_id: script}, true)[0];
                if (selectedComments) {
                    $scope.currentRating['notes'] = selectedComments.notes;
                    $scope.currentRating['feedback'] = selectedComments.feedback;
                    $scope.currentRating['duration'] = selectedComments.duration;
                }
                
            }
            
            $scope.saveRating = function() {
            
                script = $scope.currentScript;
                data = $scope.currentRating;
                
                RatingService.update(script, data)
                            .then(function () {
                                $route.reload();
                            })
                            .catch(function () {
                                $scope.$emit('error', "Failed to save rating");
                                $scope.disabled = false;
                                $scope.registerForm = {};
                            });
            
            }
            
            $scope.cancelRating = function() {
                $scope.currentScript = null;
                $scope.pageTitle = "Rate";
            }
           
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

            $("#modalNewScript").on("hidden.bs.modal", function () {

                if ($scope.updated)
                {
                    $scope.updated = false;
                    $route.reload();
                }

            });
            
            activeSeason = $scope.scriptdata.seasons[$scope.scriptdata.seasons.length-1].id;
            
            $scope.filterBy = {season: activeSeason}
            $scope.filterUpdate = function() {
               
                for (var key in $scope.filterBy) {
                    if ($scope.filterBy[key] == null) {
                        $scope.filterBy[key] = "";
                    }
                }
             
            }
            
            
            $scope.resetNewScript = function(data){
                $scope.newScript = {id : 0, name: '', season: 1, author: -1, filename: '', status: 1, pageCount: ''};
            };

            $scope.sortBy = 'id';
            $scope.sortReverse = false;

            
            $scope.addScript = false;
            $scope.editing = false;
            
            $scope.modify = function(script){
                $scope.editing = true;
                $scope.newScript = script;
                $('#modalNewScript').modal('show');
            };


            
            $scope.cancel = function(data){
                $route.reload();
            };
            
            
            $scope.update = function(data, action){
            

                if (!data.file) {
                    
                    ScriptService.update(data, action)
                            .then(function () {

                                $('#modalNewScript').modal('hide');
                                $scope.updated = true;

                            })
                            .catch(function () {
                                $scope.$emit('error', "Failed to update script");
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
                       
                        data.tempfilename = data.file.result.filename;
                        data.filename = data.file.name;
                
        
                        ScriptService.update(data, action)
                            .then(function () {
                                $('#modalNewScript').modal('hide');
                                $scope.updated = true;
                            })
                            .catch(function () {
                                $scope.$emit('error', "Failed to update script");
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
          $location.path('/login');
        });

    };

}]);

angular.module('myApp').controller('registerController',
  ['$scope', '$location', 'AuthService',
  function ($scope, $location, AuthService) {

    $scope.register = function () {

      if ($scope.registerForm.password != $scope.registerForm.passwordConfirm) {
	$scope.$emit("error", "Passwords don't match");
      } else {

      	$scope.disabled = true;

      	// call register from service
      	AuthService.register($scope.registerForm.name, 
			   $scope.registerForm.email,
                           $scope.registerForm.password)
        // handle success
        .then(function () {
	  $scope.$emit('info', "Registration sucessful - you'll recieve an email shortly with details on how to activate your account");
          
          $scope.disabled = false;
          $scope.registerForm = {};


        })
        // handle error
        .catch(function () {
          $scope.$emit('error', "Registration failed - if your email address is already registered, please use the password reset");
          $scope.disabled = false;
          $scope.registerForm = {};
        });

      }

    };

}]);


angular.module('myApp').controller('adminController',
  ['$scope', '$location', 'AuthService', 'AdminService', '$route',
  function ($scope, $location, AuthService, AdminService, $route) {

   
    AdminService.readData()
        .then(function() {
            $scope.admindata = AdminService.getData();
            
            $("#modalNewUser").on("hidden.bs.modal", function () {

                if ($scope.updated)
                {
                    $scope.updated = false;
                    $route.reload();
                }

            });

            $scope.resetNewUser = function(data){
                $scope.newUser = {id: 0, name: '', email: '', user_type: 1, password: '', can_rate: false};
            };

            $scope.filterBy = {};
            $scope.filterUpdate = function() {

                for (var key in $scope.filterBy) {
                    if ($scope.filterBy[key] == null) {
                        $scope.filterBy[key] = "";
                    }
                }

            }

            $scope.sortBy = 'id';
            $scope.sortReverse = false;

            $scope.questiontypes = [
                {id: 1, type: 'Normal'},
                {id: 2, type: 'Final Vote'}
            ];
            
            
            $scope.editingData = [];
            for (var i = 0; i < 100; i++) {
                $scope.editingData[i] = false;
            }
            
            $scope.modifyUser = function(user){
                $scope.editing = true;
                $scope.newUser = user;
                $('#modalNewUser').modal('show');
            };

            $scope.modify = function(data){
                $scope.editingData[data.id] = true;
            };
            
            $scope.cancel = function(data){
                $route.reload();
            };
            
            $scope.newQuestion = {id: 0, question: '', description: '', type: 1};
            
            
            $scope.update = function(type, data, action){
                AdminService.update(type, data, action)
                    .then(function () {
			if (type == 'users') {
                            $('#modalNewUser').modal('hide');
                            $scope.updated = true;
			} else {
			    $route.reload();
			}
                    })
                    .catch(function () {
                        $scope.$emit('error', "Operation failed - please try again");
                        $scope.disabled = false;
                        $scope.registerForm = {};
                    });
                    
            }
            
        })
        //handle non-admin user
        .catch(function() {
            //redirect back to home
            $location.path('/');
        });
}]);
