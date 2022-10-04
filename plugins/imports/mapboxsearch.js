import * as search from '@mapbox/search-js-web';

export default (context, inject) => {
    inject("search", search)
}