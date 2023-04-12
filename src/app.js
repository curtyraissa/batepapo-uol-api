import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from "mongodb"; 

const dayjs = require('dayjs');
const app = express();

app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;
mongoClient.connect()
.then(() => {db = mongoClient.db(); 
}).catch((err) => console.log(err.message))

app.post("/participants", (request, response) => {
  const { name } = request.body
  if (!name || name=="") {
    response.status(422).send("Todos os campos são obrigatórios!");
    return;
  }

  const nomeExiste = db.collection("participants").findOne({ name });
  if (nomeExiste) return res.sendStatus(409);

  const promise = db.collection("participants").insertOne({name, lastStatus: Date.now()});
  promise.then(() => res.sendStatus(201));
  // promise.catch(() => res.sendStatus(500));

  const message = db.collection("messages").insertOne({ from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: 'HH:mm:ss' });
})

app.get("/participants", (request, response) => {

  response.send("blablabla")
})

app.post("/messages", (request, response) => {

  response.send("blablabla")
})

app.get("/messages", (request, response) => {

  response.send("blablabla")
})

app.post("/status", (request, response) => {

  response.send("blablabla")
})

const PORT = 5000;
app.listen(PORT, () => { console.log(`servidor rodando na porta ${PORT}`) });