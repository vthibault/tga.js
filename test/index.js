import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';
import TgaLoader from '../src/tga';

const buffer = readFileSync(join(__dirname, 'test.tga'));
const data = new Uint8Array(buffer);

describe('tga', () => {
  const tga = new TgaLoader();
  tga.load(data);

  it('should load the image data', () => {
    expect(tga.imageData).to.exist;
  });

  it('should parse header', () => {
    expect(tga.header).to.deep.equal({
      idLength: 0,
      colorMapType: 0,
      imageType: 2,
      colorMapIndex: 0,
      colorMapLength: 0,
      colorMapDepth: 0,
      offsetX: 0,
      offsetY: 0,
      width: 256,
      height: 256,
      pixelDepth: 32,
      flags: 8,
      hasEncoding: false,
      hasColorMap: false,
      isGreyColor: false,
    });
  });
});

describe('tga colormap', () => {
  // 1x1 uncompressed colour-mapped image: two colormap entries of the given
  // size, then one pixel set to entry 1
  const getPixel = (colorMapDepth, colorMap) => {
    const header = [0, 1, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 8, 0x20];
    header[7] = colorMapDepth;

    const tga = new TgaLoader();
    tga.load(new Uint8Array(header.concat(colorMap, [1])));

    const imageData = { width: 1, height: 1, data: new Uint8Array(4) };
    return Array.from(tga.getImageData(imageData).data);
  };

  it('should read 15 and 16 bits colormap entries', () => {
    const red = [0x00, 0x00, 0x00, 0x7c];
    const blue = [0x00, 0x00, 0x1f, 0x00];
    expect(getPixel(15, red)).to.deep.equal([248, 0, 0, 255]);
    expect(getPixel(16, blue)).to.deep.equal([0, 0, 248, 255]);
  });

  it('should read 24 bits colormap entries', () => {
    const red = [0, 0, 0, 0, 0, 255];
    expect(getPixel(24, red)).to.deep.equal([255, 0, 0, 255]);
  });

  it('should read 32 bits colormap entries', () => {
    const green = [0, 0, 0, 0, 0, 255, 0, 255];
    expect(getPixel(32, green)).to.deep.equal([0, 255, 0, 255]);
  });
});
