import { AgentConfig, PredictionContext, ToolResult, PredictionRecord, PredictionStrategy } from './types.js';
import { btcPriceService } from './btcPrice.js';
import { v4 as uuidv4 } from 'uuid';

export class PredictionEngine {
  private tools: Map<string, (context: PredictionContext) => Promise<ToolResult>> = new Map();

  constructor() {
    this.registerTools();
  }

  private registerTools() {
    this.tools.set('analyze_rsi', async (ctx) => {
      const rsi = btcPriceService.getRSI();
      let signal: string;
      if (rsi > 70) signal = 'oversold - expect correction down';
      else if (rsi < 30) signal = 'oversold - expect bounce up';
      else signal = 'neutral';
      
      return {
        value: { rsi, signal },
        confidence: Math.abs(50 - rsi) / 50,
        reasoning: `RSI is ${rsi.toFixed(1)}, indicating ${signal}`
      };
    });

    this.tools.set('analyze_momentum', async (ctx) => {
      const change1m = btcPriceService.getChangePercent(1);
      const change5m = btcPriceService.getChangePercent(5);
      const change15m = btcPriceService.getChangePercent(15);
      
      const momentum = change1m + change5m * 0.5 + change15m * 0.25;
      const direction = momentum > 0.5 ? 'up' : momentum < -0.5 ? 'down' : 'flat';
      
      return {
        value: { change1m, change5m, change15m, momentum, direction },
        confidence: Math.min(Math.abs(momentum) / 2, 1),
        reasoning: `Momentum: ${momentum.toFixed(2)}% across timeframes. Direction: ${direction}`
      };
    });

    this.tools.set('analyze_volatility', async (ctx) => {
      const volatility = btcPriceService.getVolatility();
      const pattern = btcPriceService.detectPattern();
      
      return {
        value: { volatility, pattern },
        confidence: Math.min(volatility / 10, 1),
        reasoning: `Volatility: ${volatility.toFixed(2)}%, Pattern: ${pattern}`
      };
    });

    this.tools.set('analyze_support_resistance', async (ctx) => {
      const { support, resistance } = btcPriceService.getSupportResistance();
      const current = btcPriceService.getCurrentPrice();
      const distanceToResistance = (resistance - current) / current * 100;
      const distanceToSupport = (current - support) / current * 100;
      
      return {
        value: { support, resistance, distanceToResistance, distanceToSupport },
        confidence: 0.6,
        reasoning: `Support at $${support.toFixed(0)}, Resistance at $${resistance.toFixed(0)}`
      };
    });

    this.tools.set('analyze_moving_averages', async (ctx) => {
      const ma5 = btcPriceService.getMovingAverage(5);
      const ma20 = btcPriceService.getMovingAverage(20);
      const ma50 = btcPriceService.getMovingAverage(50);
      const current = btcPriceService.getCurrentPrice();
      
      let signal = 'neutral';
      if (ma5 > ma20 && current > ma5) signal = 'strong bullish';
      else if (ma5 > ma20) signal = 'bullish';
      else if (ma5 < ma20 && current < ma5) signal = 'strong bearish';
      else if (ma5 < ma20) signal = 'bearish';
      
      return {
        value: { ma5, ma20, ma50, current, signal },
        confidence: 0.7,
        reasoning: `MA5: $${ma5.toFixed(0)}, MA20: $${ma20.toFixed(0)}. Signal: ${signal}`
      };
    });

    this.tools.set('analyze_cycles', async (ctx) => {
      const hour = new Date().getHours();
      const dayOfWeek = new Date().getDay();
      
      const historicalPatterns: Record<number, string> = {
        0: 'Sunday - typically lower volume',
        1: 'Monday - market establishing direction',
        2: 'Tuesday - higher volatility',
        3: 'Wednesday - midweek momentum',
        4: 'Thursday - pre-weekend positioning',
        5: 'Friday - weekend positioning',
        6: 'Saturday - typically lower volatility'
      };
      
      return {
        value: { hour, dayOfWeek, pattern: historicalPatterns[dayOfWeek] },
        confidence: 0.4,
        reasoning: `Time analysis: ${historicalPatterns[dayOfWeek]} at hour ${hour}`
      };
    });

    this.tools.set('analyze_onchain', async (ctx) => {
      const price = btcPriceService.getCurrentPrice();
      const change1h = btcPriceService.getChangePercent(1);
      const change24h = btcPriceService.getChangePercent(24);
      
      let networkHealth = 'neutral';
      if (change24h > 5) networkHealth = 'bullish';
      else if (change24h < -5) networkHealth = 'bearish';
      
      return {
        value: { change1h, change24h, networkHealth },
        confidence: 0.6,
        reasoning: `On-chain: 24h change ${change24h.toFixed(2)}%, network health: ${networkHealth}`
      };
    });

    this.tools.set('analyze_sentiment', async (ctx) => {
      const price = btcPriceService.getCurrentPrice();
      const change1h = btcPriceService.getChangePercent(1);
      
      let sentiment = 'neutral';
      if (change1h > 1) sentiment = 'fear_of_missing_out';
      else if (change1h < -1) sentiment = 'fear_uncertainty_doubt';
      else sentiment = 'calm';
      
      return {
        value: { sentiment, recentChange: change1h },
        confidence: 0.5,
        reasoning: `Based on recent movement: ${sentiment} (${change1h.toFixed(2)}% 1h change)`
      };
    });

    this.tools.set('analyze_mean_reversion', async (ctx) => {
      const current = btcPriceService.getCurrentPrice();
      const ma20 = btcPriceService.getMovingAverage(20);
      const ma50 = btcPriceService.getMovingAverage(50);
      const deviation = ((current - ma20) / ma20) * 100;
      
      let expectation: string;
      if (deviation > 5) expectation = 'revert down to MA';
      else if (deviation < -5) expectation = 'revert up to MA';
      else expectation = 'within normal range';
      
      return {
        value: { deviation, ma20, expectation },
        confidence: Math.min(Math.abs(deviation) / 10, 0.8),
        reasoning: `Price is ${deviation.toFixed(1)}% from 20 MA. Expect: ${expectation}`
      };
    });

    this.tools.set('analyze_macro', async (ctx) => {
      const price = btcPriceService.getCurrentPrice();
      const change24h = btcPriceService.getChangePercent(24);
      const change7d = btcPriceService.getChangePercent(7 * 24);
      
      let macroOutlook = 'neutral';
      if (change7d > 10) macroOutlook = 'strong bullish';
      else if (change7d < -10) macroOutlook = 'strong bearish';
      else if (change24h > 0) macroOutlook = 'short-term bullish';
      else macroOutlook = 'short-term bearish';
      
      return {
        value: { change24h, change7d, macroOutlook },
        confidence: 0.65,
        reasoning: `Macro outlook: ${macroOutlook}. 7d: ${change7d.toFixed(1)}%, 24h: ${change24h.toFixed(1)}%`
      };
    });
  }

  getToolsForStrategy(strategy: PredictionStrategy): string[] {
    const toolMap: Record<PredictionStrategy, string[]> = {
      technical: ['analyze_rsi', 'analyze_momentum', 'analyze_moving_averages', 'analyze_support_resistance', 'analyze_volatility'],
      sentiment: ['analyze_sentiment', 'analyze_momentum', 'analyze_cycles'],
      onchain: ['analyze_onchain', 'analyze_momentum', 'analyze_volatility'],
      momentum: ['analyze_momentum', 'analyze_moving_averages', 'analyze_rsi'],
      mean_reversion: ['analyze_mean_reversion', 'analyze_support_resistance'],
      cycle: ['analyze_cycles', 'analyze_momentum', 'analyze_support_resistance'],
      macro: ['analyze_macro', 'analyze_onchain', 'analyze_momentum'],
      ai_analysis: ['analyze_rsi', 'analyze_momentum', 'analyze_volatility', 'analyze_support_resistance', 'analyze_moving_averages', 'analyze_onchain']
    };
    
    return toolMap[strategy] || toolMap.ai_analysis;
  }

  async makePrediction(agent: AgentConfig): Promise<PredictionRecord> {
    const currentPrice = btcPriceService.getCurrentPrice();
    const strategy = agent.predictionConfig?.strategy || 'ai_analysis';
    const tools = this.getToolsForStrategy(strategy);
    
    const context: PredictionContext = {
      currentPrice,
      priceHistory: btcPriceService.getPriceHistory(),
      agent
    };

    const toolResults: ToolResult[] = [];
    let totalConfidence = 0;

    for (const toolName of tools) {
      const tool = this.tools.get(toolName);
      if (tool) {
        try {
          const result = await tool(context);
          toolResults.push(result);
          totalConfidence += result.confidence;
        } catch (e) {
          console.error(`Tool ${toolName} failed:`, e);
        }
      }
    }

    const avgConfidence = toolResults.length > 0 ? totalConfidence / toolResults.length : 0.5;
    
    const reasoning = toolResults.map(r => r.reasoning).join('. ');
    
    let predictedDirection: 'up' | 'down' | 'flat' = 'flat';
    let predictedPrice = currentPrice;
    
    const bullishSignals = toolResults.filter(r => 
      r.value?.direction === 'up' || 
      r.value?.signal?.includes('bullish') ||
      r.value?.signal?.includes('oversold') ||
      r.value?.signal?.includes('bounce') ||
      r.value?.expectation?.includes('revert up')
    ).length;
    
    const bearishSignals = toolResults.filter(r => 
      r.value?.direction === 'down' || 
      r.value?.signal?.includes('bearish') ||
      r.value?.signal?.includes('overbought') ||
      r.value?.signal?.includes('correction') ||
      r.value?.expectation?.includes('revert down')
    ).length;

    if (bullishSignals > bearishSignals + 1) {
      predictedDirection = 'up';
      predictedPrice = currentPrice * (1 + avgConfidence * 0.02);
    } else if (bearishSignals > bullishSignals + 1) {
      predictedDirection = 'down';
      predictedPrice = currentPrice * (1 - avgConfidence * 0.02);
    }

    return {
      id: uuidv4(),
      timestamp: Date.now(),
      currentPrice,
      predictedPrice,
      predictionDirection: predictedDirection,
      actualDirection: 'pending',
      outcome: 'pending',
      confidence: avgConfidence,
      reasoning: reasoning.slice(0, 500)
    };
  }

  async evaluatePrediction(prediction: PredictionRecord): Promise<PredictionRecord> {
    const currentPrice = btcPriceService.getCurrentPrice();
    const price5mAgo = btcPriceService.getPriceAtMinutesAgo(5);
    
    if (!price5mAgo) {
      return { ...prediction, actualDirection: 'flat', outcome: 'pending' };
    }

    const actualChange = ((currentPrice - price5mAgo) / price5mAgo) * 100;
    let actualDirection: 'up' | 'down' | 'flat';
    
    if (actualChange > 0.1) actualDirection = 'up';
    else if (actualChange < -0.1) actualDirection = 'down';
    else actualDirection = 'flat';

    const outcome = actualDirection === prediction.predictionDirection ? 'correct' : 'incorrect';

    return {
      ...prediction,
      actualDirection,
      outcome,
      currentPrice: price5mAgo
    };
  }
}

export const predictionEngine = new PredictionEngine();
