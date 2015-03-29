
function mapViewModel() {
    // Data
    var self = this;
	
	self.fsqVenues = ko.observableArray([]);
	self.fsqLoaded = false;
	
	// Object with all the FourSquare functions
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
			var month = self.fsqData.zeroPad((currentDate.getMonth() + 1),2);
			var year = currentDate.getFullYear();
			var myDate = year + month + day;
			return myDate;
		},
		
		//FourSquare info function
		getFourSquare: function(lat, lng) {
			var fsqCredetials = 'client_id=NSPM4CXL0HVTMVNEFDGQJ5T3BMXERMGAMYSCKXMPZJWADYL2&client_secret=YUGK1TZC3U1YR3AWFARNCWOQT5BNRVSUDECFK0IVDXI30XY0';
			var date = self.fsqData.dateParam();
			var fsqRequest = 'https://api.foursquare.com/v2/venues/search?ll='+lat+','+lng+'&'+fsqCredetials+'&v='+date;
			return fsqRequest;
		},
		 
		fsqRequestTimeout: setTimeout(function() {
			$msgElem.text("Failed to get Foursquare resources");
		}, 5000),
				
		fsqCallback: function(myLat, myLng) {
			// get lat lng parameters or go to Washington default.
			var lat= myLat || 38.899192;
			var lng= myLng || -77.036871;
			var fsqAPI = self.fsqData.getFourSquare(lat, lng);
			var myData = [];
			$.ajax({
				url: fsqAPI,
				dataType: 'json',
				type: 'GET',
				success: function(data) {
					if (!data.meta.code === 200) {
						console.log('Sorry, we were not able to retrieve Foursquare venues');
					} else {
						self.fsqVenues(data.response.venues);
						self.fsqData.fsqFormatVenues(data.response.venues);
						console.log(self.fsqVenues());
						self.fsqLoaded = true;
					}
					clearTimeout(self.fsqData.fsqRequestTimeout);
				}
			});
		},

		// Foursquare generate venues for map
		fsqFormatVenues: function(results) {
			self.infowindow = new google.maps.InfoWindow();
			for (var i = 0; i < results.length; i++) {
				var place = results[i];
				console.log(place);
				// Test fields
				if (place.categories.length === 0) {
					var name = {name: 'other'};
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
			var placeLoc = {'lat': place.location.lat, 'lng': place.location.lng};
			var marker = new google.maps.Marker({
				map: null,  //self.map,
				position: placeLoc,
				id: place.id
			});
			// add marker to markers array
			self.markers.push(marker);
			var markerTxt = ""
			// List the name of the place's category
			markerTxt = place.categories[0].name;

				// add a listener to each marker with the infoWindow content
			google.maps.event.addListener(marker, 'click', function() {
				self.infowindow.setContent('<strong>'+place.name+'</strong>'+'<br />'+markerTxt);
				self.infowindow.open(self.map, this);
			});
		}
		
	};
	
	
	// Google map variables
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
	
	self.arrows = function(blnClose) {
		/*var forceClose = false;
		if (!blnClose) {
			forceClose = true;
		}*/
		if (($('.serviceBox').css('max-height') === '350px') || blnClose === true) {
			$('.serviceBox').css('max-height', '30px').css('overflow', 'hidden').css('border', '2px solid #f74978');
			$('.serviceBox .arrows').css('background-position', '0 0px');
		} else {
			$('.serviceBox').css('max-height', '350px').css('overflow', 'scroll').css('border', '2px solid #999');	
			$('.serviceBox .arrows').css('background-position', '0 -13px');
		}
	};

	// Show or hide the map markers. 
	// On hiding the markers, they are removed from the map, 
	//  but kept in their array.
	self.hideMarkers = function(){
		if (self.markersHide() === true) {
			self.setAllMap(null);
		} else {
			self.setAllMap(self.map);
		}
		return true;
	};
	
	self.reSort = function() {
		console.log(self.sortType());
		self.services.removeAll();
		for (i=0; i < self.allServices().length; i++) {
			// Empty string on sort type - show all
			if (self.sortType() === "") {
				self.services.push(self.allServices()[i]);
			} else { 	// look for a match		
				if (self.allServices()[i].categories[0].name === self.sortType()) {
					self.services.push(self.allServices()[i]);
				}
			}
		}
	};
	

	// Input field for neighborhood
    self.neigborhood = ko.observable();
	self.map = ko.observable();
	
	// Initialize Google Map API. 
	// Initialized with Washington, DC coordinates
	// so that we won't have a blank map on start
	self.initialize = function() {
		self.geocoder = new google.maps.Geocoder();
		var mapOptions = {
			//coordinates to put the white house in the center
			center: { lat: 38.899192, lng: -77.036871 },
			zoom: 16
		};
		self.map = new google.maps.Map(document.getElementById('map-canvas'),
		mapOptions);
		// Get the location object from the current map
		var myLocation = self.map.getCenter();
		// call to Foursquare for venues in the area
		self.fsqData.fsqCallback(myLocation.k, myLocation.D);
	};
	
	// Google Map function that does the address to latitude/longitude lookup.
	self.codeAddress = function() {
		console.log('Im in codeAddress :'+self.neigborhood().length);
		if (self.neigborhood().length == 0) {
			self.location = self.map.getCenter();
			self.markersHide(true);
			self.fsqData.fsqCallback(self.location.k, self.location.D);
		} else {
			var address = self.neigborhood();
			self.neigborhood("");
			self.geocoder.geocode( { 'address': address}, function(results, status) {
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
	};
	
	// Load map button function begins the address lookup process
	// Empty all info arrays arrays from last map 
	self.loadMap = function() {
		self.showServices(false);
		self.services.removeAll();
		self.allServices.removeAll();
		self.placeTypes.removeAll();
		self.markers = [];
		self.arrows(true);
		self.codeAddress();
	};
	
	// Call Google's PlacesService option to get local businesses 
	self.addServices = function(myLocation, type) {
		var request = {
			location: myLocation,
			radius: '500',
			types: [type]
		};
		self.infowindow = new google.maps.InfoWindow();
		self.service = new google.maps.places.PlacesService(self.map);
		self.service.nearbySearch(request, self.svsCallback)
	}
				
	// Sets the map on all markers in the array.
	self.setAllMap = function(map) {
	  for (var i = 0; i < self.markers.length; i++) {
		self.markers[i].setMap(map);
	  }
	};

	// Displays the specific marker when a place from the list is clicked.
	self.showPlace = function() {
		// get location from clicked item
		var location = {'lat': this.location.lat, 'lng': this.location.lng};
		//var location = this.geometry.location;
		for (var i = 0; i < self.markers.length; i++) {
			// find the specific marker by its id
			if (self.markers[i].id === this.id) {
				// display it on the map
				self.markers[i].setMap(self.map);
				// to better see the place, make this marker the center of the map
				// panTo does it slower to avoid a jerky motion.
				self.map.panTo(location);
				// trigger the click event to show the infoWindow
				google.maps.event.trigger(self.markers[i], 'click');
				self.markersHide(false);
			}	
		}
	};
	
	// Event listens for page load to initialize Google maps API
	google.maps.event.addDomListener(window, 'load', self.initialize);
};
ko.applyBindings(new mapViewModel());