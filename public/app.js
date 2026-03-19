const socket = io();
let key;
let roomName;

async function generateKey() {
    key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

async function encrypt(text) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder().encode(text);

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc
    );

    return {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted))
    };
}

async function decrypt(obj) {
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(obj.iv) },
        key,
        new Uint8Array(obj.data)
    );

    return new TextDecoder().decode(decrypted);
}

async function register() {
    const username = user.value;
    const password = pass.value;

    await fetch("/register", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({username,password})
    });

    alert("Conta criada");
}

async function login() {
    const username = user.value;
    const password = pass.value;

    const res = await fetch("/login", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({username,password})
    });

    const data = await res.json();

    if (data.ok) {
        await generateKey();
        auth.style.display = "none";
        chat.style.display = "block";
    }
}

function joinRoom() {
    roomName = room.value;
    socket.emit("joinRoom", roomName);
}

async function sendMessage() {
    const encrypted = await encrypt(msg.value);

    socket.emit("message", {
        room: roomName,
        message: encrypted
    });

    msg.value = "";
}

socket.on("message", async (data) => {
    try {
        const text = await decrypt(data.message);
        const div = document.createElement("div");
        div.textContent = text;
        messages.appendChild(div);
    } catch {}
});

themeToggle.onclick = () => {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
};
