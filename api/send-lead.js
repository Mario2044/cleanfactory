module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const data = req.body;

    const name = data.name || 'Не вказано';
    const phone = data.phone || 'Не вказано';
    const service = data.service || 'Не вказано';
    const objectType = data.object || data.object_type || 'Не вказано';
    const comment = data.comment || data.message || 'Без коментаря';
    const pageUrl = data.page_url || 'Не вказано';

    const web3formsAccessKey = process.env.WEB3FORMS_ACCESS_KEY;
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_GROUP_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

    if (!telegramBotToken || !telegramChatId) {
      return res.status(500).json({ success: false, message: 'Missing environment variables' });
    }

    const telegramMessage = `
🧼 Нова заявка Clean Factory

👤 Імʼя: ${name}
📞 Телефон: ${phone}
🧽 Послуга: ${service}
🏠 Тип обʼєкта: ${objectType}
💬 Коментар: ${comment}

🌐 Сторінка: ${pageUrl}
    `.trim();

    console.log(`Sending to chat_id: ${telegramChatId}`);

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramChatId, text: telegramMessage })
      }
    );

    let telegramOk = false;
    try {
      const telegramResult = await telegramResponse.json();
      telegramOk = telegramResponse.ok && telegramResult.ok;
      if (telegramOk) {
        console.log(`TELEGRAM OK: message sent to ${telegramChatId}`);
      } else {
        console.log(`TELEGRAM FAIL: ${telegramResponse.status}`, JSON.stringify(telegramResult));
      }
    } catch (e) {
      console.log('TELEGRAM parse error:', e.message);
    }

    if (!telegramOk) {
      return res.status(500).json({ success: false, message: 'Telegram send failed' });
    }

    return res.status(200).json({ success: true, telegram: true });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
