/**
 * High-Performance Vanilla Canvas/SVG Chart Renderer
 * Render Revenue Trends, Expense Category Donuts, and Sentiment Gauges without external dependencies.
 */

window.ChartRenderer = {
  
  // Line Chart for Monthly Revenue vs Expenses
  renderLineChart: (canvasId, data) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Scale for High DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    const labels = ["Nov", "Dec", "Jan", "Feb", "Mar"];
    const revenue = [4200, 5100, 4800, 6200, 7500];
    const expenses = [2100, 2400, 2900, 4100, 3200];

    const maxVal = 9000;

    // Draw Grid Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i * (height - padding * 2) / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Axis label
      ctx.fillStyle = "#6b7280";
      ctx.font = "11px Plus Jakarta Sans";
      ctx.fillText(`$${Math.round(maxVal - (i * maxVal / 4))}`, 10, y + 4);
    }

    // Helper to plot curve
    const getCoords = (arr) => arr.map((val, idx) => {
      const x = padding + (idx * (width - padding * 2) / (arr.length - 1));
      const y = height - padding - (val / maxVal * (height - padding * 2));
      return { x, y };
    });

    const revCoords = getCoords(revenue);
    const expCoords = getCoords(expenses);

    // Render Gradient Fill for Revenue
    const gradRev = ctx.createLinearGradient(0, 0, 0, height);
    gradRev.addColorStop(0, "rgba(99, 102, 241, 0.35)");
    gradRev.addColorStop(1, "rgba(99, 102, 241, 0.0)");

    ctx.beginPath();
    ctx.moveTo(revCoords[0].x, height - padding);
    revCoords.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(revCoords[revCoords.length - 1].x, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradRev;
    ctx.fill();

    // Render Lines
    const drawLine = (coords, color) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      coords.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Dots
      coords.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#090d16";
        ctx.stroke();
      });
    };

    drawLine(revCoords, "#6366f1"); // Revenue Line (Indigo)
    drawLine(expCoords, "#f43f5e"); // Expense Line (Rose)

    // X Axis Labels
    labels.forEach((lbl, idx) => {
      const x = padding + (idx * (width - padding * 2) / (labels.length - 1));
      ctx.fillStyle = "#9ca3af";
      ctx.font = "12px Plus Jakarta Sans";
      ctx.fillText(lbl, x - 10, height - 12);
    });
  },

  // Donut Chart for Expense Categories
  renderDonutChart: (containerId, categories) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const data = categories || [
      { name: "Cloud & AI", value: 45, color: "#6366f1" },
      { name: "SaaS & Tools", value: 25, color: "#06b6d4" },
      { name: "Equipment & Hardware", value: 18, color: "#10b981" },
      { name: "Office & Travel", value: 12, color: "#f59e0b" }
    ];

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
