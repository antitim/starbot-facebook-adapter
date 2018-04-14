require('chai').should();
const sinon = require('sinon');
const Bot = require('starbot-ktotam-bot');
const Adapter = require('..');
const axios = require('axios');

describe('FB Adapter', () => {
  let bot = new Bot({
    message: 'Кто там?'
  });

  let adapter = new Adapter({
    pageAccessToken: 'pageAccessToken',
    verifyToken: 'verifyToken'
  });

  adapter.bot = bot;

  it('confirmation', async () => {
    await adapter.middleware({ query: {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'verifyToken',
      'hub.challenge': 'foo'
    }}, {
      send: function (data) {
        data.should.equal('foo');
      },
      status: () => {},
      end: () => {}
    });
  });

  it('confirmation fail', async () => {
    await adapter.middleware({ query: {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'verifyTokenBar',
      'hub.challenge': 'foo'
    }}, {
      send: function (data) {
        data.should.equal('');
      },
      status: () => {},
      end: () => {}
    });
  });

  it('message_new', async () => {
    let stub = sinon.stub(axios, 'request', function (config) {
      config.should.deep.equal({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        params: { access_token: 'pageAccessToken' },
        data: '{"recipient":{"id":"userId"},"message":{"text":"Кто там?"}}'
      });
    });

    await adapter.middleware({
      query: {
        'hub.mode': 'subscribe'
      },
      body: {
        object: 'page',
        entry: [
          {
            messaging: [
              {
                message: {
                  text: 'Привет'
                },
                sender: {
                  id: 'userId'
                }
              }
            ]
          }
        ]
      }
    }, {
      send: function () {},
      status: () => {},
      end: function () {}
    }, (err) => {
      err.should.be.null();
    });

    stub.restore();
  });
});
