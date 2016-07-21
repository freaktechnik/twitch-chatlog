# twitch-chatlog
Fetch the chatlog to a twitch VOD from your command line with `twitch-chatlog`.

This little command can download the whole chat log to a twitch VOD. It takes the ID of the VOD (v1111111 or similar) as only argument. The output can optionally be colored with `-c`. To learn about the usage of the command, use `twitch-chatlog -h`.

## Installation
```
npm install -g twitch-chatlog
```

## Usage
```
Fetch the chat log to a twitch VOD.
Usage: twitch-chatlog <vod_id>[ -c]

vod_id is the ID from the VOD URL, prefixed with v.

Options:
  -c          Colorize output
  -h, --help  Show help                                                [boolean]
  --version   Show version number                                      [boolean]

Examples:
  twitch-chatlog v79240813
```

