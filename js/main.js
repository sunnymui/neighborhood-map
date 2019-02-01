// run the main app on window loaded

function initMap() {
  let map;
  // starting coordinates for san jose,ca
  let start_loc = {
    lat: 37.3361,
    lng: -121.89100000000002
  }

  // instantiate the google map
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: start_loc,
    zoom: 13,
    mapTypeControl: false
  });
}

// import the starting data

// build the listings obj into a object array for storing all the current stuff

// render the listings on the map
var foursquare_api = (function(){

})();

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
  self.taquerias = ko.observableArray([]);

  // STATE

  self.current_taqueria = ko.observable();

  // OPERATIONS

  self.get_init_data = function(data_url){
    fetch(data_url)
      .then(function(response){
        return response.json();
      })
      .then(function(init_data){
        let string_result = JSON.stringify(init_data);
        console.log(init_data);
      });
  };

  // Initialize View Model Defaults
  self.get_init_data(init_data_url);
}

ko.applyBindings(new TaqueriaListViewModel());
