const https = require('https');

https.get('https://slam-attach-61841687.figma.site/_components/v2/b08eb56f33d6eab41ae6a4471e9814951f5995fe.js', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const strings = data.match(/(?:"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')/g);
    if (strings) {
      const uniqueStrings = [...new Set(strings)].filter(s => s.length > 10 && s.length < 100);
      console.log(uniqueStrings.slice(0, 50).join('\n'));
    }
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
