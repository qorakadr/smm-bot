const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const mongoose = require('mongoose');

// --- SOZLAMALAR ---
const TOKEN = '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';
const MONGO_URI = "mongodb+srv://Odil014:mutRjmtuog5CwbLD@cluster0.dzhhdpf.mongodb.net/smm_database?retryWrites=true&w=majority";
const API_URL = 'https://smm-panel-sayti.com/api/v2'; // O'z panelingiz manzilini yozing
const API_KEY = 'SIZNING_API_KALITINGIZ'; // Panel API KEY
const PROFIT = 1.25; // 25% ustama

const bot = new TelegramBot(TOKEN, { polling: true });

// --- MONGODB ULANISH ---
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB ga ulandi!"))
    .catch(err => console.error("❌ MongoDB xatosi:", err.message));

// --- API DAN NARX OLISH FUNKSIYASI ---
async function getPrice(serviceId) {
    try {
        const response = await axios.post(API_URL, { key: API_KEY, action: 'services' });
        const service = response.data.find(s => s.service == serviceId);
        return service ? (parseFloat(service.rate) * PROFIT).toFixed(2) : "0.00";
    } catch (error) {
        return "Xatolik";
    }
}

// --- ASOSIY MENYU ---
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Assalomu alaykum! SMM xizmatlar botiga xush kelibsiz.", {
        reply_markup: {
            keyboard: [['📦 Buyurtma berish', '📊 Buyurtmalar'], ['💳 Mening hisobim', '💰 Hisob to\'ldirish']],
            resize_keyboard: true
        }
    });
});

// --- MENYU BOSILGANDA ---
bot.on('message', (msg) => {
    if (msg.text === '📦 Buyurtma berish') {
        bot.sendMessage(msg.chat.id, "Ijtimoiy tarmoqni tanlang:", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🌐 TELEGRAM', callback_data: 'cat_tg' }, { text: '❤️ INSTAGRAM', callback_data: 'cat_insta' }],
                    [{ text: '🖤 TIKTOK', callback_data: 'cat_tiktok' }]
                ]
            }
        });
    }
});

// --- CALLBACKLAR (API ULANISHI) ---
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    // Telegram bo'limi
    if (data === 'cat_tg') {
        bot.editMessageText("Telegram xizmatlari:", {
            chat_id: chatId, message_id: query.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🌐 1-Baza Telegram Obunachi', callback_data: 'serv_tg1' }],
                    [{ text: '◀️ Orqaga', callback_data: 'back_to_main' }]
                ]
            }
        });
    }

    // Narxni hisoblash (25% ustama bilan)
    if (data === 'serv_tg1') {
        const price = await getPrice(123); // 123 o'rniga panelingizdagi ID ni yozing
        bot.sendMessage(chatId, `✅ Xizmat: Telegram 1-Baza\n💰 Narxi: ${price} $`);
    }

    // Orqaga qaytish
    if (data === 'back_to_main') {
        bot.editMessageText("Ijtimoiy tarmoqni tanlang:", {
            chat_id: chatId, message_id: query.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🌐 TELEGRAM', callback_data: 'cat_tg' }, { text: '❤️ INSTAGRAM', callback_data: 'cat_insta' }],
                    [{ text: '🖤 TIKTOK', callback_data: 'cat_tiktok' }]
                ]
            }
        });
    }
});
