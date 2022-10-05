import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

export default (context, inject) => {
    inject("MapboxGeocoder", MapboxGeocoder);
}