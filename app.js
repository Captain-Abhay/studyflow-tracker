import { getState, updateState, getToday } from './state.js';
import { generateSchedule } from './scheduler.js';
import { renderHeatmap } from './heatmap.js';

const clock = document.getElementById('clock');
const saveBtn = document.getElementById('save-work');
const generateBtn = document.getElementById('generate');

function tick() {
    clock.textContent = new Date().toLocaleTimeString();
}
setInterval(tick,1000);

// SAVE WORK HOURS
saveBtn.onclick = () => {
    const val = document.getElementById('work-hours').value;

    if (!val.match(/^\d{1,2}-\d{1,2}$/)) {
        alert("Use format 10-18");
        return;
    }

    updateState(s => ({ ...s, workHours: val }));
};

// GENERATE
generateBtn.onclick = () => {

    const state = getState();

    if (!state.workHours) {
        alert("Set work hours first");
        return;
    }

    const input = document.getElementById('goals').value;

    const subjects = input.split('\n')
        .map(l => l.split(':')[0].trim())
        .filter(Boolean);

    const schedule = generateSchedule(subjects, state.workHours);

    updateState(s => ({ ...s, schedule }));

    renderSchedule();
};

// RENDER SCHEDULE
function renderSchedule() {

    const container = document.getElementById('schedule');
    container.innerHTML = '';

    const state = getState();

    state.schedule.forEach(task => {

        const div = document.createElement('div');
        div.className = 'block';

        div.innerHTML = `
            <span>${task.label}</span>
            ${task.type === 'study' ? `<input type="checkbox">` : ''}
        `;

        if (task.type === 'study') {

            const checkbox = div.querySelector('input');

            checkbox.onchange = () => {

                div.classList.toggle('done', checkbox.checked);

                const today = getToday();

                updateState(prev => {

                    const count = prev.progress[today] || 0;

                    return {
                        ...prev,
                        progress: {
                            ...prev.progress,
                            [today]: checkbox.checked ? count+1 : Math.max(0,count-1)
                        }
                    };
                });

                renderHeatmap(getState().progress);
            };
        }

        container.appendChild(div);
    });
}

// INIT
renderHeatmap(getState().progress);
renderSchedule();