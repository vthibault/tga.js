/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "^(TYPE|ORIGIN)_" }]*/
'use strict';

/**
 * @enum tga types
 */
const TYPE_NO_DATA = 0;
const TYPE_INDEXED = 1;
const TYPE_RGB = 2;
const TYPE_GREY = 3;
const TYPE_RLE_INDEXED = 9;
const TYPE_RLE_RGB = 10;
const TYPE_RLE_GREY = 11;

/**
 * @enum tga origins
 */
const ORIGIN_BOTTOM_LEFT = 0x00;
const ORIGIN_BOTTOM_RIGHT = 0x01;
const ORIGIN_TOP_LEFT = 0x02;
const ORIGIN_TOP_RIGHT = 0x03;
const ORIGIN_SHIFT = 0x04;
const ORIGIN_MASK = 0x30;

/**
 * TGA Namespace
 * @constructor
 */
export default class TgaLoader {
  /**
   * Check the header of TGA file to detect errors
   *
   * @throws Error
   * @private
   */
  _checkHeader() {
    const header = this.header;

    // What the need of a file without data ?
    if (header.imageType === TYPE_NO_DATA) {
      throw new Error('No data');
    }

    // Indexed type
    if (header.hasColorMap) {
      if (
        header.colorMapLength > 256 ||
        header.colorMapDepth !== 24 ||
        header.colorMapType !== 1
      ) {
        throw new Error('Invalid colormap for indexed type');
      }
    } else {
      if (header.colorMapType) {
        throw new Error('Why does the image contain a palette ?');
      }
    }

    // Check image size
    if (!header.width || !header.height) {
      throw new Error('Invalid image size');
    }

    // Check pixel size
    if (
      header.pixelDepth !== 8 &&
      header.pixelDepth !== 16 &&
      header.pixelDepth !== 24 &&
      header.pixelDepth !== 32
    ) {
      throw new Error('Invalid pixel size "' + header.pixelDepth + '"');
    }
  }

  /**
   * Decode RLE compression
   *
   * @param {Uint8Array} data
   * @param {Number} offset in data to start loading RLE
   * @param {Number} pixel count
   * @param {Number} output buffer size
   * @returns {Uint8Array} the decoded data
   * @private
   */
  _decodeRLE(data, offset, pixelSize, outputSize) {
    const output = new Uint8Array(outputSize);
    const pixels = new Uint8Array(pixelSize);
    let pos = 0;

    while (pos < outputSize) {
      const c = data[offset++];
      let count = (c & 0x7f) + 1;

      // RLE pixels.
      if (c & 0x80) {
        // Bind pixel tmp array
        for (let i = 0; i < pixelSize; ++i) {
          pixels[i] = data[offset + i];
        }

        offset += pixelSize;

        // Copy pixel array
        for (let i = 0; i < count; ++i) {
          output.set(pixels, pos);
          pos += pixelSize;
        }
      }

      // Raw pixels.
      else {
        count *= pixelSize;

        for (let i = 0; i < count; ++i) {
          output[pos + i] = data[offset + i];
        }

        pos += count;
        offset += count;
      }
    }

    return output;
  }

  /**
   * Return a ImageData object from a TGA file (8bits)
   *
   * @param {Array} imageData - ImageData to bind
   * @param {Array} indexes - index to colormap
   * @param {Array} colormap
   * @param {number} width
   * @param {number} y_start - start at y pixel.
   * @param {number} x_start - start at x pixel.
   * @param {number} y_step  - increment y pixel each time.
   * @param {number} y_end   - stop at pixel y.
   * @param {number} x_step  - increment x pixel each time.
   * @param {number} x_end   - stop at pixel x.
   * @returns {Array} imageData
   * @private
   */
  _getImageData8bits(
    imageData,
    indexes,
    colormap,
    width,
    y_start,
    y_step,
    y_end,
    x_start,
    x_step,
    x_end
  ) {
    for (let i = 0, y = y_start; y !== y_end; y += y_step) {
      for (let x = x_start; x !== x_end; x += x_step, i++) {
        const color = indexes[i];

        imageData[(x + width * y) * 4 + 3] = 255;
        imageData[(x + width * y) * 4 + 2] = colormap[color * 3 + 0];
        imageData[(x + width * y) * 4 + 1] = colormap[color * 3 + 1];
        imageData[(x + width * y) * 4 + 0] = colormap[color * 3 + 2];
      }
    }

    return imageData;
  }

  /**
   * Return a ImageData object from a TGA file (16bits)
   *
   * @param {Array} imageData - ImageData to bind
   * @param {Array} pixels data
   * @param {Array} colormap - not used
   * @param {number} width
   * @param {number} y_start - start at y pixel.
   * @param {number} x_start - start at x pixel.
   * @param {number} y_step  - increment y pixel each time.
   * @param {number} y_end   - stop at pixel y.
   * @param {number} x_step  - increment x pixel each time.
   * @param {number} x_end   - stop at pixel x.
   * @returns {Array} imageData
   * @private
   */
  _getImageData16bits(
    imageData,
    pixels,
    colormap,
    width,
    y_start,
    y_step,
    y_end,
    x_start,
    x_step,
    x_end
  ) {
    for (let i = 0, y = y_start; y !== y_end; y += y_step) {
      for (let x = x_start; x !== x_end; x += x_step, i += 2) {
        const color = pixels[i + 0] | (pixels[i + 1] << 8);
        imageData[(x + width * y) * 4 + 0] = (color & 0x7c00) >> 7;
        imageData[(x + width * y) * 4 + 1] = (color & 0x03e0) >> 2;
        imageData[(x + width * y) * 4 + 2] = (color & 0x001f) >> 3;
        imageData[(x + width * y) * 4 + 3] = color & 0x8000 ? 0 : 255;
      }
    }

    return imageData;
  }

  /**
   * Return a ImageData object from a TGA file (24bits)
   *
   * @param {Array} imageData - ImageData to bind
   * @param {Array} pixels data
   * @param {Array} colormap - not used
   * @param {number} width
   * @param {number} y_start - start at y pixel.
   * @param {number} x_start - start at x pixel.
   * @param {number} y_step  - increment y pixel each time.
   * @param {number} y_end   - stop at pixel y.
   * @param {number} x_step  - increment x pixel each time.
   * @param {number} x_end   - stop at pixel x.
   * @returns {Array} imageData
   * @private
   */
  _getImageData24bits(
    imageData,
    pixels,
    colormap,
    width,
    y_start,
    y_step,
    y_end,
    x_start,
    x_step,
    x_end
  ) {
    for (let i = 0, y = y_start; y !== y_end; y += y_step) {
      for (let x = x_start; x !== x_end; x += x_step, i += 3) {
        imageData[(x + width * y) * 4 + 3] = 255;
        imageData[(x + width * y) * 4 + 2] = pixels[i + 0];
        imageData[(x + width * y) * 4 + 1] = pixels[i + 1];
        imageData[(x + width * y) * 4 + 0] = pixels[i + 2];
      }
    }

    return imageData;
  }

  /**
   * Return a ImageData object from a TGA file (32bits)
   *
   * @param {Array} imageData - ImageData to bind
   * @param {Array} pixels data
   * @param {Array} colormap - not used
   * @param {number} width
   * @param {number} y_start - start at y pixel.
   * @param {number} x_start - start at x pixel.
   * @param {number} y_step  - increment y pixel each time.
   * @param {number} y_end   - stop at pixel y.
   * @param {number} x_step  - increment x pixel each time.
   * @param {number} x_end   - stop at pixel x.
   * @returns {Array} imageData
   * @private
   */
  _getImageData32bits(
    imageData,
    pixels,
    colormap,
    width,
    y_start,
    y_step,
    y_end,
    x_start,
    x_step,
    x_end
  ) {
    for (let i = 0, y = y_start; y !== y_end; y += y_step) {
      for (let x = x_start; x !== x_end; x += x_step, i += 4) {
        imageData[(x + width * y) * 4 + 2] = pixels[i + 0];
        imageData[(x + width * y) * 4 + 1] = pixels[i + 1];
        imageData[(x + width * y) * 4 + 0] = pixels[i + 2];
        imageData[(x + width * y) * 4 + 3] = pixels[i + 3];
      }
    }

    return imageData;
  }

  /**
   * Return a ImageData object from a TGA file (8bits grey)
   *
   * @param {Array} imageData - ImageData to bind
   * @param {Array} pixels data
   * @param {Array} colormap - not used
   * @param {number} width
   * @param {number} y_start - start at y pixel.
   * @param {number} x_start - start at x pixel.
   * @param {number} y_step  - increment y pixel each time.
   * @param {number} y_end   - stop at pixel y.
   * @param {number} x_step  - increment x pixel each time.
   * @param {number} x_end   - stop at pixel x.
   * @returns {Array} imageData
   * @private
   */
  _getImageDataGrey8bits(
    imageData,
    pixels,
    colormap,
    width,
    y_start,
    y_step,
    y_end,
    x_start,
    x_step,
    x_end
  ) {
    for (let i = 0, y = y_start; y !== y_end; y += y_step) {
      for (let x = x_start; x !== x_end; x += x_step, i++) {
        const color = pixels[i];
        imageData[(x + width * y) * 4 + 0] = color;
        imageData[(x + width * y) * 4 + 1] = color;
        imageData[(x + width * y) * 4 + 2] = color;
        imageData[(x + width * y) * 4 + 3] = 255;
      }
    }

    return imageData;
  }

  /**
   * Return a ImageData object from a TGA file (16bits grey)
   *
   * @param {Array} imageData - ImageData to bind
   * @param {Array} pixels data
   * @param {Array} colormap - not used
   * @param {number} width
   * @param {number} y_start - start at y pixel.
   * @param {number} x_start - start at x pixel.
   * @param {number} y_step  - increment y pixel each time.
   * @param {number} y_end   - stop at pixel y.
   * @param {number} x_step  - increment x pixel each time.
   * @param {number} x_end   - stop at pixel x.
   * @returns {Array} imageData
   * @private
   */
  _getImageDataGrey16bits(
    imageData,
    pixels,
    colormap,
    width,
    y_start,
    y_step,
    y_end,
    x_start,
    x_step,
    x_end
  ) {
    for (let i = 0, y = y_start; y !== y_end; y += y_step) {
      for (let x = x_start; x !== x_end; x += x_step, i += 2) {
        imageData[(x + width * y) * 4 + 0] = pixels[i + 0];
        imageData[(x + width * y) * 4 + 1] = pixels[i + 0];
        imageData[(x + width * y) * 4 + 2] = pixels[i + 0];
        imageData[(x + width * y) * 4 + 3] = pixels[i + 1];
      }
    }

    return imageData;
  }

  /**
   * Open a targa file using XHR, be aware with Cross Domain files...
   *
   * @param {string} path - Path of the filename to load
   * @param {function} callback - callback to trigger when the file is loaded
   * @public
   */
  open(path, callback) {
    const req = new XMLHttpRequest();
    req.responseType = 'arraybuffer';
    req.open('GET', path, true);
    req.onload = () => {
      if (this.status === 200) {
        this.load(new Uint8Array(req.response));
        if (callback) {
          callback();
        }
      }
    };
    req.send(null);
  }

  /**
   * Load and parse a TGA file
   *
   * @param {Uint8Array} data - TGA file buffer array
   * @public
   */
  load(data) {
    let offset = 0;

    // Not enough data to contain header ?
    if (data.length < 0x12) {
      throw new Error('Not enough data to contain header');
    }

    // Read TgaHeader
    const header = {
      /* 0x00  BYTE */ idLength: data[offset++],
      /* 0x01  BYTE */ colorMapType: data[offset++],
      /* 0x02  BYTE */ imageType: data[offset++],
      /* 0x03  WORD */ colorMapIndex: data[offset++] | (data[offset++] << 8),
      /* 0x05  WORD */ colorMapLength: data[offset++] | (data[offset++] << 8),
      /* 0x07  BYTE */ colorMapDepth: data[offset++],
      /* 0x08  WORD */ offsetX: data[offset++] | (data[offset++] << 8),
      /* 0x0a  WORD */ offsetY: data[offset++] | (data[offset++] << 8),
      /* 0x0c  WORD */ width: data[offset++] | (data[offset++] << 8),
      /* 0x0e  WORD */ height: data[offset++] | (data[offset++] << 8),
      /* 0x10  BYTE */ pixelDepth: data[offset++],
      /* 0x11  BYTE */ flags: data[offset++],
    };

    // Set shortcut
    header.hasEncoding =
      header.imageType === TYPE_RLE_INDEXED ||
      header.imageType === TYPE_RLE_RGB ||
      header.imageType === TYPE_RLE_GREY;
    header.hasColorMap =
      header.imageType === TYPE_RLE_INDEXED ||
      header.imageType === TYPE_INDEXED;
    header.isGreyColor =
      header.imageType === TYPE_RLE_GREY || header.imageType === TYPE_GREY;

    // Check if a valid TGA file (or if we can load it)
    this.header = header;
    this._checkHeader();

    // Move to data
    offset += header.idLength;
    if (offset >= data.length) {
      throw new Error('No data');
    }

    // Read palette
    if (header.hasColorMap) {
      const colorMapSize = header.colorMapLength * (header.colorMapDepth >> 3);
      this.palette = data.subarray(offset, offset + colorMapSize);
      offset += colorMapSize;
    }

    const pixelSize = header.pixelDepth >> 3;
    const imageSize = header.width * header.height;
    const pixelTotal = imageSize * pixelSize;

    if (header.hasEncoding) {
      // RLE encoded
      this.imageData = this._decodeRLE(data, offset, pixelSize, pixelTotal);
    } else {
      // RAW pixels
      this.imageData = data.subarray(
        offset,
        offset + (header.hasColorMap ? imageSize : pixelTotal)
      );
    }
  }

  /**
   * Return a ImageData object from a TGA file
   *
   * @param {object} imageData - Optional ImageData to work with
   * @returns {object} imageData
   */
  getImageData(imageData) {
    const { width, height, flags, pixelDepth, isGreyColor } = this.header;
    const origin = (flags & ORIGIN_MASK) >> ORIGIN_SHIFT;
    let x_start, x_step, x_end, y_start, y_step, y_end;
    let getImageData;

    // Create an imageData
    if (!imageData) {
      if (document) {
        imageData = document
          .createElement('canvas')
          .getContext('2d')
          .createImageData(width, height);
      }
      // In Thread context ?
      else {
        imageData = {
          width: width,
          height: height,
          data: new Uint8ClampedArray(width * height * 4),
        };
      }
    }

    if (origin === ORIGIN_TOP_LEFT || origin === ORIGIN_TOP_RIGHT) {
      y_start = 0;
      y_step = 1;
      y_end = height;
    } else {
      y_start = height - 1;
      y_step = -1;
      y_end = -1;
    }

    if (origin === ORIGIN_TOP_LEFT || origin === ORIGIN_BOTTOM_LEFT) {
      x_start = 0;
      x_step = 1;
      x_end = width;
    } else {
      x_start = width - 1;
      x_step = -1;
      x_end = -1;
    }

    // TODO: use this.header.offsetX and this.header.offsetY ?

    switch (pixelDepth) {
      case 8:
        getImageData = isGreyColor
          ? this._getImageDataGrey8bits
          : this._getImageData8bits;
        break;

      case 16:
        getImageData = isGreyColor
          ? this._getImageDataGrey16bits
          : this._getImageData16bits;
        break;

      case 24:
        getImageData = this._getImageData24bits;
        break;

      case 32:
        getImageData = this._getImageData32bits;
        break;
    }

    getImageData.call(
      this,
      imageData.data,
      this.imageData,
      this.palette,
      width,
      y_start,
      y_step,
      y_end,
      x_start,
      x_step,
      x_end
    );

    return imageData;
  }

  /**
   * Return a canvas with the TGA render on it
   *
   * @returns {object} CanvasElement
   */
  getCanvas() {
    const { width, height } = this.header;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);

    canvas.width = width;
    canvas.height = height;

    ctx.putImageData(this.getImageData(imageData), 0, 0);

    return canvas;
  }

  /**
   * Return a dataURI of the TGA file
   *
   * @param {string?} type - Optional image content-type to output (default: image/png)
   * @returns {string} url
   */
  getDataURL(type) {
    return this.getCanvas().toDataURL(type || 'image/png');
  }
}
