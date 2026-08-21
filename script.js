const assets = [];
const liabilities = [];

const assetColors = {
  Cash: "#ff82b8",
  Retirement: "#e83e8c",
  Brokerage: "#ffb3d1",
  "Real Estate": "#ff6aa8",
  Vehicle: "#ffc2dd",
  Other: "#f58fcb"
};

const liabilityColors = {
  "Credit Card": "#a56cff",
  "Student Loan": "#c3a0ff",
  "Auto Loan": "#8f55e8",
  Mortgage: "#d7c2ff",
  Other: "#b88cff"
};

document.getElementById("assetForm").addEventListener("submit", function (event) {
  event.preventDefault();

  assets.push({
    name: document.getElementById("assetName").value,
    type: document.getElementById("assetType").value,
    amount: Number(document.getElementById("assetAmount").value)
  });

  this.reset();
  updatePage();
});

document.getElementById("liabilityForm").addEventListener("submit", function (event) {
  event.preventDefault();

  liabilities.push({
    name: document.getElementById("liabilityName").value,
    type: document.getElementById("liabilityType").value,
    amount: Number(document.getElementById("liabilityAmount").value)
  });

  this.reset();
  updatePage();
});

function updatePage() {
  const totalAssets = addAmounts(assets);
  const totalLiabilities = addAmounts(liabilities);
  const netWorth = totalAssets - totalLiabilities;

  document.getElementById("totalAssets").textContent = money(totalAssets);
  document.getElementById("totalLiabilities").textContent = money(totalLiabilities);
  document.getElementById("netWorth").textContent = money(netWorth);

  showList("assetList", assets, removeAsset);
  showList("liabilityList", liabilities, removeLiability);
  drawChart();
}

function addAmounts(items) {
  return items.reduce((total, item) => total + item.amount, 0);
}

function showList(listId, items, removeFunction) {
  const list = document.getElementById(listId);
  list.innerHTML = "";

  items.forEach(function (item, index) {
    const row = document.createElement("li");
    row.innerHTML = `
      <span>${item.name} (${item.type})</span>
      <strong>${money(item.amount)}</strong>
      <button type="button">Remove</button>
    `;
    row.querySelector("button").addEventListener("click", function () {
      removeFunction(index);
    });
    list.appendChild(row);
  });
}

function removeAsset(index) {
  assets.splice(index, 1);
  updatePage();
}

function removeLiability(index) {
  liabilities.splice(index, 1);
  updatePage();
}

function drawChart() {
  const canvas = document.getElementById("netWorthChart");
  const ctx = canvas.getContext("2d");
  const slices = buildSlices();
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (total === 0) {
    ctx.fillStyle = "#7c2452";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Add assets or liabilities to see the chart", canvas.width / 2, canvas.height / 2);
    return;
  }

  let startAngle = -Math.PI / 2;
  const centerX = 170;
  const centerY = 160;
  const radius = 115;

  slices.forEach(function (slice, index) {
    const angle = (slice.amount / total) * Math.PI * 2;
    const endAngle = startAngle + angle;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();

    ctx.fillStyle = "#7c2452";
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.fillText(slice.label, 330, 60 + index * 24);

    ctx.fillStyle = slice.color;
    ctx.fillRect(305, 49 + index * 24, 14, 14);

    startAngle = endAngle;
  });
}

function buildSlices() {
  const groups = {};

  assets.forEach(function (asset) {
    const key = "Asset: " + asset.type;
    groups[key] = (groups[key] || 0) + asset.amount;
  });

  liabilities.forEach(function (liability) {
    const key = "Debt: " + liability.type;
    groups[key] = (groups[key] || 0) + liability.amount;
  });

  return Object.keys(groups).map(function (key) {
    const type = key.replace("Asset: ", "").replace("Debt: ", "");
    const isAsset = key.startsWith("Asset:");
    return {
      label: key,
      amount: groups[key],
      color: isAsset ? assetColors[type] : liabilityColors[type]
    };
  });
}

function money(amount) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });
}

updatePage();
