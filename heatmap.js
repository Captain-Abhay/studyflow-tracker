import { getToday } from './state.js';

// Utility: Map count → heat level
export function getLevel(count) {
    if (count >= 4) return 4;
    if (count >= 3) return 3;
    if (count >= 2) return 2;
    if (count >= 1) return 1;
    return 0;
}

// Utility: Faster date formatting
function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

// Render full heatmap (only on load)
export function renderHeatmap(progressData) {
    const container = document.getElementById('heatmap');
    const fragment = document.createDocumentFragment();

    const today = new Date(); // create once

    for (let i = 80; i >= 0; i--) {
        const d = new Date(today); // clone
        d.setDate(today.getDate() - i);

        const dateStr = formatDate(d);
        const count = progressData[dateStr] || 0;

        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.date = dateStr;
        cell.dataset.level = getLevel(count);
        cell.title = `${dateStr}: ${count} tasks completed`;

        // Optional: show count inside cell
        if (count > 0) {
            cell.textContent = count;
            cell.style.fontSize = '10px';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
        }

        fragment.appendChild(cell);
    }

    container.innerHTML = '';
    container.appendChild(fragment);
}

// Update only today's cell (efficient)
export function updateTodayHeatmap(count) {
    const today = getToday();
    const cell = document.querySelector(`.cell[data-date="${today}"]`);
    
    if (cell) {
        cell.dataset.level = getLevel(count);
        cell.title = `${today}: ${count} tasks completed`;

        // Update visible count
        cell.textContent = count > 0 ? count : '';
    }
}