var ICON = {
    'clear-day': 'wi-day-sunny',
    'clear-night': 'wi-night-clear',
    'rain': 'wi-rain',
    'snow': 'wi-snow',
    'sleet': 'wi-sleet',
    'wind': 'wi-strong-wind',
    'fog': 'wi-fog',
    'cloudy': 'wi-cloudy',
    'partly-cloudy-day': 'wi-day-cloudy',
    'partly-cloudy-night': 'wi-night-partly-cloudy',
    'hail': 'wi-hail',
    'thunderstorm': 'wi-thunderstorm',
    'tornado': 'wi-tornado'
};

(function () {
    var app = angular.module('you', []);

    app.directive('onFinishRender', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                if (scope.$last === true) {
                    $timeout(function () {
                        scope.$emit('ngRepeatFinished');
                    });
                }
            }
        }
    });

    // Fix courtesy of http://victorblog.com/2014/01/12/fixing-autocomplete-autofill-on-angularjs-form-submit/
    app.directive('formAutofillFix', function() {
        return function(scope, elem, attrs) {
            elem.prop('method', 'POST');
            if(attrs.ngSubmit) {
                setTimeout(function() {
                    elem.unbind('submit').submit(function(e) {
                        e.preventDefault();
                        elem.find('input, textarea, select').trigger('input').trigger('change').trigger('keydown');
                        scope.$apply(attrs.ngSubmit);
                    });
                }, 0);
            }
        };
    });



    app.service('FriendDatabase', function() {
        var friendList = (localStorage['friendList']) ? JSON.parse(localStorage['friendList']) : [];

        var updateTime = function() {
            now = moment();
            for (var i = 0; i < friendList.length; i++) {
                friendList[i].now = now.tz(friendList[i].timezone).format('h:mm:ss a');
                friendList[i].today = now.tz(friendList[i].timezone).format('dddd, MMMM Do, YYYY');
            }
        }();

        var addFriend = function(friend) {
            friendList.push(friend);
            saveToLocal();
        };

        var getFriendList = function() {
            return friendList;
        };

        var saveToLocal = function() {
            localStorage['friendList'] = JSON.stringify(friendList);
        };

        return {
            addFriend: addFriend,
            getFriendList: getFriendList,
            saveToLocal: saveToLocal,
            updateTime: updateTime
        };
    });

    app.service('GoogleTimeZone', function($http) {
        var timezoneLink = 'https://maps.googleapis.com/maps/api/timezone/json?' +
                       'location={0},{1}&timestamp=1331766000&language=es&key=AIzaSyA9ZjSeB4LZExOk1_WPEtgp8vTpt0kRhW4';
        var key = 'AIzaSyA9ZjSeB4LZExOk1_WPEtgp8vTpt0kRhW4';

        this.getData = function(latitude, longitude, successCb) {
            $http({
                method: 'GET',
                url: timezoneLink.format(latitude, longitude)
            });

            $http.success(function(data) {
                successCb(data);
            });

            $http.error(function(error) {
                console.log(error.message);
            });
        }
    });

    app.controller('FriendsListController', ['$scope', '$rootScope', 'FriendDatabase', function($scope, $rootScope, FriendDatabase){
        var thisController = this;

        this.friendList = FriendDatabase.getFriendList();

        $rootScope.$on('NewFriendAdded', function(event) {
            $scope.$apply(function () {
                thisController.friendList = FriendDatabase.getFriendList();
            });
        });

        $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
            $(".information").unbind('click').click(function () {
                $content = $(this).next();
                $content.slideToggle(500, 'linear');
            });
        });
    }]);
    
    app.controller('AddFriendsController', ['$scope', '$rootScope', 'FriendDatabase', function($scope, $rootScope, FriendDatabase) {
        var thisController = this;

        this.name = this.location = '';

        this.addFriend = function() {
            if (this.name && this.location) {
                getTime(function(data) {
                    var currentTime = moment();
                    var location = parsePlaceDetails(autocomplete.getPlace());
                    var link = 'https://api.forecast.io/forecast/328c07219474afa5173466e4f594ac6e/{0},{1}?units=si&exclude=minutely,hourly,daily,flags';
                    JSONP(link.format(location.latitude, location.longitude), function(json) {
                        location.weather = {
                            temperature: Math.round(json.currently.temperature),
                            summary: json.currently.summary,
                            icon: ICON[json.currently.icon]
                        }

                        FriendDatabase.addFriend({
                            name: thisController.name,
                            location: location,
                            timezone: data.timeZoneId,
                            now: currentTime.tz(data.timeZoneId).format('h:mm:ss a'),
                            today: currentTime.tz(data.timeZoneId).format('dddd, MMMM Do, YYYY'),
                        });
                        thisController.name = thisController.location = '';
                        $rootScope.$broadcast('NewFriendAdded');
                    });

                });
            }
        }
    }]);
})();


// A collection of error messages for different portion of the app
var error = function() {
    var parsingPlaces   = 'There was an error while parsing places\' details ({0})';
    var parsingTimezone = 'There was an error while parsing timezone ({0})';
    var requestHttp     = 'There was an error while requesting the data (code: {0})';

    function parsePlacesError(e) {
        console.error(parsingPlaces.format(e.message));
    }

    function parseTimezoneError(e) {
        console.error(parsingTimezone.format(e.message));
    }

    function requestHttpError(e) {
        console.error(requestHttp.format(e.message));
    }
};

var autocomplete = null;

function initAutoComplete(fieldId) {
    var input = document.getElementById(fieldId);
    var options = {types: ['(cities)']};

    autocomplete = new google.maps.places.Autocomplete(input, options);
    // autocomplete.addListener('place_changed', getTime);
}

function parsePlaceDetails(place) {
    if (!place) return null;

    try {
        var address = place.address_components;
        var location = place.geometry.location;
        var details = {
            city: place.name,
            country: address[address.length-1].long_name,
            latitude: location.H,
            longitude: location.L
        }
    } catch (e) {
        console.error('There was an error while parsing places\' details ' +
                      '(' + e.message + ')');
    }

    return details;
}

function getTime(cbOnSuccess) {
    var place = autocomplete.getPlace();
    console.dir(place);
    if (!place) return;

    try {
        var parsed = parsePlaceDetails(place);
    } catch(e) {
        console.log(e.message);
    }
    if (!parsed) return;

    googleTimeZone(parsed.latitude, parsed.longitude, cbOnSuccess);
}

function googleTimeZone(lat, long, cbOnSuccess) {
    var timezone = 'https://maps.googleapis.com/maps/api/timezone/json?' +
                   'location={0},{1}&timestamp=1331766000&language=es&key=AIzaSyA9ZjSeB4LZExOk1_WPEtgp8vTpt0kRhW4';
    var key = 'AIzaSyA9ZjSeB4LZExOk1_WPEtgp8vTpt0kRhW4';
    console.log(timezone.format(lat, long));
    $.get(timezone.format(lat, long), cbOnSuccess);
}