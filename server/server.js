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

async function fetchDatabase(sqlStmt)
{
  return connection.query (
        sqlStmt
  );
}

const corsOptions = {
    origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/Mission", async (req, res) => {

    try {
      const [response] = await fetchDatabase("SELECT * FROM Mission");
      res.json(response);
    }

    catch(err) {
      //console.log("GET Request for /Mission failed.");
      res.status(500);
    }
});

app.get("/Employer", async (req, res) => {

    try {
      const [response] = await fetchDatabase("SELECT * FROM Employer");
      res.json(response);
    }

    catch(err) {
      //console.log("GET Request for /Employer failed.");
      res.status(500);
    }
});

app.get("/Chauffeur", async (req, res) => {
   try {
      const [response] = await fetchDatabase("SELECT * FROM Chauffeur");
      res.json(response);
    }

    catch(err) {
      //console.log("GET Request for /Chauffeur failed.");
      res.status(500);
    }
});

app.get("/Vehicule", async (req, res) => {
    try {
      const [response] = await fetchDatabase("SELECT * FROM Vehicule");
      res.json(response);
    }

    catch(err) {
      //console.log("GET Request for /Vehicule failed.");
      res.status(500);
    }   
});

app.listen(8080, () => {
    console.log("running...");
});
