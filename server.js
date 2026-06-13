const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const mongoose = require('mongoose');

const TOKEN = '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';
const MONGO_URI = "mongodb+srv://Odil014:mutRjmtuog5CwbLD@cluster0.dzhhdpf.mongodb.net/smm_database?retryWrites=true&w=majority";
const PROFIT_PERCENT = 1.25; // 25% ustama

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB ga ulandi!"))
    .catch(err => console.error("❌ MongoDB xatosi:", err.message));

const bot = new TelegramBot(TOKEN, { polling: true });

// --- ASOSIY MENYU ---
const mainKeyboard = {
    reply_markup: {
        keyboard: [
            ['📦 Buyurtma berish', '📞 Nomer olish'],
            ['📊 Buyurtmalar', '💳 Mening hisobim'],
            ['🔗 Referal tizimi', '💰 Hisob to\'ldirish'],
            ['🎧 Murojaat qilish', '📖 Qo\'llanmalar']
        ],
        resize_keyboard: true
    }
};

// --- IJTIMOIY TARMOQLAR ---
const socialMediaKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: '🌐 TELEGRAM 🔵', callback_data: 'cat_telegram' }, { text: '❤️ INSTAGRAM 🤍', callback_data: 'cat_insta' }],
            [{ text: '🖤 TikTok ❤️', callback_data: 'cat_tiktok' }, { text: '❤️ YouTube 🖤', callback_data: 'cat_yt' }],
            [{ text: '⭐ Stars yulduz va Premium...', callback_data: 'cat_stars' }, { text: '💬 WhatsApp', callback_data: 'cat_wa' }],
            [{ text: '🌐 Facebook 🔵', callback_data: 'cat_fb' }, { text: '🤎 Twitter', callback_data: 'cat_twitter' }],
            [{ text: '🔔 Twitch', callback_data: 'cat_twitch' }, { text: '🪖 Vk obunachilar', callback_data: 'cat_vk' }],
            [{ text: '❇️ @Threads Instagram ❇️', callback_data: 'cat_threads' }, { text: '😱 TEKIN NAKRUTKA 🎁', callback_data: 'cat_free' }],
            [{ text: '⚡ TELEGRAM GIFT HADYALAR 🌹🎁', callback_data: 'cat_gift' }]
        ]
    }
};

// --- START BUYRUG'I ---
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Assalomu alaykum! Xush kelibsiz. Quyidagi menyudan foydalaning:", mainKeyboard);
});

// --- MENYU BOSILGANDA ---
bot.on('message', (msg) => {
    if (msg.text === '📦 Buyurtma berish') {
        bot.sendMessage(msg.chat.id, "Quyidagi ijtimoiy tarmoqlardan birini tanlang:", socialMediaKeyboard);
    }
});

// --- CALLBACKLAR (TUGMALAR) ---
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    // Telegram menyusi (Sizning rasmingizdagi)
    if (data === 'cat_telegram') {
        bot.editMessageText("Quyidagi bo'limlardan birini tanlang:", {
            chat_id: chatId, message_id: query.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🌐 1-Baza TELEGRAM OBUNACHILAR 👥', callback_data: 'serv_tg1' }],
                    [{ text: '♻️ Telegram Online 🌐 obunachilar 👤', callback_data: 'serv_tg_online' }],
                    [{ text: '⭐ ARZON PREMIUM OBUNACHI ⭐', callback_data: 'serv_tg_premium_cheap' }],
                    [{ text: '◀️ Orqaga', callback_data: 'back_to_main' }]
                ]
            }
        });
    }

    // Orqaga qaytish
    if (data === 'back_to_main') {
        bot.editMessageText("Quyidagi ijtimoiy tarmoqlardan birini tanlang:", {
            chat_id: chatId, message_id: query.message.message_id, ...socialMediaKeyboard
        });
    }
});
