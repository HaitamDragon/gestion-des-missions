import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
const connection = await mysql.createPool({

    host: "localhost",
    user: "root",
    password: "root",
    database: "db_mission"

});

try {
  const [results, fields] = await connection.query(
    'SELECT * FROM `dbMission`'
  );

  console.log(results); // results contains rows returned by server
  console.log(fields); // fields contains extra meta data about results, if available
} catch (err) {
  console.log(err);
}


const corsOptions = {
    origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));

app.get("/acceuil", (req, res) => {
    res.json({ test: "string" });
});

app.listen(8080, () => {
    console.log("running...");
});
