function WebmailViewModel() {
    // Data
    var self = this;
	// Google map variables
	//self.map;
	self.geocoder;
	self.service;
	self.location;
	self.infowindow;

	// Input field for neighborhood
    self.neigborhood = ko.observable();
	self.map = ko.observable();
	
	// Google map api function initialized with Washington, DC coordinates
	// so that we won't have a blank map on start
	self.initialize = function() {
		self.geocoder = new google.maps.Geocoder();
		var mapOptions = {
			//coordinates to put the white house in the center
			center: { lat: 38.897192, lng: -77.036871 },
			zoom: 16
		};
		self.map = new google.maps.Map(document.getElementById('map-canvas'),
		mapOptions);
	};
	// Google Map function that does the address to latitude/longitude lookup.
	self.codeAddress = function() {
	  var address = self.neigborhood();
	  self.geocoder.geocode( { 'address': address}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			self.map.setCenter(results[0].geometry.location);
			self.location = results[0].geometry.location;
			console.log(results[0].geometry.location);
			var marker = new google.maps.Marker({
			  map: self.map,
			  position: results[0].geometry.location
			});
			var request = {
			  location: results[0].geometry.location,
			  radius: '500',
			  types: ['store']
			};
			self.infowindow = new google.maps.InfoWindow();
			self.service = new google.maps.places.PlacesService(self.map);
			self.service.nearbySearch(request, self.svsCallback)
		} else {
			alert('Sorry, could not find your neighborhood for the following reason: ' + status);
		}
	  });
	};
	
	// Load map button function begins the address lookup process
	self.loadMap = function() {
		self.codeAddress();
	};
	
	self.svsCallback = function(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			for (var i = 0; i < results.length; i++) {
				console.log(results[i]);
			  var place = results[i];
			  self.createMarker(results[i]);
			}
		  }
	}

	self.createMarker = function(place) {
		var placeLoc = place.geometry.location;
		var marker = new google.maps.Marker({
			map: self.map,
			position: place.geometry.location
		});

		google.maps.event.addListener(marker, 'click', function() {
			console.log(place.name);
			self.infowindow.setContent(place.name);
			self.infowindow.open(self.map, this);
		});
	}
	
	// Event listens for page load to initialize Google maps API
	google.maps.event.addDomListener(window, 'load', self.initialize);
};
ko.applyBindings(new WebmailViewModel());
