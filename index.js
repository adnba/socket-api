const http = require("http")
const httpServer = http.createServer(app)
const socketio = require("socket.io")

const cors = require("cors")
require("dotenv").config()

app.use(express.json())
app.use(cors())

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

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => console.log("Websocket listening on port:", PORT))
