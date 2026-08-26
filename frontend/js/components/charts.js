/**
 * High-Performance Vanilla Canvas/SVG Chart Renderer
 * Render Revenue Trends, Expense Category Donuts, and Sentiment Gauges without external dependencies.
 */

window.ChartRenderer = {
  
  // Line Chart for Monthly Expense Totals (real data only - there is no
  // "revenue" field anywhere in the bookkeeping-query schema, so this is a
  // single expense series computed from actual stored transactions, not a
  // two-series revenue/expense comparison).
  renderLineChart: (canvasId, monthly) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;

    ctx.clearRect(0, 0, width, height);

    if (!monthly || monthly.length === 0) {
      ctx.fillStyle = "#6b7280";
      ctx.font = "13px Plus Jakarta Sans";
      ctx.fillText("No transactions yet", padding, height / 2);
      return;
    }

    const labels = monthly.map(m => m.label);
    const expenses = monthly.map(m => m.total);
    const maxVal = Math.max(...expenses, 1) * 1.2;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i * (height - padding * 2) / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      ctx.fillStyle = "#6b7280";
      ctx.font = "11px Plus Jakarta Sans";
      ctx.fillText(`$${Math.round(maxVal - (i * maxVal / 4))}`, 4, y + 4);
    }

    const getCoords = (arr) => arr.map((val, idx) => {
      const x = arr.length > 1
        ? padding + (idx * (width - padding * 2) / (arr.length - 1))
        : width / 2;
      const y = height - padding - (val / maxVal * (height - padding * 2));
      return { x, y };
    });

    const expCoords = getCoords(expenses);

    const gradExp = ctx.createLinearGradient(0, 0, 0, height);
    gradExp.addColorStop(0, "rgba(244, 63, 94, 0.30)");
    gradExp.addColorStop(1, "rgba(244, 63, 94, 0.0)");

    ctx.beginPath();
    ctx.moveTo(expCoords[0].x, height - padding);
    expCoords.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(expCoords[expCoords.length - 1].x, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradExp;
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 3;
    expCoords.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    expCoords.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#f43f5e";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#090d16";
      ctx.stroke();
    });

    labels.forEach((lbl, idx) => {
      const x = labels.length > 1
        ? padding + (idx * (width - padding * 2) / (labels.length - 1))
        : width / 2;
      ctx.fillStyle = "#9ca3af";
      ctx.font = "12px Plus Jakarta Sans";
      ctx.fillText(lbl, x - 10, height - 12);
    });
  },

  // Donut Chart for Expense Categories
  renderDonutChart: (containerId, categories) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!categories || categories.length === 0) {
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.justifyContent = "center";
      container.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem;">No transactions yet</span>`;
      return;
    }
    const data = categories;

    let total = data.reduce((acc, item) => acc + item.value, 0);
    let currentAngle = 0;

    let svgHtml = `
      <svg width="180" height="180" viewBox="0 0 42 42" class="donut-svg">
        <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="rgba(255,255,255,0.05)" stroke-width="5"></circle>
    `;

    data.forEach(item => {
      const pct = (item.value / total) * 100;
      const strokeDasharray = `${pct} ${100 - pct}`;
      const strokeDashoffset = 100 - currentAngle + 25;

      svgHtml += `
        <circle cx="21" cy="21" r="15.91549430918954"
                fill="transparent"
                stroke="${item.color}"
                stroke-width="5"
                stroke-dasharray="${strokeDasharray}"
                stroke-dashoffset="${strokeDashoffset}"
                style="transition: all 0.5s ease;">
        </circle>
      `;
      currentAngle += pct;
    });

    svgHtml += `
        <text x="50%" y="47%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="6" font-weight="700">100%</text>
        <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-size="2.5">Tracked</text>
      </svg>
      <div class="donut-legend" style="display: flex; flex-direction: column; gap: 8px; font-size: 0.8rem; margin-left: 20px;">
    `;

    data.forEach(item => {
      svgHtml += `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <span style="display: flex; align-items: center; gap: 8px; color: var(--text-main);">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${item.color}; display: inline-block;"></span>
            ${item.name}
          </span>
          <strong style="color: #ffffff;">${item.value}%</strong>
        </div>
      `;
    });

    svgHtml += `</div>`;
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.innerHTML = svgHtml;
  }
};
