// This is a simple utility to track the status of async operations.
// keep track of the start time of the operation

class TimeFrame {
    startTime: number;
    endTime: number | undefined;
}

const asyncStatus: Record<string, TimeFrame> = {};
//const finalStatuses: Record<string, TimeFrame> = {};
let lastLogtime = Date.now();
let firstTime = undefined;


export function asyncStatusStart(key: string): void {
    if (firstTime == undefined) {
        firstTime = Date.now();
    }
    asyncStatus[key] = {startTime: Date.now(), endTime: undefined};
}

export function asyncStatusEnd(key: string): void {
    asyncStatus[key].endTime = Date.now();
    // delete asyncStatus[key];

}

function getTimeFrameBar(timeFrame: TimeFrame, key: string): string {
    const totalWidth = 100;
    const startTime = timeFrame.startTime;
    const endTime = timeFrame.endTime ?? Date.now();
    const frameDuration = endTime - startTime;
    const totalTimeElapsed = Date.now() - firstTime;
    const normalizedTime = frameDuration / totalTimeElapsed;
    const normalizedStartTime = (startTime - firstTime) / totalTimeElapsed;
    const barWidth = Math.floor(normalizedTime * totalWidth);
    const barStart = Math.floor(normalizedStartTime * totalWidth);
    const bar = `${" ".repeat(barStart)}[${"=".repeat(barWidth)}] ${key} Start time: ${startTime - firstTime} End time: ${endTime - firstTime} Duration: ${frameDuration}ms\n`;
    return bar;
}

export function logAsyncStatus(): void {

    process.stdout.write('\x1Bc');
    let outString = "";
    const orderedKeys = Object.keys(asyncStatus).sort((a, b) => asyncStatus[a].startTime - asyncStatus[b].startTime);
    for (const key in orderedKeys) {
        const asyncKey = orderedKeys[key];
        const timeFrame = asyncStatus[asyncKey];
        outString += `${getTimeFrameBar(timeFrame, asyncKey)}`;

    }

    process.stdout.write(outString);
    lastLogtime = Date.now();
}

