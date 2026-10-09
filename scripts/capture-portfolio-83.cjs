const fs = require('fs'), path = require('path'), http = require('http');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= 'C:/Users/user/AppData/Local/ms-playwright';
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const appRoot = process.env.KANJI_HINT_ROOT || 'C:/Users/user/kanji-hint-drill';
const directory = path.join(root, '.portfolio-work/demo-83');
const mime = {'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.mp4':'video/mp4'};
function serve() {
  return http.createServer((req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const base = pathname.startsWith('/app/') ? appRoot : root;
      const relative = pathname.startsWith('/app/') ? pathname.slice(5) : pathname.slice(1);
      const file = path.resolve(base, relative || 'index.html');
      if (!file.startsWith(path.resolve(base) + path.sep)) throw Error('Invalid path');
      res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
      res.end(fs.readFileSync(file));
    } catch { res.statusCode = 404; res.end(); }
  });
}
async function main() {
  fs.mkdirSync(directory, {recursive:true});
  const server = serve(); await new Promise(r => server.listen(8958, '127.0.0.1', r));
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    const context = await browser.newContext({viewport:{width:1280,height:640}, recordVideo:{dir:directory,size:{width:1280,height:640}}});
    const page = await context.newPage(); const errors = []; let storyboard;
    // Stable sample question without changing curriculum or app behavior.
    await page.addInitScript(() => { Math.random = () => 0.5; });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:8958/app/index.html', {waitUntil:'domcontentloaded'});
    await page.locator('#start').waitFor({state:'attached'});
    await page.waitForFunction(() => !document.getElementById('start').disabled);
    await page.evaluate(() => {document.body.style.zoom = '.65'; document.querySelector('main').style.maxWidth = '1800px';});
    await page.screenshot({path:path.join(directory,'setup.png')});
    if (process.argv.includes('--inspect')) {
      await page.locator('#start').click(); await page.waitForTimeout(800);
      await page.evaluate(() => window.scrollTo({top:100,behavior:'instant'}));
      await page.screenshot({path:path.join(directory,'inspect.png')});
      console.log(await page.locator('#drillView').innerText());
    } else {
      await page.locator('#modelStatus').filter({hasText:'手書きの自動判定が使えます。'}).waitFor({timeout:60000});
      await page.locator('#start').scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const segments = [];
      async function hold(index, duration = 2200) {
        segments.push(await page.evaluate(() => performance.now() / 1000));
        await page.waitForTimeout(150);
        await page.screenshot({path:path.join(directory,`frame-0${index}.png`)});
        await page.waitForTimeout(duration);
      }
      await hold(0);
      await page.locator('#start').click(); await page.waitForTimeout(700);
      await page.evaluate(() => window.scrollTo({top:100,behavior:'instant'}));
      await hold(1);
      await page.locator('#hint').click();
      await hold(2);
      const canvas = await page.locator('#canvas').boundingBox();
      const points = await page.locator('#guide path').first().evaluate(p => {
        const length = p.getTotalLength();
        return Array.from({length:40}, (_,i) => {const q=p.getPointAtLength(length*i/39);return {x:q.x,y:q.y};});
      });
      await page.mouse.move(canvas.x + points[0].x/109*canvas.width, canvas.y + points[0].y/109*canvas.height);
      await page.mouse.down();
      for (const p of points) {await page.mouse.move(canvas.x+p.x/109*canvas.width,canvas.y+p.y/109*canvas.height);await page.waitForTimeout(18);}
      await page.mouse.up();
      await hold(3);
      await page.locator('#check').click();
      await page.waitForFunction(() => document.getElementById('feedback').textContent.includes('正解！'), {timeout:15000});
      await hold(4);
      const data = {id:83,title:'ひとふでヒント',url:'https://yggdrasilw-spec.github.io/kanji-hint-drill/',localUrl:'http://127.0.0.1:8958/app/index.html',segments,durations:[1.5,1.5,2.5,2,2],captions:['学年と練習する漢字を選んでスタート','ひとふでのヒントを見て、漢字を書く','書けた漢字を確かめて、次の練習へ'],capture:{viewport:[1280,640],zoom:0.65,question:'一',story:'単元選択 → 問題 → 一画ヒント → 手書き → 正解'}};
      storyboard = data;
      console.log('RECORDED 83',await page.locator('#feedback').innerText());
    }
    const endTime = await page.evaluate(() => performance.now()/1000);
    const video = page.video(); await context.close(); await video.saveAs(path.join(directory,'source.webm'));
    if (storyboard) {
      // The recorder starts with the first browser frame, after navigation's time origin.
      const ffmpeg = 'C:/Users/user/AppData/Roaming/Python/Python314/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe';
      const probe = require('child_process').spawnSync(ffmpeg,['-hide_banner','-i',path.join(directory,'source.webm')],{encoding:'utf8'});
      const match = probe.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
      if (!match) throw Error('Cannot calibrate recording timestamps');
      const duration = Number(match[1])*3600+Number(match[2])*60+Number(match[3]);
      storyboard.recordedSegments = storyboard.segments;
      storyboard.recordingOffsetSeconds = endTime-duration;
      storyboard.segments = storyboard.recordedSegments.map(t=>Math.max(0,t-storyboard.recordingOffsetSeconds));
      fs.writeFileSync(path.join(directory,'storyboard.json'),JSON.stringify(storyboard,null,2));
      fs.writeFileSync(path.join(__dirname,'portfolio-demos-83.json'),JSON.stringify([storyboard],null,2)+'\n');
    }
    if (errors.length) throw Error(errors.join('; '));
  } finally { await browser.close(); server.close(); }
}
if (require.main === module) main().catch(e => {console.error(e);process.exitCode=1;});
module.exports = {serve};
