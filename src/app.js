import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dayjs from "dayjs"
import dotenv from "dotenv"
import joi from "joi"

const app = express()
app.use(express.json())
app.use(cors())
dotenv.config()

let db
const mongoClient = new MongoClient(process.env.DATABASE_URL)
mongoClient.connect()
  .then(() => db = mongoClient.db())
  .catch((err) => console.log(err.message))

const participantsSchema = joi.object({
  name: joi.string().min(3).required(),
})

const messageScheme = joi.object({
  from: joi.string().min(3).required(),
  to: joi.string().min(3).required(),
  text: joi.string().required(),
  type: joi.string().valid("message", "private_message").required(),
  time: joi.required()
})

app.post("/participants", async (req, res) => {
  const { name } = req.body
  const { validation } = participantsSchema.validate(name, { abortEarly: false })

  if (validation) {
    res.sendStatus(422)
    return
  }

  try {
    const nomeExiste = await db.collection("participants").findOne({ name })
    if (nomeExiste) {
      res.sendStatus(409)
      return
    }
    await db.collection("participants").insertOne({
      name: name,
      lastStatus: Date.now()
    })
    await db.collection("messages").insertOne({
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs().format("HH:mm:ss")
    })
  }

  catch (err) {
    res.sendStatus(500).send(err.message)
  }
  res.sendStatus(201)
})

// get participants
app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray()
    res.send(participants)
  }
  catch (err) {
    res.status(500).send(err.message)
  }
})


// post messages
app.post("/messages", async (req, res) => {
  const { body } = req
  const User = req.headers.user
  const message = {
    from: User,
    to: body.to,
    text: body.text,
    type: body.type,
    time: dayjs().format("HH:mm:ss")
  }

  try {
    await messageScheme.validateAsync(message, { abortEarly: false })
  } catch (error) {
    return res.sendStatus(422)
  }

  try {
    const participants = await db.collection("participants").findOne({ name: User })
    if (!participants) return res.sendStatus(422)
    await db.collection("messages").insertOne(message)
    return res.sendStatus(201)
  } catch (error) {
    return res.sendStatus(422)
  }
})

// get messages
app.get("/messages", async (req, res) => {
  let { limit } = req.query
  if (limit) {
    if (limit <= 0 || isNaN(limit)) {
      return res.sendStatus(422)
    }
  }
  const user = req.headers.user
  try {
    const messages = await db.collection("messages").find({
      $or: [{ from: user }, { to: user }, { to: 'Todos' }]
    }).toArray()

    if (!limit) return res.send(messages.reverse())
    res.send(messages.slice(-limit).reverse())

  } catch (error) {
    return res.sendStatus(422)
  }
})

// post endpoint status
app.post("/status", async (req, res) => {
  const { user } = req.headers

  if (!user) {
    return res.sendStatus(404)
  }
  try {
    const temParticipante = await db.collection("participants").findOne({ name: user })
    if (!temParticipante) {
      return res.sendStatus(404)
    }
    db.collection("participants").updateOne(
      { name: user },
      { $set: { lastStatus: Date.now() } }
    )
    res.sendStatus(200)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

// remover user por tempo inativo
setInterval(async () => {
  const AFK = dayjs().subtract(10, 'seconds').valueOf();
  await db.collection('participants').find({ lastStatus: { $lt: AFK } }).toArray().forEach(async (participant) => {
    const message = {
      from: participant.name,
      to: 'Todos',
      text: 'sai da sala...',
      type: 'status',
      time: dayjs().format('HH:mm:ss')
    };
    await db.collection('messages').insertOne(message);
    await db.collection('participants').deleteOne({ _id: participant._id });
  });
}, 15000);

//rodando servidor na porta 5000
const PORT = 5000
app.listen(PORT, () => { console.log(`servidor rodando na porta ${PORT}`) })