/* =========================
   API BASE URL (CHANGE ONLY THIS FOR RENDER)
========================= */

const API_URL = "https:/dukaan-backend-u1zj.onrender.com/";
// const API_URL = "https://your-render-app.onrender.com";

/* =========================
   SESSION CHECK
========================= */

if (localStorage.getItem("isAdmin") !== "true") {
  window.location.href = "index.html";
}

/* =========================
   GLOBAL
========================= */

let customers = [];

/* =========================
   LOAD CUSTOMERS FROM DB
========================= */

async function loadCustomers() {
  try {
    const res = await fetch(`${API_URL}/customers`);
    customers = await res.json();
    render();
  } catch (err) {
    console.error("Server not running?", err);
  }
}

/* =========================
   LOGOUT
========================= */

function logout() {
  localStorage.removeItem("isAdmin");
  window.location = "index.html";
}

function toggleDark() {
  document.body.classList.toggle("dark");
}

/* =========================
   MODAL
========================= */

function openModal(name = "", father = "") {
  document.getElementById("modal").style.display = "flex";
  document.getElementById("customerName").value = name;
  document.getElementById("fatherName").value = father;
  document.getElementById("amount").value = "";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

/* =========================
   SAVE TRANSACTION
========================= */

async function saveTransaction() {
  const name = document.getElementById("customerName").value.trim();
  const fatherName = document.getElementById("fatherName").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const type = document.getElementById("type").value;

  if (!name || !fatherName || !amount) {
    alert("Fill all fields");
    return;
  }

  try {
    await fetch(`${API_URL}/customer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, fatherName, amount, type }),
    });

    closeModal();
    loadCustomers();
  } catch (err) {
    console.error("Save error:", err);
  }
}

/* =========================
   EDIT CUSTOMER
========================= */

async function editCustomer(index) {
  const customer = customers[index];

  const newName = prompt("Edit Name:", customer.name);
  const newFather = prompt("Edit Father Name:", customer.fatherName);

  if (!newName || !newFather) return;

  await fetch(`${API_URL}/customer/${customer._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: newName.trim(),
      fatherName: newFather.trim(),
    }),
  });

  loadCustomers();
}

/* =========================
   DELETE CUSTOMER
========================= */

async function deleteCustomer(index) {
  if (!confirm("Delete this customer?")) return;

  const id = customers[index]._id;

  await fetch(`${API_URL}/customer/${id}`, {
    method: "DELETE",
  });

  loadCustomers();
}

/* =========================
   ADJUST BALANCE
========================= */

async function adjustBalance(index) {
  const customer = customers[index];

  const newBalance = prompt(
    `Current Balance: ₹${customer.balance}\nEnter Correct Balance:`,
  );

  if (newBalance === null) return;
  if (isNaN(newBalance)) {
    alert("Invalid number");
    return;
  }

  await fetch(`${API_URL}/adjust/${customer._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      newBalance: Number(newBalance),
    }),
  });

  loadCustomers();
}

/* =========================
   VIEW HISTORY
========================= */

function viewHistory(index) {
  let text = "Transaction History:\n\n";

  customers[index].history.forEach((h) => {
    text += `${h.date} - ${h.type} ₹${h.amount}\n`;
  });

  alert(text);
}

/* =========================
   SEARCH
========================= */

function searchCustomer() {
  const val = document.getElementById("searchInput").value.toLowerCase();

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(val) ||
      (c.fatherName && c.fatherName.toLowerCase().includes(val)),
  );

  render(filtered);
}

/* =========================
   RENDER TABLE
========================= */

function render(list = customers) {
  const table = document.getElementById("customerTable");
  if (!table) return;

  table.innerHTML = "";

  let totalBalance = 0;

  list.forEach((c, index) => {
    totalBalance += c.balance;

    table.innerHTML += `
      <tr>
        <td>${c.name}</td>
        <td>${c.fatherName || "-"}</td>
        <td>₹${c.balance}</td>
        <td>
          <button onclick="openModal('${c.name}','${c.fatherName}')">Add</button>
          <button onclick="viewHistory(${index})">History</button>
          <button onclick="editCustomer(${index})">Edit</button>
          <button onclick="adjustBalance(${index})">Adjust</button>
          <button onclick="deleteCustomer(${index})">Delete</button>
        </td>
      </tr>
    `;
  });

  document.getElementById("totalCustomers").innerText = list.length;
  document.getElementById("totalBalance").innerText = totalBalance;
}

/* =========================
   PDF EXPORT
========================= */

function exportCSV() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  doc.text("DukaanHisab Report", 20, 20);

  let y = 35;

  customers.forEach((c, index) => {
    const name = (c?.name || "-").replace(/\s+/g, " ").trim();
    const father = (c?.fatherName || "-").replace(/\s+/g, " ").trim();
    const balance = c?.balance ?? 0;

    const line = `${index + 1}. ${name} | ${father} | Balance: ₹${balance}`;

    doc.text(line, 20, y);
    y += 10;
  });

  doc.save("DukaanHisab.pdf");
}

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", loadCustomers);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
