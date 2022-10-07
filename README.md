<center><img src="https://cdn.discordapp.com/attachments/349356606883889152/616414555639382016/Logger.png" />
<a href="https://discordbots.org/bot/298822483060981760" >
  <img src="https://discordbots.org/api/widget/298822483060981760.svg" alt="Logger" />
</a>
</center>

Logger is a powerful [Discord](https://discordapp.com) bot meant to give staff members oversight over the various actions taking place in their server. Come talk about me with my creator at [Logger's Lounge](https://discord.gg/ed7Gaa3).

## Installation

You are mostly on your own selfhosting this version. Required applications:
- PostgreSQL 11
- Redis
- NodeJS 14+ (14.5.0)

1. Setup Postgres and add a superuser (default user works)
2. Clone bot repo and enter the created folder
3. Copy .env.example into .env
4. Fill out **all** fields in it (even Sentry unless you hotpatch it out)
5. `npm install`
6. `node src/miscellaneous/generateDB.js`
7. Set `ENABLE_TEXT_COMMANDS="true"` in .env
8. `node index.js`
9. Use your prefix to set the bot's commands. If yours is %, then you'd do `%setcmd global` to globally set commands, and `%setcmd guild` to quickly set server-specific slash commands

## Usage

```bash
node index.js
```

## Contributing
Pull requests are welcome as long as it follows the following guidelines:
1. Is your idea really one that a large group of moderators would like?
2. Is your idea scalable?
3. Will your idea cause the bot to hit it's global ratelimit?
4. Have you proposed it to *piero#5432* in my [support server?](https://discord.gg/ed7Gaa3)

If you have done all of the above steps, then open a pull request and I will review it. Style guide and testing will be implemented in a later update.
