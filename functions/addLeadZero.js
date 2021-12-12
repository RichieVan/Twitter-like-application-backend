export default (date) => {
    if ((date + '').length < 2) {
        date = '0' + date;
    }
    return date;
}