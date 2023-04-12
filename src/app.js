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
  const novoParticipante = { name, lastStatus: Date.now() }
  response.sendStatus(201);
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