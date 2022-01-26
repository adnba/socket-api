const express = require("express")
const app = express()
const http = require("http")
const httpServer = http.createServer(app)
const socketio = require("socket.io")

const mongoose = require("mongoose")
const cors = require("cors")
require("dotenv").config()
const Joi = require("joi")
const JoiObjectId = require("joi-objectid")
Joi.objectid = JoiObjectId(Joi)
const auth = require("./routes/users")
const casts = require("./routes/casts")
const genres = require("./routes/genres")
const films = require("./routes/films")

mongoose
  .connect(
    `mongodb+srv://user8465z:${process.env.MONGODB_PASSWORD}@cluster0.oxi8g.mongodb.net/socketsDB?retryWrites=true&w=majority`
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch(error => console.log("Error connecting to MongoDB", error))

app.use(express.json())
app.use(cors())

app.use("/api/auth", auth)
// app.use("/api/casts", casts)
// app.use("/api/genres", genres)
// app.use("/api/films", films)

const io = socketio(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
})

let users = []

io.on("connection", socket => {
  console.log("someone is connected", socket.id)

  socket.on("sendMessageChat", message => {
    console.log("someone sent message in chat:", message)
    // socket.emit("receiveMessage", message)
    // socket.broadcast.emit("receiveMessage", message)
    const senderUser = users.find(user => user.id === socket.id)
    io.emit("receiveMessageChat", senderUser.username, message)
  })

  socket.on("sendDirectMessage", (receiverUsername, message) => {
    console.log("someone sent direct message:", message)
    const senderUser = users.find(user => user.id === socket.id)
    const receiverUser = users.find(user => user.username === receiverUsername)

    io.to(receiverUser.id).emit("receiveDirectMessage", senderUser.username, message)
    io.to(senderUser.id).emit("receiveDirectMessage", senderUser.username, message)
  })

  socket.on("chooseUsername", username => {
    const newUser = {
      id: socket.id,
      username: username,
    }
    users.push(newUser)
    console.log("new user added:", username)
    console.log("users:", users)

    const usernames = users.map(user => user.username)
    io.emit("updateUsers", usernames)
  })

  socket.on("disconnect", () => {
    console.log("someone disconnected")
    users = users.filter(user => user.id !== socket.id)
    console.log("users after disconnect:", users)

    const usernames = users.map(user => user.username)
    io.emit("updateUsers", usernames)
  })
})

httpServer.listen(5000, () => console.log("Websocket listening on port 5000"))

app.listen(4000, () => console.log("server listening on port 4000"))
