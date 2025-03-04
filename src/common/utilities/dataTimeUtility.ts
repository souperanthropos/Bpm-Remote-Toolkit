export class DataTimeUtility {

    private static padTo2Digits(num: number): string {
        return num.toString().padStart(2, '0');
    }

    public static getUnixTimeWithoutMilliseconds(unixTime: number): string {
        const time = Math.floor(unixTime / 1000) * 1000;
        return time.toString();
    }

    public static formatDate(date: Date): string {
        return (
            [
                date.getFullYear(),
                this.padTo2Digits(date.getMonth() + 1),
                this.padTo2Digits(date.getDate()),
            ].join('-') +
            ' ' +
            [
                this.padTo2Digits(date.getHours()),
                this.padTo2Digits(date.getMinutes()),
                this.padTo2Digits(date.getSeconds()),
            ].join(':')
        );
    }
}