import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";

export default (context, inject) => {
    inject("MapboxGeocoder", MapboxGeocoder);
}