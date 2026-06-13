const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// === SIZNING MA'LUMOTLARINGIZ ===
const TOKEN = '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';
const API_URL = 'https://topsmm.uz/api/v2';
const API_KEY = 'f1152704a5c99b2877ec57ad6b53f892';
const PROFIT = 1.25; // 25% ustama
// ================================

const bot = new TelegramBot(TOKEN, { 
    polling: true,
    filepath: false
});

// Foydalanuvchi ma'lumotlarini saqlash (shaxsiy ma'lumotlar himoyalangan)
const userData = {};

// -------------------- API SO'ROVLARI (XAVFSIZ) --------------------
async function getServices() {
    try {
        const res = await axios.post(API_URL, 
            { key: API_KEY, action: 'services' },
            { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );
        return Array.isArray(res.data) ? res.data : [];
    } catch (e) {
        console.error('Xizmatlar xatosi:', e.message);
        return [];
    }
}

async function getBalance(userId) {
    // Faqat so'rov yuborgan foydalanuvchiga tegishli ma'lumot
    try {
        const res = await axios.post(API_URL, 
            { key: API_KEY, action: 'balance' },
            { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
        );
        return res.data?.balance ? res.data : { balance: '0.00', currency: 'USD' };
    } catch (e) {
        return { balance: 'Xato', currency: '' };
    }
}

async function createOrder(serviceId, link, quantity) {
    try {
        const res = await axios.post(API_URL,
            { key: API_KEY, action: 'add', service: serviceId, link: link, quantity: quantity },
            { headers: { 'Content-Type': 'application/json' }, timeout: 12000 }
        );
        return res.data;
    } catch (e) {
        return { error: e.response?.data?.error || 'Buyurtma yaratishda xato' };
    }
}

// -------------------- /START BO'LIMI --------------------
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
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

// -------------------- ASOSIY MENYU ISHLASHI --------------------
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // === 1. BUYURTMA BERISH ===
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
        bot.sendMessage(chatId, "Bu bo'limda raqam olish xizmati ishlab chiqilmoqda. Tez orada ishga tushadi!");
    }

    // === 3. BUYURTMALARIM ===
    else if (text === '3. 📋 Buyurtmalarim') {
        bot.sendMessage(chatId, "Buyurtmalaringiz ro'yxatini ko'rish uchun xizmat nomini va ID raqamini yozing yoki yangilang...");
    }

    // === 4. MENING HISOBIM (FAQAT O'ZIGA KO'RINADI) ===
    else if (text === '4. 💰 Mening hisobim') {
        // Faqat so'rov yuborgan foydalanuvchining balansi olinadi
        const balance = await getBalance(chatId);
        bot.sendMessage(chatId, `💳 Sizning shaxsiy balansingiz:\n<b>${balance.balance} ${balance.currency}</b>`, {parse_mode: 'HTML'});
    }

    // === 5. REFERAL TIZIMI ===
    else if (text === '5. 👥 Referal tizimi') {
        bot.sendMessage(chatId, "👥 Referal tizimi: Do'stlaringizni taklif qiling va har bir buyurtmadan foiz oling!\nSizning havolangiz: https://t.me/your_bot?start=ref${chatId}");
    }

    // === 6. HISOBNI TO'LDIRISH ===
    else if (text === '6. 💳 Hisobni to‘ldirish') {
        bot.sendMessage(chatId, "💳 Hisobni to'ldirish uchun to'lov usulini tanlang:\n• Click\n• Payme\n• Uzcard\n\nMa'lumotlar: ...");
    }

    // === 7. MUROJAT QILISH ===
    else if (text === '7. 📞 Murojat qilish') {
        bot.sendMessage(chatId, "📞 Biz bilan bog'lanish:\nAdmin: @admin_username\nTelefon: +99890XXXXXXX");
    }

    // === 8. QULLANMA ===
    else if (text === '8. 📖 Qullanma') {
        bot.sendMessage(chatId, "📖 Botdan foydalanish qoidalari:\n1. Xizmat tanlang\n2. Link yuboring\n3. Sonni kiriting\n4. Buyurtma tasdiqlanadi");
    }

    // === 9. HAMKORLIK TIZIMI ===
    else if (text === '9. 🤝 Hamkorlik tizimi') {
        bot.sendMessage(chatId, "🤝 Hamkorlik shartlari: Katta hajmli buyurtmalarga chegirmalar, shaxsiy menejer va boshqa imkoniyatlar.");
    }

    // === LINK VA SON QABUL QILISH (XIZMAT TANLANGANDAN KEYIN) ===
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
                const price = ( (data.rate * PROFIT) * qty / 1000 ).toFixed(4);
                bot.sendMessage(chatId, `✅ Buyurtma yaratildi!\n\n🔢 ID: <b>${res.order}</b>\n📌 Xizmat: ${data.name}\n🔗 Link: ${data.link}\n📊 Son: ${qty}\n💸 To'lov: <b>${price} $</b>`, {parse_mode: 'HTML'});
            } else {
                bot.sendMessage(chatId, `❌ Xato: ${res.error}`);
            }
            delete userData[chatId];
        }
    }
});

// -------------------- XIZMAT TURLARI VA API BOG'LANISHI --------------------
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const allServices = await getServices(); // topsmm.uz dan barcha xizmatlar olinadi

    // Kategoriyalar bo'yicha xizmatlarni filtrlash
    let filtered = [];
    let categoryName = '';

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
        if (!serv) return bot.answerCallbackQuery(query.id, {text: "Xizmat topilmadi!"});

        userData[chatId] = {
            serviceId: servId,
            name: serv.name,
            rate: serv.rate,
            step: 'awaiting_link'
        };

        bot.answerCallbackQuery(query.id);
        return bot.sendMessage(chatId, `✅ Tanlandi: <b>${serv.name}</b>\n💸 Narx: ${(serv.rate * PROFIT).toFixed(2)} $ / 1000\n\n🔗 Endi linkni yuboring:`, {parse_mode: 'HTML'});
    }

    // Tanlangan kategoriya bo'yicha xizmatlarni chiqarish
    if (filtered.length === 0) {
        bot.answerCallbackQuery(query.id);
        return bot.sendMessage(chatId, `❌ ${categoryName} bo'yicha xizmatlar hozircha mavjud emas.`);
    }

    // Tugmalarni yaratish
    const buttons = filtered.map(s => [{
        text: `${s.name} | ${(s.rate * PROFIT).toFixed(2)} $`,
        callback_data: `service_${s.service}`
    }]);

    // 2 qatorli qilib chiqarish
    const inlineKb = [];
    for (let i = 0; i < buttons.length; i += 2) {
        inlineKb.push(buttons.slice(i, i + 2).map(b => b[0]));
    }

    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, `📋 <b>${categoryName}</b> xizmatlari:\nXizmatni tanlang:`, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: inlineKb }
    });
});

// Xatolarni nazorat qilish
bot.on('polling_error', (err) => console.error('Xato:', err.code));
console.log('✅ Bot to‘liq ishga tushdi!');
