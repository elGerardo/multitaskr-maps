import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export default (context, inject) => {
    inject("mapboxgl", mapboxgl);
};
