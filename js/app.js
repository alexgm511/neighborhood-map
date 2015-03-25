function WebmailViewModel() {
    // Data
    var self = this;
	// Google map variables
	self.geocoder;
	self.service;
	self.location;
	self.infowindow;
	self.services = ko.observableArray([]);
	self.showServices = ko.observable(false);
	self.hideMarkers = function(){
		self.clearMarkers();
	};
	self.showMarkers = function(){
		self.setAllMap(self.map);
	};
	self.markers = [];

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
				console.log(results[i]);
				self.services.push(results[i]);
				var place = results[i];
				self.createMarker(place);
			}
		  }
	}
	
	// Map marker generator
	self.createMarker = function(place) {
		var placeLoc = place.geometry.location;
		var marker = new google.maps.Marker({
			map: null,  //self.map,
			//position: place.geometry.location
			position: placeLoc
		});
		self.markers.push(marker);
		var types = place.types;
		var markerTxt = types.join('<br />');

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

		// Sets the map on all markers in the array.
	self.showPlace = function() {
		var location = this.geometry.location;
	  for (var i = 0; i < self.markers.length; i++) {
		  if (self.markers[i].position == location) {
				self.markers[i].setMap(self.map);
				self.map.panTo(location);
				google.maps.event.trigger(self.markers[i], 'click');
				//self.markers[i].click();
			}	
	  }
		window.setTimeout(function() {
			self.map.setCenter(location);
		}, 3000);
		//trigger(instance:Object, eventName:string, var_args:*)
	};

	// Removes the markers from the map, but keeps them in the array.
	self.clearMarkers = function() {
		self.setAllMap(null);
	}
	
	// Event listens for page load to initialize Google maps API
	google.maps.event.addDomListener(window, 'load', self.initialize);
};
ko.applyBindings(new WebmailViewModel());
