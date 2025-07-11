import e from "path";
import { fileURLToPath as a } from "url";
import { app as o, screen as s, BrowserWindow as d } from "electron";
const l = a(import.meta.url), t = e.dirname(l);
let i;
const r = { width: 400, height: 500 };
function h() {
  const n = s.getPrimaryDisplay(), { width: p, height: w } = n.workAreaSize;
  i = new d({
    width: r.width,
    height: r.height,
    frame: !0,
    transparent: !1,
    alwaysOnTop: !1,
    roundedCorners: !0,
    hasShadow: !0,
    resizable: !0,
    icon: e.join(t, "assets", "logo.ico"),
    webPreferences: {
      preload: e.join(t, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0
    }
  }), i.setMenu(null), i.loadFile(e.join(t, "../dist/index.html"));
}
o.whenReady().then(h);
o.on("window-all-closed", () => {
  process.platform !== "darwin" && o.quit();
});
