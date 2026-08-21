const savedData = loadData();
const assets = savedData.assets;
const liabilities = savedData.liabilities;
let editingAssetIndex = null;
let editingLiabilityIndex = null;
let chartSlices = [];
let chartCenterX = 170;
let chartCenterY = 160;
let chartRadius = 115;

const assetColors = {
  Cash: "#ff82b8",
  Cryptocurrency: "#f7b731",
  Retirement: "#e83e8c",
  Brokerage: "#ffb3d1",
  "Real Estate": "#ff6aa8",
  Vehicle: "#ffc2dd",
  Other: "#f58fcb"
};

document.getElementById("assetForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const asset = {
    name: document.getElementById("assetName").value,
    type: document.getElementById("assetType").value,
    amount: Number(document.getElementById("assetAmount").value)
  };

  if (editingAssetIndex === null) {
    assets.push(asset);
  } else {
    assets[editingAssetIndex] = asset;
    stopEditingAsset();
  }

  this.reset();
  saveData();
  updatePage();
});

document.getElementById("liabilityForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const liability = {
    name: document.getElementById("liabilityName").value,
    type: document.getElementById("liabilityType").value,
    amount: Number(document.getElementById("liabilityAmount").value)
  };

  if (editingLiabilityIndex === null) {
    liabilities.push(liability);
  } else {
    liabilities[editingLiabilityIndex] = liability;
    stopEditingLiability();
  }

  this.reset();
  saveData();
  updatePage();
});

document.getElementById("assetCancelButton").addEventListener("click", function () {
  document.getElementById("assetForm").reset();
  stopEditingAsset();
});

document.getElementById("liabilityCancelButton").addEventListener("click", function () {
  document.getElementById("liabilityForm").reset();
  stopEditingLiability();
});

document.getElementById("netWorthChart").addEventListener("mousemove", showChartTooltip);
document.getElementById("netWorthChart").addEventListener("mouseleave", hideChartTooltip);

function updatePage() {
  const totalAssets = addAmounts(assets);
  const totalLiabilities = addAmounts(liabilities);
  const netWorth = totalAssets - totalLiabilities;

  document.getElementById("totalAssets").textContent = money(totalAssets);
  document.getElementById("totalLiabilities").textContent = money(totalLiabilities);
  document.getElementById("netWorth").textContent = money(netWorth);

  showList("assetList", assets, editAsset, removeAsset);
  showList("liabilityList", liabilities, editLiability, removeLiability);
  drawChart();
}

function addAmounts(items) {
  return items.reduce((total, item) => total + item.amount, 0);
}

function showList(listId, items, editFunction, removeFunction) {
  const list = document.getElementById(listId);
  list.innerHTML = "";

  items.forEach(function (item, index) {
    const row = document.createElement("li");
    row.innerHTML = `
      <span>${item.name} (${item.type})</span>
      <strong>${money(item.amount)}</strong>
      <button type="button">Edit</button>
      <button type="button">Remove</button>
    `;
    row.querySelectorAll("button")[0].addEventListener("click", function () {
      editFunction(index);
    });
    row.querySelectorAll("button")[1].addEventListener("click", function () {
      removeFunction(index);
    });
    list.appendChild(row);
  });
}

function editAsset(index) {
  const asset = assets[index];
  editingAssetIndex = index;
  document.getElementById("assetName").value = asset.name;
  document.getElementById("assetType").value = asset.type;
  document.getElementById("assetAmount").value = asset.amount;
  document.getElementById("assetSubmitButton").textContent = "Update Asset";
  document.getElementById("assetCancelButton").hidden = false;
}

function editLiability(index) {
  const liability = liabilities[index];
  editingLiabilityIndex = index;
  document.getElementById("liabilityName").value = liability.name;
  document.getElementById("liabilityType").value = liability.type;
  document.getElementById("liabilityAmount").value = liability.amount;
  document.getElementById("liabilitySubmitButton").textContent = "Update Debt";
  document.getElementById("liabilityCancelButton").hidden = false;
}

function removeAsset(index) {
  assets.splice(index, 1);
  stopEditingAsset();
  saveData();
  updatePage();
}

function removeLiability(index) {
  liabilities.splice(index, 1);
  stopEditingLiability();
  saveData();
  updatePage();
}

function stopEditingAsset() {
  editingAssetIndex = null;
  document.getElementById("assetSubmitButton").textContent = "Add Asset";
  document.getElementById("assetCancelButton").hidden = true;
}

function stopEditingLiability() {
  editingLiabilityIndex = null;
  document.getElementById("liabilitySubmitButton").textContent = "Add Debt";
  document.getElementById("liabilityCancelButton").hidden = true;
}

function saveData() {
  const data = {
    assets: assets,
    liabilities: liabilities
  };

  try {
    localStorage.setItem("netWorthTrackerData", JSON.stringify(data));
    showSaveStatus("Saved on this browser.");
  } catch (error) {
    showSaveStatus("Could not save. Browser storage may be blocked.");
  }
}

function loadData() {
  let savedText = "";

  try {
    savedText = localStorage.getItem("netWorthTrackerData");
  } catch (error) {
    return emptyData();
  }

  if (!savedText) {
    return emptyData();
  }

  try {
    const parsedData = JSON.parse(savedText);
    return {
      assets: Array.isArray(parsedData.assets) ? parsedData.assets : [],
      liabilities: Array.isArray(parsedData.liabilities) ? parsedData.liabilities : []
    };
  } catch (error) {
    return emptyData();
  }
}

function emptyData() {
  return {
    assets: [],
    liabilities: []
  };
}

function showSaveStatus(message) {
  const status = document.getElementById("saveStatus");

  if (status) {
    status.textContent = message;
  }
}

function drawChart() {
  const canvas = document.getElementById("netWorthChart");
  const ctx = canvas.getContext("2d");
  const slices = buildSlices();
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  chartSlices = [];

  if (total === 0) {
    ctx.fillStyle = "#7c2452";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Add assets to see the chart", canvas.width / 2, canvas.height / 2);
    return;
  }

  let startAngle = -Math.PI / 2;
  chartCenterX = 170;
  chartCenterY = 160;
  chartRadius = 115;

  slices.forEach(function (slice, index) {
    const angle = (slice.amount / total) * Math.PI * 2;
    const endAngle = startAngle + angle;

    ctx.beginPath();
    ctx.moveTo(chartCenterX, chartCenterY);
    ctx.arc(chartCenterX, chartCenterY, chartRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();

    chartSlices.push({
      label: slice.label,
      amount: slice.amount,
      startAngle: startAngle,
      endAngle: endAngle
    });

    ctx.fillStyle = "#7c2452";
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.fillText(slice.label, 330, 60 + index * 24);

    ctx.fillStyle = slice.color;
    ctx.fillRect(305, 49 + index * 24, 14, 14);

    startAngle = endAngle;
  });
}

function showChartTooltip(event) {
  const canvas = document.getElementById("netWorthChart");
  const tooltip = document.getElementById("chartTooltip");
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (event.clientX - rect.left) * scaleX;
  const mouseY = (event.clientY - rect.top) * scaleY;
  const slice = findHoveredSlice(mouseX, mouseY);

  if (!slice) {
    hideChartTooltip();
    return;
  }

  tooltip.textContent = `${slice.label}: ${money(slice.amount)}`;
  tooltip.style.left = `${event.clientX - rect.left}px`;
  tooltip.style.top = `${event.clientY - rect.top}px`;
  tooltip.hidden = false;
}

function hideChartTooltip() {
  document.getElementById("chartTooltip").hidden = true;
}

function findHoveredSlice(mouseX, mouseY) {
  const dx = mouseX - chartCenterX;
  const dy = mouseY - chartCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > chartRadius) {
    return null;
  }

  let angle = Math.atan2(dy, dx);

  if (angle < -Math.PI / 2) {
    angle += Math.PI * 2;
  }

  return chartSlices.find(function (slice) {
    return angle >= slice.startAngle && angle <= slice.endAngle;
  });
}

function buildSlices() {
  const groups = {};
  const liabilitiesByName = {};

  liabilities.forEach(function (liability) {
    const key = cleanName(liability.name);
    liabilitiesByName[key] = (liabilitiesByName[key] || 0) + liability.amount;
  });

  assets.forEach(function (asset) {
    const assetName = cleanName(asset.name);
    const matchingDebt = liabilitiesByName[assetName] || 0;
    const remainingValue = Math.max(asset.amount - matchingDebt, 0);
    liabilitiesByName[assetName] = Math.max(matchingDebt - asset.amount, 0);

    if (remainingValue > 0) {
      groups[asset.type] = (groups[asset.type] || 0) + remainingValue;
    }
  });

  return Object.keys(groups).map(function (type) {
    return {
      label: type,
      amount: groups[type],
      color: assetColors[type]
    };
  });
}

function cleanName(name) {
  return name.trim().toLowerCase();
}

function money(amount) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });
}

updatePage();
