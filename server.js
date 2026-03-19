const express = require("express");
const http = require("http");
const bcrypt = require("bcrypt");
const Database = require("better-sqlite3");
const { Server } = require("socket.io");

const db = new Database("database.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY,
username TEXT UNIQUE,
password TEXT
)
`).run();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hash = await bcrypt.hash(password, 10);

    try {
        db.prepare("INSERT INTO users (username,password) VALUES (?,?)")
            .run(username, hash);
        res.send({ ok: true });
    } catch {
        res.send({ ok: false });
    }
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const user = db.prepare("SELECT * FROM users WHERE username=?")
        .get(username);

    if (!user) return res.send({ ok: false });

    const valid = bcrypt.compareSync(password, user.password);
    res.send({ ok: valid });
});

io.on("connection", (socket) => {

    socket.on("joinRoom", (room) => {
        socket.join(room);
    });

    socket.on("message", (data) => {
        io.to(data.room).emit("message", data);
    });

});

server.listen(3000, () => {
    console.log("Servidor rodando");
});