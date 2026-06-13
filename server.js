const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const mongoose = require('mongoose');

// --- SOZLAMALAR (Bularni panelingizdan olib, bir marta kiriting) ---
const TOKEN = '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';
const MONGO_URI = "mongodb+srv://Odil014:mutRjmtuog5CwbLD@cluster0.dzhhdpf.mongodb.net/smm_database?retryWrites=true&w=majority";
const API_URL = '	https://topsmm.uz/api/v2'; // <--- SHU YERGA API LINKINGIZNI YOZING
const API_KEY = 'f1152704a5c99b2877ec57ad6b53f892';              // <--- SHU YERGA API KEYINGIZNI YOZING
const PROFIT = 1.25; 

const bot = new TelegramBot(TOKEN, { polling: true });

// --- MONGODB ---
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB ulandi!"))
    .catch(err => console.error("❌ DB Xatosi:", err.message));

// --- API FUNKSIYA ---
async function getPrice(serviceId) {
    try {
        const response = await axios.post(API_URL, { key: API_KEY, action: 'services' });
        const service = response.data.find(s => s.service == serviceId);
        return service ? (parseFloat(service.rate) * PROFIT).toFixed(2) : "0.00";
    } catch (e) {
        return "Xatolik";
    }
}

// --- BOT LOGIKASI ---
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Assalomu alaykum! Xush kelibsiz.", {
        reply_markup: {
            keyboard: [['📦 Buyurtma berish']],
            resize_keyboard: true
        }
    });
});

bot.on('message', (msg) => {
    if (msg.text === '📦 Buyurtma berish') {
        bot.sendMessage(msg.chat.id, "Ijtimoiy tarmoqni tanlang:", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🌐 TELEGRAM', callback_data: 'cat_tg' }],
                    [{ text: '❤️ INSTAGRAM', callback_data: 'cat_insta' }]
                ]
            }
        });
    }
});

bot.on('callback_query', async (query) => {
    const { chat, message_id } = query.message;
    
    // Telegram tugmasi
    if (query.data === 'cat_tg') {
        const price = await getPrice(1); // 1 - bu xizmat ID (panelingizdan qarang)
        bot.editMessageText(`🌐 Telegram Obunachi narxi:\n💰 ${price} $`, {
            chat_id: chat.id, message_id,
            reply_markup: { inline_keyboard: [[{ text: '◀️ Orqaga', callback_data: 'back' }]] }
        });
    }

    // Instagram tugmasi
    if (query.data === 'cat_insta') {
        const price = await getPrice(2); // 2 - bu xizmat ID
        bot.editMessageText(`❤️ Instagram Obunachi narxi:\n💰 ${price} $`, {
            chat_id: chat.id, message_id,
            reply_markup: { inline_keyboard: [[{ text: '◀️ Orqaga', callback_data: 'back' }]] }
        });
    }
});
