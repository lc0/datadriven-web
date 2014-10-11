'use strict';
// Declare app level module which depends on filters, and services
angular.module('datadriven', ['ngResource', 'ngRoute', 'ui.bootstrap', 'ui.date', 'ngFacebook', 'angular-rickshaw'])
  .config(function ($facebookProvider) {
    $facebookProvider.setAppId('300970376756350');
    $facebookProvider.setPermissions("email,user_actions.fitness");
  })
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/github', {
        templateUrl: 'views/home/github.html',
        controller: 'GithubController'})
      .when('/fb/:type', {
        templateUrl: 'views/home/fb.html',
        controller: 'FbController'})
      .when('/', {
        templateUrl: 'views/home/home.html',
        controller: 'DemoCtrl'}
      )
      .otherwise({redirectTo: '/'});
  }])
  .factory('mySharedService', function($rootScope) {
      var sharedService = {};
      sharedService.message = '';

      sharedService.prepForBroadcast = function(msg) {
          this.message = msg;
          this.broadcastItem();
      };

      sharedService.broadcastItem = function() {
          $rootScope.$broadcast('handleBroadcast');
      };

      return sharedService;
  })

  .run(function ($rootScope) {
      // Load the facebook SDK asynchronously
      (function(){
         // If we've already installed the SDK, we're done
         if (document.getElementById('facebook-jssdk')) {return;}

         // Get the first script element, which we'll use to find the parent node
         var firstScriptElement = document.getElementsByTagName('script')[0];

         // Create a new script element and set its id
         var facebookJS = document.createElement('script');
         facebookJS.id = 'facebook-jssdk';

         // Set the new script's source to the source of the Facebook JS SDK
         facebookJS.src = '//connect.facebook.net/en_US/all.js';

         // Insert the Facebook JS SDK into the DOM
         firstScriptElement.parentNode.insertBefore(facebookJS, firstScriptElement);
       }());
    });

var DemoCtrl = function ($scope, $facebook, $document) {
  $scope.isLoggedIn = false;
  $scope.login = function() {
    $facebook.login().then(function() {
      refreshDemo();
    });
  }

  function refreshDemo() {
    $facebook.api("/me").then(
      function(response) {
        $scope.welcomeMsg = "Welcome " + response.name;
        $scope.isLoggedIn = true;

      },
      function(err) {
        $scope.welcomeMsg = "Please log in";
      });
  }

  refreshDemo();
};

var FbController = function ($scope, $facebook, $document, $routeParams) {
  $scope.options = {
      renderer: 'bar',
      width: 1140
  };
  $scope.features = {
      palette: 'colorwheel',
      legend: {
          toggle: true,
          highlight: true
      },
      hover: {
          yFormatter: function(y) {
              return y;
          }
      }
  };
  $scope.series = [
      {
          name: 'loading..',
          data: [{x: 0, y: 0}]
      },
      // {
      //     name: 'facebook data stream 1',
      //     data: [{x: 0, y: 230}, {x: 1, y: 1500}, {x: 2, y: 790}, {x: 3, y: 310}, {x: 4, y: 600}]
      // },
      // {
      //     name: 'facebook data stream 2',
      //     data: [{x: 0, y: 300}, {x: 1, y: 2000}, {x: 2, y: 640}, {x: 3, y: 500}, {x: 4, y: 150}]
      // }
      ];

  $scope.isLoggedIn = false;
  $scope.login = function() {
    $facebook.login().then(function() {
      refresh();
    });
  }

  function refresh() {
    $facebook.api("/me").then(
      function(response) {
        $scope.welcomeMsg = "Welcome " + response.name;
        // console.log($scope.welcomeMsg);
        $scope.isLoggedIn = true;

        $facebook.api('/v2.1/me/fitness.' + $routeParams['type']).then(
            function(response) {
                var fitness = response;
                var acts = response['data'];

                var fbserie = [];
                acts.forEach(function(act) {
                  // console.log(act);

                  fbserie.push({'x': (new Date(act['start_time']))/1000, 'y': parseFloat(act['data']['course']['title'])})
                });
                var sortedSeries = _.sortBy(fbserie, function(act) {return act.x});
                // console.log(fbserie);
                var seriesList = [];
                seriesList.push({name:'facebook fitness: ' + $routeParams['type'], 'data': sortedSeries});

                // console.log("here", $scope.series);
                $scope.series = seriesList;
                // graph.render();

            },
            function(response) {
                $scope.fitness = response.error;
                //console.log("nope-nope-nope" + response.error);
            }
        );
      },
      function(err) {
        $scope.welcomeMsg = "Please log in";
      });
  }

  refresh();

  $scope.handleClick = function() {
    sharedService.prepForBroadcast($scope.series[0]);
  };

};

var GithubController = function ($scope, sharedService) {
  $scope.options = {
      renderer: 'line',
      width: 1140
  };
  $scope.features = {
      palette: 'colorwheel',
      legend: {
          toggle: true,
          highlight: true
      },
      hover: {
          yFormatter: function(y) {
              return y;
          }
      }
  };
  $scope.series = [{
      name: 'Github data',
      data: Githubdata
  }];

  $scope.handleClick = function() {
    sharedService.prepForBroadcast($scope.series);
  };
};

var JointController = function ($scope, sharedService) {
  $scope.options = {
      renderer: 'line',
      height: 450
  };
  $scope.features = {
      palette: 'colorwheel',
      legend: {
          toggle: true,
          highlight: true
      },
      hover: {
          yFormatter: function(y) {
              return y;
          }
      }
  };
  var seriesData = [ [], [], [] ];
  var random = new Rickshaw.Fixtures.RandomData(150);

  for (var i = 0; i < 150; i++) {
    random.addData(seriesData);
  }
  $scope.series = [
    {
      color: "#c05020",
      data: seriesData[0],
      name: 'fitness activity'
    }, {
      color: "#30c020",
      data: seriesData[1],
      name: 'work performance'
    }, {
      color: "#6060c0",
      data: seriesData[2],
      name: 'satisfactions'
    },
  ];

  $scope.clean = function() {
      $scope.series = [{
          name: 'empty..',
          data: [{x: 0, y: 0}]
      }];
  };

  $scope.$on('handleBroadcast', function() {
    //TODO: failing right now only because of data inconsistency
    //$scope.series.push(sharedService.message[0]);
    $scope.series = sharedService.message;
  });

};

JointController.$inject = ['$scope', 'mySharedService'];
GithubController.$inject = ['$scope', 'mySharedService'];
//FbController.$inject = ['$scope', 'mySharedService'];
