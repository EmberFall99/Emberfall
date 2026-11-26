// Encode image literals into MakeCode's asset format using pxt's own functions.
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
require(require.resolve('pxt-core/built/pxt.js', { paths: [__dirname, process.cwd()] }));
const p = global.pxt;
const input = JSON.parse(fs.readFileSync(path.join(dir, 'assets_in.json'), 'utf8'));
const jres = {};
let n = 0;
for (const [name, lit] of Object.entries(input.images)) {
    const bmp = p.sprite.imageLiteralToBitmap(lit);
    jres['image' + (++n)] = { data: p.sprite.base64EncodeBitmap(bmp.data()), mimeType: p.IMAGE_MIME_TYPE, displayName: name };
}
let a = 0;
for (const [name, [frames, interval]] of Object.entries(input.animations)) {
    const bitmaps = frames.map(f => p.sprite.imageLiteralToBitmap(f).data());
    jres['anim' + (++a)] = {
        namespace: p.sprite.ANIMATION_NAMESPACE, id: 'anim' + a, mimeType: p.ANIMATION_MIME_TYPE,
        data: p.sprite.encodeAnimationString(bitmaps, interval), displayName: name
    };
}
jres['*'] = { mimeType: 'image/x-mkcd-f4', dataEncoding: 'base64', namespace: p.sprite.IMAGES_NAMESPACE };
fs.writeFileSync(path.join(dir, 'images.g.jres'), JSON.stringify(jres));
fs.writeFileSync(path.join(dir, 'images.g.ts'), p.emitProjectImages(jres));
console.log('encoded', n, 'images and', a, 'animations; namespace for animations:', p.sprite.ANIMATION_NAMESPACE);
