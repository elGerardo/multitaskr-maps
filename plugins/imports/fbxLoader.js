import FBXLoader from 'threejs-fbxloader';

export default (context, inject) => {
    inject("FBXLoader", FBXLoader);
}