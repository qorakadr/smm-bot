const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// === SIZNING MA'LUMOTLARINGIZ ===
const TOKEN = '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';
const API_URL = 'https://topsmm.uz/api/v2';
const API_KEY = 'f1152704a5c99b2877ec57ad6b53f892';
const PROFIT = 1.25; // 25% ustama
const REFERRAL_PERCENT = 10; // Referaldan 10% foiz
const ADMIN_ID = 123456789; // O'zingizning Telegram ID raqamingizni yozing
const MY_CARD = "8600 1234 5678 9012"; // Sizning karta raqamingiz
// ================================

// ❗ FAQAT POLLING REJIMI — PORT KERAK EMAS
const bot = new TelegramBot(TOKEN, { polling: true });

// Foydalanuvchi ma'lumotlari
const userData = {};
const userBalance = {}; // Faqat admin to'ldiradigan shaxsiy balans
const referralData = {};

// -------------------- API FUNKSIYALARI --------------------
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

async function createOrder(serviceId, link, quantity, extras = {}) {
    try {
        const formData = new URLSearchParams();
        formData.append('key', API_KEY);
        formData.append('action', 'add');
        formData.append('service', serviceId);
        formData.append('link', link);
        formData.append('quantity', quantity);

        for (let key in extras) {
            if (extras[key]) formData.append(key, extras[key]);
        }

        const res = await axios.post(API_URL, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 15000
        });
        return res.data;
    } catch (e) {
        return { error: e.response?.data?.error || 'Buyurtma xatosi' };
    }
}

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

// -------------------- /START MENYU --------------------
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const refId = msg.text.split(' ')[1] || null;

    if (refId && !referralData[chatId]) {
        referralData[chatId] = { invitedBy: refId, balance: 0 };
        if (!referralData[refId]) referralData[refId] = { invited: [], balance: 0 };
        referralData[refId].invited.push(chatId);
        bot.sendMessage(refId, `🎉 Yangi foydalanuvchi sizning havolangiz orqali qo'shildi!`);
    }

    if (!userBalance[chatId]) userBalance[chatId] = 0;

    bot.sendMessage(chatId, `👋 SMM BOTGA XUSH KELIBSIZ!\n\nQuyidagi bo'limlardan keraklisini tanlang:`, {
        reply_markup: {
            keyboard: [
                ['📦 Buyurtma berish', '🆔 Nomer olish'],
                ['📋 Buyurtmalarim', '💰 Mening hisobim'],
                ['👥 Referal tizimi', '💳 Hisobni to‘ldirish'],
                ['📞 Murojat qilish', '📖 Qullanma'],
                ['🤝 Hamkorlik tizimi']
            ],
            resize_keyboard: true
        }
    });
});

// -------------------- ADMIN BUYRUQLARI --------------------
bot.onText(/\/toldir (.+) (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    if (chatId != ADMIN_ID) return;

    const userId = parseInt(match[1]);
    const sum = parseFloat(match[2]);

    if (!userBalance[userId]) userBalance[userId] = 0;
    userBalance[userId] += sum;

    bot.sendMessage(chatId, `✅ Foydalanuvchi <b>${userId}</b> hisobiga <b>${sum} USD</b> yozildi.\nJami: ${userBalance[userId]} USD`, {parse_mode: 'HTML'});
    bot.sendMessage(userId, `💳 Hisobingizga <b>${sum} USD</b> pul o'tkazildi!\nYangi balans: <b>${userBalance[userId]} USD</b>`, {parse_mode: 'HTML'});
});

// -------------------- ASOSIY BO'LIMLAR --------------------
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '📦 Buyurtma berish') {
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

    else if (text === '🆔 Nomer olish') {
        bot.sendMessage(chatId, "📞 Raqam olish xizmati ishlab chiqilmoqda. Tez orada ishga tushadi!");
    }

    else if (text === '📋 Buyurtmalarim') {
        bot.sendMessage(chatId, "🔍 Buyurtma holatini tekshirish uchun ID raqamini yozing:\nMisol: /status 123456");
    }

    else if (text === '💰 Mening hisobim') {
        const refBal = referralData[chatId]?.balance || 0;
        bot.sendMessage(chatId, 
            `💳 <b>SHAXSIY HISOBIM</b>\n\n` +
            `Mavjud balans: <b>${userBalance[chatId] || 0} USD</b>\n` +
            `Referal balans: <b>${refBal} USD</b>\n\n` +
            `❗ Balans faqat admin tomonidan to'ldirilgandan keyin ko'rinadi va ishlaydi!`, 
            {parse_mode: 'HTML'}
        );
    }

    else if (text === '👥 Referal tizimi') {
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

    else if (text === '💳 Hisobni to‘ldirish') {
        bot.sendMessage(chatId,
            `💳 <b>HISOBNI TO'LDIRISH</b>\n\n` +
            `Pul o'tkazish uchun quyidagi kartaga yuboring:\n` +
            `<code>${MY_CARD}</code>\n\n` +
            `To'lov qilib bo'lgach, chekni rasm sifatida yuboring va o'zingizning ID raqamingizni yozing.\n` +
            `Admin tekshirib, hisobingizga pul yozib beradi.`,
            {parse_mode: 'HTML'}
        );
    }

    else if (text === '📞 Murojat qilish') {
        bot.sendMessage(chatId,
            `📞 <b>MUROJAT QILISH</b>\n\n` +
            `Admin: @SMM_Admin\n` +
            `Telefon: +998 99 123 45 67\n` +
            `Ish vaqti: 9:00 - 18:00`,
            {parse_mode: 'HTML'}
        );
    }

    else if (text === '📖 Qullanma') {
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

    else if (text === '🤝 Hamkorlik tizimi') {
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

            const pricePer1k = data.rate * PROFIT;
            const totalPrice = (pricePer1k * qty / 1000).toFixed(4);

            if (parseFloat(userBalance[chatId]) < parseFloat(totalPrice)) {
                delete userData[chatId];
                return bot.sendMessage(chatId, `❌ Hisobingizda yetarli mablag' yo'q!\nMavjud: ${userBalance[chatId]} USD\nKerak: ${totalPrice} USD`);
            }

            bot.sendMessage(chatId, "⏳ Buyurtma yaratilmoqda...");
            const res = await createOrder(data.serviceId, data.link, qty);

            if (res.order) {
                userBalance[chatId] = (parseFloat(userBalance[chatId]) - parseFloat(totalPrice)).toFixed(4);

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
                    `💸 To'lov: <b>${totalPrice} $</b>\n` +
                    `💳 Qolgan balans: <b>${userBalance[chatId]} USD</b>\n\n` +
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

// -------------------- BUYURTMA HOLATI --------------------
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

// -------------------- KATEGORIYALAR VA XIZMATLAR --------------------
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const allServices = await getServices();

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

    if (filtered.length === 0) {
        bot.answerCallbackQuery(query.id);
        return bot.sendMessage(chatId, `❌ ${categoryName} bo'yicha xizmatlar hozircha mavjud emas.`);
    }

    const buttons = filtered.map(s => [{
        text: `${s.name}\n💵 ${(s.rate * PROFIT).toFixed(2)} $`,
        callback_data: `service_${s.service}`
    }]);

    const inlineKb = [];
    for (let i = 0; i < buttons.length; i += 1) {
        inlineKb.push(buttons[i]);
    }

    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, 
        `📋 <b>${categoryName}</b> xizmatlari:\nQuyidagilardan tanlang:`, 
        {parse_mode: 'HTML', reply_markup: { inline_keyboard: inlineKb }}
    );
});

// Xatolarni nazorat qilish
bot.on('polling_error', (err) => console.error('Xato:', err.code));

// ✅ DOIMIY ISHLASH UCHUN — PORT KERAK EMAS
setInterval(() => {
  console.log("✅ Bot ishlayapti...");
}, 10 * 60 * 1000);

console.log('✅ Bot to\'liq sozlandi va ishga tushdi!');
