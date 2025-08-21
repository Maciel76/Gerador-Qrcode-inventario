// Utilidades
function detectSep(line) {
  const cands = [";", ",", "\t", "|"];
  const counts = cands.map((s) => [
    s,
    (line.match(new RegExp(`\\${s}`, "g")) || []).length,
  ]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] ? counts[0][0] : ";";
}

function parseText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const sep = detectSep(lines[0]);
  return lines.map((l) => {
    const parts = l.split(sep).map((s) => s?.trim() ?? "");
    return {
      codigo: parts[0] || "",
      nome: parts[1] || "",
      quantidade: parts[2] || "",
    };
  });
}

function normalize(rows, { dedup = true }) {
  if (!dedup) return rows.filter((r) => r.codigo && r.codigo.trim() !== "");

  const map = new Map();
  for (const r of rows) {
    const codigo = (r.codigo || "").replace(/\s+/g, "");
    if (!codigo) continue;

    if (!map.has(codigo)) {
      map.set(codigo, {
        codigo,
        nome: r.nome || "",
        quantidade: r.quantidade || "",
      });
    }
  }
  return [...map.values()];
}

function renderTable(rows, opts) {
  const tbody = document.querySelector("#grid tbody");
  tbody.innerHTML = "";

  for (const r of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td class="codigo">${r.codigo}</td>
            <td class="nome">${r.nome}</td>
            <td class="qt">${r.quantidade}</td>
            <td class="qr-container"><div class="qrbox"></div></td>
        `;
    tbody.appendChild(tr);

    // Gerar QR Code
    const box = tr.querySelector(".qrbox");
    try {
      // Validar se o código não está vazio
      if (!r.codigo || r.codigo.trim() === "") {
        throw new Error("Código vazio");
      }

      new QRCode(box, {
        text: r.codigo,
        width: opts.size,
        height: opts.size,
        correctLevel: QRCode.CorrectLevel[opts.ecc],
        margin: 2,
      });
    } catch (error) {
      console.error("Erro ao gerar QR Code para", r.codigo, error);
      box.innerHTML = `<span class="error">Erro no QR</span>`;
    }
  }

  // Mostrar/ocultar tabela e estado vazio
  const tableContainer = document.getElementById("table-container");
  const emptyState = document.getElementById("empty-state");

  if (rows.length > 0) {
    tableContainer.style.display = "block";
    emptyState.style.display = "none";
  } else {
    tableContainer.style.display = "none";
    emptyState.style.display = "block";
  }
}

function showStatus(message, type = "success") {
  const statusEl = document.getElementById("status");
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = "block";

  // Auto-ocultar após 5 segundos
  setTimeout(() => {
    statusEl.style.display = "none";
  }, 5000);
}

function loadFromLocalStorage() {
  try {
    const preferences = JSON.parse(localStorage.getItem("qrPreferences")) || {};

    if (preferences.qrSize) {
      document.getElementById("qrSize").value = preferences.qrSize;
    }

    if (preferences.qrEcc) {
      document.getElementById("qrEcc").value = preferences.qrEcc;
    }

    if (preferences.dedup !== undefined) {
      document.getElementById("dedup").checked = preferences.dedup;
    }

    if (preferences.inputData) {
      document.getElementById("input").value = preferences.inputData;
    }
  } catch (error) {
    console.error("Erro ao carregar preferências:", error);
  }
}

function saveToLocalStorage() {
  const preferences = {
    qrSize: parseInt(document.getElementById("qrSize").value, 10) || 96,
    qrEcc: document.getElementById("qrEcc").value || "M",
    dedup: document.getElementById("dedup").checked,
    inputData: document.getElementById("input").value,
  };

  try {
    localStorage.setItem("qrPreferences", JSON.stringify(preferences));
  } catch (error) {
    console.error("Erro ao salvar preferências:", error);
  }
}

// Processar upload de CSV
function handleCsvUpload(file) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      if (results.errors.length > 0) {
        showStatus(
          "Erro ao processar CSV: " + results.errors[0].message,
          "error"
        );
        return;
      }

      const rows = results.data
        .map((row) => {
          // Tentar encontrar colunas por nome (case insensitive)
          let codigo = "",
            nome = "",
            quantidade = "";
          const keys = Object.keys(row);

          // Procurar por coluna de código
          const codKey = keys.find(
            (key) =>
              key.toLowerCase().includes("cod") ||
              key.toLowerCase().includes("code") ||
              key.toLowerCase().includes("id")
          );
          codigo = codKey ? row[codKey] : "";

          // Procurar por coluna de nome
          const nomeKey = keys.find(
            (key) =>
              key.toLowerCase().includes("nome") ||
              key.toLowerCase().includes("name") ||
              key.toLowerCase().includes("prod") ||
              key.toLowerCase().includes("desc")
          );
          nome = nomeKey ? row[nomeKey] : "";

          // Procurar por coluna de quantidade
          const qtKey = keys.find(
            (key) =>
              key.toLowerCase().includes("qt") ||
              key.toLowerCase().includes("quant") ||
              key.toLowerCase().includes("qtd") ||
              key.toLowerCase().includes("quantity")
          );
          quantidade = qtKey ? row[qtKey] : "";

          // Se não encontrou pelos nomes, usar as primeiras colunas
          if (!codigo && keys.length > 0) codigo = row[keys[0]] || "";
          if (!nome && keys.length > 1) nome = row[keys[1]] || "";
          if (!quantidade && keys.length > 2) quantidade = row[keys[2]] || "";

          return {
            codigo: (codigo || "").toString().trim(),
            nome: (nome || "").toString().trim(),
            quantidade: (quantidade || "").toString().trim(),
          };
        })
        .filter((row) => row.codigo !== ""); // Filtrar linhas sem código

      // Atualizar textarea com os dados
      const textData = rows
        .map((r) => `${r.codigo};${r.nome};${r.quantidade}`)
        .join("\n");
      document.getElementById("input").value = textData;

      showStatus(`CSV processado com ${rows.length} linhas válidas`, "success");

      // Gerar automaticamente os QR Codes
      if (rows.length > 0) {
        const size =
          parseInt(document.getElementById("qrSize").value, 10) || 96;
        const ecc = document.getElementById("qrEcc").value || "M";
        const dedup = document.getElementById("dedup").checked;

        const normalizedRows = normalize(rows, { dedup });
        renderTable(normalizedRows, { size, ecc });
      }
    },
    error: function (error) {
      showStatus("Erro ao ler arquivo: " + error.message, "error");
    },
  });
}

// Eventos
document.addEventListener("DOMContentLoaded", function () {
  // Carregar preferências salvas
  loadFromLocalStorage();

  // Botão Gerar
  document.getElementById("generate").addEventListener("click", function () {
    const text = document.getElementById("input").value;
    const size = parseInt(document.getElementById("qrSize").value, 10) || 96;
    const ecc = document.getElementById("qrEcc").value || "M";
    const dedup = document.getElementById("dedup").checked;

    if (!text.trim()) {
      showStatus("Por favor, insira alguns dados primeiro", "error");
      return;
    }

    try {
      const rows = normalize(parseText(text), { dedup });
      renderTable(rows, { size, ecc });
      showStatus(`Gerados ${rows.length} QR Codes`, "success");

      // Salvar preferências
      saveToLocalStorage();
    } catch (error) {
      showStatus("Erro ao processar dados: " + error.message, "error");
      console.error(error);
    }
  });

  // Botão Imprimir
  document.getElementById("print").addEventListener("click", function () {
    if (document.querySelectorAll("#grid tbody tr").length === 0) {
      showStatus("Nada para imprimir. Gere os QR Codes primeiro.", "error");
      return;
    }
    window.print();
  });

  // Botão Limpar
  document.getElementById("clear").addEventListener("click", function () {
    document.getElementById("input").value = "";
    document.getElementById("table-container").style.display = "none";
    document.getElementById("empty-state").style.display = "block";
    document.getElementById("file-name").textContent =
      "Nenhum arquivo selecionado";
    document.getElementById("status").style.display = "none";

    // Limpar localStorage
    localStorage.removeItem("qrPreferences");
  });

  // Upload de arquivo CSV
  document.getElementById("csv").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById("file-name").textContent = file.name;

    if (file.type !== "text/csv" && !file.name.toLowerCase().endsWith(".csv")) {
      showStatus("Por favor, selecione um arquivo CSV válido", "error");
      return;
    }

    handleCsvUpload(file);
  });

  // Salvar preferências quando alteradas
  document
    .getElementById("qrSize")
    .addEventListener("change", saveToLocalStorage);
  document
    .getElementById("qrEcc")
    .addEventListener("change", saveToLocalStorage);
  document
    .getElementById("dedup")
    .addEventListener("change", saveToLocalStorage);
  document
    .getElementById("input")
    .addEventListener("input", saveToLocalStorage);
});

// ... (código anterior das funções de utilidade)

function renderTable(rows, opts) {
  const tbody = document.querySelector("#grid tbody");
  tbody.innerHTML = "";

  for (const r of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td class="codigo">${r.codigo}</td>
            <td class="nome">${r.nome}</td>
            <td class="qt">${r.quantidade}</td>
            <td class="qr-container"><div class="qrbox"></div></td>
        `;
    tbody.appendChild(tr);

    // Gerar QR Code
    const box = tr.querySelector(".qrbox");
    try {
      if (!r.codigo || r.codigo.trim() === "") {
        throw new Error("Código vazio");
      }

      new QRCode(box, {
        text: r.codigo,
        width: opts.size,
        height: opts.size,
        correctLevel: QRCode.CorrectLevel[opts.ecc],
        margin: 2,
      });
    } catch (error) {
      console.error("Erro ao gerar QR Code para", r.codigo, error);
      box.innerHTML = `<span class="error">Erro no QR</span>`;
    }
  }

  // Mostrar/ocultar tabela e estado vazio
  const tableContainer = document.getElementById("table-container");
  const emptyState = document.getElementById("empty-state");

  if (rows.length > 0) {
    tableContainer.style.display = "block";
    emptyState.style.display = "none";
  } else {
    tableContainer.style.display = "none";
    emptyState.style.display = "block";
  }
}

// Nova função para renderizar os QR Codes em cards
function renderQRCards(rows, opts) {
  const qrGrid = document.querySelector(".qr-grid");
  qrGrid.innerHTML = "";

  for (const r of rows) {
    const card = document.createElement("div");
    card.className = "qr-card";
    card.innerHTML = `
            <div class="qr-header">
                <div class="qr-badge">Item</div>
            </div>
            <div class="qr-content">
                <div class="qr-code-wrapper"><div class="qrbox"></div></div>
                <div class="qr-details">
                    <h3>${r.codigo}</h3>
                    <p>${r.nome}</p>
                    <span class="quantity">Qtd: ${r.quantidade}</span>
                </div>
            </div>
        `;
    qrGrid.appendChild(card);

    // Gerar QR Code
    const box = card.querySelector(".qrbox");
    try {
      if (!r.codigo || r.codigo.trim() === "") {
        throw new Error("Código vazio");
      }

      new QRCode(box, {
        text: r.codigo,
        width: opts.size,
        height: opts.size,
        correctLevel: QRCode.CorrectLevel[opts.ecc],
        margin: 2,
      });
    } catch (error) {
      console.error("Erro ao gerar QR Code para", r.codigo, error);
      box.innerHTML = `<span class="error">Erro no QR</span>`;
    }
  }

  // Mostrar/ocultar grid e estado vazio
  const qrGridContainer = document.getElementById("qr-grid-container");
  const emptyState = document.getElementById("empty-state");

  if (rows.length > 0) {
    qrGridContainer.style.display = "block";
    emptyState.style.display = "none";
  } else {
    qrGridContainer.style.display = "none";
    emptyState.style.display = "block";
  }
}

// ... (restante do código anterior)

// Adicionar toggle de visualização
function setupViewToggle() {
  const toggleButtons = document.querySelectorAll(".view-toggle button");
  toggleButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remover classe active de todos os botões
      toggleButtons.forEach((btn) => btn.classList.remove("active"));
      // Adicionar classe active ao botão clicado
      this.classList.add("active");

      // Alternar entre as visualizações
      const viewType = this.dataset.view;
      localStorage.setItem("preferredView", viewType);

      // Recarregar a visualização atual se já houver dados
      const text = document.getElementById("input").value;
      if (text.trim()) {
        const size =
          parseInt(document.getElementById("qrSize").value, 10) || 96;
        const ecc = document.getElementById("qrEcc").value || "M";
        const dedup = document.getElementById("dedup").checked;

        const rows = normalize(parseText(text), { dedup });

        if (viewType === "cards") {
          document.getElementById("table-container").style.display = "none";
          renderQRCards(rows, { size, ecc });
        } else {
          document.getElementById("qr-grid-container").style.display = "none";
          renderTable(rows, { size, ecc });
        }
      }
    });
  });

  // Carregar visualização preferida
  const preferredView = localStorage.getItem("preferredView") || "cards";
  document
    .querySelector(`.view-toggle button[data-view="${preferredView}"]`)
    .classList.add("active");
}

// Modificar o evento DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
  // Carregar preferências salvas
  loadFromLocalStorage();

  // Configurar toggle de visualização
  setupViewToggle();

  // ... (restante do código de eventos)

  // Modificar o evento de clique do botão Gerar
  document.getElementById("generate").addEventListener("click", function () {
    const text = document.getElementById("input").value;
    const size = parseInt(document.getElementById("qrSize").value, 10) || 96;
    const ecc = document.getElementById("qrEcc").value || "M";
    const dedup = document.getElementById("dedup").checked;

    if (!text.trim()) {
      showStatus("Por favor, insira alguns dados primeiro", "error");
      return;
    }

    try {
      const rows = normalize(parseText(text), { dedup });

      // Verificar qual visualização está ativa
      const activeView = document.querySelector(".view-toggle button.active")
        .dataset.view;

      if (activeView === "cards") {
        renderQRCards(rows, { size, ecc });
      } else {
        renderTable(rows, { size, ecc });
      }

      showStatus(`Gerados ${rows.length} QR Codes`, "success");

      // Salvar preferências
      saveToLocalStorage();
    } catch (error) {
      showStatus("Erro ao processar dados: " + error.message, "error");
      console.error(error);
    }
  });
});
// Adicione este código se quiser animações adicionais
document.addEventListener("DOMContentLoaded", function () {
  const contactLinks = document.querySelectorAll(".contact-link");

  contactLinks.forEach((link) => {
    link.addEventListener("mouseenter", function () {
      this.style.transform = "translateX(5px)";
    });

    link.addEventListener("mouseleave", function () {
      this.style.transform = "translateX(0)";
    });
  });
});
