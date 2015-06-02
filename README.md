jsTGALoader
===========

Lot of games are using TGA files to store textures.
So, since browsers try to bring games in the web it can be a good idea (or not) to have a TGA loader.

How to Use
==========

Loading a remote tga file
```js
var tga = new TGA();
tga.open( "resource.tga", function(){
   document.body.appendChild( tga.getCanvas() );
});
```

Loading a tga from data
```js
var tga = new TGA();
tga.load(tga_data); // tga_data must be a Uint8Array
```

Used by
======
- ThreeJS (https://github.com/mrdoob/three.js)
- BabylonJS (https://github.com/BabylonJS/Babylon.js)
