// Utility functions

var util = {
  clean_string: function(string) {
    /*
    Cleans a string in prep for comparisons or other uses. Strips out extra
    white space and punctuation.
    Args: string (str) - string to clean
    Return: cleaned string (str)
    */
    // strip filter text of extra whitespace before/after, lowercase so it isn't case sensitive
    return string.trim()
                 .toLowerCase()
                 // strip out punctation and collapse extra whitespace, source:
                 // https://stackoverflow.com/questions/4328500/how-can-i-strip-all-punctuation-from-a-string-in-javascript-using-regex
                 // extended with missing ’ punctuation
                 .replace(/['!"#$%&\\'()\*+,\-\.\/:;’<=>?@\[\\\]\^_`{|}~']/g,"")
                 .replace(/\s{2,}/g," ");
  },
  is_empty_obj: function(obj) {
    /*
    Checks if an object is empty or contains stuff.
    Source: https://coderwall.com/p/_g3x9q/how-to-check-if-javascript-object-is-empty
    Args: obj (obj) - the object to Check
    Return: true/false (bool) - true if empty, false if not an empty object
    */
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
  }
};

// Google Maps Module

var gmap = {
  map: {},
  markers: [],
  selected_marker: {},
  default_icon: {},
  info_window: {},
  panorama: {},
  error_codes: {
    api_not_loaded: "Google Maps couldn't load. Check your internet connection and reload.",
    street_view_failed: 'Street View could not connect. You can try again later.',
    street_view_none: 'No Street View available for that location. Sorry.',
    places_failed: 'Detailed Places info unavailable. Check your internet connection or try later.'
  },
  object_cache: [],
  // uses ES6 simulated default named parameters, source:
  // https://stackoverflow.com/questions/894860/set-a-default-parameter-value-for-a-javascript-function/46760685#46760685
  Cache_obj: function({
    marker = {},
    place_details = {}
  } = {}) {
    /*
    Constructor function for an object cache item to store already instantiated
    gmap objects so we don't have to waste resources recreating things.
    Args: gmap objs to cache like marker obj, place data
    Return: na
    */
    this.marker = marker;
    this.place_details = place_details;
  },
  init_map: function(locations_data) {
    /*
    Instantiates the google map and displays the starting markers
    Args: locations_data (array) - an array of location data objects.
          Should have properties like this example:
          {name: 'Some Place', location: {lat: 32.21, lng 12.231}}
    Return: na
    */
    // starting coordinates for san jose,ca
    let start_loc = {
      lat: 37.3361,
      lng: -121.89100000000002
    };
    // grab the map dom element
    let map_dom_element = document.getElementById('map');

    // catches errors if the google maps library didnt load
    try {
      // instantiate the google map
      // Constructor creates a new map - only center and zoom are required.
      gmap.map = new google.maps.Map(map_dom_element, {
        center: start_loc,
        zoom: 13,
        mapTypeControl: false
      });

      // instantiate an infowindow to populate place details with
      gmap.info_window = new google.maps.InfoWindow();

      // Create a "highlighted location" marker color for when the user
      // wants more details on the marker.
      gmap.selected_marker = gmap.make_marker_icon('FFFF24');
      // Create a default marker icon based on color
      gmap.default_icon = gmap.make_marker_icon('0091ff');

      // create markers per location
      locations_data.forEach(function(current_item) {
        // instantiate a google map marker for the currrent taqueria
        let current_marker = gmap.make_marker(current_item.location, current_item.name, current_item.id.place);
        // initialize the object cache
        let current_cached_obj = new gmap.Cache_obj({marker: current_marker});

        // store marker in the gmap module's markers array
        gmap.markers.push(current_marker);
        // store the marker instance in the object cache
        gmap.object_cache.push(current_cached_obj);
      });

      // display all the markers
      gmap.show_all_markers();
    }
    catch(error) {
      // notify the main taqueria app of the api loading error
      taqueria_app.error_triggered(gmap.error_codes.api_not_loaded);
      // exit the init function early to not waste time
      return;
    }
  },
  make_marker: function(location, name, id) {
    /*
    Creates a single marker object from a lat lng obj pair
    Args: location (obj) - {lat,lng} location pair
          name (string) - title to show when mousing over the marker
          id (string) - place id for this marker
    Return: a Marker instance for the location (obj)
    */

    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      position: location,
      title: name,
      animation: google.maps.Animation.DROP,
      icon: gmap.default_icon,
      id: id
    });

    // Create an onclick event to open the info window at each marker.
    marker.addListener('click', function() {
      gmap.show_info_window(this, gmap.info_window);
    });
    // Two event listeners - one for mouseover, one for mouseout,
    // to change the colors back and forth.
    marker.addListener('mouseover', function() {
      this.setIcon(gmap.selected_marker);
      // show info window on hover
      gmap.show_info_window(this, gmap.info_window);
    });
    marker.addListener('mouseout', function() {
      this.setIcon(gmap.default_icon);
    });

    // return the created marker
    return marker;
  },
  show_all_markers: function() {
    /*
    Displays all the markers in the markers array.
    Args: na
    Return: na
    */
    // shorthand for the markers array
    let markers = gmap.markers;
    // bounds obj to extend map with our marker locations
    let bounds = new google.maps.LatLngBounds();
    // shorthand to the map
    let map = gmap.map;
    // Extend the boundaries of the map for each marker and display the marker
    for (let i = 0; i < markers.length; i++) {
      // set the map to show the marker on the current map
      markers[i].setMap(map);
      // fits the map bounds to the marker
      bounds.extend(markers[i].position);
    }
    // fit the map to the bounds of the marker locaitons
    map.fitBounds(bounds);
  },
  show_markers: function(marker_array) {
    /*
    Displays specific markers on the map.
    Args: Marker_array (array)- marker(s) to display on the map
    Return: na
    */
    // shorthand to the map
    let map = gmap.map;
    // bounds to extend the map with our new marker location
    let bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (let i = 0; i < marker_array.length; i+=1) {
      // set the map to show the marker on the current map
      marker_array[i].setMap(map);
      // fits the map bounds to the marker
      bounds.extend(marker_array[i].position);
    }
    // fit the map with the new bounds
    map.fitBounds(bounds);
  },
  hide_marker: function(marker) {
    /*
    Hides one specific marker on the map.
    Args: Marker (obj) - marker to hide on the map
    Return: na
    */
    // shorthand to the map
    let map = gmap.map;
    // bounds to extend the map with our new marker location
    let bounds = new google.maps.LatLngBounds();
    // remove the marker from the map
    marker.setMap(null);

    // Recompute the bounds of the map, accounting for now hidden markers
    for (let i = 0; i < markers.length; i+=1) {
      // cache ref to the current marker
      let current_marker = markers[i];
      // only extend bounds with visible markers' positions
      if (current_marker.getMap()) {
        // fits the map bounds to the marker
        bounds.extend(current_marker.position);
      }
    }
    // fit the map with the new bounds
    map.fitBounds(bounds);
  },
  hide_all_markers: function() {
    /*
    Hides all the markers in the markers array fom the map.
    Args: na
    Return: na
    */
    // shorthand for the markers array
    let markers = gmap.markers;
    // shorthand to the map
    let map = gmap.map;
    // Extend the boundaries of the map for each marker and display the marker
    for (let i = 0; i < markers.length; i+=1) {
      // hide the marker from the current map
      markers[i].setMap(null);
    }
  },
  highlight_marker: function(marker) {
    /*
    Highlights a specific marker. Useful to show it's been selected.
    Args: marker (obj) - the marker to highlight
    Return: na
    */
    // add a bounce animation ot the marker
    marker.setAnimation(google.maps.Animation.BOUNCE);

    // clear the animation when done
    addEventListener('hide.bs.modal', function() {
      marker.setAnimation(null);
    }.call(this, marker));
  },
  make_marker_icon: function(markerColor) {
    /*
    Creates a custom marker icon based on a color.
    Args: markerColor (string) - 6 digit hex coded color value
    */
    var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
      '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21,34));
    return markerImage;
  },
  get_place_details: function(marker) {
    /*
    This is the PLACE DETAILS search - it's the most detailed so it's only
    executed when a marker is selected, indicating the user wants more
    details about that place.
    Args: marker (obj) - the Marker instance to get details for from places api
          infoWindow (obj) - the infoWindow instance to add detail info to
    Return: na
    */
    // get the index of the current marker in the markers array
    let current_marker_index = gmap.markers.indexOf(marker);
    // shortcut to the object cache for place details
    let current_place_details = gmap.object_cache[current_marker_index].place_details;
    // check if place details have been cached
    let current_place_not_cached = util.is_empty_obj(current_place_details);

    // if place details aren't cached, fetch it from the places service api
    if (current_place_not_cached) {
      // create a places service api interface
      let place_service = new google.maps.places.PlacesService(gmap.map);

      // make the places service request
      place_service.getDetails({
        placeId: marker.id
      }, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          // will store the found information
          let details = {
            // full name of the place
            name: place.name || '',
            // full formatted street address
            address: place.formatted_address || '',
            // phone including area code
            phone: place.formatted_phone_number || '',
            // array of business hours by day in text strings
            hours: place.opening_hours.weekday_text || '',
            // photo of the business
            photos: place.photos[0].getUrl(
                {maxHeight: 100, maxWidth: 200}) || '',
            // array of reviews for the business
            reviews: place.reviews || '',
            // array of reviews for the business
            rating: place.rating || '',
            // official website
            website: place.website || ''
          };

          // push the place details information to the current details buffer
          taqueria_app.current_details(details);
          // trigger details ready in main app
          taqueria_app.place_details_ready(true);
          // cache the found details in the gmap object cache
          gmap.object_cache[current_marker_index].place_details = details;

        } else {
          console.log('Could not reach Places api');
          // trigger appropriate error in main app
          taqueria_app.error_triggered(gmap.error_codes.places_failed);
        }
      });
    } else {
      // push the cached place details object to the current details buffer
      taqueria_app.current_details(current_place_details);
      // trigger details ready in main app
      taqueria_app.place_details_ready(true);
    }
  },
  get_panorama: function(marker) {
    /*
    Get a panorama from the street view service for a marker.
    Args: marker (obj) - marker to get location from for street views
    Return: na
    */

    // panorama request options
    let pano_options = {
      // marker's lat-lng
      location: marker.position,
      // get the outside view only
      source: google.maps.StreetViewSource.OUTDOOR
    };
    // open a google maps street view api interface
    let street_view_service = new google.maps.StreetViewService();

    // // get the panorama for this marker from the street view api
    street_view_service.getPanorama(pano_options, gmap.process_street_view_data);
  },
  process_street_view_data: function(data, status) {
    if (status == google.maps.StreetViewStatus.OK) {
      // location to center the panorama on
      let view_location = data.location.latLng;
      // config for panorama appearance
      let panorama_options = {
        position: view_location,
        // the following show/hide default control overlays
        linksControl: false,
        enableCloseButton: false,
        addressControl: false,
        panControl: false,
        zoomControl: true,
        fullscreenControl: false,
        motionTrackingControl: false
      };
      // get the pano element here in case it isn't in the dom at init load
      let pano_element = document.getElementById('pano');
      // generate the panorama and store it in case we need to fiddle with it
      gmap.panorama = new google.maps.StreetViewPanorama(pano_element, panorama_options);
      // trigger details ready flag in main app
      taqueria_app.panorama_ready(true);

    } else if (status == google.maps.StreetViewStatus.ZERO_RESULTS) {
      // trigger an error in the main app view model
      taqueria_app.error_triggered(gmap.error_codes.street_view_none);
    } else {
      console.log('Street View request failed');
      // trigger an error in the main app view model
      taqueria_app.error_triggered(gmap.error_codes.street_view_failed);
    }
  },
  show_info_window: function(marker, infowindow) {
    /*
    This function populates the infowindow when the marker is clicked. We populate
     one infowindow which will open at the marker that is clicked, and populate based
     on that markers position.
    */

    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
      // Clear the infowindow content to give the streetview time to load.
      infowindow.setContent('<h5>'+marker.title+'</h5>');
      infowindow.marker = marker;
      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
      });

      // open info window at marker
      infowindow.open(gmap.map, marker);
    }
  }
};

// import the starting data

// build the listings obj into a object array for storing all the current stuff

// render the listings on the map
var fsquare = {
  client_details: {
    id: 'NFVFONNFXKXHUZIRELJPUT5OVPJYJASJLDU3GUGPABYLRJY5',
    secret:'UCVSJOTSDRFKMBWTYIGTXFUOO45ECAZCQLDU4ZAN301IBU2G',
    api_version: '20180129',
  },
  api_parameters: {

  },
  get_details: function() {

  }
};

let client_details = {
  id: 'NFVFONNFXKXHUZIRELJPUT5OVPJYJASJLDU3GUGPABYLRJY5',
  secret:'UCVSJOTSDRFKMBWTYIGTXFUOO45ECAZCQLDU4ZAN301IBU2G',
  api_version: '20180129',
};
let api_parameters = {
  limit: '5',
  near: 'San Jose, CA',
  query: 'taqueria'
};
let request = 'https://api.foursquare.com/v2/venues/explore?client_id='+
client_details.id +
'&client_secret='+
client_details.secret +
'&v='+
client_details.api_version +
'&limit='+
api_parameters.limit +
'&near='+
api_parameters.near +
'&query='+
api_parameters.query;

fetch(request)
    .then(function(response) {
      return response.json();
    })
    .then(function(the_json){
      let string_result = JSON.stringify(the_json);

      let bounds = the_json.response.suggestedBounds;
      let results = the_json.response.groups;

    })
    .catch(function() {
      window.alert('api no worky');
        // Code for handling errors
    });

// Knockout Neigborhood Map Web App

function Taqueria(data) {
  // stores the index identifier for easy accessibility
  this.index = ko.observable(data.index);
  // stores the name string of the taqueria
  this.name = ko.observable(data.name);
  // store lat lng location obj
  this.location = ko.observable(data.location);
  // store foursquare place id
  this.foursquare_id = ko.observable(data.foursquare_id);
  // store google place id
  this.place_id = ko.observable(data.place_id);
}

function TaqueriaListViewModel() {
  // DATA
  let self = this;
  const init_data_url = 'https://sunnymui.github.io/neighborhood-map/js/data.js';

  // array to store each taqueria listing to be displayed
  self.Taquerias = ko.observableArray();

  // STATE

  // tracks the currently selected taqueria to view info for
  self.currently_viewing_Taqueria = ko.observable();
  // tracks if an error occured and the type
  self.error_triggered = ko.observable();
  // tracks the current search term to filter Taquerias array by
  self.entered_terms = ko.observable('');
  // tracks the current search term to filter Taquerias array by
  self.current_filter = ko.observable('');
  // flag to track when starting data is ready and init'd to render the views
  self.ready = ko.observable(false);
  // flag to track if street view panorama has finished loading
  self.panorama_ready = ko.observable(false);
  // flag to track if details ready
  self.place_details_ready = ko.observable(false);
  // stores details currently loaded by api
  self.current_details = ko.observable();

  // OPERATIONS

  self.get_init_data = function(data_url){
    /*
    Grabs the initial data from a specific url and makes it usable for our app
    Args: data_url (string) - the http/https url to fetch info from
    Return: na
    */
    // fetch the initial starting data
    fetch(data_url)
      .then(function(response){
        // output response as json obj
        return response.json();
      })
      .then(function(init_data){
        // grab the array of raw data
        let response_array = init_data.response;
        // loop through the data and instantiate Taqueria objs
        for (let i = 0; i < response_array.length; i+=1) {
          // shorthand for the current data item
          let current_item = response_array[i];
          // create a Taqueria instance with the current item's data
          let current_Taqueria = new Taqueria({
              index: i,
              name: current_item.name,
              location: current_item.location,
              foursquare_id: current_item.id.foursquare,
              place_id: current_item.id.place
          });
          // push the Taqueria to the main app's Taquerias array
          self.Taquerias.push(current_Taqueria);
        }
        // start the google map module with the raw location data
        gmap.init_map(response_array);

        // set ready status to true so rendering views can start
        self.ready(true);
      })
      .catch(function() {
        console.log('Could not fetch starting data.');
        // trigger the erro flag observable
        self.error_triggered('Could not get the starting data. Check your internet connection and reload the page.');
      });
  };

  self.update_map = function(updated_Taquerias) {
    /*
    Update the map display to show the passed in Taquerias.
    Args: updated_Taquerias (array) - array of taqueria instances to show on the map
    Return: na
    */
    // hide all the current markers being shown
    gmap.hide_all_markers();

    // grab an array of corresponding Markers from the updated Taquerias list
    let filtered_markers = updated_Taquerias.map(current_Taqueria => gmap.markers[current_Taqueria.index()]);

    // show the filtered Markers on the map
    gmap.show_markers(filtered_markers);
  };

  self.set_current_filter_to_entered_terms = function() {
    /*
    Sets the current filter to the value inputted into entered terms.
    Args: na
    Return: na
    */
    self.current_filter(self.entered_terms());
  };

  self.filtered_Taquerias = ko.computed(function() {
    /*
    Filters the taquerias by the filter term and returns matches
    Args: na
    Return: matches (observableArray / obj) - matching Taquerias with a name matching the filter term
    */
    // make sure gmap and taquerias model is ready to go before rendering
    if (self.ready()) {
      // strip filter text of extra whitespace before/after, lowercase so it isn't case sensitive
      let filter = util.clean_string(self.current_filter());
      // array to hold matching taquerias
      let matches = [];

      // check if a filter term has even been entered
      if (!filter) {
        // show the full taquerias list
        matches = self.Taquerias();
      } else {
        // filter the Taquerias array and store in matches variable
        matches = ko.utils.arrayFilter(self.Taquerias(), function(item) {
          // // lowercase the taqueria name to eliminate case sensitivity
          let current_name = util.clean_string(item.name());
          // if filter term is in current name, return true to include the current Taqueria as a match
          return current_name.includes(filter);
        });
      }
      // update the map view with the filtered matches
      self.update_map(matches);

      return matches;
    }
  }, self);

  self.show_details = function(Taqueria) {
    /*
    Shows the details for a place in a modal window.
    Args: Taqueria (obj) - the Taqueria to view details for
    Return: na
    */

    // reset ready state
    self.panorama_ready(false);
    self.place_details_ready(false);

    // set the current taqueria as the passed in one that triggered the function
    self.currently_viewing_Taqueria(Taqueria);

    // shortcut to the index of the current Taqueria
    let index = Taqueria.index();
    // cache reference to the corresponding gmap marker
    let current_marker = gmap.markers[index];

    // show the corresponding street view panorama
    gmap.get_panorama(current_marker);
    // show the corresponding place details
    gmap.get_place_details(current_marker);

    // change appearnace of map marker
    gmap.highlight_marker(current_marker);

    // display the modal dialog box view
    $('#details').modal('toggle');
  };

  self.details_ready = ko.computed(function() {
    /*
    Tracks whether details are ready to show visually. Used
    for showing loading spinner.
    Args: na
    Return: ready (bool) - true if everything ready, false if not
    */
    // default to false
    let ready = false;

    // different api readiness flags to determine total readiness
    if (self.panorama_ready()) {
      // everything ready so set to true
      ready = true;
    }

    return ready;
  });

  self.show_mouseover_view = function(current_element){
    /*
    Shows mouseover info in the map view for corresponding elements.
    Args: current_element (obj) - the Taqueria that triggered the function
    Return: na
    */
    let current_index = current_element.index();
    // show the corresponding info window in the map view
    gmap.show_info_window(gmap.markers[current_index], gmap.info_window);
  };

  self.clear_error = function() {
    /*
    Clears the error state observable.
    Args: na
    Return: na
    */
    self.error_triggered('');
  };

  self.reset_view = function() {
    /*
    Resets the view to the initial state with starting data.
    Args: na
    Return: na
    */
    // only have to set current filter to blank since view renders everything
    // starting from that observable
    self.current_filter('');
  };

  // Initialize View Model Defaults
  self.get_init_data(init_data_url);

}

// launch the main taqueria app with this publicly accessible name
var taqueria_app = new TaqueriaListViewModel();
// apply the data bindings
ko.applyBindings(taqueria_app);
