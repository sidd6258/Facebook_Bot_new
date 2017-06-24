#🤖 Facebook Chatbot Tutorial 🤖
Step by step guide how to build a fully functional chatbot sample app using facebook messenger plattform and node.js

## Facebook integration

1. create a Facebook Page --> https://www.facebook.com/pages/create/
2. create a Facebook App  --> https://developers.facebook.com/docs/messenger-platform/product-overview/setup#app_and_page_setup

## Server
1. `git clone https://github.com/AdrianKrebs/facebook-chatbot-tutorial.git`
2. `npm install`

Facebook webhooks require a public https URL so we need to expose our local server endpoints as public https.
There are two ways to do this:
- deploy your app on Heroku
- use https://localtunnel.me/ to tunnel to your local machine

### 1. Deploy on Heroku
1. create Heroku account --> https://signup.heroku.com/
2. Install Heroku Toolbelt --> https://devcenter.heroku.com/articles/heroku-command-line
3. type `heroku create` in your app
4. you will see something like this: `Creating example... done
https://example.herokuapp.com/ | https://git.heroku.com/example.git`
5. add environment variables to the heroku app --> https://devcenter.heroku.com/articles/config-vars
6. setup Facebook webhook https://developers.facebook.com/docs/messenger-platform/product-overview/setup#webhook_setup 
6. `git commit -m -a "initial commit" `
7. `git push heroku master`
8. `heroku logs --tail`
9. go to your Facebook page and send a message. The bot will echo back :memo::speech_balloon:

### Config Variables

| variable        |value                        |
| -------------   |:-------------:              |
| appSecret       | facebook app secret         |
| pageAccessToken | facebook page access token  |
| validationToken | facebook validation token   |

### 2. Use localtunnel
1. set config-vars in `default.config` file in your app
1. `npm install -g localtunnel`
2. Tunnel our local server port
3. `lt --port 5000`
4. you will see something like this: `https://gqgh.localtunnel.me which is your public base URL`
6. setup Facebook webhook with the just received url https://developers.facebook.com/docs/messenger-platform/product-overview/setup#webhook_setup 
7. go to your Facebook page and send a message. The bot will echo back :memo::speech_balloon:

**Note** : everytime you restart the webserver you also have to restart the localtunnel, setup the webhook, unsuscribe the page and suscribe it again to the new webhook.

### Setup Webhook
![FB Webhook](/assets/callback_url.PNG)
