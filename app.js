const list = document.getElementById("list");
const msg = document.getElementById("msg");
const input = document.getElementById("text");
const JSON_HEADERS = { "Content-Type": "application/json" };
let todos = [];

async function api(path, options) {
  const res = await fetch(path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function render() {
  list.innerHTML = "";
  if (!todos.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No tasks yet";
    list.appendChild(li);
    return;
  }
  todos.forEach((t) => {
    const li = document.createElement("li");
    li.dataset.id = t.id;

    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = t.done;

    const label = document.createElement("span");
    label.textContent = t.text;
    if (t.done) label.className = "done";

    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "✕";

    li.append(box, label, del);
    list.appendChild(li);
  });
}

async function load() {
  try {
    todos = await api("/todos");
    msg.textContent = "";
    render();
  } catch (e) {
    msg.textContent = "Cannot reach the API. Is node api.js running?";
  }
}

function run(action) {
  return action().then(load).catch((e) => (msg.textContent = e.message));
}

function add() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  run(() => api("/todos", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ text }) }));
}

document.getElementById("add").onclick = add;
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") add();
});

load();

list.addEventListener("change", (e) => {
  const li = e.target.closest("li");
  if (!li || e.target.type !== "checkbox") return;
  run(() => api("/todos/" + li.dataset.id, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify({ done: e.target.checked }),
  }));
});

list.addEventListener("click", (e) => {
  if (!e.target.classList.contains("del")) return;
  const li = e.target.closest("li");
  run(() => api("/todos/" + li.dataset.id, { method: "DELETE" }));
});
