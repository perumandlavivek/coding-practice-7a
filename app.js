const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
// GET LIST OF PLAYERS API

app.get("/players/", async (request, response) => {
  const playersQuery = `
         SELECT * FROM player_details ;`;

  const playersList = await database.all(playersQuery);
  response.send(
    playersList.map((each) => convertPlayerDbObjectToResponseObject(each))
  );
});

// GET SPECIFIC PLAYER API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playersQuery = `
         SELECT * FROM player_details WHERE player_id=${playerId} ;`;

  const playerList = await database.get(playersQuery);
  response.send(convertPlayerDbObjectToResponseObject(playerList));
});

// GET MATCH DETAILS BY SPECIFIC MATCH API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
    SELECT * FROM match_details WHERE match_id=${matchId};`;
  const matchDetail = await database.get(matchQuery);
  response.send(convertMatchDbObjectToResponseObject(matchDetail));
});

// GET ALL MATCHES OF SPECIFIC PLAYER API

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchQuery = `
    SELECT match_id, match,year FROM match_details NATURAL JOIN player_match_score  WHERE player_id=${playerId};`;
  const matchDetail = await database.all(matchQuery);
  response.send(
    matchDetail.map((each) => convertMatchDbObjectToResponseObject(each))
  );
});

// GET PLAYER BY MATCH ID API

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerQuery = `
    SELECT 
    *
 FROM  player_match_score
  NATURAL JOIN 
 player_details
  WHERE 
  match_id = ${matchId};`;
  const matchDetail = await database.all(playerQuery);
  response.send(
    matchDetail.map((each) => convertPlayerDbObjectToResponseObject(each))
  );
});

// GET PLAYER SCORES AND DETAILS API

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const playerScoreQuery = `
    SELECT
     player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_details 
    NATURAL JOIN player_match_score 
     WHERE player_id = ${playerId};`;
  const matchDetail = await database.get(playerScoreQuery);
  response.send(matchDetail);
});

//PUT PLAYER NAME UPDATE API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const PutQuery = `
       UPDATE player_details
       SET player_name='${playerName}'`;

  await database.run(PutQuery);
  response.send("Player Details Updated");
});

module.exports = app;
