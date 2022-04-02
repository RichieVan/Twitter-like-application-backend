import addLeadZero from './addLeadZero.js';
import convertTimeForView from "./convertTimeForView.js";

export default function CalculatePostTimestamps (timestamp) {
    let diffTimestamp = (Date.now() - Date.parse(timestamp));

    const createdDate = new Date(Date.parse(timestamp));
    const titleTime = addLeadZero(createdDate.getDate()) + '.' + addLeadZero(createdDate.getMonth() + 1) + '.' + createdDate.getFullYear() + ' ' + addLeadZero(createdDate.getHours()) + ':' + addLeadZero(createdDate.getMinutes());
    const viewTime = convertTimeForView(diffTimestamp);

    return {
        timestamp,
        view: viewTime,
        title: titleTime
    }
}