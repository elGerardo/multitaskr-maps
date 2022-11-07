import * as turf from '@turf/turf'

export default (context, inject) => {
    inject("turf", turf);
}