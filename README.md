# Comment Cloud

Turn a user's comments on reddit or imgur into a word cloud. Works without any custom server-side scripting!

## Current Limitations

- No user feedback on errors.
- Only fetches the last 100 comments on reddit, the last 50 on imgur.
- Only tested in Firefox and Safari.
- Not mobile friendly.

## Setup

Because imgur requires authorization for their API, you will need to [register your application](https://api.imgur.com/). Once you have your client ID, you will need to save it to imgur.js:

```
var imgurClientId = 'XXXXXXXXXXXXXXX'
```
