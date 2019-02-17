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
