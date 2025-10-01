##SourceTree で接続方法
・アカウントは https で作成
・token を github から取得してアカウントに貼り付ける

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
SYNCPOWER_CLIENT_ID=rakutenmusic
SYNCPOWER_CLIENT_SECRET=44e2b22ef16fb758b339b758514f7cee87ec6fa4e63759e78b365a42bab53895
NEXT_PUBLIC_BASE_URL=http://localhost:3000
OSHIRAKU_API_KEY=KEhaJea88BtBFOcT8vX3C1yljYhxkIce


Vercel の環境設定に下記を記述する
CLIENT_ID=rakutenmusic
CLIENT_SECRET=1aed621ca6270d9488b0f411fdb590af74047b73e0c6639b037c05a2128cfcb2
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

###ディレクトリ構造
/
├── app/
│ ├── api/
│ │ ├── auth/
│ │ │ └── route.js // アクセストークン取得 API
│ │ ├── image-proxy/
│ │ │ └── route.js // 画像プロキシ API
│ │ ├── interview-column/ // ★ 新規追加・統合 API Route
│ │ │ └── route.js // インタビュー・コラム統合 API
│ │ ├── music-news/
│ │ │ ├── [news_id]/
│ │ │ │ └── route.js // 個別音楽ニュース取得 API
│ │ │ └── route.js // 音楽ニュースリスト取得 API
│ │ ├── oshiraku-news/
│ │ │ └── route.js // 推し楽ニュース取得 API (OshirakuNewsList.js から直接は使われなくなったが、残っている可能性)
│ │ ├── static-news/
│ │ │ └── route.js // 静的ニュース取得 API (OshirakuNewsList.js から直接は使われなくなったが、残っている可能性)
│ │ └── today-what-day/
│ │ └── route.js // 今日は何の日取得 API
│ ├── components/
│ │ ├── parts/
│ │ │ └── TitleImage.js // タイトル画像コンポーネント
│ │ ├── InterviewColumnList.js // ★ 新規追加: インタビュー・コラム一覧表示用リストコンポーネント
│ │ ├── MusicNews.js // トップページの音楽ニュース表示コンポーネント
│ │ ├── MyImage.js // 画像表示（プロキシ・キャッシュ対応）コンポーネント
│ │ ├── OshirakuNewsList.js // ★ 改修済: トップページのインタビュー・コラム表示コンポーネント
│ │ └── TodayWhatDay.js // トップページの今日は何の日表示コンポーネント
│ ├── interview-column/ // ★ 新規追加: インタビュー・コラム関連ページ
│ │ └── all/
│ │ └── page.js // ★ 新規追加: インタビュー・コラム一覧ページ
│ ├── music-news/ // 音楽ニュース関連ページ
│ │ ├── [news_id]/
│ │ │ └── page.js // 音楽ニュース詳細ページ
│ │ ├── all/
│ │ │ └── page.js // 音楽ニュース一覧ページ
│ │ └── MusicNewsList.js // 音楽ニュース一覧表示用リストコンポーネント (all/page.js で使用)
│ ├── layout.js // ルートレイアウト
│ ├── page.js // トップページ
│ └── globals.css // グローバル CSS
├── config/
│ └── staticNewsUrls.json // 静的ニュースの URL 設定ファイル
├── public/
│ └── images/
│ └── img_title.png // タイトル画像ファイル
├── .env.local // 環境変数ファイル
├── next.config.js // Next.js 設定ファイル
├── package.json // プロジェクト設定ファイル
└── README.md // プロジェクト説明ファイル

##各スクリプトの処理内容

# app/api/auth/route.js

機能: SyncPower API の認証トークンを取得し、クライアントに提供します。
処理内容:
SyncPower API の認証エンドポイント (/auth/token) に対して、環境変数で設定されたクライアント ID とクライアントシークレットを使用して POST リクエストを送信します。
成功した場合、レスポンスからアクセストークンを抽出し、JSON 形式でクライアントに返します。
トークン取得に失敗した場合、エラーメッセージと共に適切な HTTP ステータスコード（例: 500）を返します。
CORS（Cross-Origin Resource Sharing）を許可するためのヘッダーを設定します。

# app/api/image-proxy/route.js

機能: 外部 URL の画像をプロキシ経由で取得し、Base64 エンコードしてクライアントに返します。認証が必要な画像 URL にも対応します。
処理内容:
クエリパラメータ url から外部画像の URL を取得します。
クエリパラメータ authorization から認証トークン（SyncPower API 用）を取得します。
取得した外部画像の URL に対して fetch リクエストを送信します。この際、authorization トークンが提供されていれば Authorization ヘッダーに設定します。
画像を ArrayBuffer として取得し、Buffer.from().toString('base64') で Base64 エンコードします。
画像の MIME タイプ（例: image/jpeg, image/png）を特定し、
data:MIME タイプ;base64,

の形式で Base64 データ URL を生成します。
生成したデータ URL を JSON 形式でクライアントに返します。
画像取得に失敗した場合、エラーメッセージと共に適切な HTTP ステータスコードを返します。

# app/api/interview-column/route.js

機能: 推し楽ニュースと楽天ミュージック（静的）記事を統合し、ページネーションに対応した形で提供します。
処理内容:
クエリパラメータ page と pageSize を取得します。
推し楽ニュースの取得:
推し楽 API の pageSize 上限（100 件）を考慮し、ループ処理で推し楽 API から利用可能な全ての記事をページを跨いで取得します。
取得した記事には id, type, sortDate (Date オブジェクト), displayDate (整形済み文字列) などの共通フォーマットを追加します。
静的記事の取得:
config/staticNewsUrls.json から全ての記事 URL を読み込みます。
各 URL に対して fetchAndParseStaticNews ヘルパー関数を呼び出し、記事内容をスクレイピングして取得します。
スクレイピング結果にも id, type, sortDate, displayDate などの共通フォーマットを追加します。特に日付情報の取得とパースを強化し、displayDate を生成します。
データの結合とソート:
推し楽記事と静的記事を一つの配列 allCombinedArticles に結合します。
sortDate フィールドを基に、全ての記事を公開日の新しい順にソートします。
ページング処理:
ソートされた allCombinedArticles に対して、クライアントから指定された page と pageSize に基づいて slice 処理を行い、該当するページの記事を抽出します。
レスポンス:
抽出された記事リスト (articles) と、結合された全記事の総件数 (total_count) を JSON 形式でクライアントに返します。
フェッチ中にエラーが発生した場合、エラーメッセージを含めて返します。

# app/api/music-news/[news_id]/route.js

機能: 特定の音楽ニュース記事の詳細情報を SyncPower API から取得し提供します。
処理内容:
URL パスパラメータ news_id からニュース記事の ID を取得します。
リクエストヘッダーから Authorization トークンを取得します。
SyncPower API の音楽ニュース詳細エンドポイント (/music-news/{news_id}) に対して、取得したトークンを Authorization ヘッダーに含めて GET リクエストを送信します。
成功した場合、取得したニュース詳細データを JSON 形式でクライアントに返します。
取得に失敗した場合、エラーメッセージと共に適切な HTTP ステータスコードを返します。

# app/api/music-news/route.js

機能: 音楽ニュースのリストを SyncPower API から取得し、提供します。
処理内容:
クエリパラメータ posted_at_from, offset, limit を取得します。
リクエストヘッダーから Authorization トークンを取得します。
SyncPower API の音楽ニュースリストエンドポイント (/music-news) に対して、取得したトークンとクエリパラメータを含めて GET リクエストを送信します。
成功した場合、取得したニュースリストデータを JSON 形式でクライアントに返します。
取得に失敗した場合、エラーメッセージと共に適切な HTTP ステータスコードを返します。

# app/api/oshiraku-news/route.js

機能: 推し楽 API からニュース記事を取得し、提供します。
処理内容:
クエリパラメータ page と pageSize を取得します。
推し楽 API エンドポイントに対して、環境変数で設定された API キーとクエリパラメータを含めて GET リクエストを送信します。
成功した場合、推し楽ニュースリストデータを JSON 形式でクライアントに返します。
取得に失敗した場合、エラーメッセージと共に適切な HTTP ステータスコードを返します。
注: 現在、app/api/interview-column/route.js が推し楽ニュースの取得を統合しているため、この API Route は直接は使用されていません。

# app/api/static-news/route.js

機能: config/staticNewsUrls.json に記載された URL から静的ニュース記事をスクレイピングし、提供します。
処理内容:
config/staticNewsUrls.json から記事 URL のリストを読み込みます。
各 URL に対して HTTP リクエストを送信し、HTML コンテンツを取得します。
cheerio を使用して HTML を解析し、タイトル、説明、公開日、サムネイル画像 URL などの情報を抽出します。
抽出した記事データを JSON 形式でクライアントに返します。
読み込みやスクレイピングに失敗した場合、エラーメッセージと共に適切な HTTP ステータスコードを返します。
注: 現在、app/api/interview-column/route.js が静的ニュースの取得を統合しているため、この API Route は直接は使用されていません。

# app/api/today-what-day/route.js

機能: SyncPower API から「今日は何の日」の情報を取得し、提供します。
処理内容:
クエリパラメータ day (月日) と article_type を取得します。
リクエストヘッダーから Authorization トークンを取得します。
SyncPower API の「今日は何の日」エンドポイント (/what-day) に対して、取得したトークンとクエリパラメータを含めて GET リクエストを送信します。
成功した場合、取得したデータを JSON 形式でクライアントに返します。
取得に失敗した場合、エラーメッセージと共に適切な HTTP ステータスコードを返します。

# app/components/parts/TitleImage.js

機能: アプリケーション内で共通して使用されるタイトル横のアイコン画像を表示します。
処理内容:
next/image コンポーネントを使用して、/images/img_title.png を表示します。
固定の width と height、alt テキストが設定されています。
app/components/InterviewColumnList.js
機能: インタビュー・コラム記事のリストを MUI コンポーネントで表示します。主に app/

# interview-column/all/page.js で使用されます。

処理内容:
親コンポーネントから page, pageSize, onTotalArticlesChange プロップを受け取ります。
useEffect フック内で、/api/interview-column API Route に対して page と pageSize を含めて記事リストをフェッチします。
フェッチ中は LinearProgress を表示します。
取得した記事データを List, ListItem, ListItemText, CardMedia (サムネイル画像), Chip (記事タイプバッジ) などの MUI コンポーネントを使って整形して表示します。
各記事は next/link を使って外部 URL (article.url) にリンクします。
API から取得した total_count を onTotalArticlesChange コールバックを通じて親コンポーネントに伝えます。
エラーが発生した場合や記事がない場合は、適切なメッセージを表示します。

# app/components/MusicNews.js

機能: トップページに最新の音楽ニュースを表示します。
処理内容:
親コンポーネントから accessToken をプロップとして受け取ります。
useEffect フック内で、/api/music-news API Route に対して今日のニュースを offset=0, limit=5 でフェッチします。
フェッチ中はローディングメッセージを表示します。
取得した音楽ニュースを List, ListItem, ListItemText, MyImage (サムネイル画像) などの MUI コンポーネントを使って表示します。
各ニュースは next/link を使って音楽ニュース詳細ページ (/music-news/{news_id}) にリンクします。
ニュースが 5 件より多い場合、「最新ニュースをもっと見る」ボタンを表示し、app/music-news/all/page.js にリンクします。
エラーが発生した場合やニュースがない場合は、適切なメッセージを表示します。
app/components/MyImage.js
機能: 外部 URL の画像を安全に表示し、ローカルストレージでキャッシュする汎用画像コンポーネントです。
処理内容:
imageUrl, accessToken, alt, width, height プロップを受け取ります。
useEffect フック内で loadImage 関数を呼び出し、画像をロードします。
画像をロードする前に、localStorage にキャッシュされているか確認します。キャッシュがあり、有効期限内であればそれを使用します。
キャッシュがない、または期限切れの場合は、/api/image-proxy API Route に対して imageUrl と accessToken を含めてリクエストし、Base64 データ URL として画像を取得します。
取得した Base64 データを localStorage に保存します（容量制限を考慮）。
ロード中は MUI の Skeleton を表示します。
画像が取得できたら next/image コンポーネントに Base64 データ URL を渡して表示します（この際、unoptimized={true} で Next.js の最適化はオフにしています）。
エラーが発生した場合は、エラーメッセージを表示します。

# app/components/OshirakuNewsList.js

機能: トップページに最新のインタビュー・コラム記事（推し楽＆楽天ミュージック）を表示します。
処理内容:
useEffect フック内で、/api/interview-column API Route に対して page=1, pageSize=10 を含めて記事リストをフェッチします。
フェッチ中は CircularProgress を表示します。
取得した記事データを List, ListItem, ListItemText, CardMedia (サムネイル画像), Chip (記事タイプバッジ) などの MUI コンポーネントを使って整形して表示します。
各記事は next/link を使って外部 URL (article.url) にリンクします。
API から取得した total_count を基に、表示件数 (DISPLAY_LIMIT=10) より総件数が多ければ、「インタビュー・コラムをもっと見る」ボタンを表示し、app/interview-column/all/page.js にリンクします。
エラーが発生した場合や記事がない場合は、適切なメッセージを表示します。

# app/components/TodayWhatDay.js

機能: トップページに「今日は何の日」の情報を表示します。
処理内容:
親コンポーネントから accessToken をプロップとして受け取ります。
コンポーネントマウント時に今日の日付を取得し、「MM 月 DD 日」形式で表示します。
useEffect フック内で、accessToken が利用可能になったら /api/today-what-day API Route に対して今日の日付と固定の article_type を含めて情報をフェッチします。
フェッチ中は CircularProgress を表示します。
取得した情報を MUI の Accordion コンポーネントを使って表示します。各アコーディオンにはタイトルが表示され、展開するとアーティスト名、記事ノートなどの詳細が表示されます。
エラーが発生した場合やデータがない場合は、適切なメッセージを表示します。

# app/interview-column/all/page.js

機能: インタビュー・コラム記事の一覧ページで、ページネーションを制御します。
処理内容:
useState で現在のページ番号 (currentPage) と総記事数 (totalArticles) を管理します。
useEffect で localStorage から前回のページ番号を読み込み、currentPage を初期化します。
handlePageChange 関数でページネーションの変更イベントを処理し、currentPage を更新し、localStorage に保存します。ページ変更時には画面トップにスクロールします。
InterviewColumnList コンポーネントをレンダリングし、page, pageSize プロップを渡します。また、InterviewColumnList から totalArticles を受け取るための onTotalArticlesChange コールバックも渡します。
MUI の Pagination コンポーネントをレンダリングし、totalArticles を基に計算した総ページ数 (count) を設定します。
上部に固定されたナビゲーションヘッダー（戻るボタンとタイトル）を表示します。

# app/music-news/[news_id]/page.js

機能: 特定の音楽ニュース記事の詳細ページを表示します。
処理内容:
useRouter から news_id パラメータを取得します。
1 つ目の useEffect で、/api/auth API Route からアクセストークンを独立して取得します。
2 つ目の useEffect で、取得したアクセストークンと news_id を使用して /api/music-news/{news_id} API Route からニュース詳細をフェッチします。
フェッチ中は LinearProgress を表示します。
取得したニュース詳細データ（タイトル、投稿日、ジャンル、画像、本文など）を MUI の Typography, Chip, MyImage などを使って表示します。
ニュース本文は dangerouslySetInnerHTML を使用して HTML としてレンダリングします。
上部に固定されたナビゲーションヘッダー（戻るボタンとニュースタイトル）を表示します。
エラーが発生した場合は、エラーメッセージと「戻る」ボタンを表示します。

# app/music-news/all/page.js

機能: 全ての音楽ニュース記事の一覧ページで、ページネーションを制御します。
処理内容:
useState で現在のページ番号 (currentPage) を管理します。
useEffect で localStorage から前回のページ番号を読み込み、currentPage を初期化します。
handlePageChange 関数でページネーションの変更イベントを処理し、currentPage を更新し、localStorage に保存します。
MusicNewsList コンポーネントをレンダリングし、offset と limit プロップを渡します（offset は (currentPage - 1) \* PAGE_SIZE で計算）。
MUI の Pagination コンポーネントをレンダリングし、ハードコードされた総ページ数 (count=10) を設定します。
上部に固定されたナビゲーションヘッダー（戻るボタンとタイトル）を表示します。
app/music-news/MusicNewsList.js
機能: 音楽ニュース記事のリストを MUI コンポーネントで表示します。主に app/music-news/all/page.js で使用されます。
処理内容:
親コンポーネントから offset と limit プロップを受け取ります。
useEffect フック内で、/api/auth からアクセストークンを取得し、その後 /api/music-news API Route に対して offset と limit を含めて記事リストをフェッチします。
フェッチ中は LinearProgress を表示します。
取得した音楽ニュースを List, ListItem, ListItemText, MyImage (コメントアウトされているが、サムネイル画像表示用) などの MUI コンポーネントを使って整形して表示します。
各ニュースは next/link を使って音楽ニュース詳細ページ (/music-news/{news_id}) にリンクします。
エラーが発生した場合やニュースがない場合は、適切なメッセージを表示します。
app/layout.js
機能: Next.js アプリケーションのルートレイアウトを定義します。
処理内容:
HTML の <html> および <body> タグをラップします。
head 要素内にメタデータ（例: title, description）を設定します。
子コンポーネント（ページコンテンツ）をレンダリングします。
アプリケーション全体に適用される共通の CSS (globals.css) をインポートします。
app/page.js
機能: アプリケーションのトップページ（ホームページ）を構成します。
処理内容:
accessToken を管理するステートを持ちます。
useEffect フック内で、/api/auth API Route からアクセストークンを取得します。
アクセストークンが取得できたら、MusicNews, TodayWhatDay, OshirakuNewsList といった主要なコンポーネントをレンダリングし、accessToken をプロップとして渡します。
アクセストークン取得中はローディング状態を表示します。
各セクションの間に Divider を配置し、視覚的な区切りを設けます。
app/globals.css
機能: アプリケーション全体に適用されるグローバルなスタイルを定義します。
処理内容:
基本的な CSS リセットや、フォント、背景色など、アプリケーション全体の共通スタイルを記述します。
config/staticNewsUrls.json
機能: 楽天ミュージックの静的ニュース記事の URL リストを JSON 形式で保持します。
処理内容:
app/api/interview-column/route.js (および旧 app/api/static-news/route.js) がこのファイルを読み込み、記載された URL から記事内容をスクレイピングします。
その他
.env.local: 環境変数を設定するファイル（例: SyncPower API キー、推し楽 API キーなど）。
next.config.js: Next.js のビルド設定や、画像最適化、リダイレクトなどの設定を行うファイル。
package.json: プロジェクトのメタデータ、依存関係、スクリプトなどを定義するファイル。
