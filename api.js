const http = require("http");
const fs = require("fs");

const PORT = 3000;
const FILE = "data.json";

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
}

function save(todos) {
  fs.writeFileSync(FILE, JSON.stringify(todos, null, 2));
}

function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function readBody(req, callback) {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      callback(null, body ? JSON.parse(body) : {});
    } catch {
      callback(new Error("Invalid JSON"));
    }
  });
}

const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0];
  const parts = url.split("/").filter(Boolean);

  if (parts[0] !== "todos") {
    return send(res, 404, { error: "Not found" });
  }

  const todos = load();
  const id = parts[1] ? Number(parts[1]) : null;

  // GET /todos
  if (req.method === "GET" && id === null) {
    return send(res, 200, todos);
  }

  // GET /todos/:id
  if (req.method === "GET") {
    const todo = todos.find((t) => t.id === id);
    return todo ? send(res, 200, todo) : send(res, 404, { error: "Todo not found" });
  }

  // POST /todos
  if (req.method === "POST" && id === null) {
    return readBody(req, (err, body) => {
      if (err) return send(res, 400, { error: err.message });
      if (!body.text || typeof body.text !== "string" || !body.text.trim()) {
        return send(res, 400, { error: "text is required" });
      }
      const nextId = todos.length ? Math.max(...todos.map((t) => t.id)) + 1 : 1;
      const todo = { id: nextId, text: body.text.trim(), done: false };
      todos.push(todo);
      save(todos);
      send(res, 201, todo);
    });
  }

  // PATCH /todos/:id
  if (req.method === "PATCH" && id !== null) {
    return readBody(req, (err, body) => {
      if (err) return send(res, 400, { error: err.message });
      const todo = todos.find((t) => t.id === id);
      if (!todo) return send(res, 404, { error: "Todo not found" });
      if (typeof body.done === "boolean") todo.done = body.done;
      if (typeof body.text === "string" && body.text.trim()) todo.text = body.text.trim();
      save(todos);
      send(res, 200, todo);
    });
  }

  // DELETE /todos/:id
  if (req.method === "DELETE" && id !== null) {
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) return send(res, 404, { error: "Todo not found" });
    const removed = todos.splice(index, 1)[0];
    save(todos);
    return send(res, 200, removed);
  }

  send(res, 405, { error: "Method not allowed" });
});

server.listen(PORT, () => {
  console.log("API running at http://localhost:" + PORT);
});