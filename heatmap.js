function getLevel(c) {
    if (c >= 4) return 4;
    if (c >= 3) return 3;
    if (c >= 2) return 2;
    if (c >= 1) return 1;
    return 0;
}

export function renderHeatmap(data) {

    const container = document.getElementById('heatmap');
    container.innerHTML = '';

    const weeks = 12;

    for (let w = 0; w < weeks; w++) {

        const col = document.createElement('div');
        col.className = 'column';

        for (let d = 0; d < 7; d++) {

            const date = new Date();
            date.setDate(date.getDate() - ((weeks-w)*7 - d));

            const key = date.toISOString().split('T')[0];
            const count = data[key] || 0;

            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.level = getLevel(count);

            col.appendChild(cell);
        }

        container.appendChild(col);
    }
}