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
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (!web3formsAccessKey || !telegramBotToken || !telegramChatId) {
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

    const web3formsRequest = fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: web3formsAccessKey,
        subject: 'Нова заявка — Clean Factory',
        from_name: 'Clean Factory Website',
        botcheck: '',
        name, phone, service,
        object_type: objectType,
        comment,
        page_url: pageUrl
      })
    });

    const telegramRequest = fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramChatId, text: telegramMessage })
      }
    );

    const [web3formsResponse, telegramResponse] = await Promise.all([web3formsRequest, telegramRequest]);

    let web3formsOk = false;
    try {
      const web3formsResult = await web3formsResponse.json();
      web3formsOk = web3formsResponse.ok && web3formsResult.success;
      console.log('WEB3FORMS:', web3formsResponse.status, JSON.stringify(web3formsResult));
    } catch (e) {
      console.log('WEB3FORMS parse error:', web3formsResponse.status, e.message);
    }

    let telegramOk = false;
    try {
      const telegramResult = await telegramResponse.json();
      telegramOk = telegramResponse.ok && telegramResult.ok;
      console.log('TELEGRAM:', telegramResponse.status, JSON.stringify(telegramResult));
    } catch (e) {
      console.log('TELEGRAM parse error:', telegramResponse.status, e.message);
    }

    if (!telegramOk && !web3formsOk) {
      return res.status(500).json({ success: false, message: 'Lead was not sent' });
    }

    return res.status(200).json({ success: true, web3forms: web3formsOk, telegram: telegramOk });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
