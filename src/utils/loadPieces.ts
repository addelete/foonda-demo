const urls: Record<string, string> = [
  '00',
  '10',
  '20',
  '21',
  '22',
  '30',
  '31',
  '32',
  '33',
  '40',
  '41',
  '42',
  '50',
  '51',
  '52',
  '60',
  '61',
  '70',
  '80',
  '90',
].reduce((acc, key) => {
  acc[key] = `./pieces/${key}.png`;
  return acc;
}, {} as Record<string, string>);

const loaded = new Map<string, HTMLImageElement>();

async function loadPieces(): Promise<Map<string, HTMLImageElement>> {
  return new Promise((resolve) => {
    if (loaded.size !== Object.keys(urls).length) {
      let count = Object.keys(urls).length - loaded.size;
      for (const key in urls) {
        if (!loaded.has(key)) {
          const img = new Image();
          img.onload = () => {
            loaded.set(key, img);
            count--;
            if (count === 0) {
              return resolve(loaded);
            }
          };
          img.src = urls[key];
        }
      }
    } else {
      return resolve(loaded);
    }
  });
}

export default loadPieces;
