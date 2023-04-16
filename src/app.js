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
  name: joi.string().min(3).required(),
});

const messageScheme = joi.object({
  from: joi.string().required(),
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.string().valid("message", "private_message").required(),
})

app.post("/participants", async (req, res) => {
  const { name } = req.body
  const { validation } = participantsSchema.validate(name, { abortEarly: false });

  if (validation) {
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
  }
  catch (err) {
    res.status(500).send(err.message)
  }
})

app.post("/messages", async (req, res) => {
  try {
    const { to, text, type } = req.body;
    const from = req.headers("User");

    const { error } = messageScheme.validate({ to, text, type })
    if (error) {
      return res.status(422).send(error.details[0].message)
    }

    const existentes = await db.collection("messages").findOne({ name: from })
    if (!existentes) {
      return res.sendStatus(422)
    }

    const time = dayjs().format("HH:mm:ss")
    const message = { from, to, text, type, time }

    await db.collection("participants").insertOne(message)
    return res.sendStatus(201)

  } catch (err) {
    return res.status(500).send(err.message)
  }


  //     const formato = { from: user, to, text, type, time: dayjs().format("HH:mm:ss") }
  //     const validation = messageScheme.validate(
  //       formato, { aboutEarly: false }
  //     )
  //     if (validation.error) {
  //       const err = validation.error.details.map((e) => e.formato)
  //       res.sendStatus(422).send(err);
  //       return;
  //     } const naoExiste = await db.collection("participants").insertOne({ name: participants })
  //     if (!naoExiste) {
  //       res.sendStatus(409)
  //       return
  //     } await db.collection("messages").findOne(formato);
  //     res.sendStatus(201)
  //   } catch (err) {
  //     res.sendStatus(500);
  //   }
})

app.get("/messages", async (req, resp) => {
  const { limit } = req.query;

  if (limit && (isNaN(parseInt(limit)) || parseInt(limit) <= 0)) {
    return resp.status(422).send({ error: "err" })
  }

  const messages = await db.collection('messages').find({
    $or: [
      { to: "Todos" },
      { from: req.headers.user },
      { to: req.headers.user },
    ]
  })
    .sort({ time: -1 })
    .limit(limit ? parseInt(limit) : 0)
    .toArray();

  resp.send(messages.reverse());

})


// post endpoint status
app.post("/status", (req, resp) => {
  const schema = joi.object({
    User: joi.string().required()
  });

  const { error } = schema.validate(req.headers);
  if (error) {
    return resp.status(400).send(error.details[0].message);
  }

  const user = req.headers.User;

  db.collection('participants').findOneAndUpdate(
    { name: user },
    { $set: { lastStatus: dayjs().unix() } }
  ).then(result => {
    if (!result.value) {
      return resp.status(404).end();
    }
    return resp.status(200).end();
  }).catch(err => {
    console.error('erro status', err);
    return resp.status(500).end();
  });

})

//rodando servidor na porta 5000
const PORT = 5000;
app.listen(PORT, () => { console.log(`servidor rodando na porta ${PORT}`) });