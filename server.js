const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const fs = require('fs');
const axios = require('axios');

// Ma'lumotlar bazasi boshlang'ich holati
let users = [];
let referrals = {};
let userStep = {};
let orders = {};
let balances = {};
let stats = { users: 0, orders: 0, income: 0 };

// ⚙️ ASOSIY SOZLAMALAR
const CARD_NUMBER = '9860350144650842';
const CARD_NAME = 'ODILJON OCHILOV';
const ADMIN_ID = 8782481713; 
const REQUIRED_CHANNEL = '@xabarlar24uzbekiston';

// 🔥 USTAMA FOIZI (25% foiz qo'shish uchun 1.25 deb belgilanadi)
const PROFIT_PERCENT = 1.25;

// 🌐 TIYLI TIZIM (API) SOZLAMALARI
const TOPSMM_API_URL = 'https://topsmm.uz/api/v2';
const TOPSMM_API_KEY = 'f1152704a5c99b2877ec57ad6b53f892'; 

let ALL_SERVICES = [];
let CATEGORIES = [];

// 🔄 API bilan moslashtirilgan xavfsiz POST ulanish funksiyasi
async function topsmmRequest(params) {
    try {
        const urlParams = new URLSearchParams();
        for (const key in params) {
            urlParams.append(key, params[key]);
        }

        const response = await axios.post(TOPSMM_API_URL, urlParams, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0)'
            }
        });
        return response.data;
    } catch (err) {
        console.error("❌ Tizim API ulanish xatosi:", err.message);
        return null;
    }
}

// 🔄 API dan barcha xizmatlarni yuklash va kategoriyalarni ajratish
async function loadServices() {
    const data = await topsmmRequest({
        key: TOPSMM_API_KEY,
        action: 'services'
    });

    if (Array.isArray(data)) {
        ALL_SERVICES = data;
        CATEGORIES = [...new Set(ALL_SERVICES.map(x => x.category))];
        console.log(`✅ Tizimga ${ALL_SERVICES.length} ta xizmat va ${CATEGORIES.length} ta kategoriya muvaffaqiyatli yuklandi!`);
    } else {
        console.log("⚠️ Xizmatlarni yuklash formati noto'g'ri yoki API kalit xato.");
    }
}

// ⚡️ KIRISH MATNI
const WELCOME_TEXT = `⚡️ ASSALOM ALAYKUM!

Eng yaxshi xizmatlarini taqdim etuvchi bot.
Ushbu xizmatlarning barchasini «SMM.ADMIN» botida ko'rishingiz mumkin.

Har qanday vaqtda muammolaringizni hal qilish uchun:
✅ Eng ko'p xizmatlar soni
✅ Eng past bozor narxi
✅ Eng yaxshi yordam jamoasi

👨‍💻 ADMIN: @SMM_adminMAX
📞 Tel: +998(93)409-06-06

Quyidagi bo'limlardan birini tanlang 👇`;

// 📂 Fayllarni yuklash va saqlash funksiyalari
const safeReadJSON = (filename, defaultVal) => {
    if (fs.existsSync(filename)) {
        try { return JSON.parse(fs.readFileSync(filename, 'utf8')); } catch(e) { return defaultVal; }
    }
    return defaultVal;
};

const safeWriteJSON = (filename, data) => {
    try { fs.writeFileSync(filename, JSON.stringify(data, null, 2)); } catch (e) { console.error(`Fayl yozishda xatolik: ${filename}`, e); }
};

orders = safeReadJSON('orders.json', {});
users = safeReadJSON('users.json', []);
referrals = safeReadJSON('referrals.json', {});
balances = safeReadJSON('balances.json', {});
stats = safeReadJSON('stats.json', { users: 0, orders: 0, income: 0 });

// 🤖 Botni sozlash
const token = process.env.BOT_TOKEN || '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';
const bot = new TelegramBot(token, { polling: true });

loadServices();
setInterval(loadServices, 60 * 60 * 1000);

// 🔄 AVTOMATIK BUYURTMA STATUSLARINI TEKSHIRISH FUNKSIYASI
async function checkAllOrdersStatus() {
    console.log("🔄 Aktiv buyurtmalar statusi tekshirilmoqda...");
    let statusOzgardi = false;

    for (let orderId in orders) {
        let order = orders[orderId];
        
        if (order.apiOrderId && !['Completed', 'Canceled', 'Partial', 'Yakunlandi', 'Bekor qilindi'].includes(order.status)) {
            const checkStatus = await topsmmRequest({
                key: TOPSMM_API_KEY,
                action: 'status',
                order: order.apiOrderId
            });

            if (checkStatus && checkStatus.status) {
                let oldStatus = order.status;
                let newStatus = checkStatus.status;

                if (newStatus === 'Completed') newStatus = 'Yakunlandi';
                if (newStatus === 'Canceled') newStatus = 'Bekor qilindi';
                if (newStatus === 'Pending') newStatus = 'Kutilmoqda';
                if (newStatus === 'In progress') newStatus = 'Bajarilmoqda';
                if (newStatus === 'Processing') newStatus = 'Ishlov berilmoqda';
                if (newStatus === 'Partial') newStatus = 'Qisman bajarildi';

                if (oldStatus !== newStatus) {
                    orders[orderId].status = newStatus;
                    statusOzgardi = true;

                    let msgText = `🔔 *BUYURTMA STATUSI O'ZGARDI!*\n\n`;
                    msgText += `🆔 *Bot ID:* \`${orderId}\`\n`;
                    msgText += `📋 *Xizmat:* ${order.serviceName.replace(/[*_`]/g, '\\$&')}\n`;
                    msgText += `📦 *Miqdor:* ${order.count} ta\n`;
                    
                    if (newStatus === 'Yakunlandi') {
                        msgText += `✅ *Holati:* ${newStatus}. Buyurtmangiz to'liq bajarildi! Rahmat!`;
                    } else if (newStatus === 'Bekor qilindi') {
                        msgText += `❌ *Holati:* ${newStatus}. Buyurtma tizim tomonidan rad etildi. Muammo bo'lsa adminga yozing.`;
                    } else {
                        msgText += `📌 *Holati:* ${newStatus}`;
                    }

                    bot.sendMessage(order.userId, msgText, { parse_mode: 'Markdown' }).catch(()=>{});
                }
            }
        }
    }

    if (statusOzgardi) {
        safeWriteJSON('orders.json', orders);
    }
}

setInterval(checkAllOrdersStatus, 5 * 60 * 1000);

bot.setMyCommands([
    { command: '/start', description: 'Botni qayta ishga tushirish (Start)' },
    { command: '/menu', description: 'Bosh menyuni ochish' }
]);

async function checkSubscription(userId) {
    if (userId === ADMIN_ID) return true;
    try {
        const m = await bot.getChatMember(REQUIRED_CHANNEL, userId);
        return ['creator','administrator','member'].includes(m.status);
    } catch { return false; }
}

function sendMainMenu(chatId) {
    const isAdmin = (chatId === ADMIN_ID);
    const keyboard = [
        ['🛒 SMM Xizmatlar'],
        ['💳 Mening hisobim', '📦 Buyurtmalarim'],
        ['💰 Hisobni to‘ldirish', '🔗 Referal havola']
    ];
    if (isAdmin) keyboard.push(['👤 Admin panel']);
    bot.sendMessage(chatId, WELCOME_TEXT, { reply_markup: { keyboard: keyboard, resize_keyboard: true } });
    delete userStep[chatId];
}

// 🚀 /start
bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const refId = match[1] ? match[1].trim() : null;

    if (!await checkSubscription(userId)) {
        return bot.sendMessage(chatId, `❌ Botdan foydalanish uchun avval kanalimizga a'zo bo'ling!\n👉 ${REQUIRED_CHANNEL}`);
    }

    if (!users.includes(userId)) {
        users.push(userId);
        balances[userId] = balances[userId] || 0;
        stats.users += 1;
        safeWriteJSON('users.json', users);
        safeWriteJSON('balances.json', balances);
        safeWriteJSON('stats.json', stats);
        
        if (refId && refId != userId && users.includes(parseInt(refId))) { 
            referrals[refId] = (referrals[refId] || 0) + 1; 
            safeWriteJSON('referrals.json', referrals); 
        }
    }
    sendMainMenu(chatId);
});

bot.onText(/\/menu/, async (msg) => {
    if (!await checkSubscription(msg.from.id)) return;
    sendMainMenu(msg.chat.id);
});

// 🛡️ ADMIN COMMANDS
bot.onText(/\/addbalans (\d+) (\d+)/, (msg, match) => {
    if (msg.from.id !== ADMIN_ID) return;
    const uid = parseInt(match[1]); const sum = parseInt(match[2]);
    balances[uid] = (balances[uid] || 0) + sum;
    safeWriteJSON('balances.json', balances);
    bot.sendMessage(msg.chat.id, `✅ Yangi balans: ${balances[uid]}`);
    bot.sendMessage(uid, `✅ Hisobingizga ${sum} so'm qo'shildi!`).catch(()=>{});
});

// 📩 MESSAGE HANDLING
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (msg.photo && userStep[chatId] && userStep[chatId].step === 'chek_kutish') {
        const fileId = msg.photo[msg.photo.length - 1].file_id; 
        const kiritilganSumma = userStep[chatId].summa;
        const name = msg.from.first_name || "Foydalanuvchi";
        const username = msg.from.username ? `@${msg.from.username}` : "Mavjud emas";

        const adminText = `🔔 *YANGI TO'LOV CHEKI KELDI!*\n\n` +
                          `👤 *Kimdan:* ${name} (${username})\n` +
                          `🆔 *Telegram ID:* \`${userId}\`\n` +
                          `💰 *Kiritgan summa:* ${kiritilganSumma} so'm\n\n` +
                          `👉 Balans qo'shish uchun buyruq:\n\`/addbalans ${userId} ${kiritilganSumma}\``;

        await bot.sendPhoto(ADMIN_ID, fileId, { caption: adminText, parse_mode: 'Markdown' });
        bot.sendMessage(chatId, `✅ *To'lov cheki botga muvaffaqiyatli yuborildi!*\n\nTez orada to'lovingiz tekshirilib, balansingizga ${kiritilganSumma} so'm qo'shiladi.`, { parse_mode: 'Markdown' });
        
        delete userStep[chatId]; 
        return sendMainMenu(chatId);
    }

    if (!text || text.startsWith('/')) return;
    if (!await checkSubscription(userId)) return;
    if (text === '🔙 Orqaga') return sendMainMenu(chatId);

    if (text === '👤 Admin panel' && userId === ADMIN_ID) {
        return bot.sendMessage(chatId, `👨‍💻 BUYRUQLAR:\n/addbalans [id] [sum]\n/statistika`, {reply_markup:{keyboard:[['🔙 Orqaga']],resize_keyboard:true}});
    }

    if (text === '💰 Hisobni to‘ldirish') {
        userStep[chatId] = { step: 'summa_kiritish' };
        return bot.sendMessage(chatId, `💰 Qancha so'm kiritmoqchisiz? Raqam yozing:`);
    }

    if (userStep[chatId] && userStep[chatId].step === 'summa_kiritish') {
        const summa = parseInt(text);
        if (isNaN(summa) || summa < 1000) return bot.sendMessage(chatId, `❌ Kamida 1000 so'm kiriting:`);
        userStep[chatId] = { step: 'chek_kutish', summa: summa };
        return bot.sendMessage(chatId, `💳 *Karta raqami:* \`${CARD_NUMBER}\`\n👤 *Ega:* ${CARD_NAME}\n💰 *To'lanishi kerak bo'lgan summa:* ${summa} so'm\n\n👇 To'lovni amalga oshirib, *to'lov chekini botga yuboring!*`, { parse_mode: 'Markdown' });
    }

    // 🛒 SMM XIZMATLAR
    if (text === '🛒 SMM Xizmatlar') {
        if (CATEGORIES.length === 0) {
            return bot.sendMessage(chatId, "⚠️ Xizmatlar yuklanmoqda. Birozdan so'ng qayta urinib ko'ring.");
        }

        const page = 0; 
        const itemsPerPage = 10;
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const pageCategories = CATEGORIES.slice(start, end);

        let inline_keyboard = [];
        pageCategories.forEach((cat) => {
            inline_keyboard.push([{ text: cat, callback_data: `cat_${start}_${CATEGORIES.indexOf(cat)}` }]);
        });

        let navRow = [];
        if (page > 0) navRow.push({ text: "⬅️ Orqaga", callback_data: `page_${page - 1}` });
        if (end < CATEGORIES.length) navRow.push({ text: "Keyingisi ➡️", callback_data: `page_${page + 1}` });
        if (navRow.length > 0) inline_keyboard.push(navRow);

        return bot.sendMessage(chatId, `📋 *SMM Xizmatlar Kategoriyalari (Sahifa: ${page + 1}):*\n\n👇 O'zingizga kerakli bo'limni tanlang:`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: inline_keyboard }
        });
    }

    if (userStep[chatId] && userStep[chatId].step === 'sel_serv') {
        const serviceId = text.trim();
        const service = userStep[chatId].services.find(x => x.service == serviceId);
        if (!service) return bot.sendMessage(chatId, "❌ Noto'g'ri xizmat ID raqami. Qayta kiriting:");

        userStep[chatId].service = service;
        userStep[chatId].step = 'send_link';
        return bot.sendMessage(chatId, `✅ Tanlandi: *${service.name.replace(/[*_`]/g, '\\$&')}*\n\n🔗 Buyurtma havolasini (Link) kiriting:`, { parse_mode: 'Markdown' });
    }

    if (userStep[chatId] && userStep[chatId].step === 'send_link') {
        userStep[chatId].link = text;
        userStep[chatId].step = 'send_count';
        const s = userStep[chatId].service;
        return bot.sendMessage(chatId, `📦 Miqdorni kiriting (Min: ${s.min} ta / Max: ${s.max} ta):`);
    }

    // Qadam: Miqdor kiritilganda buyurtma yuborish (25% USTAMA BILAN HISOBLASH)
    if (userStep[chatId] && userStep[chatId].step === 'send_count') {
        const cnt = parseInt(text);
        const s = userStep[chatId].service;

        if (isNaN(cnt) || cnt < parseInt(s.min) || cnt > parseInt(s.max)) {
            return bot.sendMessage(chatId, `❌ Noto'g'ri miqdor! Iltimos ${s.min} va ${s.max} oralig'ida kiriting:`);
        }

        // 🔥 Bu yerda API narxiga avtomatik 25% (PROFIT_PERCENT) ustama qo'shilyapti
        const ClientRate = parseFloat(s.rate) * PROFIT_PERCENT;
        const sum = Math.ceil((cnt / 1000) * ClientRate);

        if ((balances[userId] || 0) < sum) {
            delete userStep[chatId];
            return bot.sendMessage(chatId, `❌ Balans yetarli emas. Narxi: ${sum} so'm. Balans: ${balances[userId] || 0} so'm`);
        }

        const orderId = Date.now();
        bot.sendMessage(chatId, `⏳ Buyurtmangiz xavfsiz tizim orqali rasmiylashtirilmoqda...`);

        const result = await topsmmRequest({
            key: TOPSMM_API_KEY,
            action: 'add',
            service: s.service,
            link: userStep[chatId].link,
            quantity: cnt
        });

        if (result && result.order) {
            const topsmmOrderId = result.order;

            orders[orderId] = {
                userId: userId,
                apiOrderId: topsmmOrderId,
                serviceName: s.name,
                link: userStep[chatId].link,
                count: cnt,
                summa: sum,
                status: 'Qabul qilindi',
                date: new Date().toLocaleString()
            };

            balances[userId] -= sum;
            stats.income += sum;
            stats.orders += 1;

            safeWriteJSON('orders.json', orders);
            safeWriteJSON('balances.json', balances);
            safeWriteJSON('stats.json', stats);

            const safeShowName = s.name.replace(/[*_`]/g, '\\$&');
            bot.sendMessage(chatId, `✅ *Buyurtma muvaffaqiyatli qabul qilindi!*\n\n🆔 Bot ID: \`${orderId}\`\n📋 Xizmat: ${safeShowName}\n📦 Miqdor: ${cnt} ta\n💸 Yechildi: ${sum} so'm`, { parse_mode: 'Markdown' });
            bot.sendMessage(ADMIN_ID, `🔔 *YANGI REAL BUYURTMA*\nBot ID: ${orderId}\nSMM ID: ${topsmmOrderId}\nFoydalanuvchi: ${userId}\nSumma: ${sum} so'm`).catch(()=>{});
        } else {
            bot.sendMessage(chatId, `❌ Tizim buyurtmani rad etdi. Sababi: ${result && result.error ? result.error : 'Nomalum'}. Balansdan pul yechilmadi.`);
        }

        delete userStep[chatId];
        return;
    }

    if (text === '💳 Mening hisobim') {
        let adminExtra = "";
        if (userId === ADMIN_ID) {
            const apiBalance = await topsmmRequest({ key: TOPSMM_API_KEY, action: 'balance' });
            if (apiBalance) adminExtra = `\n\n🌐 *API Umumiy Balans:* ${apiBalance.balance} ${apiBalance.currency}`;
        }
        return bot.sendMessage(chatId, `💳 HISOBINGIZ\n\n🆔 ID: \`${userId}\`\n💰 Balans: ${balances[userId] || 0} so'm${adminExtra}`, { parse_mode: 'Markdown' });
    }

    if (text === '📦 Buyurtmalarim') {
        let myOrdersText = '📦 *BUYURTMALARINGIZ HISTORIYASI*\n\n';
        let hasOrders = false;

        for (let orderId in orders) {
            if (orders[orderId].userId === userId) {
                hasOrders = true;
                let currentStatus = orders[orderId].status;

                if (orders[orderId].apiOrderId && !['Completed', 'Canceled', 'Partial', 'Yakunlandi', 'Bekor qilindi'].includes(currentStatus)) {
                    const checkStatus = await topsmmRequest({
                        key: TOPSMM_API_KEY,
                        action: 'status',
                        order: orders[orderId].apiOrderId
                    });
                    if (checkStatus && checkStatus.status) {
                        currentStatus = checkStatus.status;
                        if (currentStatus === 'Completed') currentStatus = 'Yakunlandi';
                        if (currentStatus === 'Canceled') currentStatus = 'Bekor qilindi';
                        if (currentStatus === 'Pending') currentStatus = 'Kutilmoqda';
                        if (currentStatus === 'In progress') currentStatus = 'Bajarilmoqda';
                        if (currentStatus === 'Processing') currentStatus = 'Ishlov berilmoqda';
                        if (currentStatus === 'Partial') currentStatus = 'Qisman bajarildi';
                        orders[orderId].status = currentStatus;
                    }
                }

                const safeOrderName = orders[orderId].serviceName.replace(/[*_`]/g, '\\$&');
                myOrdersText += `🔹 *Bot ID:* \`${orderId}\`\n📋 *Xizmat:* ${safeOrderName}\n📦 *Miqdor:* ${orders[orderId].count} ta\n📌 *Holat:* ${currentStatus}\n\n`;
            }
        }
        
        if (hasOrders) safeWriteJSON('orders.json', orders);
        return bot.sendMessage(chatId, hasOrders ? myOrdersText : '❌ Sizda hozircha buyurtmalar mavjud emas.', { parse_mode: 'Markdown' });
    }

    if (text === '🔗 Referal havola') {
        return bot.sendMessage(chatId, `🔗 https://t.me/SMM_adminMAX_bot?start=${userId}\n👥 Do'stlar: ${referrals[userId] || 0} ta`);
    }
});

// 🔄 INLINE CALLBACK QUERY HANDLING (KATEGORIYALARDA 25% USTAMA BILAN KO'RSATISH)
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    if (data.startsWith('page_')) {
        const page = parseInt(data.split('_')[1]);
        const itemsPerPage = 10;
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const pageCategories = CATEGORIES.slice(start, end);

        let inline_keyboard = [];
        pageCategories.forEach((cat) => {
            inline_keyboard.push([{ text: cat, callback_data: `cat_${start}_${CATEGORIES.indexOf(cat)}` }]);
        });

        let navRow = [];
        if (page > 0) navRow.push({ text: "⬅️ Orqaga", callback_data: `page_${page - 1}` });
        if (end < CATEGORIES.length) navRow.push({ text: "Keyingisi ➡️", callback_data: `page_${page + 1}` });
        if (navRow.length > 0) inline_keyboard.push(navRow);

        bot.editMessageText(`📋 *SMM Xizmatlar Kategoriyalari (Sahifa: ${page + 1}):*\n\n👇 O'zingizga kerakli bo'limni tanlang:`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: inline_keyboard }
        }).catch(()=>{});
    }

    if (data.startsWith('cat_')) {
        const index = parseInt(data.split('_')[2]);
        const selectedCat = CATEGORIES[index];
        const filteredServices = ALL_SERVICES.filter(x => x.category === selectedCat);

        userStep[chatId] = { step: 'sel_serv', category: selectedCat, services: filteredServices };

        let txt = `📂 *Kategoriya:* ${selectedCat}\n\n`;
        filteredServices.forEach((s) => {
            // 🔥 Narxlarni ro'yxatda ko'rsatayotganda ham 25% (PROFIT_PERCENT) qo'shib ko'rsatadi
            const ClientRate = (parseFloat(s.rate) * PROFIT_PERCENT).toFixed(2); 
            const safeName = s.name.replace(/[*_`]/g, '\\$&');

            txt += `🆔 *ID:* \`${s.service}\`\n`;
            txt += `📋 *Xizmat:* ${safeName}\n`;
            txt += `💰 *Narxi (1000x):* ${ClientRate} so'm\n`;
            txt += `🔹 *Min:* ${s.min} / *Max:* ${s.max}\n\n`;
        });

        txt += `✍️ Sotib olmoqchi bo'lgan xizmatning *ID raqamini* chatga yozib yuboring:`;
        
        bot.sendMessage(chatId, txt, { 
            parse_mode: 'Markdown', 
            reply_markup: { keyboard: [['🔙 Orqaga']], resize_keyboard: true } 
        });
    }
});

// Server ulanishi
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'}); res.write('Bot ishlamoqda ✅'); res.end();
}).listen(port, "0.0.0.0", () => {
    console.log(`🔥 Bot ${port}-portda mukammal va xatosiz ishga tushdi! ✅`);
});
