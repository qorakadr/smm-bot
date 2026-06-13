const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// === SIZNING MA'LUMOTLARINGIZ ===
const TOKEN = '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';
const API_URL = 'https://topsmm.uz/api/v2';
const API_KEY = 'f1152704a5c99b2877ec57ad6b53f892';
const PROFIT = 1.25; // 25% ustama
const REFERRAL_PERCENT = 10; // Referaldan 10% foiz
// ================================

const bot = new TelegramBot(TOKEN, { 
    polling: true,
    filepath: false
});

// Foydalanuvchi ma'lumotlari va vaqtincha saqlash
const userData = {};
const referralData = {}; // Referal tizimi uchun

// -------------------- API FUNKSIYALARI (TOPSMM.UZ PHP KODIGA MOS) --------------------
// Barcha xizmatlarni olish
async function getServices() {
    try {
        const formData = new URLSearchParams();
        formData.append('key', API_KEY);
        formData.append('action', 'services');

        const res = await axios.post(API_URL, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 15000
        });

        return Array.isArray(res.data) ? res.data : [];
    } catch (e) {
        console.error('Xizmatlar xatosi:', e.message);
        return [];
    }
}

// Balansni olish
async function getBalance() {
    try {
        const formData = new URLSearchParams();
        formData.append('key', API_KEY);
        formData.append('action', 'balance');

        const res = await axios.post(API_URL, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000
        });

        return res.data?.balance ? res.data : { balance: '0.00', currency: 'USD' };
    } catch (e) {
        return { balance: 'Xato', currency: '' };
    }
}

// Yangi buyurtma yaratish
async function createOrder(serviceId, link, quantity, extras = {}) {
    try {
        const formData = new URLSearchParams();
        formData.append('key', API_KEY);
        formData.append('action', 'add');
        formData.append('service', serviceId);
        formData.append('link', link);
        formData.append('quantity', quantity);

        // Qo'shimcha parametrlar (PHP misolidagi kabi)
        for (let key in extras) {
            if (extras[key]) formData.append(key, extras[key]);
        }

        const res = await axios.post(API_URL, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 15000
        });

        return res.data;
    } catch (e) {
        return { error: e.response?.data?.error || 'Buyurtma yaratishda xato' };
    }
}

// Bitta buyurtma holatini tekshirish
async function checkOrderStatus(orderId) {
    try {
        const formData = new URLSearchParams();
        formData.append('key', API_KEY);
        formData.append('action', 'status');
        formData.append('order', orderId);

        const res = await axios.post(API_URL, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        return res.data;
    } catch (e) {
        return { error: 'Xato' };
    }
}

// Bir nechta buyurtma holatini tekshirish
async function checkMultiStatus(orderIds) {
    try {
        const formData = new URLSearchParams();
        formData.append('key', API_KEY);
        formData.append('action', 'status');
        formData.append('orders', orderIds.join(','));

        const res = await axios.post(API_URL, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        return res.data;
    } catch (e) {
        return { error: 'Xato' };
    }
}

// Buyurtmani qayta to'ldirish
async function refillOrder(orderId) {
    try {
        const formData = new URLSearchParams();
        formData.append('key', API_KEY);
        formData.append('action', 'refill');
        formData.append('order', orderId);

        const res = await axios.post(API_URL, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        return res.data;
    } catch (e) {
        return { error: 'Xato' };
    }
}

// -------------------- /START VA ASOSIY MENYU --------------------
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const refId = msg.text.split(' ')[1] || null;

    // Referal tizimi: agar havola orqali kirgan bo'lsa
    if (refId && !referralData[chatId]) {
        referralData[chatId] = { invitedBy: refId, balance: 0 };
        if (!referralData[refId]) referralData[refId] = { invited: [], balance: 0 };
        referralData[refId].invited.push(chatId);
        bot.sendMessage(refId, `🎉 Yangi foydalanuvchi sizning havolangiz orqali qo'shildi!`);
    }

    bot.sendMessage(chatId, `👋 SMM BOTGA XUSH KELIBSIZ!\n\nQuyidagi bo'limlardan keraklisini tanlang:`, {
        reply_markup: {
            keyboard: [
                ['1. 📦 Buyurtma berish', '2. 🆔 Nomer olish'],
                ['3. 📋 Buyurtmalarim', '4. 💰 Mening hisobim'],
                ['5. 👥 Referal tizimi', '6. 💳 Hisobni to‘ldirish'],
                ['7. 📞 Murojat qilish', '8. 📖 Qullanma'],
                ['9. 🤝 Hamkorlik tizimi']
            ],
            resize_keyboard: true
        }
    });
});

// -------------------- BARCHA BO'LIMLAR ISHLASHI --------------------
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // === 1. BUYURTMA BERISH (BARCHA KATEGORIYALAR) ===
    if (text === '1. 📦 Buyurtma berish') {
        bot.sendMessage(chatId, "📱 Xizmat turini tanlang:", {
            reply_markup: {
                inline_keyboard: [
                    [{text: 'TELEGRAM', callback_data: 'cat_telegram'}, {text: 'INSTAGRAM', callback_data: 'cat_instagram'}],
                    [{text: 'TIKTOK', callback_data: 'cat_tiktok'}, {text: 'YOUTUBE', callback_data: 'cat_youtube'}],
                    [{text: 'STARS / YULDUZ', callback_data: 'cat_stars'}, {text: 'WHATSAPP', callback_data: 'cat_whatsapp'}],
                    [{text: 'FACEBOOK', callback_data: 'cat_facebook'}, {text: 'TWITTER / X', callback_data: 'cat_twitter'}],
                    [{text: 'TWITCH', callback_data: 'cat_twitch'}, {text: 'VK', callback_data: 'cat_vk'}],
                    [{text: 'OBUNACHILAR', callback_data: 'cat_subs'}, {text: 'TEKIN NAKRUTKA', callback_data: 'cat_free'}],
                    [{text: 'TELEGRAM GIFT / HADIYALAR', callback_data: 'cat_gift'}]
                ]
            }
        });
    }

    // === 2. NOMER OLISH ===
    else if (text === '2. 🆔 Nomer olish') {
        bot.sendMessage(chatId, "📞 Raqam olish xizmati ishlab chiqilmoqda. Tez orada ishga tushadi!");
    }

    // === 3. BUYURTMALARIM VA HOLATI ===
    else if (text === '3. 📋 Buyurtmalarim') {
        bot.sendMessage(chatId, "🔍 Buyurtma holatini tekshirish uchun ID raqamini yozing:\nMisol: /status 123456");
    }

    // === 4. MENING HISOBIM (FAQAT O'ZIGA KO'RINADI) ===
    else if (text === '4. 💰 Mening hisobim') {
        const balance = await getBalance();
        const refBal = referralData[chatId]?.balance || 0;
        bot.sendMessage(chatId, 
            `💳 <b>SHAXSIY HISOBIM</b>\n\n` +
            `Asosiy balans: <b>${balance.balance} ${balance.currency}</b>\n` +
            `Referal balans: <b>${refBal} USD</b>\n\n` +
            `❗ Balansingiz faqat sizga ko'rinadi!`, 
            {parse_mode: 'HTML'}
        );
    }

    // === 5. REFERAL TIZIMI ===
    else if (text === '5. 👥 Referal tizimi') {
        const refLink = `https://t.me/${bot.options.username}?start=ref${chatId}`;
        const count = referralData[chatId]?.invited?.length || 0;
        const refBal = referralData[chatId]?.balance || 0;

        bot.sendMessage(chatId,
            `👥 <b>REFERAL TIZIMI</b>\n\n` +
            `🔗 Sizning havolangiz: <code>${refLink}</code>\n` +
            `👤 Taklif qilinganlar: <b>${count}</b> kishi\n` +
            `💸 Yig'ilgan summa: <b>${refBal} USD</b>\n` +
            `📊 Har bir do'stingiz buyurtmasidan <b>${REFERRAL_PERCENT}%</b> foiz oling!`,
            {parse_mode: 'HTML'}
        );
    }

    // === 6. HISOBNI TO'LDIRISH ===
    else if (text === '6. 💳 Hisobni to‘ldirish') {
        bot.sendMessage(chatId,
            `💳 <b>HISOBNI TO'LDIRISH</b>\n\n` +
            `To'lov tizimlari:\n` +
            `• Click - @click_payment\n` +
            `• Payme - @payme_bot\n` +
            `• Uzcard - 8600 **** **** 1234\n\n` +
            `Summani kiriting (USD):`,
            {parse_mode: 'HTML'}
        );
    }

    // === 7. MUROJAT QILISH ===
    else if (text === '7. 📞 Murojat qilish') {
        bot.sendMessage(chatId,
            `📞 <b>MUROJAT QILISH</b>\n\n` +
            `Admin: @SMM_Admin\n` +
            `Telefon: +998 99 123 45 67\n` +
            `Ish vaqti: 9:00 - 18:00`,
            {parse_mode: 'HTML'}
        );
    }

    // === 8. QULLANMA ===
    else if (text === '8. 📖 Qullanma') {
        bot.sendMessage(chatId,
            `📖 <b>BOTDAN FOYDALANISH QOIDALARI</b>\n\n` +
            `1. 📦 Buyurtma berish → Xizmat tanlang\n` +
            `2. 🔗 Linkni yuboring\n` +
            `3. 🔢 Sonni kiriting\n` +
            `4. ✅ Buyurtma tasdiqlanadi\n` +
            `5. 📋 Holatini tekshirish uchun ID yozing`,
            {parse_mode: 'HTML'}
        );
    }

    // === 9. HAMKORLIK TIZIMI ===
    else if (text === '9. 🤝 Hamkorlik tizimi') {
        bot.sendMessage(chatId,
            `🤝 <b>HAMKORLIK SHARTLARI</b>\n\n` +
            `• Katta hajmga chegirma - 5% dan 20% gacha\n` +
            `• Shaxsiy menejer\n` +
            `• Kunlik hisob-kitob\n` +
            `• Maxsus narxlar\n\n` +
            `Murojat: @SMM_Partner`,
            {parse_mode: 'HTML'}
        );
    }

    // === BUYURTMA JARAYONI: LINK VA SON QABUL QILISH ===
    else if (userData[chatId]) {
        const data = userData[chatId];

        if (data.step === 'awaiting_link') {
            data.link = text.trim();
            data.step = 'awaiting_quantity';
            bot.sendMessage(chatId, "🔢 Buyurtma sonini kiriting (masalan: 100, 500, 1000):");
        }

        else if (data.step === 'awaiting_quantity') {
            const qty = parseInt(text.trim());
            if (isNaN(qty) || qty < 1) {
                return bot.sendMessage(chatId, "❌ Faqat raqam kiriting! Qaytadan urinib ko'ring:");
            }

            bot.sendMessage(chatId, "⏳ Buyurtma yaratilmoqda...");
            const res = await createOrder(data.serviceId, data.link, qty);

            if (res.order) {
                const pricePer1k = data.rate * PROFIT;
                const totalPrice = (pricePer1k * qty / 1000).toFixed(4);

                // Referalga foiz hisoblash
                if (referralData[chatId]?.invitedBy) {
                    const refBonus = (totalPrice * REFERRAL_PERCENT / 100).toFixed(4);
                    const invId = referralData[chatId].invitedBy;
                    if (!referralData[invId]) referralData[invId] = {balance:0};
                    referralData[invId].balance += parseFloat(refBonus);
                }

                bot.sendMessage(chatId,
                    `✅ <b>BUYURTMA YARATILDI!</b>\n\n` +
                    `🔢 Buyurtma ID: <b>${res.order}</b>\n` +
                    `📌 Xizmat: ${data.name}\n` +
                    `🔗 Link: ${data.link}\n` +
                    `📊 Son: ${qty}\n` +
                    `💸 To'lov: <b>${totalPrice} $</b>\n\n` +
                    `ℹ️ Holatini ko'rish: /status ${res.order}`,
                    {parse_mode: 'HTML'}
                );
            } else {
                bot.sendMessage(chatId, `❌ Xato: ${res.error || 'Noma’lum xato'}`);
            }
            delete userData[chatId];
        }
    }
});

// -------------------- BUYURTMA HOLATI KOMANDASI --------------------
bot.onText(/\/status (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const orderId = match[1];
    const status = await checkOrderStatus(orderId);

    if (status.error) {
        bot.sendMessage(chatId, "❌ Buyurtma topilmadi yoki xato yuz berdi!");
    } else {
        bot.sendMessage(chatId,
            `📊 <b>BUYURTMA HOLATI #${orderId}</b>\n\n` +
            `Holat: <b>${status.status}</b>\n` +
            `Narx: ${status.charge || '0'} ${status.currency || 'USD'}\n` +
            `Bajarilgan: ${status.start_count || 0} / ${status.quantity || 0}`,
            {parse_mode: 'HTML'}
        );
    }
});

// -------------------- KATEGORIYALAR VA XIZMATLAR FILTRI --------------------
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const allServices = await getServices(); // API dan barcha xizmatlar

    let filtered = [];
    let categoryName = '';

    // Kategoriyalar bo'yicha filtrlash
    if (data === 'cat_telegram') {
        filtered = allServices.filter(s => s.name.toLowerCase().includes('telegram'));
        categoryName = 'TELEGRAM';
    }
    else if (data === 'cat_instagram') {
        filtered = allServices.filter(s => s.name.toLowerCase().includes('instagram'));
        categoryName = 'INSTAGRAM';
    }
    else if (data === 'cat_tiktok') {
        filtered = allServices.filter(s => s.name.toLowerCase().includes('tiktok'));
        categoryName = 'TIKTOK';
    }
    else if (data === 'cat_youtube') {
        filtered = allServices.filter(s => s.name.toLowerCase().includes('youtube'));
        categoryName = 'YOUTUBE';
    }
    else if (data === 'cat_stars') {
        filtered = allServices.filter(s => s.name.toLowerCase().includes('star') || s.name.toLowerCase().includes('yulduz'));
        categoryName = 'STARS / YULDUZ';
    }
    else if (data === 'cat_whatsapp') {
        filtered = allServices.filter(s => s.name.toLowerCase().includes('whatsapp'));
        categoryName = 'WHATSAPP';
    }
    else if (data === 'cat_facebook') {
        filtered = allServices.filter(s => s.name.toLowerCase().includes('facebook'));
        categoryName = 'FACEBOOK';
    }
    else if (data === 'cat_twitter') {
        filtered = allServices.filter(s => s.name.toLowerCase().includes('twitter') || s.name.toLowerCase().includes('x '));
        categoryName = 'TWITTER / X';
    }
    else if (data === 'cat_twitch') {
        filtered = allServices.filter(s => s.name.toLowerCase().includes('twitch'));
        categoryName = 'TWITCH';
    }
    else if (data === 'cat_vk') {
        filtered = allServices.filter(s => s.name.toLowerCase().includes('vk'));
        categoryName = 'VK';
    }
    else if (data === 'cat_subs') {
        filtered = allServices.filter(s => s.name.toLowerCase().includes('obunachi') || s.name.toLowerCase().includes('subscriber'));
        categoryName = 'OBUNACHILAR';
    }
    else if (data === 'cat_free') {
        filtered = allServices.filter(s => s.name.toLowerCase().includes('tekin') || s.name.toLowerCase().includes('free'));
        categoryName = 'TEKIN NAKRUTKA';
    }
    else if (data === 'cat_gift') {
        filtered = allServices.filter(s => s.name.toLowerCase().includes('gift') || s.name.toLowerCase().includes('hadya'));
        categoryName = 'TELEGRAM GIFT / HADIYALAR';
    }

    // Xizmat tanlanganda
    else if (data.startsWith('service_')) {
        const servId = data.split('_')[1];
        const serv = allServices.find(s => s.service == servId);
        if (!serv) return bot.answerCallbackQuery(query.id, {text: "❌ Xizmat topilmadi!"});

        userData[chatId] = {
            serviceId: servId,
            name: serv.name,
            rate: serv.rate,
            step: 'awaiting_link'
        };

        bot.answerCallbackQuery(query.id);
        return bot.sendMessage(chatId, 
            `✅ Tanlandi: <b>${serv.name}</b>\n` +
            `💸 Narx: ${(serv.rate * PROFIT).toFixed(2)} $ / 1000\n\n` +
            `🔗 Endi linkni yuboring:`, 
            {parse_mode: 'HTML'}
        );
    }

    // Xizmatlarni chiqarish
    if (filtered.length === 0) {
        bot.answerCallbackQuery(query.id);
        return bot.sendMessage(chatId, `❌ ${categoryName} bo'yicha xizmatlar hozircha mavjud emas.`);
    }

    const buttons = filtered.map(s => [{
        text: `${s.name} | ${(s.rate * PROFIT).toFixed(2)} $`,
        callback_data: `service_${s.service}`
    }]);

    const inlineKb = [];
    for (let i = 0; i < buttons.length; i += 2) {
        inlineKb.push(buttons.slice(i, i + 2).map(b => b[0]));
    }

    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, 
        `📋 <b>${categoryName}</b> xizmatlari:\nXizmatni tanlang:`, 
        {parse_mode: 'HTML', reply_markup: { inline_keyboard: inlineKb }}
    );
});

// Xatolarni nazorat qilish
bot.on('polling_error', (err) => console.error('Xato:', err.code));
console.log('✅ Bot topsmm.uz API ga to‘liq ulandi va ishga tushdi!');
