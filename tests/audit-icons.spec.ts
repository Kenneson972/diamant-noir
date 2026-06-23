/**
 * Audit visuel des icônes — KayvilaPngIcon vs Lucide
 *
 * Lance: npx playwright test tests/audit-icons.spec.ts --project=audit
 * Pré-requis: serveur Next.js démarré (npm run dev ou PLAYWRIGHT_BASE_URL=https://...)
 * Credentials: TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD dans .env.local ou env
 */

import { test, type Page } from "@playwright/test";
import path from "path";
import fs from "fs";

const OUT_DIR = path.join(process.cwd(), "test-results", "icon-audit");

interface IconMeasure {
  src: string;
  w: number;
  h: number;
  x: number;
  y: number;
}

interface PageReport {
  url: string;
  label: string;
  icons: IconMeasure[];
  screenshot: string;
  error?: string;
}

const PAGES_PUBLIC = [
  { url: "/", label: "Homepage" },
  { url: "/villas", label: "Villas — liste" },
  { url: "/prestations", label: "Prestations" },
  { url: "/contact", label: "Contact" },
  { url: "/faq", label: "FAQ" },
  { url: "/qui-sommes-nous", label: "À propos" },
  { url: "/book", label: "Réservation" },
];

const PAGES_ADMIN = [
  { url: "/admin", label: "Admin — Dashboard" },
  { url: "/admin/villas", label: "Admin — Villas" },
  { url: "/admin/reservations", label: "Admin — Réservations" },
  { url: "/admin/proprietaires", label: "Admin — Propriétaires" },
  { url: "/admin/soumissions", label: "Admin — Soumissions" },
  { url: "/admin/clients", label: "Admin — Clients" },
  { url: "/admin/revenus", label: "Admin — Revenus" },
  { url: "/admin/sync-ota", label: "Admin — Sync OTA" },
  { url: "/admin/avis", label: "Admin — Avis" },
  { url: "/admin/concierge", label: "Admin — Concierge IA" },
  { url: "/admin/documents", label: "Admin — Documents" },
  { url: "/admin/messagerie", label: "Admin — Messagerie" },
];

const PAGES_DASHBOARD = [
  { url: "/dashboard", label: "Dashboard Proprio" },
  { url: "/dashboard/reservations", label: "Proprio — Réservations" },
  { url: "/dashboard/revenus", label: "Proprio — Revenus" },
  { url: "/dashboard/villas", label: "Proprio — Villas" },
  { url: "/dashboard/taches", label: "Proprio — Tâches" },
  { url: "/dashboard/messages", label: "Proprio — Messages" },
  { url: "/dashboard/concierge", label: "Proprio — Copilot" },
];

const PAGES_CLIENT = [
  { url: "/espace-client", label: "Espace Client" },
  { url: "/espace-client/conciergerie", label: "Espace Client — Conciergerie" },
];

// CSS : outline rouge + fond translucide sur toutes les icônes PNG
const HIGHLIGHT_CSS = `
  img[src*="icons-png"] {
    outline: 3px solid #ef4444 !important;
    outline-offset: 1px !important;
    background-color: rgba(239, 68, 68, 0.08) !important;
  }
`;

async function injectHighlight(page: Page) {
  await page.addStyleTag({ content: HIGHLIGHT_CSS });
}

async function injectSizeLabels(page: Page) {
  await page.evaluate(() => {
    const imgs = document.querySelectorAll<HTMLImageElement>('img[src*="icons-png"]');
    imgs.forEach((img) => {
      const rect = img.getBoundingClientRect();
      const label = document.createElement("span");
      label.textContent = `${Math.round(rect.width)}×${Math.round(rect.height)}`;
      label.style.cssText = `
        position: fixed;
        left: ${rect.left + window.scrollX}px;
        top: ${rect.top + window.scrollY - 16}px;
        background: #ef4444;
        color: white;
        font-size: 9px;
        font-weight: bold;
        padding: 1px 3px;
        border-radius: 2px;
        z-index: 99999;
        pointer-events: none;
        font-family: monospace;
        line-height: 1.2;
      `;
      document.body.appendChild(label);
    });
  });
}

async function measureIcons(page: Page): Promise<IconMeasure[]> {
  return page.evaluate(() => {
    const imgs = document.querySelectorAll<HTMLImageElement>('img[src*="icons-png"]');
    return Array.from(imgs)
      .filter((img) => {
        // Ignorer les éléments masqués (display:none, visibility:hidden, dans un parent hidden)
        const style = window.getComputedStyle(img);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
        // Vérifier aussi les parents
        let el: HTMLElement | null = img.parentElement;
        while (el) {
          const ps = window.getComputedStyle(el);
          if (ps.display === "none" || ps.visibility === "hidden") return false;
          el = el.parentElement;
        }
        return true;
      })
      .map((img) => {
        const rect = img.getBoundingClientRect();
        return {
          src: img.src.replace(/.*\/brand\/icons-png\//, ""),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          x: Math.round(rect.left),
          y: Math.round(rect.top),
        };
      });
  });
}

async function auditPage(
  page: Page,
  url: string,
  label: string,
  reports: PageReport[]
) {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const screenshotPath = path.join(OUT_DIR, `${slug}.png`);

  console.log(`\n⏳ ${label} (${url})`);

  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Si redirigé vers /login, noter et ignorer
    if (page.url().includes("/login")) {
      console.log(`  ⚠️  Redirigé → login (pas de credentials pour ce rôle)`);
      reports.push({ url, label, icons: [], screenshot: "", error: "requires-auth" });
      return;
    }

    if (response && response.status() >= 400) {
      console.log(`  ❌ HTTP ${response.status()}`);
      reports.push({ url, label, icons: [], screenshot: "", error: `HTTP ${response.status()}` });
      return;
    }

    await page.waitForTimeout(1500); // laisser les composants client hydrater

    await injectHighlight(page);
    const icons = await measureIcons(page);
    await injectSizeLabels(page);
    await page.waitForTimeout(200);

    await page.screenshot({ path: screenshotPath, fullPage: true });

    const small = icons.filter((i) => i.w < 18 || i.h < 18);
    console.log(`  ✅ ${icons.length} icône(s) PNG — ${small.length} trop petite(s) (<18px)`);
    if (icons.length > 0) {
      const sizes = [...new Set(icons.map((i) => `${i.w}px`))].join(", ");
      console.log(`     Tailles: ${sizes}`);
    }
    if (small.length > 0) {
      console.log(`     ⚠️  Petites: ${small.map((i) => `${i.src} (${i.w}×${i.h})`).join(", ")}`);
    }

    reports.push({ url, label, icons, screenshot: path.basename(screenshotPath) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ❌ Erreur: ${msg.slice(0, 120)}`);
    reports.push({ url, label, icons: [], screenshot: "", error: msg.slice(0, 200) });
  }
}

function generateReport(reports: PageReport[]) {
  const allIcons = reports.flatMap((r) => r.icons);
  const small = allIcons.filter((i) => i.w < 18);
  const bySize = allIcons.reduce<Record<number, number>>((acc, i) => {
    acc[i.w] = (acc[i.w] ?? 0) + 1;
    return acc;
  }, {});

  const rows = reports
    .map((r) => {
      const smallCount = r.icons.filter((i) => i.w < 18).length;
      const status = r.error
        ? `<span style="color:#888">${r.error}</span>`
        : smallCount > 0
        ? `<span style="color:#ef4444">⚠️ ${smallCount} trop petite(s)</span>`
        : r.icons.length === 0
        ? `<span style="color:#64748b">0 icône PNG</span>`
        : `<span style="color:#22c55e">✅ OK (${r.icons.length})</span>`;

      const thumb = r.screenshot
        ? `<img src="${r.screenshot}" style="max-width:320px;border:1px solid #e2e8f0;border-radius:6px" />`
        : "";

      const iconList = r.icons
        .map((i) => {
          const color = i.w < 18 ? "#ef4444" : i.w < 22 ? "#f59e0b" : "#22c55e";
          return `<span style="color:${color};font-family:monospace;font-size:11px;margin-right:6px">${i.src} <b>${i.w}×${i.h}</b></span>`;
        })
        .join("");

      return `<tr>
        <td style="padding:12px;font-weight:600;white-space:nowrap">${r.label}</td>
        <td style="padding:12px;font-size:12px;color:#64748b">${r.url}</td>
        <td style="padding:12px">${status}</td>
        <td style="padding:12px;font-size:12px">${iconList || "—"}</td>
        <td style="padding:12px">${thumb}</td>
      </tr>`;
    })
    .join("\n");

  const sizeDistrib = Object.entries(bySize)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([size, count]) => {
      const color = Number(size) < 18 ? "#ef4444" : Number(size) < 22 ? "#f59e0b" : "#22c55e";
      return `<span style="color:${color}"><b>${size}px</b>: ${count}×</span>`;
    })
    .join(" &nbsp; ");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Audit icônes — Kayvila</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1400px; margin: 0 auto; padding: 24px; background: #f8fafc; color: #0f172a; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .meta { color: #64748b; font-size: 14px; margin-bottom: 32px; }
    .summary { display: flex; gap: 24px; margin-bottom: 32px; flex-wrap: wrap; }
    .stat { background: white; border-radius: 10px; padding: 16px 24px; border: 1px solid #e2e8f0; }
    .stat-value { font-size: 32px; font-weight: 700; }
    .stat-label { font-size: 13px; color: #64748b; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    th { background: #0f172a; color: white; text-align: left; padding: 12px 16px; font-size: 13px; }
    tr:nth-child(even) { background: #f8fafc; }
    tr:hover { background: #f1f5f9; }
    .distrib { background: white; border-radius: 10px; padding: 16px 24px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
    .legend { font-size: 12px; color: #64748b; margin-top: 8px; }
  </style>
</head>
<body>
  <h1>🔍 Audit icônes PNG — Kayvila</h1>
  <p class="meta">Généré le ${new Date().toLocaleString("fr-FR")} · ${reports.length} pages auditées</p>

  <div class="summary">
    <div class="stat">
      <div class="stat-value">${allIcons.length}</div>
      <div class="stat-label">Icônes PNG détectées</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color:#ef4444">${small.length}</div>
      <div class="stat-label">Trop petites (&lt;18px)</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color:#22c55e">${allIcons.length - small.length}</div>
      <div class="stat-label">OK (≥18px)</div>
    </div>
    <div class="stat">
      <div class="stat-value">${reports.filter((r) => r.error).length}</div>
      <div class="stat-label">Pages en erreur/skip</div>
    </div>
  </div>

  <div class="distrib">
    <strong>Distribution des tailles</strong> &nbsp; ${sizeDistrib || "—"}
    <div class="legend">🔴 &lt;18px (trop petit) &nbsp; 🟡 18-21px (limite) &nbsp; 🟢 ≥22px (OK)</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Page</th><th>URL</th><th>Statut</th><th>Icônes détaillées</th><th>Screenshot</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  const reportPath = path.join(OUT_DIR, "report.html");
  fs.writeFileSync(reportPath, html, "utf-8");
  console.log(`\n📊 Rapport généré : ${reportPath}`);
  console.log(`   Ouvre : open "${reportPath}"`);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Audit icônes PNG", () => {
  const reports: PageReport[] = [];

  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  test.afterAll(() => {
    generateReport(reports);
  });

  test("Pages publiques", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const { url, label } of PAGES_PUBLIC) {
      await auditPage(page, url, label, reports);
    }
  });

  test("Pages admin (requiert TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD)", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL || process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD || process.env.TEST_USER_PASSWORD;

    await page.setViewportSize({ width: 1280, height: 900 });

    if (!email || !password) {
      console.log("⚠️  Variables TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD manquantes — pages admin ignorées");
      for (const { url, label } of PAGES_ADMIN) {
        reports.push({ url, label, icons: [], screenshot: "", error: "no-credentials" });
      }
      return;
    }

    // Login
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.locator("input[type='email'], input[name='email']").first().fill(email);
    await page.locator("input[type='password']").first().fill(password);
    await page.locator("button[type='submit']").first().click();
    await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 15000 });
    console.log("✅ Connecté en admin");

    for (const { url, label } of PAGES_ADMIN) {
      await auditPage(page, url, label, reports);
    }
  });

  test("Pages dashboard proprio (requiert TEST_OWNER_EMAIL + TEST_OWNER_PASSWORD)", async ({ page }) => {
    const email = process.env.TEST_OWNER_EMAIL;
    const password = process.env.TEST_OWNER_PASSWORD;

    await page.setViewportSize({ width: 1280, height: 900 });

    if (!email || !password) {
      console.log("⚠️  Variables TEST_OWNER_EMAIL / TEST_OWNER_PASSWORD manquantes — dashboard ignoré");
      for (const { url, label } of [...PAGES_DASHBOARD, ...PAGES_CLIENT]) {
        reports.push({ url, label, icons: [], screenshot: "", error: "no-credentials" });
      }
      return;
    }

    // Login proprio
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.locator("input[type='email'], input[name='email']").first().fill(email);
    await page.locator("input[type='password']").first().fill(password);
    await page.locator("button[type='submit']").first().click();
    await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 15000 });
    console.log("✅ Connecté en proprio");

    for (const { url, label } of [...PAGES_DASHBOARD, ...PAGES_CLIENT]) {
      await auditPage(page, url, label, reports);
    }
  });
});
