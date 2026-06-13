const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const mongoose = require('mongoose');

const TOKEN = '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';
const API_URL = 'https://smm-panel-sayti.com/api/v2'; // SMM panelingiz API manzili
const API_KEY = 'YOUR_API_KEY_HERE'; // Panel settings dan olasiz
const PROFIT = 1.25; // 25% ustama

const bot = new TelegramBot(TOKEN, { polling: true });

// API orqali narxlarni olish va 25% qo'shish funksiyasi
async function getServicePrice(serviceId) {
    try {
        const response = await axios.post(API_URL, { key: API_KEY, action: 'services' });
        const service = response.data.find(s => s.service == serviceId);
        return service ? (service.rate * PROFIT).toFixed(2) : "Noma'lum";
    } catch (error) {
        return "Xatolik";
    }
}

// Tugmalar logikasi
bot.on('callback_query', async (query) => {
    const data = query.data;
    const chatId = query.message.chat.id;

    if (data === 'serv_tg1') {
        const price = await getServicePrice(1); // 1 - bu API dagi service ID
        bot.sendMessage(chatId, `🌐 1-Baza Telegram Obunachilar\nNarxi: ${price} $ (25% ustama bilan)`);
    }
    
    // Boshqa barcha tugmalar uchun shunday bloklar qo'shasiz...
});
