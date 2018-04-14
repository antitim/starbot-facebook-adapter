const axios = require('axios');

class Adapter {
  constructor (settings) {
    if (!settings.pageAccessToken) throw new Error('Not specified pageAccessToken in settings');
    if (!settings.verifyToken) throw new Error('Not specified verifyToken in settings');

    this.pageAccessToken = settings.pageAccessToken;
    this.verifyToken = settings.verifyToken;
  }

  set bot (bot) {
    this.message = bot.message.bind(bot);

    bot.on('message', (message) => {
      axios.request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        params: {
          access_token: this.pageAccessToken
        },
        data: JSON.stringify({
          recipient: {
            id: message.client.split('fb-')[1]
          },
          message: {
            text: message.text
          }
        })
      });
    });
  }

  async middleware (req, res, next) {
    try {
      if (
        req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === this.verifyToken
      ) {
        res.send(req.query['hub.challenge']);
      }

      if (req.body && req.body.object) {
        const body = req.body;

        if (
          body.object === 'page' &&
          body.entry
        ) {
          for (let entry of body.entry) {
            for (let event of entry.messaging) {
              if (event.message) {
                const text = event.message.text || '';

                await this.message({
                  client: `fb-${event.sender.id}`,
                  text
                });
              }
            }
          }
        }
      }

      res.end();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = Adapter;
