exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({
        success: false,
        message: 'Method Not Allowed'
      })
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');

    const name = data.name || 'Не вказано';
    const phone = data.phone || 'Не вказано';
    const service = data.service || 'Не вказано';
    const objectType = data.object || data.object_type || 'Не вказано';
    const comment = data.comment || data.message || 'Без коментаря';
    const pageUrl = data.page_url || data.page || 'Не вказано';

    const web3formsAccessKey = process.env.WEB3FORMS_ACCESS_KEY;
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (!web3formsAccessKey || !telegramBotToken || !telegramChatId) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Missing environment variables'
        })
      };
    }

    const ccEmail = process.env.NOTIFICATION_CC_EMAIL;

    const web3formsPayload = {
      access_key: web3formsAccessKey,
      subject: data.subject || 'Нова заявка — Clean Factory',
      from_name: data.from_name || 'Clean Factory Website',
      botcheck: '',
      ...(ccEmail && { cc: ccEmail }),
      name,
      phone,
      service,
      object_type: objectType,
      comment,
      page_url: pageUrl
    };

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
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(web3formsPayload)
    });

    const telegramRequest = fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: telegramMessage
        })
      }
    );

    const [web3formsResponse, telegramResponse] = await Promise.all([
      web3formsRequest,
      telegramRequest
    ]);

    let web3formsResult = {};
    let web3formsOk = false;
    try {
      web3formsResult = await web3formsResponse.json();
      web3formsOk = web3formsResponse.ok && web3formsResult.success;
      console.log('WEB3FORMS status:', web3formsResponse.status, JSON.stringify(web3formsResult));
    } catch (e) {
      console.log('WEB3FORMS parse error:', web3formsResponse.status, e.message);
    }

    let telegramResult = {};
    let telegramOk = false;
    try {
      telegramResult = await telegramResponse.json();
      telegramOk = telegramResponse.ok && telegramResult.ok;
      console.log('TELEGRAM status:', telegramResponse.status, JSON.stringify(telegramResult));
    } catch (e) {
      console.log('TELEGRAM parse error:', telegramResponse.status, e.message);
    }

    if (!telegramOk && !web3formsOk) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Lead was not sent',
          web3forms: web3formsResult,
          telegram: telegramResult
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Lead sent successfully',
        web3forms: web3formsOk,
        web3forms_status: web3formsResponse.status,
        web3forms_result: web3formsResult,
        telegram: telegramOk
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: error.message
      })
    };
  }
};