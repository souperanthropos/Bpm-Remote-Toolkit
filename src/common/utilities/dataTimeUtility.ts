export class DataTimeUtility {

    private static padTo2Digits(num: number): string {
        return num.toString().padStart(2, '0');
    }

    public static getUnixTimeWithoutMilliseconds(unixTime: number): string {
        const time = Math.floor(unixTime / 1000) * 1000;
        return time.toString();
    }

    public static formatDate(date: Date, separators: string = '- :'): string {
        if(separators.length !== 3){
            throw new Error('The separators must have 3 characters');
        }
        return (
            [
                date.getFullYear(),
                this.padTo2Digits(date.getMonth() + 1),
                this.padTo2Digits(date.getDate()),
            ].join(separators[0]) +
            separators[1] +
            [
                this.padTo2Digits(date.getHours()),
                this.padTo2Digits(date.getMinutes()),
                this.padTo2Digits(date.getSeconds()),
            ].join(separators[2])
        );
    }
}