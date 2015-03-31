function mapViewModel() {
    // Data
    var self = this;

    // Google map variables
    self.map = ko.observable();
    // Input field for neighborhood
    self.neighborhood = ko.observable();
    // Default values for coordinates - White House neighborhood
    self.defLat = 38.899192;
    self.defLng = -77.036871;
    self.defZoom = 17;
    self.geocoder;
    self.service;
    self.location;
    self.infowindow;
    self.services = ko.observableArray([]);
    self.allServices = ko.observableArray([]);
    self.showServices = ko.observable(false);
    self.markersHide = ko.observable(true);
    self.placeTypes = ko.observableArray([]);
    self.markers = [];
    self.sortType = ko.observable("");

    self.fsqVenues = ko.observableArray([]);
    self.fsqLoaded = false;

    /* ~~~  FourSquare functions ~~~ */
    self.fsqData = {
        // function to format by zero filling the date parameter -  http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
        zeroPad: function(n, width, z) {
            z = z || '0';
            n = n + '';
            return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
        },

        // Returns date in format "YYYYMMDD"
        dateParam: function() {
            var currentDate = new Date(new Date().getTime());
            var day = self.fsqData.zeroPad(currentDate.getDate(), 2);
            var month = self.fsqData.zeroPad((currentDate.getMonth() + 1), 2);
            var year = currentDate.getFullYear();
            var myDate = year + month + day;
            return myDate;
        },

        //FourSquare info function
        getFourSquare: function(lat, lng) {
            var fsqCredetials = 'client_id=NSPM4CXL0HVTMVNEFDGQJ5T3BMXERMGAMYSCKXMPZJWADYL2&client_secret=YUGK1TZC3U1YR3AWFARNCWOQT5BNRVSUDECFK0IVDXI30XY0';
            var date = self.fsqData.dateParam();
            var fsqRequest = 'https://api.foursquare.com/v2/venues/search?ll=' + lat + ',' + lng + '&' + fsqCredetials + '&v=' + date;
            return fsqRequest;
        },
		
		// Timeout in case of error in retrieving Foursquare info
        fsqRequestTimeout: setTimeout(function() {
            self.fsqData.toggleError(true);
        }, 5000),
		
		// Ajax function that requests Foursquare info
        fsqCallback: function(myLat, myLng) {
            // get lat lng parameters or go to Washington default.
            var lat = myLat || self.defLat; //38.899192;
            var lng = myLng || self.defLng; //-77.036871;
            var fsqAPI = self.fsqData.getFourSquare(lat, lng);
            var myData = [];
            $.ajax({
                url: fsqAPI,
                dataType: 'json',
                type: 'GET',
                error: function(data) {
					// Error in case of failed ajax call
                    self.fsqData.toggleError(true);
                },
                success: function(data) {
                    if (!data.meta.code === 200) {
						// Error in case returned info is not successful
                        self.fsqData.toggleError(true);
                    } else {
                        self.fsqVenues(data.response.venues);
                        self.fsqData.fsqFormatVenues(data.response.venues);
                        self.fsqData.toggleVenuesAll(false);
                        self.fsqLoaded = true;
                    }
					// clear the error catching timeout
                    clearTimeout(self.fsqData.fsqRequestTimeout);
                }
            });
        },

        // Foursquare generate venues for map
		// creates an object for each returned venue and adds to services array
		// It also creates a list of categories to be able to sort later
        fsqFormatVenues: function(results) {
            self.infowindow = new google.maps.InfoWindow();
            for (var i = 0; i < results.length; i++) {
                var place = results[i];
                // Test fields
                if (place.categories.length === 0) {
                    var name = {
                        name: 'other'
                    };
                    place.categories.push(name);
                }
                if (!place.location.address) {
                    place.location.address = "n/a";
                }
                // add place to services array
                self.services.push(place);
                // allServices array will be the full list backup
                self.allServices.push(place);
                // create a marker for each place
                self.fsqData.createFSMarker(place);
                // add each distinct type of place to types array
                if (self.placeTypes.indexOf(place.categories[0].name) === -1) {
                    self.placeTypes.push(place.categories[0].name);
                }
            }
        },

        // Map FourSquare marker generator
        createFSMarker: function(place) {
            //var placeLoc = place.geometry.location;
            var placeLoc = {
                'lat': place.location.lat,
                'lng': place.location.lng
            };
            var marker = new google.maps.Marker({
                map: null, //self.map,
                position: placeLoc,
                id: place.id
            });
            // add marker to markers array
            self.markers.push(marker);
            var markerTxt = ""
			// Html for the inside of each marker message including a Google map image of the given coordinates
            markerTxt = '<div class="markerMsg"><h3>' + place.name + '</h3><p>' + place.categories[0].name + '</p><img src="https://maps.googleapis.com/maps/api/streetview?size=200x113&location=' + placeLoc.lat + ',' + placeLoc.lng + '" /></div>';

            // add a click listener to each marker with the infoWindow content
            google.maps.event.addListener(marker, 'click', function() {
                self.infowindow.setContent(markerTxt);
                self.infowindow.open(self.map, this);
            });
        },

        // Toggles showing/hiding of Foursquare box.
		// Box is shown once all info is returned and loaded
        toggleVenuesAll: function(state) {
            if (state) {
                $('.serviceBox').hide();
            } else {
                $('.serviceBox').show();
            }
        },

        // Toggles showing/hiding of Foursquare info error 
        toggleError: function(state) {
            if (state) {
                $('.serviceBox #msgElem').text("Failed to get Foursquare resources.");
                $(".serviceBox .svsContent").hide();
            } else {
                $('.serviceBox #msgElem').text("");
                $(".serviceBox .svsContent").show();
            }
        }

    };

    /* ~~~ Google Maps functions ~~~ */
    self.GMap = {
        // Initialize Google Map API. 
        // Initialized with Washington, DC coordinates
        // so that we won't have a blank map on start
        initialize: function() {
            self.geocoder = new google.maps.Geocoder();
            var mapOptions = {
                //coordinates to put the white house in the center
                center: {
                    lat: self.defLat,
                    lng: self.defLng
                },
                zoom: self.defZoom
            };
            self.map = new google.maps.Map(document.getElementById('map-canvas'),
                mapOptions);
            // Get the location object from the current map
            var myLocation = self.map.getCenter();
            // call to Foursquare for venues in the area
            self.fsqData.fsqCallback(myLocation.k, myLocation.D);
        },

        // Google Map lookup function returns latitude/longitude from address.
		// If no address is given, map center is used to find surrounding venues.
        codeAddress: function() {
            if (self.neighborhood().length == 0) {
                self.location = self.map.getCenter();
                self.markersHide(true);
                self.fsqData.fsqCallback(self.location.k, self.location.D);
            } else {
                var address = self.neighborhood();
                self.neighborhood("");
                self.geocoder.geocode({
                    'address': address
                }, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        self.location = results[0].geometry.location;
                        self.map.setCenter(self.location);
                        self.markersHide(true);
                        self.fsqData.fsqCallback(self.location.k, self.location.D);
                    } else {
                        alert('Sorry, could not find your neighborhood for the following reason: ' + status);
                    }
                });
            }
        },

        // STARTING POINT for new maps.
		// loadMap function begins the address lookup process
        // Empty all info arrays from last map 
        loadMap: function() {
            self.showServices(false);
            self.services.removeAll();
            self.allServices.removeAll();
            self.placeTypes.removeAll();
            self.markersHide(true);
            self.GMap.hideMarkers();
            self.markers = [];
            self.GMap.venuesToggle(true);
            self.fsqData.toggleVenuesAll(true);
            self.fsqData.toggleError(false);
            self.GMap.codeAddress();
        },


        // Venues box starts out closed with a down arrow to open it.
		// This function toggles it open and close and shows the down and up arrow accordingly
        // If the blnClose parameter is passed true the box is forced close.
        venuesToggle: function(blnClose) {
            if (($('.serviceBox').css('max-height') === '350px') || blnClose === true) {
                $('.serviceBox').css('max-height', '30px').css('overflow', 'hidden').css('border', '2px solid #f74978');
                $('.serviceBox .arrows').css('background-position', '0 0px');
            } else {
                $('.serviceBox').css('max-height', '350px').css('overflow', 'scroll').css('border', '2px solid #999');
                $('.serviceBox .arrows').css('background-position', '0 -13px');
            }
        },

        // Show or hide the map markers. 
        // On hiding the markers, they are removed from the map, 
        //  but kept in their array.
        hideMarkers: function() {
            if (self.markersHide() === true) {
                self.GMap.setAllMap(null);
            } else {
                self.GMap.setAllMap(self.map);
            }
            return true;
        },

        // Sets the map on all markers in the array.
        setAllMap: function(map) {
            for (var i = 0; i < self.markers.length; i++) {
                self.markers[i].setMap(map);
            }
        },

        // Displays the specific marker when a place from the list is clicked.
        showPlace: function() {
            // get location from clicked item
            var location = {
                'lat': this.location.lat,
                'lng': this.location.lng
            };
            //var location = this.geometry.location;
            for (var i = 0; i < self.markers.length; i++) {
                // find the specific marker by its id
                if (self.markers[i].id === this.id) {
                    // display it on the map
                    self.markers[i].setMap(self.map);
                    // to better see the place, make this marker the center of the map
                    // panTo does it slower to avoid a jerky motion.
                    self.map.panTo(location);
                    // trigger the marker's click event to show the infoWindow
                    google.maps.event.trigger(self.markers[i], 'click');
					// Once there is a marker on the map, enable the Hide marker option.
                    self.markersHide(false);
                }
            }
        },
		
		// Put on visible list only items that match the sort category.
		// allServices array keeps all markers, services array has only current set
        reSort: function() {
            self.services.removeAll();
            for (i = 0; i < self.allServices().length; i++) {
                // Empty string on sort type - show all
                if (self.sortType() === "") {
                    self.services.push(self.allServices()[i]);
                } else { // look for a match		
                    if (self.allServices()[i].categories[0].name === self.sortType()) {
                        self.services.push(self.allServices()[i]);
                    }
                }
            }
        }

    };

    // This function triggers the Go button when user presses return/enter key
	// The Go button or return/enter key is used rather than each key entered
	//    to avoid excessive API calls to Foursquare / Google 
    $('.addressBar input').keypress(function(event) {
        if (event.charCode === 13) {
            $('.addressBar button').click();
        }
    });

    // Event listens for page load to initialize Google maps API
    google.maps.event.addDomListener(window, 'load', self.GMap.initialize);
};
ko.applyBindings(new mapViewModel());