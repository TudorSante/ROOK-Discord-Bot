const express = require("express");
const rookBotSubs = require("./rook_bot_subs");
const app = express();
const port = 3000;

app.listen(port, () =>
  console.log(`App listening on http://localhost:${port}`)
);

rookBotSubs.trackOriginsAndOrderFilledEvents();