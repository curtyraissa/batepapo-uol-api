import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
import dotenv from 'dotenv';
import joi from 'joi';

// const dayjs = require("dayjs");
const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

let db;
const mongoClient = new MongoClient(process.env.DATABASE_URL);
mongoClient.connect()
  .then(() => db = mongoClient.db())
  .catch((err) => console.log(err.message))

const participantsSchema = joi.object({
  name: joi.string().required(),
});

const messageScheme = joi.object({
  from: joi.string().required(),
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.string().required().valid("message", "private_message"),
})

app.post("/participants", async (req, res) => {
  const { name } = req.body

  const validation = participantsSchema.validate(name, { abortEarly: false });

  if (validation.error) {
    res.sendStatus(422);
    return;
  }

  try {
    const nomeExiste = await db.collection("participants").findOne({ name });
    if (nomeExiste) {
      return res.sendStatus(409);
    }

    await db.collection("participants").insertOne({ 
      name: name, 
      lastStatus: Date.now() 
    });
    // .catch(() => res.sendStatus(500));

    await db.collection("messages").insertOne({
      from: name,
      to: 'Todos',
      text: 'entra na sala...',
      type: 'status',
      time: dayjs().format('HH:mm:ss')
    });
  } catch (err) {res.sendStatus(500)}

  res.sendStatus(201);
})

app.get("/participants",async (req, res) => {
  try {
  const participants = await db.collection("/participants").find().toArray()
  if (!participants) {
    return res.status(404).send([])
  } } catch (err) {
    res.status(201).send(participants)
  }
})

app.post("/messages", (req, res) => {
  const { to, text, type } = req.body;
  const { user } = req.headers;

  //  if(!user || !to || !text || !type)
  //   return res.sendStatus(422);


  const validation = messageScheme.validate(
    { to, text, type, from: user }, { aboutEarly: false }
  )

  if (validation.error) {
    res.sendStatus(422);
    return;
  }
})

// app.get("/messages", (req, resp) => {


// })

// app.post("/status", (req, resp) => {


// })

//rodando servidor na porta 5000
const PORT = 5000;
app.listen(PORT, () => { console.log(`servidor rodando na porta ${PORT}`) });