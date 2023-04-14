import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from "mongodb";
import joi from 'joi'

const dayjs = require(dayjs);
const app = express();
const Joi = require(joi);

app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;
mongoClient.connect()
  .then(() => { db = mongoClient.db();
  }).catch((err) => console.log(err.message))

app.post("/participants", (request, response) => {
  const { name } = request.body

  const participantsSchema = joi.object({
    name: joi.string().required(),
  });

  const validation = participantsSchema.validate(name, { abortEarly: false });

  if (validation. error) {
    response.status(422).send("Todos os campos são obrigatórios!");
    return;
  }

  const nomeExiste = db.collection("participants").findOne({ name });
  if (nomeExiste) return res.sendStatus(409);

  const promise = db.collection("participants").insertOne({ name: name, lastStatus: Date.now() });
  promise.then(() => res.sendStatus(201));
  promise.catch(() => res.sendStatus(500));

  const message = db.collection("messages").insertOne({ 
    from: name, 
    to: 'Todos', 
    text: 'entra na sala...', 
    type: 'status', 
    time: 'HH:mm:ss' 
  });
})

app.get("/participants", (request, response) => {

  
})

app.post("/messages", (request, response) => {

  
})

app.get("/messages", (request, response) => {

  
})

app.post("/status", (request, response) => {

  
})

const PORT = 5000;
app.listen(PORT, () => { console.log(`servidor rodando na porta ${PORT}`) });