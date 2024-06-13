import express, { response } from "express";
import * as path from "path";
import fs from "fs";
import "opencv.js";

const app = express();
app.use(express.json());
const port = 3000;
const gameTime = (2 * 60 + 31) * 1000;
let timerEnd = new Date();
let inMatchView = false;
let matchStarted = false;
let gameList = [];
let currentGame = {};

const calculateBracket = (games) => {
  //winner bracket
  //game 7:
  games[6].red = games[0].winner;
  games[6].blue = games[1].winner;
  //game 8:
  games[7].red = games[2].winner;
  games[7].blue = games[3].winner;
  //game 11:
  games[10].red = games[8].loser;
  games[10].blue = games[9].winner;
  //finale:
  games[11].red = games[10].winner;
  games[11].blue = games[8].winner;

  //loser bracket
  //game 5:
  games[4].red = games[0].loser;
  games[4].blue = games[1].loser;
  //game 6:
  games[5].red = games[2].loser;
  games[5].blue = games[3].loser;
  //game 9:
  games[8].red = games[6].winner;
  games[8].blue = games[7].winner;
  //game 10:
  games[9].red = games[4].winner;
  games[9].blue = games[5].winner;
};

app.get("/", (req, res) => {
  res.sendFile(path.join("C:/Users/guyku/frc/BBGreen/matchPov.html"));
});

app.get("/getInMatch", (req, res) => {
  res.send(inMatchView);
});

app.get("/stopMatch", (req, res) => {
  inMatchView = false;
  matchStarted = false;
  res.send();
});
app.get("/noMatch", (req, res) => {
  res.sendFile(path.join("C:/Users/guyku/frc/BBGreen/noMatch.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join("C:/Users/guyku/frc/BBGreen/admin.html"));
});

app.get("/leaderboard", (req, res) => {
  const file = fs.readFileSync("C:/Users/guyku/frc/BBGreen/leaderboard.json");
  const data = JSON.parse(file);

  res.send(`<p>${JSON.stringify(data)}</p>`);
});

app.get("/resetTimer", (req, res) => {
  // timerEnd = new Date().getTime();
  matchStarted = false;
  res.send();
});

app.post("/startGame", (req, res) => {
  currentGame = gameList[req.body.gameNum - 1];
  inMatchView = true;
  res.send();
});

app.get("/startTimer", (req, res) => {
  if (inMatchView) {
    matchStarted = true;
    timerEnd = new Date().getTime() + gameTime;
  }
  res.send();
});

app.get("/runBanner", (req, res) => {
  let now = new Date().getTime();
  let dist = timerEnd - now;
  let minutes = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
  let seconds = Math.floor((dist % (1000 * 60)) / 1000);
  seconds = seconds < 0 ? 0 : seconds;
  minutes = minutes < 0 ? 0 : minutes;
  let minuteFix = "0" + minutes;
  let secondsFix = seconds < 10 ? "0" + seconds : seconds;
  let timer;
  if (matchStarted) timer = minuteFix + " : " + secondsFix;
  else timer = "02 : 30";
  res.send(
    `
    <div class="blue">${currentGame.blue}</div>
    <div>
      <div class="gameNumber">match: ${currentGame.number}</div>
      <div class="timer">${timer}</div>
    </div>
    <div class="red">${currentGame.red}</div>`
  );
});

app.post("/addGame", (req, res) => {
  const file = fs.readFileSync("C:/Users/guyku/frc/BBGreen/leaderboard.json");
  const data = JSON.parse(file);
  console.log("before", JSON.stringify(data));
  const compArr = data.competitors;
  const orderedData = {
    competitors: []
  };
  const gameAdded = req.body;
  console.log(gameAdded.winner);
  console.log(gameAdded.loser);

  compArr.forEach((comp) => {
    console.log("competitor", comp);
    if (comp.name == gameAdded.winner) {
      console.log("found winner");
      console.log("game", gameAdded);
      comp.games.push(gameAdded);
      comp.won++;
    }
    if (comp.name == gameAdded.loser) {
      console.log("found loser");
      console.log("game", gameAdded);
      comp.games.push(gameAdded);
      comp.lost++;
    }
  });
  orderedData.competitors = compArr.sort((a, b) => {
    a.won > b.won;
  });
  fs.writeFileSync("C:/Users/guyku/frc/BBGreen/leaderboard.json", JSON.stringify(data), "utf-8", (err) => {
    if (err) throw err;
    console.log("added game to file");
  });
  console.log("ordered", JSON.stringify(orderedData));
  const updated = fs.readFileSync("C:/Users/guyku/frc/BBGreen/leaderboard.json");
  const updatedData = JSON.parse(updated);
  res.json(updatedData);
});

app.get("/gameList", (req, res) => {
  const games = fs.readFileSync("C:/Users/guyku/frc/BBGreen/games.json");
  const gamesJson = JSON.parse(games);
  res.json(gamesJson);
});

app.post("/submitGame", (req, res) => {
  const gamesFile = fs.readFileSync("C:/Users/guyku/frc/BBGreen/games.json");
  const games = JSON.parse(gamesFile);
  let updated = games;
  updated.forEach((game) => {
    if (game.number == req.body.number) {
      if (req.body.winner == "red") {
        console.log("winner", game.red);
        game.winner = game.red;
        game.loser = game.blue;
      } else {
        console.log("winner", game.blue);
        game.winner = game.blue;
        game.loser = game.red;
      }
    }
  });
  calculateBracket(updated);
  console.log(updated);
  fs.writeFileSync("C:/Users/guyku/frc/BBGreen/games.json", JSON.stringify(updated), "utf-8", (err) => {
    if (err) throw err;
    console.log("added game to file");
  });
  res.json(updated);
});

app.get("/style", (req, res) => {
  res.sendFile(path.join("C:/Users/guyku/frc/BBGreen/style.css"));
});

app.get("/noMatchStyle", (req, res) => {
  res.sendFile(path.join("C:/Users/guyku/frc/BBGreen/noMatchStyle.css"));
});

app.get("/getGames", (req, res) => {
  var htmlTxt = [""];
  const gamesFile = fs.readFileSync("C:/Users/guyku/frc/BBGreen/games.json");
  const games = JSON.parse(gamesFile);
  gameList = games;
  calculateBracket(gameList);
  games.forEach((game) => {
    let bodyReq = {
      "number": game.number,
      "red": game.red,
      "blue": game.blue,
      "winner": game.winner,
      "loser": game.loser
    };
    if (bodyReq.winner != "" && bodyReq.loser == "")
      htmlTxt.push(`
      <div class="gameCont gameNum${bodyReq.number}">
          <header class="gameNum">${bodyReq.number}</header>
          <header class="gameBlue">${bodyReq.winner}</header>
        </div>
      </div>
    `);
    else
      htmlTxt.push(`
        <div class="gameCont gameNum${bodyReq.number}">
          <header class="gameNum">${bodyReq.number}</header>
          <div class="teams">
            <header class="gameRed">${bodyReq.red}</header>
            <header class="gameBlue">${bodyReq.blue}</header>
          </div>
        </div>
      `);
  });
  res.send(htmlTxt);
});

app.get("/timerBanner", (req, res) => {
  res.sendFile(path.join("C:/Users/guyku/frc/BBGreen/banner.jpg"));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  //   open("http://localhost:3000");
});
