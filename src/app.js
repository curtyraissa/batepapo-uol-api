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
    const participants = await db.collection("/participants").find().toArray()
    res.send(participants)
  }
  catch (err) {
    res.status(500).send(err.message)
  }
})


// post messages
app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body
  const from = req.headers.user
  const validation = messageScheme.validate({ from, to, text, type })

  if (validation.error) {
    const error = validation.error.details.map((detail) => detail.message)
    return res.status(422).send(error)
  }
  try {
    const participant = await db.collection("participants").findOne({ name: from })
    if (!participant) {
      return res.sendStatus(422)
    }
    await db.collection("messages").insertOne({
      from: user,
      to,
      text,
      type,
      time: dayjs(Date.now()).format("HH:mm:ss")
    })
    res.sendStatus(201)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

app.get("/messages", async (req, resp) => {
  const participant = req.headers.user

  if (Number(req.query.limit) <= 0 || (isNaN(req.query.limit) && req.query.limit !== undefined)) {
    return resp.sendStatus(422)
  }
  try {
    const msg = await db.collection("messages").find({
      $or: [
        { from: participant },
        { to: participant },
        { to: "Todos" }
      ]
    }).toArray()

    if (req.query.limit) {
      return resp.status(200).send(msg.slice(-req.query.limit))
    } resp.status(200).send(msg)
  } catch (err) {
    resp.status(500).send(err.message)
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

//rodando servidor na porta 5000
const PORT = 5000
app.listen(PORT, () => { console.log(`servidor rodando na porta ${PORT}`) })