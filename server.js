const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TOKEN = '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';
const API_URL = 'https://topsmm.uz/api/v2';
const API_KEY = 'f1152704a5c99b2877ec57ad6b53f892'; // <--- API Keyingizni yozing
const PROFIT = 1.25; // 25% ustama

const bot = new TelegramBot(TOKEN, { polling: true });

// API orqali barcha xizmatlarni olish
async function getServices() {
    try {
        const response = await axios.post(API_URL, { key: API_KEY, action: 'services' });
        return response.data;
    } catch (e) { return []; }
}

// Start
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "SMM botga xush kelibsiz!", {
        reply_markup: {
            keyboard: [['📦 Buyurtma berish', '💰 Balans']],
            resize_keyboard: true
        }
    });
});

// Buyurtma menyusi
bot.on('message', async (msg) => {
    if (msg.text === '📦 Buyurtma berish') {
        const services = await getServices();
        const buttons = services.slice(0, 5).map(s => [{
            text: `${s.name} - ${(s.rate * PROFIT).toFixed(2)} $`,
            callback_data: `service_${s.service}`
        }]);
        
        bot.sendMessage(msg.chat.id, "Xizmatni tanlang:", {
            reply_markup: { inline_keyboard: buttons }
        });
    }

    if (msg.text === '💰 Balans') {
        const res = await axios.post(API_URL, { key: API_KEY, action: 'balance' });
        bot.sendMessage(msg.chat.id, `Sizning balansingiz: ${res.data.balance} ${res.data.currency}`);
    }
});

// Xizmatni tanlash va buyurtma
bot.on('callback_query', (query) => {
    if (query.data.startsWith('service_')) {
        const serviceId = query.data.split('_')[1];
        bot.sendMessage(query.message.chat.id, `ID: ${serviceId} tanlandi. Link yuboring:`);
        // Bu yerda foydalanuvchidan link olib, order funksiyasini chaqirasiz
    }
});
