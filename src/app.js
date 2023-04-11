import express from "express"
import cors from "cors"

const app = express();


app.use(cors());
app.use(express.json());

app.post("/participants", (request, response) => {

  response.send("blablabla")
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