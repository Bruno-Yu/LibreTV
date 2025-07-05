const express = require('express');
const app = express();

app.all(/^\/proxy(?:\/(.*))?$/, async (req, res) => {
  // 取得原始 URL
  const match = req.originalUrl.match(/^\/proxy\/(.+)$/);
  if (!match) {
    res.status(400).send('請帶上目標網址');
    return;
  }
  const url = decodeURIComponent(match[1]);
  if (!/^https?:\/\//.test(url)) {
    return res.status(400).send('Invalid target URL');
  }
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, {
      headers: { 'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0' }
    });
    res.status(response.status);
    for (const [key, value] of response.headers.entries()) {
      if (['content-type', 'content-length', 'cache-control'].includes(key)) {
        res.setHeader(key, value);
      }
    }
    const data = await response.buffer();
    res.send(data);
  } catch (err) {
    res.status(500).send('Proxy error: ' + err.message);
  }
});

// 靜態檔案服務（可選，讓你直接用 http://localhost:3000 開網頁）
app.use(express.static('.'));

const port = 3000;
app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});