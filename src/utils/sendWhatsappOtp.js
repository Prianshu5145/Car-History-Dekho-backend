// utils/sendWhatsappOtp.js
const axios = require('axios');

const sendWhatsappOtp = async (phoneNumber, otp) => {
  const url = `https://graph.facebook.com/v21.0/${process.env.PHONE_ID}/messages`;

  const data = {
    messaging_product: "whatsapp",
    to: phoneNumber, // Must be in international format
    type: "template",
    template: {
      name: "authentication_template", // Your approved template name
      language: { code: "en_US" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: otp },
           
          ]
        },
        {
        "type": "button",
        "sub_type": "url",
        "index": "0",
        "parameters": [
          {
            "type": "text",
            "text": otp  
          }
        ]
      }
      ]
    }
  };

  const headers = {
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json',
  };

  await axios.post(url, data, { headers });
};

module.exports = sendWhatsappOtp;
