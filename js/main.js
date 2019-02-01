// run the main app on window loaded

// start the framework

// instantiate the google map

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

console.log(request);
fetch(request)
    .then(function(response) {
      return response.json();
    })
    .then(function(the_json){
      let string_result = JSON.stringify(the_json);
      console.log(string_result);
      let bounds = the_json.response.suggestedBounds;
      let results = the_json.response.groups;
      console.log(results);
    })
    .catch(function() {
      window.alert('api no worky');
        // Code for handling errors
    });
