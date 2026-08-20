# 📊 ServiceNow MTTR Calculator

A lightning-fast, client-side web dashboard to calculate **Mean Time to Resolution (MTTR)** from ServiceNow Excel exports.

Originally built in Python, this tool was completely re-architected in **V3.0** into a standalone HTML/JS web application running on Nginx. This means all data parsing is done instantly in your browser, resulting in massive performance gains and zero backend bottlenecks.

---

## ✨ Version History

### **v1.5.0 (Latest Release)**
* **Advanced Glassmorphism UI:** Complete visual overhaul featuring deep glowing borders, frosted glass cards, and smooth hover transitions.
* **Global Monthly Filtering:** Easily slice the entire dashboard (KPIs, Tables, and Charts) by a specific month (e.g. 2026-08) using the new 'Date Range' toggle.
* **Interactive Drill-downs:** The "By Group" and "By Item" tables now feature visually distinct, clickable links that instantly open the raw ticket data modal.
* **SLA Badging & Layout Fixes:** Fixed KPI badges popping out correctly, eliminated horizontal scrollbars by improving the CSS grid responsiveness, and squashed rendering bugs with chart data.
* **First-Launch Splash Screen:** Added an interactive "What's New" modal that greets users with recent changes upon opening a new session.

### **V3.0 (Legacy Web App)**
* **Client-Side Architecture:** Rebuilt entirely in HTML/JS. Data never leaves your browser, ensuring maximum privacy and instant calculation speeds.
* **Smart Column Detection:** The app now "peeks" into your data to automatically map columns. It actively detects and ignores columns containing RITM/INC IDs when searching for your Catalog Items.
* **Ongoing Tickets Analysis:** Tickets without a 'Closed' date are no longer ignored. The app calculates their current age based on the export date and plots them in orange so you can track SLA bleed.
* **Active Breaches KPI:** A new clickable KPI card instantly filters the data grid to show all ongoing tickets that have already breached your SLA target.
* **Grid Dashboard Layout:** Improved responsive UI using CSS Grids to eliminate vertical scrolling, featuring side-by-side grouped tables and dynamic Chart.js interactive graphs.
* **Executive Snapshots:** Download high-resolution PNG snapshots of your dashboard layout for reporting.

### **V2.0 & V1.0 (Legacy Python)**
* *Deprecated:* The original Streamlit Python implementation has been retired in favor of the static web app architecture.

---

## 🚀 Deployment Guide

This app is fully containerized using Nginx to serve the static files.

### **1. Clone the repository**
```bash
git clone https://github.com/beanp02/mttr-calculator.git
cd mttr-calculator
```

### **2. Launch the App**
```bash
docker-compose up -d --build
```
The app will be available at `http://<your-ip>:8501`.

*(Note: We maintain port 8501 in the docker-compose mapping to ensure seamless transition from the old Streamlit deployment).*

---

## 🛠️ Usage & Tips

1. **Upload Data:** Export your tickets from ServiceNow as an Excel (`.xlsx`) or CSV file and drop it into the app.
2. **Configuration:** The app will attempt to auto-map your Start, End, Group, and Item columns.
3. **Filtering:** Use the left sidebar to slice your data by Assignment Group, Category, or timeframe (Last 30 Days, Last 90 Days, etc.).
4. **Analysis:** 
   - Hover over the **Trend Chart** to see weekly/monthly aggregations.
   - Click the **🔥 Active Breaches** card to instantly view open tickets failing your SLA.
   - Use the **By Group / By Item** tabs to see your best and worst performers without scrolling.
