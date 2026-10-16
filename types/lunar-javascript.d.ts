// lunar-javascript(6tail) 중 이 프로젝트가 쓰는 부분만 선언
declare module "lunar-javascript" {
  export class Solar {
    static fromYmd(y: number, m: number, d: number): Solar;
    static fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getLunar(): Lunar;
    toYmd(): string;
  }
  export class Lunar {
    static fromYmd(y: number, m: number, d: number): Lunar;
    static fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Lunar;
    getYear(): number;
    getMonth(): number; // 윤달은 음수
    getDay(): number;
    getSolar(): Solar;
    getEightChar(): EightChar;
    getYearZhi(): string;
    getDayInGanZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
  }
  export class EightChar {
    setSect(sect: 1 | 2): void; // 1: 23시에 일주 변경, 2: 0시에 변경(기본)
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getDayGan(): string;
  }
}
