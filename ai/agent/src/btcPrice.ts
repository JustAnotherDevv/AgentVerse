import axios from 'axios';

export class BTCPriceService {
  private priceHistory: number[] = [];
  private currentPrice: number = 0;
  private lastUpdate: number = 0;
  private updateInterval: number = 60000;

  constructor() {
    this.fetchPrice();
    setInterval(() => this.fetchPrice(), this.updateInterval);
  }

  async fetchPrice() {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true', {
        timeout: 10000
      });
      
      const price = response.data.bitcoin.usd;
      const change = response.data.bitcoin.usd_24h_change;
      
      this.priceHistory.push(price);
      if (this.priceHistory.length > 500) {
        this.priceHistory.shift();
      }
      
      this.currentPrice = price;
      this.lastUpdate = Date.now();
      
      return { price, change, history: this.priceHistory };
    } catch (error) {
      console.error('Failed to fetch BTC price:', error);
      return { 
        price: this.currentPrice || 97000, 
        change: 0, 
        history: this.priceHistory 
      };
    }
  }

  getCurrentPrice(): number {
    return this.currentPrice || 97000;
  }

  getPriceHistory(): number[] {
    return this.priceHistory;
  }

  getPriceAtMinutesAgo(minutes: number): number | null {
    const index = this.priceHistory.length - minutes;
    if (index < 0) return null;
    return this.priceHistory[index];
  }

  getChangePercent(periods: number = 1): number {
    if (this.priceHistory.length < periods + 1) return 0;
    const oldPrice = this.priceHistory[this.priceHistory.length - periods - 1];
    const newPrice = this.priceHistory[this.priceHistory.length - 1];
    return ((newPrice - oldPrice) / oldPrice) * 100;
  }

  getMovingAverage(periods: number = 20): number {
    if (this.priceHistory.length < periods) {
      return this.currentPrice;
    }
    const recent = this.priceHistory.slice(-periods);
    return recent.reduce((a, b) => a + b, 0) / periods;
  }

  getRSI(periods: number = 14): number {
    if (this.priceHistory.length < periods + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = this.priceHistory.length - periods; i < this.priceHistory.length; i++) {
      const change = this.priceHistory[i] - this.priceHistory[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / periods;
    const avgLoss = losses / periods;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  getVolatility(periods: number = 20): number {
    if (this.priceHistory.length < periods) return 0;
    
    const recent = this.priceHistory.slice(-periods);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / recent.length;
    
    return Math.sqrt(variance) / mean * 100;
  }

  detectPattern(): string {
    if (this.priceHistory.length < 20) return 'insufficient_data';
    
    const recent = this.priceHistory.slice(-20);
    const ma20 = recent.reduce((a, b) => a + b, 0) / 20;
    const ma5 = recent.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const current = recent[recent.length - 1];
    
    if (ma5 > ma20 && current > ma5) return 'strong_uptrend';
    if (ma5 > ma20 && current < ma5) return 'weak_uptrend';
    if (ma5 < ma20 && current < ma5) return 'strong_downtrend';
    if (ma5 < ma20 && current > ma5) return 'weak_downtrend';
    return 'sideways';
  }

  getSupportResistance(): { support: number; resistance: number } {
    if (this.priceHistory.length < 50) {
      return { support: this.currentPrice * 0.95, resistance: this.currentPrice * 1.05 };
    }
    
    const recent = this.priceHistory.slice(-50);
    const lows = recent.filter((p, i) => i > 0 && p < recent[i - 1] && p < recent[i + 1]);
    const highs = recent.filter((p, i) => i > 0 && p > recent[i - 1] && p > recent[i + 1]);
    
    const support = lows.length > 0 ? lows.sort((a, b) => a - b)[0] : this.currentPrice * 0.95;
    const resistance = highs.length > 0 ? highs.sort((a, b) => b - a)[0] : this.currentPrice * 1.05;
    
    return { support, resistance };
  }
}

export const btcPriceService = new BTCPriceService();
