# Runtime paths (this machine)

## Node modules — Codex runtime

All Node scripts in this project use packages from the Codex primary runtime.
Do NOT run `npm install` or search for global packages; they are unavailable.

```
CODEX_MODULES = C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules
```

### Playwright (CJS)
```js
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
```

### Sharp (ESM)
```js
const { default: sharp } = await import(
  pathToFileURL('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs').href
);
```

## Chrome executable
```
C:\Program Files\Google\Chrome\Application\chrome.exe
```

## ffmpeg (via imageio_ffmpeg)
```
C:\Users\user\AppData\Roaming\Python\Python314\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe
```

## Important: always use the published GitHub Pages URL

Local file:// URLs fail for 3D/WebGL apps that require a server context.
Use the `href` from the portfolio card directly (e.g. `https://yggdrasilw-spec.github.io/sonohoka/3d-ryokan/`).
Do NOT start a local HTTP server.
