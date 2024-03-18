import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();
const __dirname = path.resolve();
const token = "7164356424:AAGz9XQfw-QbxE82RZdHqoAp_Kulqhmc8ZQ";
const bot = new TelegramBot(token, { polling: true });

const sentGifs = {};

// Добавляем флаг disable_web_page_preview: true, чтобы кнопка была кликабельна
const menu = {
  reply_markup: {
    keyboard: [[{ text: "Гифка" }]],
    resize_keyboard: true,
    one_time_keyboard: false,
    disable_web_page_preview: true,
  },
};

// Создаем переменную isButtonDisabled
let isButtonDisabled = false;

// Создаем папку logs, если она не существует
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Привет, я ботик который шлет гифки крутые вот, нажми и давай посмеемся",
    menu
  );
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  // Добавляем проверку на значение флага isButtonDisabled
  if (msg.text === "Гифка" && !isButtonDisabled) {
    // Задаем значение флага isButtonDisabled в true
    isButtonDisabled = true;
    setTimeout(() => {
      isButtonDisabled = false;
    }, 5000);

    if (!sentGifs[chatId]) {
      sentGifs[chatId] = [];
    }

    const gifs = fs.readdirSync(path.join(__dirname, "gifs"));

    const filteredGifs = gifs.filter(
      (gif, index) => !sentGifs[chatId].includes(index)
    );

    if (filteredGifs.length === 0) {
      sentGifs[chatId] = [];
      return bot.sendMessage(chatId, "Это все гифки, дальше с начала", menu);
    }

    const randomGif =
      filteredGifs[Math.floor(Math.random() * filteredGifs.length)];

    await bot.sendDocument(chatId, path.join(__dirname, "gifs", randomGif), {
      contentType: "image/gif",
    });

    sentGifs[chatId].push(gifs.indexOf(randomGif));

    // Записываем активность пользователя в файл activity.log
    const username = msg.from.username || "Unknown username";
    const first_name = msg.from.first_name || "Unknown first_name";
    const logMsg = `User ${username}/${first_name} requested a gif at ${new Date().toISOString()}\n`;
    fs.appendFile(path.join(logsDir, "activity.log"), logMsg, (err) => {
      if (err) console.error(err);
    });
  } else{
    // Если кнопка заблокирована, сообщаем пользователю об этом только один раз
    bot.sendMessage(chatId, "Подожди 5 секунд", menu);
  }
});
