'use strict';

const axios = require('axios');

module.exports = function (settings, botControl) {
  let { pageAccessToken, verifyToken } = settings;

  return async (req, res) => {
    res.status(200);

    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === verifyToken) {
      res.send(req.query['hub.challenge']);
    }

    if (req.body && req.body.object) {
      let data = req.body;

      if (data.object === 'page' && data.entry) {
        for (let entry of data.entry) {
          for (let event of entry.messaging) {
            if (event.message) {
              let text = event.message.text || '';
              let userId = 'fb_' + event.sender.id;

              let answer = await botControl(userId, text);

              userId = answer.userId.split('fb_')[1];
              text = answer.text;

              await axios.request({
                url: 'https://graph.facebook.com/v2.6/me/messages',
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                params: {
                  access_token: pageAccessToken
                },
                data: JSON.stringify({
                  recipient: {
                    id: userId
                  },
                  message: {
                    text: text
                  }
                })
              });
            }
          }
        };
      }
    }

    res.end();
  };
};
