# tga-js

![Browser](https://img.shields.io/badge/env-browser-blue.svg)
![](https://img.shields.io/david/vthibault/tga.js.svg)
![](https://img.shields.io/snyk/vulnerabilities/github/vthibault/tga.js.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

**tga-js** is a tga file loader written in JavaScript, working in the browser environment. It provides a simple and really fast solution for loading TGA file format.

> Lot of games are using TGA files to store textures.
> So, since browsers try to bring games in the web it can be a good idea to have a TGA loader _(actually a better idea to use another smaller file format)_.

---

## 🔗 Used by :

- [ThreeJS](https://threejs.org/) 3D Engine
- [BabylonJS](https://www.babylonjs.com/) 3D Engine

---

## 🚀 Installation

Install with [yarn](https://yarnpkg.com):

```sh
$ yarn add tga-js
```

Or install using [npm](https://npmjs.org):

```sh
$ npm i tga-js
```

---

## 📖 Usage

#### Loading a remote tga file.

```js
import TgaLoader from 'tga-js';

const tga = new TgaLoader();
tga.open('./assets/resource.tga', () => {
  document.body.appendChild(tga.getCanvas());
});
```

#### Loading a tga from buffer.

```js
import TgaLoader from 'tga-js';

const tga = new TgaLoader();

// Your own function returning a buffer from cache/memory/..
const buffer = getImageBufferFromCache('resource/data');

tga.load(new UInt8Array(buffer));
document.body.appendChild(tga.getCanvas());
```

#### Get data-uri as output

```js
tga.getDataURL('image/png');
```
