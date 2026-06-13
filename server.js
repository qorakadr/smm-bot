const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const axios = require('axios');
const mongoose = require('mongoose'); // MongoDB drayveri qo'shildi

// 🍃 MONGODB ULANISH HAVOLASI (Siz yaratgan baza)
const MONGO_URI = "mongodb+srv://Odil014:mutRjmtuog5CwbLD@cluster0.dzhhdpf.mongodb.net/smm_database?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log("🍃 MongoDB Ma'lumotlar bazasiga muvaffaqiyatli ulandi! ✅"))
    .catch(err => console.error("❌ MongoDB ulanishida xatolik:", err));

// 📊 MongoDB sxemalarini yaratish (Fayllar o'rniga)
const UserSchema = new mongoose.Schema({
    userId: { type: Number, unique: true },
    balance: { type: Number, default: 0 },
    refCount: { type: Number, default: 0 }
});
const User = mongoose.model('User', UserSchema);

const OrderSchema = new mongoose.Schema({
    orderId: String,
    userId: Number,
    apiOrderId: String,
    serviceName: String,
    link: String,
    count: Number,
    summa: Number,
    status: { type: String, default: 'Qabul qilindi' },
    date: { type: String, default: () => new Date().toLocaleString() }
});
const Order = mongoose.model('Order', OrderSchema);

const StatsSchema = new mongoose.Schema({
    users: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    income: { type: Number, default: 0 }
});
const Stats = mongoose.model('Stats', StatsSchema);

// Ma'lumotlar bazasi vaqtinchalik xotirasi
let userStep = {};
let ALL_SERVICES = [];
let CATEGORIES = [];

// ⚙️ ASOSIY SOZLAMALAR
const CARD_NUMBER = '9860350144650842';
const CARD_NAME = 'ODILJON OCHILOV';
const ADMIN_ID = 8782481713; 
const REQUIRED_CHANNEL = '@xabarlar24uzbekiston';
const PROFIT_PERCENT = 1.25;

const TOPSMM_API_URL = 'https://topsmm.uz/api/v2';
const TOPSMM_API_KEY = 'f1152704a5c99b2877ec57ad6b53f892'; 

// 🔄 API ulanish funksiyasi
async function topsmmRequest(params) {
    try {
        const urlParams = new URLSearchParams();
        for (const key in params) { urlParams.append(key, params[key]); }
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

// Xizmatlarni yuklash
async function loadServices() {
    const data = await topsmmRequest({ key: TOPSMM_API_KEY, action: 'services' });
    if (Array.isArray(data)) {
        ALL_SERVICES = data;
        CATEGORIES = [...new Set(ALL_SERVICES.map(x => x.category))];
        console.log(`✅ Tizimga ${ALL_SERVICES.length} ta xizmat yuklandi!`);
    }
}

const WELCOME_TEXT = `⚡️ ASSALOM ALAYKUM!\n\nEng yaxshi xizmatlarini taqdim etuvchi bot.\nUshbu xizmatlarning barchasini «SMM.ADMIN» botida ko'rishingiz mumkin.\n\n👨‍💻 ADMIN: @SMM_adminMAX\nQuyidagi bo'limlardan birini tanlang 👇`;

const token = process.env.BOT_TOKEN || '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';
const bot = new TelegramBot(token, { polling: true });

loadServices();
setInterval(loadServices, 60 * 60 * 1000);

// 🔄 AVTOMATIK STATUS TEKSHIRISH
async function checkAllOrdersStatus() {
    console.log("🔄 Aktiv buyurtmalar statusi tekshirilmoqda...");
    const activeOrders = await Order.find({ status: { $nin: ['Completed', 'Canceled', 'Partial', 'Yakunlandi', 'Bekor qilindi'] } });
    
    for (let order of activeOrders) {
        if (order.apiOrderId) {
            const checkStatus = await topsmmRequest({ key: TOPSMM_API_KEY, action: 'status', order: order.apiOrderId });
            if (checkStatus && checkStatus.status) {
                let newStatus = checkStatus.status;
                if (newStatus === 'Completed') newStatus = 'Yakunlandi';
                if (newStatus === 'Canceled') newStatus = 'Bekor qilindi';
                if (newStatus === 'Pending') newStatus = 'Kutilmoqda';
                if (newStatus === 'In progress') newStatus = 'Bajarilmoqda';
                if (newStatus === 'Processing') newStatus = 'Ishlov berilmoqda';
                
                if (order.status !== newStatus) {
                    order.status = newStatus;
                    await order.save();
                    bot.sendMessage(order.userId, `🔔 *BUYURTMA STATUSI O'ZGARDI!*\n\n🆔 ID: \`${order.orderId}\`\n📌 Holati: ${newStatus}`, { parse_mode: 'Markdown' }).catch(()=>{});
                }
            }
        }
    }
}
setInterval(checkAllOrdersStatus, 5 * 60 * 1000);

bot.setMyCommands([
    { command: '/start', description: 'Botni qayta ishga tushirish' },
    { command: '/menu', description: 'Bosh menyu' }
]);

async function checkSubscription(userId) {
    if (userId === ADMIN_ID) return true;
    try {
        const m = await bot.getChatMember(REQUIRED_CHANNEL, userId);
        return ['creator','administrator','member'].includes(m.status);
    } catch { return false; }
}

function sendMainMenu(chatId) {
    const keyboard = [
        ['🛒 SMM Xizmatlar'],
        ['💳 Mening hisobim', '📦 Buyurtmalarim'],
        ['💰 Hisobni to‘ldirish', '🔗 Referal havola']
    ];
    if (chatId === ADMIN_ID) keyboard.push(['👤 Admin panel']);
    bot.sendMessage(chatId, WELCOME_TEXT, { reply_markup: { keyboard: keyboard, resize_keyboard: true } });
    delete userStep[chatId];
}

bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const refId = match[1] ? match[1].trim() : null;

    if (!await checkSubscription(userId)) {
        return bot.sendMessage(chatId, `❌ Botdan foydalanish uchun kanalga a'zo bo'ling:\n👉 ${REQUIRED_CHANNEL}`);
    }

    let dbUser = await User.findOne({ userId });
    if (!dbUser) {
        dbUser = new User({ userId });
        await dbUser.save();
        await Stats.updateOne({}, { $inc: { users: 1 } }, { upsert: true });
        
        if (refId && refId != userId) {
            await User.updateOne({ userId: parseInt(refId) }, { $inc: { refCount: 1 } });
        }
    }
    sendMainMenu(chatId);
});

bot.onText(/\/menu/, async (msg) => {
    if (!await checkSubscription(msg.from.id)) return;
    sendMainMenu(msg.chat.id);
});

bot.onText(/\/addbalans (\d+) (\d+)/, async (msg, match) => {
    if (msg.from.id !== ADMIN_ID) return;
    const uid = parseInt(match[1]); const sum = parseInt(match[2]);
    await User.updateOne({ userId: uid }, { $inc: { balance: sum } }, { upsert: true });
    bot.sendMessage(msg.chat.id, `✅ Balans qo'shildi!`);
    bot.sendMessage(uid, `✅ Hisobingizga ${sum} so'm qo'shildi!`).catch(()=>{});
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (msg.photo && userStep[chatId] && userStep[chatId].step === 'chek_kutish') {
        const fileId = msg.photo[msg.photo.length - 1].file_id; 
        const kiritilganSumma = userStep[chatId].summa;
        const adminText = `🔔 *YANGI TO'LOV CHEKI!*\n\n🆔 ID: \`${userId}\`\n💰 Summa: ${kiritilganSumma} so'm\n\n\`/addbalans ${userId} ${kiritilganSumma}\``;
        await bot.sendPhoto(ADMIN_ID, fileId, { caption: adminText, parse_mode: 'Markdown' });
        bot.sendMessage(chatId, `✅ Chek adminga yuborildi.`);
        delete userStep[chatId]; 
        return sendMainMenu(chatId);
    }

    if (!text || text.startsWith('/')) return;
    if (!await checkSubscription(userId)) return;
    if (text === '🔙 Orqaga') return sendMainMenu(chatId);

    if (text === '👤 Admin panel' && userId === ADMIN_ID) {
        return bot.sendMessage(chatId, `👨‍💻 /addbalans [id] [sum]`, {reply_markup:{keyboard:[['🔙 Orqaga']],resize_keyboard:true}});
    }

    if (text === '💰 Hisobni to‘ldirish') {
        userStep[chatId] = { step: 'summa_kiritish' };
        return bot.sendMessage(chatId, `💰 Qancha so'm kiritmoqchisiz?`);
    }

    if (userStep[chatId] && userStep[chatId].step === 'summa_kiritish') {
        const summa = parseInt(text);
        if (isNaN(summa) || summa < 1000) return bot.sendMessage(chatId, `❌ Kamida 1000 so'm kiriting:`);
        userStep[chatId] = { step: 'chek_kutish', summa: summa };
        return bot.sendMessage(chatId, `💳 Karta: \`${CARD_NUMBER}\`\n👤 Ega: ${CARD_NAME}\n💰 To'lov: ${summa} so'm\n\nChekni rasm shaklida yuboring!`, { parse_mode: 'Markdown' });
    }

    if (text === '🛒 SMM Xizmatlar') {
        if (CATEGORIES.length === 0) return bot.sendMessage(chatId, "⚠️ Yuklanmoqda...");
        let inline_keyboard = [];
        CATEGORIES.slice(0, 10).forEach((cat, idx) => {
            inline_keyboard.push([{ text: cat, callback_data: `cat_0_${idx}` }]);
        });
        return bot.sendMessage(chatId, `📋 Bo'limni tanlang:`, { reply_markup: { inline_keyboard: inline_keyboard } });
    }

    if (userStep[chatId] && userStep[chatId].step === 'sel_serv') {
        const service = userStep[chatId].services.find(x => x.service == text.trim());
        if (!service) return bot.sendMessage(chatId, "❌ Xato ID. Qayta kiriting:");
        userStep[chatId].service = service;
        userStep[chatId].step = 'send_link';
        return bot.sendMessage(chatId, `🔗 Havolani (Link) kiriting:`);
    }

    if (userStep[chatId] && userStep[chatId].step === 'send_link') {
        userStep[chatId].link = text;
        userStep[chatId].step = 'send_count';
        return bot.sendMessage(chatId, `📦 Miqdorni kiriting (Min: ${userStep[chatId].service.min}):`);
    }

    if (userStep[chatId] && userStep[chatId].step === 'send_count') {
        const cnt = parseInt(text);
        const s = userStep[chatId].service;
        if (isNaN(cnt) || cnt < parseInt(s.min) || cnt > parseInt(s.max)) return bot.sendMessage(chatId, `❌ Xato miqdor!`);

        const ClientRate = parseFloat(s.rate) * PROFIT_PERCENT;
        const sum = Math.ceil((cnt / 1000) * ClientRate);
        const dbUser = await User.findOne({ userId });

        if (!dbUser || dbUser.balance < sum) return bot.sendMessage(chatId, `❌ Balans yetarli emas. Narxi: ${sum} so'm.`);

        bot.sendMessage(chatId, `⏳ Buyurtma berilmoqda...`);
        const result = await topsmmRequest({ key: TOPSMM_API_KEY, action: 'add', service: s.service, link: userStep[chatId].link, quantity: cnt });

        if (result && result.order) {
            const newOrder = new Order({
                orderId: Date.now().toString(),
                userId: userId,
                apiOrderId: result.order,
                serviceName: s.name,
                link: userStep[chatId].link,
                count: cnt,
                summa: sum
            });
            await newOrder.save();
            await User.updateOne({ userId }, { $inc: { balance: -sum } });
            await Stats.updateOne({}, { $inc: { income: sum, orders: 1 } }, { upsert: true });

            bot.sendMessage(chatId, `✅ Buyurtma qabul qilindi! ID: \`${newOrder.orderId}\``, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, `❌ Rad etildi: ${result ? result.error : 'Nomalum'}`);
        }
        delete userStep[chatId];
        return;
    }

    if (text === '💳 Mening hisobim') {
        const dbUser = await User.findOne({ userId });
        return bot.sendMessage(chatId, `💳 HISOBINIZ\n\n🆔 ID: \`${userId}\`\n💰 Balans: ${dbUser ? dbUser.balance : 0} so'm`, { parse_mode: 'Markdown' });
    }

    if (text === '📦 Buyurtmalarim') {
        const myOrders = await Order.find({ userId }).limit(10);
        if (myOrders.length === 0) return bot.sendMessage(chatId, '❌ Buyurtmalar mavjud emas.');
        let txt = '📦 BUYURTMALARINGIZ:\n\n';
        myOrders.forEach(o => { txt += `🆔 ${o.orderId} | ${o.serviceName} | ${o.status}\n`; });
        return bot.sendMessage(chatId, txt);
    }

    if (text === '🔗 Referal havola') {
        const dbUser = await User.findOne({ userId });
        return bot.sendMessage(chatId, `🔗 https://t.me/SMM_adminMAX_bot?start=${userId}\n👥 Do'stlar: ${dbUser ? dbUser.refCount : 0} ta`);
    }
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith('cat_')) {
        const idx = parseInt(data.split('_')[2]);
        const selectedCat = CATEGORIES[idx];
        const filteredServices = ALL_SERVICES.filter(x => x.category === selectedCat);
        userStep[chatId] = { step: 'sel_serv', category: selectedCat, services: filteredServices };

        let txt = `📂 Kategoriya: ${selectedCat}\n\n`;
        filteredServices.slice(0, 15).forEach((s) => {
            const ClientRate = (parseFloat(s.rate) * PROFIT_PERCENT).toFixed(2);
            txt += `🆔 \`${s.service}\` | ${s.name} | 💰 ${ClientRate} so'm\n\n`;
        });
        txt += `✍️ Sotib olmoqchi bo'lgan xizmat ID raqamini yozing:`;
        bot.sendMessage(chatId, txt, { parse_mode: 'Markdown', reply_markup: { keyboard: [['🔙 Orqaga']], resize_keyboard: true } });
    }
});

const port = process.env.PORT || 3000;
http.createServer((req, res) => { res.writeHead(200); res.end('Bot ishlamoqda ✅'); }).listen(port, "0.0.0.0");
