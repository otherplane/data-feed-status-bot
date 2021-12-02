# data-feed-status-bot

Send a notification to a telegram group when one of the data feeds is outdated.

## Usage

1. Create a bot talking with BotFather Telegram bot.
2. Add the bot to de channel where you want to use the bot.
3. Create a `.env` file with the following variables.

   > :information_source: **If you don't know where to find the CHANNEL_ID**: You can find it at the end of the URL when you open your channel using [Telegram web](https://web.telegram.org)

   ```sh
   TOKEN=telegram_bot_token
   CHANNEL_ID=telegram_channel_id
   POLLING_INTERVAL=300000
   FEED_EXPLORER_API=https://feeds-api.witnet.io
   ```

4. The bot can be built and run using docker.

   ```sh
   $ docker build -t data-feed-status-bot .

   $ docker run --env-file=./.env -it data-feed-status-bot
   ```
