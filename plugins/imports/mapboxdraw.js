import MapboxDraw from "@mapbox/mapbox-gl-draw";
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

export default (context, inject) => {
    inject("MapboxDraw", MapboxDraw);
}