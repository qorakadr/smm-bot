const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const mongoose = require('mongoose');

const TOKEN = '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';
const API_URL = 'https://smm-panel-sayti.com/api/v2'; // API manzilingiz
const API_KEY = 'SIZNING_API_KALITINGIZ'; // Panel API KEY
const PROFIT = 1.25; 

const bot = new TelegramBot(TOKEN, { polling: true });

// API dan narx olish
async function getPrice(serviceId) {
    try {
        const res = await axios.post(API_URL, { key: API_KEY, action: 'services' });
        const service = res.data.find(s => s.service == serviceId);
        return service ? (service.rate * PROFIT).toFixed(2) : "0.00";
    } catch { return "Xatolik"; }
}

// 1. ASOSIY MENYU
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Assalomu alaykum! Xush kelibsiz.", {
        reply_markup: {
            keyboard: [['📦 Buyurtma berish', '📊 Buyurtmalar'], ['💳 Mening hisobim', '💰 Hisob to\'ldirish']],
            resize_keyboard: true
        }
    });
});

// 2. CALLBACK (TUGMALAR) LOGIKASI
bot.on('callback_query', async (query) => {
    const { chat, message_id } = query.message;
    const data = query.data;

    // Asosiy menyu
    if (data === 'back_to_main') {
        bot.editMessageText("Ijtimoiy tarmoqni tanlang:", {
            chat_id: chat.id, message_id,
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🌐 TELEGRAM', callback_data: 'cat_tg' }, { text: '❤️ INSTAGRAM', callback_data: 'cat_insta' }]
                ]
            }
        });
    }

    // TELEGRAM bo'limi
    if (data === 'cat_tg') {
        bot.editMessageText("Telegram xizmatlari:", {
            chat_id: chat.id, message_id,
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🌐 1-Baza Obunachi', callback_data: 'serv_tg1' }],
                    [{ text: '◀️ Orqaga', callback_data: 'back_to_main' }]
                ]
            }
        });
    }

    // Xizmat narxini ko'rsatish
    if (data === 'serv_tg1') {
        const price = await getPrice(123); // API ID ni yozing
        bot.sendMessage(chat.id, `Narxi: ${price} $`);
    }
});

// Buyurtma berish tugmasini ushlash
bot.on('message', (msg) => {
    if (msg.text === '📦 Buyurtma berish') {
        bot.sendMessage(msg.chat.id, "Ijtimoiy tarmoqni tanlang:", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🌐 TELEGRAM', callback_data: 'cat_tg' }, { text: '❤️ INSTAGRAM', callback_data: 'cat_insta' }]
                ]
            }
        });
    }
});
