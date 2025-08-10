// index.js
const axios = require("axios");
const { JSDOM } = require("jsdom");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const URL = "https://metin2alerts.com/store";

// Bildirim eşiği
const PRICE_MAX = 999;
let seen = new Set();

async function sendTelegram(title, body) {
    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: `*${title}*\n${body}`,
        parse_mode: "Markdown",
        disable_web_page_preview: true
    });
}

// Güncellendi: 10 Ağustos 2025

async function checkItems() {
    try {
        const res = await axios.get(URL, { timeout: 15000 });
        const dom = new JSDOM(res.data);
        const rows = dom.window.document.querySelectorAll("table tbody tr");
        
        rows.forEach(row => {
            const tds = row.querySelectorAll("td");
            if (tds.length < 7) return;

            const name = tds[1].textContent.trim();
            const qty = parseInt(tds[2].textContent.trim()) || 1;
            const yang = parseInt(tds[3].textContent.replace(/\D/g, "")) || 0;
            const seller = tds[5].textContent.trim();
            const category = tds[6].textContent.trim();

            if (yang >= PRICE_MAX) return;
            const key = `${name}|${yang}|${seller}|${qty}`;
            if (seen.has(key)) return;
            seen.add(key);

            const title = `💡 ${name}`;
            const msg = `Fiyat: ${yang} Yang\nSatıcı: ${seller}\nKategori: ${category}\nMiktar: ${qty}\nZaman: ${new Date().toLocaleString()}`;
            sendTelegram(title, msg);
        });

    } catch (err) {
        console.error("❌ Veri çekme hatası:", err.message);
    }
}

// 30 saniyede bir çalıştır
setInterval(checkItems, 30000);
console.log("✅ Bot başlatıldı!");
