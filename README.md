## 自己署名証明書の作成（HTTPS 用）

mkdir cert
openssl req -x509 -newkey rsa:2048 -nodes -keyout cert/key.pem -out cert/cert.pem -days 365

• Common Name は localhost
できるファイル：
cert/
├── localhost-key.pem ← 鍵
└── localhost-cert.pem ← 証明書

##next.config.js の設定（HTTPS アクセス許可）
/\*_ @type {import('next').NextConfig} _/
const nextConfig = {
reactStrictMode: true,
experimental: {
appDir: true
}
};

module.exports = nextConfig;

##環境変数の設定（.env.local）
NEXT_PUBLIC_CLIENT_ID=rakutenmusic
NEXT_PUBLIC_CLIENT_SECRET=1aed621ca6270d9488b0f411fdb590af74047b73e0c6639b037c05a2128cfcb2
NEXT_PUBLIC_AUTH_URL=https://md.syncpower.jp/authenticate/v1/token

##HTTPS 用ローカルサーバー（server.js）
// server.js

const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// 証明書を読み込み
const httpsOptions = {
key: fs.readFileSync('./cert/key.pem'),
cert: fs.readFileSync('./cert/cert.pem')
};

app.prepare().then(() => {
createServer(httpsOptions, (req, res) => {
const parsedUrl = parse(req.url, true);
handle(req, res, parsedUrl);
}).listen(3000, err => {
if (err) throw err;
console.log('> Ready on https://localhost:3000');
});
});

##起動方法

# 必要なパッケージをインストール

npm install

# 開発サーバー起動（https 対応）

node server.js

...
