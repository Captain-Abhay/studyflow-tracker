export function generateSchedule(subjects, workHours) {

    const [start, end] = workHours.split('-').map(Number);

    let hour = 6;
    let id = 0;
    const result = [];

    while (hour < 23) {

        if (hour >= start && hour < end) {
            result.push({
                id: id++,
                label: 'Work',
                type: 'work',
                completed: false
            });
            hour++;
            continue;
        }

        const sub = subjects[Math.floor(Math.random()*subjects.length)];

        result.push({
            id: id++,
            label: sub,
            type: 'study',
            completed: false
        });

        hour++;
    }

    return result;
}