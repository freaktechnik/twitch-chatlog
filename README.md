# twitch-chatlog

[![Greenkeeper badge](https://badges.greenkeeper.io/freaktechnik/twitch-chatlog.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/freaktechnik/twitch-chatlog.svg?branch=master)](https://travis-ci.org/freaktechnik/twitch-chatlog) [![codecov](https://codecov.io/gh/freaktechnik/twitch-chatlog/branch/master/graph/badge.svg)](https://codecov.io/gh/freaktechnik/twitch-chatlog) ![Dependencies](https://david-dm.org/freaktechnik/twitch-chatlog.svg) [![Dependency Status](https://dependencyci.com/github/freaktechnik/twitch-chatlog/badge)](https://dependencyci.com/github/freaktechnik/twitch-chatlog)

Fetch the chatlog to a Twitch VOD from your command line with `twitch-chatlog`.

This little command can download the whole chat log to a twitch VOD. It takes the ID of the VOD (1111111 or similar) as only argument. To learn about the usage of the command, use `twitch-chatlog -h`.

The output can optionally be colored with `-c` or `--color` or by setting an environment variable `TWITCH_CHATLOG_COLOR`. To disable the loading progress bar, set `--no-progress` or `TWITCH_CHATLOG_PROGRESS` to false.

To make use of your own Twitch application client ID, you may provide it as a command line option `-C` or `--client-id` or set an environment variable `TWITCH_CHATLOG_CLIENT_ID`. The default value for client ID is not guaranteed to work [past 08 Aug 2016](https://discuss.dev.twitch.tv/t/client-id-requirement-faqs/6108), in which case you will have to supply your own.

To control the part of the chat log to fetch, `--start`, `--length` and `--end` can be used. See the usage section below. By default the command will only fetch the first ten minutes of chat log to minimize the amount of requests.

## Installation
```
npm install -g twitch-chatlog
```

## Usage
```
Fetch the chat log to a Twitch VOD.
Usage: twitch-chatlog <vod_id>

vod_id is the ID from the VOD URL, optionally prefixed with v (deprecated).

Options:
  -c, --color      Colorize output                    [boolean] [default: false]
  -C, --client-id  Twitch application client ID  [string] [default: (Client-ID)]
  -p, --progress   Show a progress bar while loading the log
                                                       [boolean] [default: true]
  -l, --length     Amount of time from the log to fetch in seconds. Gets
                   shortened to the VOD length if bigger. 0 loads everything but
                   is not recommended. The output will run until the next end of
                   a log fragment.                  [number] [default: (10 min)]
  -s, --start      Start time. Can either be a time relative to the VOD start or
                   actual time.                   [string] [default: "00:00:00"]
  -e, --end        End time. Alternative to specifying a length. A time like for
                   start.                                               [string]
  -r, --requests   Amount of requests to run at once.      [number] [default: 1]
  -h, --help       Show help                                           [boolean]
  --version        Show version number                                 [boolean]

Examples:
  twitch-chatlog 79240813                   Load the first ten minutes of chat
                                            for the VOD
                                            https://twitch.tv/ec0ke/v/79040813
  twitch-chatlog -c --end 00:15:00 79240813 Load the first 15 minutes of chat
                                            for the VOD and colorize the output.
  twitch-chatlog 79240813 --no-progress     Load the chat log until the given
  --end=2016-07-20T20:37:44+0000            date and don't show a progress bar.

```

## Similar Projects
 - https://github.com/PetterKraabol/Twitch-Chat-Downloader
 - https://github.com/bibby/itch

## Disclaimer
This program uses an unofficial Twitch API that may stop working at any point. It also potentially sends a lot of requests in quick succession, which might lead to Twitch taking measures against it and thus the program and/or your Twitch experience being reduced.
