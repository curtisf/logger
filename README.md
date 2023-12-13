<center><img src="https://cdn.discordapp.com/attachments/349356606883889152/616414555639382016/Logger.png" />
<a href="https://discordbots.org/bot/298822483060981760" >
  <img src="https://discordbots.org/api/widget/298822483060981760.svg" alt="Logger" />
</a>
</center>


Logger is a powerful [Discord](https://discordapp.com) bot designed to provide staff members with comprehensive oversight over various actions in their server. With features such as message deletion tracking, user moderation history, and channel activity logs, Logger enables server administrators to efficiently monitor and manage server activity. For more information about Logger and its capabilities, feel free to join the discussion with my creator at [Logger's Lounge](https://discord.gg/ed7Gaa3).

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
Pull requests are welcome if they follow these guidelines:
- Your idea should be one that a large group of moderators would find useful.
- Your idea should be scalable, so that it can handle large volumes of traffic without performance issues.
- Your idea should not cause the bot to hit its global ratelimit.
- You should propose your idea to *piero#5432* in the [support server?](https://discord.gg/ed7Gaa3).
- Please provide as much detail as possible about your idea to make the review process smoother.

Style guide and testing information will be implemented in a later update. In the meantime, please do your best to follow best practices and test thoroughly before submitting a pull request.
For more information, please refer to the support server and any relevant documentation or resources
