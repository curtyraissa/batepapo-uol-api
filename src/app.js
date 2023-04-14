import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
// import dayjs from "dayjs";
import dotenv from 'dotenv';
dotenv.config();
import joi from 'joi';

// const dayjs = require("dayjs");
const app = express();
app.use(express.json());
app.use(cors());

let db;
const mongoClient = new MongoClient(process.env.DATABASE_URL);
mongoClient.connect()
  .then(() => db = mongoClient.db())
  .catch((err) => console.log(err.message))

app.post("/participants", (req, res) => {
  const { name } = req.body

  const participantsSchema = joi.object({
    name: joi.string().required(),
  });

  const validation = participantsSchema.validate(name, { abortEarly: false });

  if (validation.error) {
    res.sendStatus(422);;
    return;
  }

  const nomeExiste = db.collection("participants").findOne({ name });
  if (nomeExiste) return res.sendStatus(409);

  const promise = db.collection("participants").insertOne({ name: name, lastStatus: Date.now() });
  promise.then(() => res.sendStatus(201));
  promise.catch(() => res.sendStatus(500));

  const messagemInicial = db.collection("messages").insertOne({ 
    from: name, 
    to: 'Todos', 
    text: 'entra na sala...', 
    type: 'status', 
    time: 'HH:mm:ss' 
  });
})

app.get("/participants", (req, res) => {
    const participants = db.collection("/participants").find().toArray()
    if(!participants){
      participants.catch((err) => res.status(404).send([]))
    } else {
      participants.then((participants) => res.status(201).send(participants))}     
})

app.post("/messages", (req, res) => {
 const {to, text, type } = req.body;
 const { user } = req.headers;

//  if(!user || !to || !text || !type)
//   return res.sendStatus(422);
 
const messageScheme = joi.object ({
  from: joi.string().required(),
  to: joi.string().required(),
  text: joi.string().required(),
  type:joi.string().required().valid("message", "private_message"),
})

const validation = messageScheme.validate(
  {to, text, type, from: user}, {aboutEarly: false}
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

const PORT = 5000;
app.listen(PORT, () => { console.log(`servidor rodando na porta ${PORT}`) });