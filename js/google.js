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
    var options = {
      types: ['(cities)']
    };

    autocomplete = new google.maps.places.Autocomplete(input, options);
    autocomplete.addListener('place_changed', getWeather);
}

function parsePlaceDetails(place) {
    if (!place) return null;

    try {
        var address = place.address_components;
        var location = place.geometry.location;

        var details = {
            city: address.shift().long_name,
            country: address.pop().long_name,
            location: {
                lat: location.H,
                long: location.L
            }
        }
    } catch (e) {
        console.error('There was an error while parsing places\' details ' +
                      '(' + e.message + ')');
    }

    return details;
}

function getWeather() {
    var place = autocomplete.getPlace();
    if (!place) return;

    var parsed = parsePlaceDetails(place);
    if (!parsed) return;

    console.log(parsed.location);
    googleTimeZone(parsed.location.lat, parsed.location.long, function(data) {
        if (data) {
            try {
                data = JSON.parse(data);
                if (data.status === 'OK') {
                    var local = moment();
                    console.log(local.clone().tz(data.timeZoneId).format('h:mm:ss a'));
                } else {
                    console.error('There was an error while requesting timezone ' +
                                  '(code: ' + data.status + ')');
                }
            } catch (e) {
                console.error('There was an error while parsing timezone ' +
                              '(' + e.message + ')');
            }
        }
    }, function(errorStatus) {
        console.error('There was an error while requesting timezone ' +
                      '(code: ' + errorStatus + ')');
    });
}

function googleTimeZone(lat, long, cbOnSuccess, cbOnError) {
  console.log(lat);
  console.log(long);
    var timezone = 'https://maps.googleapis.com/maps/api/timezone/json?' +
                   'location={0},{1}&timestamp=1331766000&language=es&key=AIzaSyA9ZjSeB4LZExOk1_WPEtgp8vTpt0kRhW4';
    var key = 'AIzaSyA9ZjSeB4LZExOk1_WPEtgp8vTpt0kRhW4';
    getJSON(timezone.format(lat, long), cbOnSuccess, cbOnError);
}

initAutoComplete('google');

JSONP('https://api.forecast.io/forecast/328c07219474afa5173466e4f594ac6e/37.8267,-122.423', function(json) {
  console.log(json);
});
