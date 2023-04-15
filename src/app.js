import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
import dotenv from "dotenv";
import joi from "joi";

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

  if (!validation) {
    res.sendStatus(422);
    return
  }

  try {
    const nomeExiste = await db.collection("participants").findOne({ name });
    if (nomeExiste) {
      res.sendStatus(409);
      return
    }
    await db.collection("participants").insertOne({
      name: name,
      lastStatus: Date.now()
    });
    await db.collection("messages").insertOne({
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs().format("HH:mm:ss")
    });
  }

  catch (err) {
    res.sendStatus(500).send(err.message)
  }
  res.sendStatus(201);
})

app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("/participants").find().toArray()
    res.send(participants);
    // if (!participants) {
    //   res.status(404).send([]);
    //   return
    // } res.send(participants);
  }
  catch (err) {
    res.status(500).send(err.message)
  }
})

app.post("/messages", async (req, res) => {
  try {
    const { to, text, type } = req.body;
    const { user } = req.headers;

    const formato = { from: user, to, text, type, time: dayjs().format("HH:mm:ss") }
    //  if(!user || !to || !text || !type)
    //   return res.sendStatus(422);


    const validation = messageScheme.validate(
      formato, { aboutEarly: false }
    )

    if (validation.error) {
      const err = validation.error.details.map((e) => e.formato)
      res.sendStatus(422).send(err);
      return;
    } const naoExiste = await db.collection("participants").insertOne({ name: participants })
    if (!naoExiste) {
      res.sendStatus(409)
      return
    } await db.collection("messages").findOne(formato);
    res.sendStatus(201)
  } catch (err) {
    res.sendStatus(500);
  }
})

// app.get("/messages", (req, resp) => {


// })

// app.post("/status", (req, resp) => {


// })

//rodando servidor na porta 5000
const PORT = 5000;
app.listen(PORT, () => { console.log(`servidor rodando na porta ${PORT}`) });