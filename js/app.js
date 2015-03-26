function WebmailViewModel() {
    // Data
    var self = this;
	// Google map variables
	self.geocoder;
	self.service;
	self.location;
	self.infowindow;
	self.services = ko.observableArray([]);
	self.allServices = ko.observableArray([]);
	self.showServices = ko.observable(false);
	self.placeTypes = ko.observableArray([]);
	self.hideMarkers = function(){
		self.clearMarkers();
	};
	self.showMarkers = function(){
		self.setAllMap(self.map);
	};
	self.markers = [];
	self.sortType = ko.observable("");
	self.reSort = function() {
		console.log(self.sortType());
		self.services.removeAll() //= [];
		for (i=0; i < self.allServices().length; i++) {
			// Empty string on sort type - show all
			if (self.sortType() === "") {
				self.services.push(self.allServices()[i]);
			} else { 	// go through the types of each place to sort.
				for (j=0; j < self.allServices()[i].types.length; j++) {
					if (self.allServices()[i].types[j] === self.sortType()) {
						self.services.push(self.allServices()[i]);
					}
				}
			}
		}
		console.log(self.services.length);
		self.services.valueHasMutated;
	};
	
	/*self.sortList = function(data) {
		var test = false;
		if (self.sortType() == "") {
			test = true;
		} else {
			var types = data.types;
			console.log(types);
			console.log(self.sortType);
			for (var i = 0; i < types.length; i++) {
				if (types[i] == self.sortType()) {
					test = true
				} 
			}
		}
		return test;
	};*/

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
		self.addServices(myLocation, 'store');
	};
	
	// Google Map function that does the address to latitude/longitude lookup.
	self.codeAddress = function() {
	  var address = self.neigborhood();
	  self.geocoder.geocode( { 'address': address}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			self.location = results[0].geometry.location;
			self.map.setCenter(self.location);
			var marker = new google.maps.Marker({
			  map: self.map,
			  position: self.location
			});
			self.addServices(self.location, 'store');
		} else {
			alert('Sorry, could not find your neighborhood for the following reason: ' + status);
		}
	  });
	};
	
	// Load map button function begins the address lookup process
	self.loadMap = function() {
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
	
	// PlacesService callback function
	self.svsCallback = function(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			for (var i = 0; i < results.length; i++) {
				var place = results[i];
				console.log(place);
				// add place to services array
				self.services.push(place);
				// allServices array will be the full list backup
				self.allServices.push(place);
				// create a marker for each place
				self.createMarker(place);
				// add each distinct type of place to types array
				for (j=0; j < place.types.length; j++) {
					if (self.placeTypes.indexOf(place.types[j]) === -1) {
						self.placeTypes.push(place.types[j]);
					} 
				}
			}
		  }
	}
	
	// Map marker generator
	self.createMarker = function(place) {
		var placeLoc = place.geometry.location;
		var marker = new google.maps.Marker({
			map: null,  //self.map,
			position: placeLoc
		});
		// add marker to markers array
		self.markers.push(marker);
		// make a list of the place's types to add to place's infoWindow
		var types = place.types;
		var markerTxt = types.join('<br />');
		console.log(types[0]+', '+types[1]+', '+types[2]);
		// add a listener to each marker with the infoWindow content
		google.maps.event.addListener(marker, 'click', function() {
			self.infowindow.setContent('<strong>'+place.name+'</strong>'+'<br />'+markerTxt);
			self.infowindow.open(self.map, this);
		});
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
		var location = this.geometry.location;
		for (var i = 0; i < self.markers.length; i++) {
			// find the specific marker by its location
			if (self.markers[i].position == location) {
				// display it on the map
				self.markers[i].setMap(self.map);
				// to better see the place, make this marker the center of the map
				// panTo does it slower to avoid a jerky motion.
				self.map.panTo(location);
				// trigger the click event to show the infoWindow
				google.maps.event.trigger(self.markers[i], 'click');
			}	
		}
	};

	// Removes the markers from the map, but keeps them in the array.
	self.clearMarkers = function() {
		self.setAllMap(null);
	}
	
	// Event listens for page load to initialize Google maps API
	google.maps.event.addDomListener(window, 'load', self.initialize);
};
ko.applyBindings(new WebmailViewModel());