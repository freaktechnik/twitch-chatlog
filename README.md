# twitch-chatlog
Fetch the chatlog to a Twitch VOD from your command line with `twitch-chatlog`.

This little command can download the whole chat log to a twitch VOD. It takes the ID of the VOD (v1111111 or similar) as only argument. To learn about the usage of the command, use `twitch-chatlog -h`.

The output can optionally be colored with `-c` or `--color` or by setting an environment variable `TWITCH_CHATLOG_COLOR`. To disable the loading progress bar, set `--no-progress` or `TWITCH_CHATLOG_PROGRESS` to false.

To make use of your own Twitch application client ID, you may provide it as a command line option `-C` or `--client-id` or set an environment variable `TWITCH_CHATLOG_CLIENT_ID`. The default value for client ID is not guaranteed to work [past 08 Aug 2016](https://discuss.dev.twitch.tv/t/client-id-requirement-faqs/6108), in which case you will have to supply your own.

## Installation
```
npm install -g twitch-chatlog
```

## Usage
```
Fetch the chat log to a Twitch VOD.
Usage: /usr/local/bin/twitch-chatlog <vod_id>[ -c][ -C <client_id>]

vod_id is the ID from the VOD URL, prefixed with v.

Options:
  -c, --color      Colorize output                    [boolean] [default: false]
  -C, --client-id  Twitch application client ID                         [string]
  -p, --progress   Show a progress bar while loading the log
                                                       [boolean] [default: true]
  -h, --help       Show help                                           [boolean]
  --version        Show version number                                 [boolean]

Examples:
  twitch-chatlog v79240813
```
