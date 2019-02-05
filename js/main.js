// run the main app on window loaded
// Knockout Web App

function Taqueria(data){
  this.name = ko.observable(data.name);
  this.location = ko.observable(data.location);
  this.foursquare_id = ko.observable(data.id);
}

function TaqueriaListViewModel() {
  // DATA
  let self = this;
  const init_data_url = 'https://sunnymui.github.io/neighborhood-map/js/data.js';

  // array to store each taqueria listing to be displayed
  self.Taquerias = ko.observableArray([]);

  // STATE

  // tracks the currently selected taqueria to view info for
  self.current_taqueria = ko.observable();
  // track network status errors on http requests
  self.network_error = ko.observable();
  // tracks the current search term to filter Taquerias array by
  self.current_filter= ko.observable();

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
        for (let i = 0; i < response_array.length; i==1) {
          // shorthand for the current data item
          let current_item = response_array[i];
          // create a Taqueria instance with the current item's data
          let current_Taqueria = new Taqueria({
              name: current_item.name,
              location: current_item.location,
              foursquare_id: current_item.id
          });
          // push the Taqueria to the startin Taquerias array
          self.Taquerias.push(current_Taqueria);
        }
        console.log(init_data);
      }
      // TODO add some error catching
    );
  };
  self.filtered_Taquerias = ko.computed(function() {
    /*
    Filters the taquerias by the filter term and returns matches
    Args: na
    Return: matches (observableArray / obj) - matching Taquerias with a name matching the filter term
    */
    // filter the Taquerias array and store in matches variable
    let matches = ko.utils.arrayFilter(self.Taquerias, function(current_Taqueria) {
      // lowercase the taqueria name to eliminate case sensitivity
      let current_name = current_Taqueria.name().toLowerCase();
      // if filter term is in current name, return true to include the current Taqueria as a match
      return current_name.includes(self.current_filter);
    });

    return matches;
  }, self);

  // Initialize View Model Defaults
  self.get_init_data(init_data_url);

  // store all the taqueria instances in the startin taquerias array

}

ko.applyBindings(new TaqueriaListViewModel());

// Google Maps Init

var gmap = {
  map: {},
  markers: [],
  filtered_markers: [],
  initMap: function() {
    /*
    Instantiates the google map and displays the starting markers
    Args: na
    Return: na
    */
    // starting coordinates for san jose,ca
    let start_loc = {
      lat: 37.3361,
      lng: -121.89100000000002
    }
    let map_dom_element = document.getElementById('map');

    // instantiate the google map
    // Constructor creates a new map - only center and zoom are required.
    gmap.map = new google.maps.Map(map_dom_element, {
      center: start_loc,
      zoom: 13,
      mapTypeControl: false
    });

    let test_loc = {
      "id": "40c3b000f964a520e3001fe3",
      "name": "La Victoria Taqueria",
      "location": {
          "lat": 37.332663708429294,
          "lng": -121.88436929316791
      }
    };
    // create the markers from the base data
    let marker = gmap.make_marker(test_loc);
    // Push the marker to our array of markers.
    gmap.markers.push(marker);
    // show all the markers on the map
    gmap.show_all_markers();
  },
  make_marker: function(location) {
    /*
    Creates a single marker object from a lat lng obj pair
    Args: {lat,lng} location pair (obj)
    Return: a Marker instance for the location (obj)
    */
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      position: location.location,
      title: location.name,
      animation: google.maps.Animation.DROP,
      icon: gmap.make_marker_icon('0091ff'),
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
      markers[i].setMap(map);
      bounds.extend(markers[i].position);
    }
    // fit the map to the bounds of the marker locaitons
    map.fitBounds(bounds);
  },
  show_marker: function(marker) {
    /*
    Displays one specific marker on the map.
    Args: Marker to display on the map (obj)
    Return: na
    */
    // shorthand to the map
    var map = gmap.map;
    // bounds to extend the map with our new marker location
    var bounds = new google.maps.LatLngBounds();
    // add the marker to the map
    marker.setMap(map);
    // extend the bounds with the marker location
    bounds.extend(marker.position);
    // fit the map with the new bounds
    map.fitBounds(bounds);
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
      // console.log(string_result);
      let bounds = the_json.response.suggestedBounds;
      let results = the_json.response.groups;
      // console.log(results);
    })
    .catch(function() {
      window.alert('api no worky');
        // Code for handling errors
    });
