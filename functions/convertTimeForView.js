export default function (timestamp) {
    const years = Math.trunc(timestamp / (1000 * 60 * 60 * 24 * 7 * 356));
    if (years > 0) {
        let ending = ' лет';
        if (years % 100 == 1 || (years % 100 > 20 && years % 10 == 1)) ending = ' год';
        else if ((years % 100 > 20 || years % 100 < 10) && years % 10 >= 2 && years % 10 <= 4) ending = ' год.';

        return years + ending;
    }

    const months = Math.trunc(timestamp / (1000 * 60 * 60 * 24 * 30));
    if (months > 0) {
        return months + ' мес.';
    }

    const weeks = Math.trunc(timestamp / (1000 * 60 * 60 * 24 * 7));
    if (weeks > 0) {
        return weeks + ' нед.';
    }

    const days = Math.trunc(timestamp / (1000 * 60 * 60 * 24));
    if (days > 0) {
        return days + ' дн.';
    }

    const hours = Math.trunc(timestamp / (1000 * 60 * 60));
    if (hours > 0) {
        return hours + ' ч.';
    }

    const minutes = Math.trunc(timestamp / (1000 * 60));
    if (minutes > 0) {
        return minutes + ' мин.';
    }

    const seconds = Math.trunc(timestamp / 1000);
    return seconds + ' сек.';
}