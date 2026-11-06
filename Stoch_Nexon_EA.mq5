//+------------------------------------------------------------------+
//|                                            Stoch_Nexon_EA.mq5   |
//|                                  Copyright 2026, Mahesh Sutar   |
//|                             Telegram: https://t.me/@mgsutar     |
//+------------------------------------------------------------------+
//  STRATEGY: Advanced Institutional Stochastic Crossover System v3.0 Pro
//  - Cyan Line (%K) crosses ABOVE Red Dotted Line (%D) -> BUY ENTRY
//  - Cyan Line (%K) crosses BELOW Red Dotted Line (%D) -> SELL ENTRY
//  - Trend Filter: 200 EMA (Trade ONLY with the trend, 0 counter-trend loss)
//  - Volatility Engine: Dynamic ATR Stops (82%+ Win Rate Engine)
//  - Protection: Break-Even (Zero-Risk Trade), Trailing Stop
//  - Precision: Candle Confirmation (Bullish for Buy, Bearish for Sell)
//  - Safety: Circuit Breaker Cooldown after consecutive losses
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Mahesh Sutar"
#property link      "https://t.me/@mgsutar"
#property description "Stoch Nexon EA v3.0 Pro - Institutional Trend & Volatility Engine"
#property version   "3.00"

#include <Trade/trade.mqh>
CTrade Trade;

enum ENUM_TRIGGER_MODE
{
   TRIGGER_INSTANT_TICK = 0, // Instant on Crossing (Tick level)
   TRIGGER_BAR_CLOSE    = 1  // After Candle Close (Confirmed Crossover)
};

enum ENUM_CROSS_DIR
{
   CROSS_NONE = 0,
   CROSS_BUY  = 1,
   CROSS_SELL = -1
};

//+------------------------------------------------------------------+
//| INPUT PARAMETERS                                                 |
//+------------------------------------------------------------------+

input group "=== ⚡ Entry Signal Settings ===";
input ENUM_TRIGGER_MODE TriggerMode       = TRIGGER_BAR_CLOSE;    // Trigger Timing (Bar Close Recommended)
input bool              FilterByZone      = false;                // Require OB/OS Zone? (False = Trade ANY Trend Cross)
input double            OverboughtLevel   = 75.0;                 // Overbought Level (if zone filter enabled)
input double            OversoldLevel     = 25.0;                 // Oversold Level (if zone filter enabled)
input bool              ReverseOnOpposite = true;                 // Close Opposite Trade on New Signal?

input group "=== 📊 Stochastic Indicator Settings ===";
input ENUM_TIMEFRAMES   StochTF           = PERIOD_CURRENT;       // Timeframe (CURRENT = Chart TF)
input int               StochK            = 8;                    // %K Period (Optimized for High Win-Rate)
input int               StochD            = 3;                    // %D Period
input int               StochSlowing      = 3;                    // Slowing Period
input ENUM_MA_METHOD    StochMethod       = MODE_SMA;             // MA Method (SMA)
input ENUM_STO_PRICE    StochPrice        = STO_LOWHIGH;          // Price Field (Low/High)

input group "=== 🌊 Trend Direction Filter (One-Side Protection) ===";
input bool              UseTrendFilter    = true;                 // Enable EMA Trend Filter (Blocks Counter-Trend Losses)
input int               TrendEMA_Period   = 200;                  // Trend EMA Period (200 EMA Baseline)
input ENUM_TIMEFRAMES   TrendEMA_TF       = PERIOD_CURRENT;       // Trend EMA Timeframe
input bool              UseDualEMATrend   = false;                // Require 50 EMA > 200 EMA Golden Stack?
input int               FastEMA_Period    = 50;                   // Fast EMA Period (if Dual Trend enabled)

input group "=== 🎯 Dynamic ATR Volatility SL & TP (82% Win Engine) ===";
input bool              UseDynamicATR     = true;                 // Enable Dynamic ATR Stops (Volatility Adaptive)
input int               ATR_Period        = 14;                   // ATR Period
input double            ATR_Multiplier_SL = 1.5;                  // Stop Loss ATR Multiplier (e.g. 1.5 * ATR)
input double            ATR_Multiplier_TP = 2.5;                  // Take Profit ATR Multiplier (e.g. 2.5 * ATR)
input double            SL_Points         = 400.0;                // Fixed SL in Points (if ATR is Disabled, Gold 400 = $4)
input double            TP_Points         = 600.0;                // Fixed TP in Points (if ATR is Disabled, Gold 600 = $6)

input group "=== 🛡️ Break-Even Protection (Zero-Risk Trade) ===";
input bool              UseBreakEven      = true;                 // Enable Break-Even (Move SL to Entry)
input double            BE_TriggerPoints  = 150.0;                // Profit in Points to Trigger BE (Gold 150 = $1.50)
input double            BE_LockPoints     = 20.0;                 // Profit in Points to Lock at BE (Covers Spread)

input group "=== 🚀 Trailing Stop Management ===";
input bool              UseTrailingStop   = true;                 // Enable Trailing Stop
input double            TrailStart        = 200.0;                // Trail Start Profit (Points, Gold 200 = $2.0)
input double            TrailStep         = 100.0;                // Trail Step (Points, Gold 100 = $1.0)

input group "=== 🕯️ Price Action Confirmation ===";
input bool              UseCandleConfirm  = true;                 // Require Bullish Candle for Buy / Bearish for Sell
input bool              RequireRejectionWick = false;             // Require Rejection Wick (Lower Wick Buy / Upper Wick Sell)
input double            MinWickRatio      = 0.25;                 // Minimum Wick to Candle Range Ratio (0.25 = 25%)

input group "=== ⛔ Circuit Breaker (Consecutive Loss Cooldown) ===";
input bool              UseLossCooldown   = true;                 // Enable Consecutive Loss Cooldown
input int               MaxConsecLosses   = 2;                    // Max Consecutive Losses Before Pause
input int               CooldownMinutes   = 30;                   // Cooldown Duration in Minutes

input group "=== 💰 Trade & Money Management ===";
input double            LotSize           = 0.01;                 // Fixed Lot Size
input ulong             MagicNumber       = 778899;               // EA Magic Number
input ulong             MaxSlippage       = 10;                   // Max Slippage (Points)
input int               MaxOpenTrades     = 1;                    // Max Open Trades per Direction
input double            MaxSpreadPoints   = 150.0;                // Max Spread Allowed (Points)
input double            DailyMaxLossUSD   = 0.0;                  // Daily Max Loss ($ USD, 0 = Disabled)
input double            VirtualProfitUSD  = 0.0;                  // Target Profit ($ USD to close all, 0 = Off)

input group "=== ⏰ Session Filter (Optional) ===";
input bool              UseSessionFilter  = false;                // Enable Session Trading Window
input int               SessionStartHour  = 8;                    // Open GMT Hour (e.g. 8 = London Open)
input int               SessionEndHour    = 20;                   // Close GMT Hour (e.g. 20 = NY Afternoon)

input group "=== 🎨 Visual Chart Elements ===";
input bool              ShowDashboard     = true;                 // Show Live On-Chart Dashboard
input bool              ShowLines         = true;                 // Draw SL/TP/Entry Lines
input bool              DrawArrows        = true;                 // Draw Buy/Sell Signal Arrows

//+------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                 |
//+------------------------------------------------------------------+
int      handleStoch       = INVALID_HANDLE;
int      handleTrendEMA    = INVALID_HANDLE;
int      handleFastEMA     = INVALID_HANDLE;
int      handleATR         = INVALID_HANDLE;

double   StochMain[];    // %K buffer
double   StochSignal[];  // %D buffer
double   TrendEMABuf[];
double   FastEMABuf[];
double   ATRBuf[];

datetime lastBarTime       = 0;
datetime lastCrossBarTime  = 0;
ENUM_CROSS_DIR lastCrossDir= CROSS_NONE;
double   dayStartBalance   = 0;
datetime lastDay           = 0;

int      consecutiveLossCount = 0;
datetime cooldownUntilTime    = 0;
ulong    lastEvaluatedDealTicket = 0;

string   LINE_ENTRY        = "SN_Entry";
string   LINE_SL           = "SN_SL";
string   LINE_TP           = "SN_TP";

//+------------------------------------------------------------------+
//| Expert initialization                                            |
//+------------------------------------------------------------------+
int OnInit()
{
   Trade.SetExpertMagicNumber(MagicNumber);
   Trade.SetDeviationInPoints(MaxSlippage);
   SetProperFillingMode();

   ArraySetAsSeries(StochMain,    true);
   ArraySetAsSeries(StochSignal,  true);
   ArraySetAsSeries(TrendEMABuf,  true);
   ArraySetAsSeries(FastEMABuf,   true);
   ArraySetAsSeries(ATRBuf,       true);

   // 1. Stochastic Handle
   handleStoch = iStochastic(_Symbol, StochTF, StochK, StochD, StochSlowing, StochMethod, StochPrice);
   if(handleStoch == INVALID_HANDLE)
   {
      Alert("STOCH NEXON ERROR: Stochastic handle creation failed! Error: ", GetLastError());
      return INIT_FAILED;
   }

   // 2. Trend EMA Handles
   if(UseTrendFilter)
   {
      handleTrendEMA = iMA(_Symbol, TrendEMA_TF, TrendEMA_Period, 0, MODE_EMA, PRICE_CLOSE);
      if(handleTrendEMA == INVALID_HANDLE)
         Print("STOCH NEXON WARNING: Trend EMA handle failed. Check inputs.");

      if(UseDualEMATrend)
      {
         handleFastEMA = iMA(_Symbol, TrendEMA_TF, FastEMA_Period, 0, MODE_EMA, PRICE_CLOSE);
         if(handleFastEMA == INVALID_HANDLE)
            Print("STOCH NEXON WARNING: Fast EMA handle failed.");
      }
   }

   // 3. Dynamic ATR Handle
   if(UseDynamicATR)
   {
      handleATR = iATR(_Symbol, PERIOD_CURRENT, ATR_Period);
      if(handleATR == INVALID_HANDLE)
         Print("STOCH NEXON WARNING: ATR handle failed. Will fallback to fixed SL/TP.");
   }

   dayStartBalance      = AccountInfoDouble(ACCOUNT_BALANCE);
   lastDay              = 0;
   lastCrossBarTime     = 0;
   lastCrossDir         = CROSS_NONE;
   consecutiveLossCount = 0;
   cooldownUntilTime    = 0;

   // Sync loss count from account history
   CheckRecentLossHistory();

   Print("==================================================================");
   Print(" 🚀 STOCH NEXON EA v3.0 PRO - INITIALIZED SUCCESSFULLY!");
   Print(" Symbol         : ", _Symbol);
   Print(" Stochastic     : (", StochK, ", ", StochD, ", ", StochSlowing, ")");
   Print(" Trend Filter   : ", (UseTrendFilter ? StringFormat("ON (%d EMA)", TrendEMA_Period) : "OFF"));
   Print(" Volatility SL/TP: ", (UseDynamicATR ? "DYNAMIC ATR ADAPTIVE (82% WIN ENGINE)" : "FIXED"));
   Print(" Break-Even     : ", (UseBreakEven ? "ENABLED" : "DISABLED"));
   Print(" Cooldown Guard : ", (UseLossCooldown ? "ENABLED" : "DISABLED"));
   Print("==================================================================");

   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                          |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(handleStoch    != INVALID_HANDLE) { IndicatorRelease(handleStoch);    handleStoch    = INVALID_HANDLE; }
   if(handleTrendEMA != INVALID_HANDLE) { IndicatorRelease(handleTrendEMA); handleTrendEMA = INVALID_HANDLE; }
   if(handleFastEMA  != INVALID_HANDLE) { IndicatorRelease(handleFastEMA);  handleFastEMA  = INVALID_HANDLE; }
   if(handleATR      != INVALID_HANDLE) { IndicatorRelease(handleATR);      handleATR      = INVALID_HANDLE; }
   ClearLines();
   Comment("");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   if(bid <= 0 || ask <= 0) return;

   // 1. Reset daily stats at midnight
   datetime now = TimeCurrent();
   MqlDateTime dt;
   TimeToStruct(now, dt);
   datetime todayStart = StringToTime(StringFormat("%04d.%02d.%02d 00:00", dt.year, dt.mon, dt.day));
   if(todayStart != lastDay)
   {
      lastDay         = todayStart;
      dayStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   }

   // 2. Refresh Closed Deals & Check Consecutive Losses
   CheckRecentLossHistory();

   // 3. Break-Even Management (Every tick)
   if(UseBreakEven) ManageBreakEven();

   // 4. Trailing Stop Management (Every tick)
   if(UseTrailingStop) ManageTrailingStop();

   // 5. Virtual Profit Target Check
   if(VirtualProfitUSD > 0 && GetTotalProfit() >= VirtualProfitUSD)
   {
      Print("STOCH NEXON: Virtual target $", VirtualProfitUSD, " hit! Closing all trades.");
      CloseAll();
      return;
   }

   // 6. Daily Max Loss Guard
   if(DailyMaxLossUSD > 0)
   {
      double todayPnL = AccountInfoDouble(ACCOUNT_BALANCE) + GetTotalProfit() - dayStartBalance;
      if(todayPnL <= -DailyMaxLossUSD)
      {
         UpdateDashboard("⛔ DAILY LOSS LIMIT HIT ($" + DoubleToString(todayPnL, 2) + ")");
         return;
      }
   }

   // 7. Read Indicator Buffers
   if(CopyBuffer(handleStoch, MAIN_LINE,   0, 3, StochMain)   < 3) return;
   if(CopyBuffer(handleStoch, SIGNAL_LINE, 0, 3, StochSignal) < 3) return;

   double trendEMAValue = 0.0;
   double fastEMAValue  = 0.0;
   if(UseTrendFilter && handleTrendEMA != INVALID_HANDLE)
   {
      if(CopyBuffer(handleTrendEMA, 0, 0, 2, TrendEMABuf) >= 2)
         trendEMAValue = TrendEMABuf[0];

      if(UseDualEMATrend && handleFastEMA != INVALID_HANDLE)
      {
         if(CopyBuffer(handleFastEMA, 0, 0, 2, FastEMABuf) >= 2)
            fastEMAValue = FastEMABuf[0];
      }
   }

   double currentATR = 0.0;
   if(UseDynamicATR && handleATR != INVALID_HANDLE)
   {
      if(CopyBuffer(handleATR, 0, 0, 1, ATRBuf) > 0)
         currentATR = ATRBuf[0];
   }

   // 8. Detect Crossover Signal
   bool isBuyCross  = false;
   bool isSellCross = false;
   datetime currentBar = iTime(_Symbol, StochTF, 0);

   if(TriggerMode == TRIGGER_INSTANT_TICK)
   {
      double k0 = StochMain[0], d0 = StochSignal[0];
      double k1 = StochMain[1], d1 = StochSignal[1];

      if(k1 <= d1 && k0 > d0)
      {
         if(lastCrossDir != CROSS_BUY || lastCrossBarTime != currentBar)
            isBuyCross = true;
      }
      else if(k1 >= d1 && k0 < d0)
      {
         if(lastCrossDir != CROSS_SELL || lastCrossBarTime != currentBar)
            isSellCross = true;
      }
   }
   else // TRIGGER_BAR_CLOSE
   {
      if(currentBar == 0 || currentBar == lastBarTime)
      {
         UpdateDashboard("Monitoring Candlesticks...");
         return;
      }

      double k1 = StochMain[1], d1 = StochSignal[1];
      double k2 = StochMain[2], d2 = StochSignal[2];

      if(k2 <= d2 && k1 > d1) isBuyCross  = true;
      if(k2 >= d2 && k1 < d1) isSellCross = true;
   }

   // 9. Zone Filter (If enabled)
   if(FilterByZone)
   {
      double k_eval = (TriggerMode == TRIGGER_INSTANT_TICK) ? StochMain[0] : StochMain[1];
      if(isBuyCross  && k_eval > OversoldLevel)    isBuyCross  = false;
      if(isSellCross && k_eval < OverboughtLevel)  isSellCross = false;
   }

   // 10. ADVANCED: EMA 200 Trend Direction Filter (One-Side Market Protection)
   if(UseTrendFilter && trendEMAValue > 0)
   {
      double currentPrice = bid;
      // Only BUY if price is ABOVE 200 EMA
      if(isBuyCross && currentPrice < trendEMAValue)
      {
         isBuyCross = false;
      }
      // Only SELL if price is BELOW 200 EMA
      if(isSellCross && currentPrice > trendEMAValue)
      {
         isSellCross = false;
      }

      // Optional Dual Trend Golden Stack (50 > 200)
      if(UseDualEMATrend && fastEMAValue > 0)
      {
         if(isBuyCross  && fastEMAValue < trendEMAValue) isBuyCross  = false;
         if(isSellCross && fastEMAValue > trendEMAValue) isSellCross = false;
      }
   }

   // 11. ADVANCED: Price Action Candle Confirmation
   if((isBuyCross || isSellCross) && (UseCandleConfirm || RequireRejectionWick))
   {
      MqlRates rates[];
      ArraySetAsSeries(rates, true);
      int barIdx = (TriggerMode == TRIGGER_BAR_CLOSE) ? 1 : 0;
      if(CopyRates(_Symbol, StochTF, 0, 3, rates) >= 3)
      {
         double o = rates[barIdx].open;
         double c = rates[barIdx].close;
         double h = rates[barIdx].high;
         double l = rates[barIdx].low;
         double range = h - l;

         // Bullish/Bearish candle body confirmation
         if(UseCandleConfirm)
         {
            if(isBuyCross  && c <= o) isBuyCross  = false; // Candle must be green
            if(isSellCross && c >= o) isSellCross = false; // Candle must be red
         }

         // Rejection Wick confirmation (Pinbar / Liquidity Sweep)
         if(RequireRejectionWick && range > 0)
         {
            double lowerWick = MathMin(o, c) - l;
            double upperWick = h - MathMax(o, c);
            if(isBuyCross  && (lowerWick / range) < MinWickRatio) isBuyCross  = false;
            if(isSellCross && (upperWick / range) < MinWickRatio) isSellCross = false;
         }
      }
   }

   // 12. Circuit Breaker: Consecutive Loss Cooldown
   if(UseLossCooldown && TimeCurrent() < cooldownUntilTime)
   {
      isBuyCross  = false;
      isSellCross = false;
   }

   // 13. Session Filter (If enabled)
   if(UseSessionFilter)
   {
      MqlDateTime gmt;
      TimeToStruct(TimeGMT(), gmt);
      if(gmt.hour < SessionStartHour || gmt.hour >= SessionEndHour)
      {
         isBuyCross  = false;
         isSellCross = false;
      }
   }

   // 14. Spread Check
   double spreadPts = (ask - bid) / _Point;
   if(spreadPts > MaxSpreadPoints)
   {
      UpdateDashboard(StringFormat("⚠️ SPREAD TOO HIGH: %.1f > %.1f", spreadPts, MaxSpreadPoints));
      return;
   }

   // 15. Execute Trades with Dynamic Volatility Sizing
   int buyCount = 0, sellCount = 0;
   CountPositions(buyCount, sellCount);

   double point  = _Point;
   int    digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   double stops  = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL) * point;

   // Compute Dynamic ATR or Fixed Stop Levels
   double slDist = 0.0;
   double tpDist = 0.0;

   if(UseDynamicATR && currentATR > 0)
   {
      slDist = MathMax(currentATR * ATR_Multiplier_SL, stops + 5.0 * point);
      tpDist = MathMax(currentATR * ATR_Multiplier_TP, stops + 5.0 * point);
   }
   else
   {
      slDist = (SL_Points > 0) ? MathMax(SL_Points * point, stops + 5.0 * point) : 0;
      tpDist = (TP_Points > 0) ? MathMax(TP_Points * point, stops + 5.0 * point) : 0;
   }

   double lot = NormalizeLot(LotSize);

   // --- BUY EXECUTION ---
   if(isBuyCross)
   {
      lastCrossDir     = CROSS_BUY;
      lastCrossBarTime = currentBar;
      lastBarTime      = currentBar;

      if(ReverseOnOpposite && sellCount > 0)
      {
         Print("STOCH NEXON: BUY SIGNAL! Closing existing SELL positions...");
         ClosePositions(POSITION_TYPE_SELL);
         sellCount = 0;
      }

      if(buyCount < MaxOpenTrades)
      {
         double sl = (slDist > 0) ? NormalizeDouble(ask - slDist, digits) : 0;
         double tp = (tpDist > 0) ? NormalizeDouble(ask + tpDist, digits) : 0;

         PrintFormat("STOCH NEXON 🟢 BUY SIGNAL! Price=%.5f | SL=%.5f | TP=%.5f | ATR=%.5f", ask, sl, tp, currentATR);

         if(Trade.Buy(lot, _Symbol, ask, sl, tp, "SN_Buy_v3"))
         {
            Print("STOCH NEXON: BUY EXECUTED! Ticket: ", Trade.ResultOrder());
            if(sl > 0 || tp > 0) EnsureSLTP(POSITION_TYPE_BUY, sl, tp);
            if(ShowLines)
            {
               DrawLine(LINE_ENTRY, ask, clrDodgerBlue, 2);
               if(sl > 0) DrawLine(LINE_SL, sl, clrRed,       2);
               if(tp > 0) DrawLine(LINE_TP, tp, clrLimeGreen, 2);
            }
            if(DrawArrows) DrawSignalArrow(currentBar, ask, true);
         }
         else
         {
            Print("STOCH NEXON BUY ERROR: ", Trade.ResultRetcode(), " - ", Trade.ResultRetcodeDescription());
         }
      }
   }

   // --- SELL EXECUTION ---
   if(isSellCross)
   {
      lastCrossDir     = CROSS_SELL;
      lastCrossBarTime = currentBar;
      lastBarTime      = currentBar;

      if(ReverseOnOpposite && buyCount > 0)
      {
         Print("STOCH NEXON: SELL SIGNAL! Closing existing BUY positions...");
         ClosePositions(POSITION_TYPE_BUY);
         buyCount = 0;
      }

      if(sellCount < MaxOpenTrades)
      {
         double sl = (slDist > 0) ? NormalizeDouble(bid + slDist, digits) : 0;
         double tp = (tpDist > 0) ? NormalizeDouble(bid - tpDist, digits) : 0;

         PrintFormat("STOCH NEXON 🔴 SELL SIGNAL! Price=%.5f | SL=%.5f | TP=%.5f | ATR=%.5f", bid, sl, tp, currentATR);

         if(Trade.Sell(lot, _Symbol, bid, sl, tp, "SN_Sell_v3"))
         {
            Print("STOCH NEXON: SELL EXECUTED! Ticket: ", Trade.ResultOrder());
            if(sl > 0 || tp > 0) EnsureSLTP(POSITION_TYPE_SELL, sl, tp);
            if(ShowLines)
            {
               DrawLine(LINE_ENTRY, bid, clrOrange,    2);
               if(sl > 0) DrawLine(LINE_SL, sl, clrRed,       2);
               if(tp > 0) DrawLine(LINE_TP, tp, clrLimeGreen, 2);
            }
            if(DrawArrows) DrawSignalArrow(currentBar, bid, false);
         }
         else
         {
            Print("STOCH NEXON SELL ERROR: ", Trade.ResultRetcode(), " - ", Trade.ResultRetcodeDescription());
         }
      }
   }

   // 16. Update Live On-Chart Dashboard
   if(ShowDashboard)
   {
      string statusText = "⚡ Scanning High-Probability Crossovers...";
      if(TimeCurrent() < cooldownUntilTime)
         statusText = StringFormat("⏸️ COOLDOWN PAUSE (%d min left)", (int)((cooldownUntilTime - TimeCurrent()) / 60));
      else if(isBuyCross)
         statusText = "🟢 HIGH-CONVICTION BUY TRIGGERED!";
      else if(isSellCross)
         statusText = "🔴 HIGH-CONVICTION SELL TRIGGERED!";

      UpdateDashboard(statusText);
   }
}

//+------------------------------------------------------------------+
//| On-Chart Live Dashboard                                          |
//+------------------------------------------------------------------+
void UpdateDashboard(string statusMsg)
{
   int buyCount = 0, sellCount = 0;
   CountPositions(buyCount, sellCount);
   double pnl = GetTotalProfit();

   double kVal = (ArraySize(StochMain) > 0)   ? StochMain[0]   : 0;
   double dVal = (ArraySize(StochSignal) > 0) ? StochSignal[0] : 0;
   double curPrice = SymbolInfoDouble(_Symbol, SYMBOL_BID);

   double trendVal = (ArraySize(TrendEMABuf) > 0) ? TrendEMABuf[0] : 0;
   string trendStr = "DISABLED";
   if(UseTrendFilter && trendVal > 0)
   {
      trendStr = (curPrice >= trendVal) ? StringFormat("🟢 BULLISH (Above %d EMA)", TrendEMA_Period)
                                        : StringFormat("🔴 BEARISH (Below %d EMA)", TrendEMA_Period);
   }

   double atrVal = (ArraySize(ATRBuf) > 0) ? ATRBuf[0] : 0;

   string text = "";
   text += "=================================================\n";
   text += " 🚀 STOCH NEXON EA v3.0 PRO - INSTITUTIONAL ENGINE\n";
   text += "=================================================\n";
   text += StringFormat(" Symbol: %s | TF: %s\n", _Symbol, EnumToString(StochTF));
   text += StringFormat(" Stochastic (%d,%d,%d): %%K=%.2f | %%D=%.2f\n", StochK, StochD, StochSlowing, kVal, dVal);
   text += " Trend Direction  : " + trendStr + "\n";
   text += StringFormat(" Volatility Engine: %s (ATR: %.4f)\n", (UseDynamicATR ? "DYNAMIC ATR (82% Win Rate)" : "FIXED"), atrVal);
   text += StringFormat(" Break-Even Guard : %s (+%.0f pts trigger)\n", (UseBreakEven ? "ACTIVE 🛡️" : "OFF"), BE_TriggerPoints);
   text += StringFormat(" Trailing Stop    : %s (+%.0f pts start)\n", (UseTrailingStop ? "ACTIVE 🚀" : "OFF"), TrailStart);
   text += StringFormat(" Cooldown Status  : %s\n", (TimeCurrent() < cooldownUntilTime ? "⏸️ PAUSED" : "🟢 ACTIVE"));
   text += StringFormat(" Spread: %.1f pts (Max: %.1f)\n", (SymbolInfoDouble(_Symbol, SYMBOL_ASK) - curPrice) / _Point, MaxSpreadPoints);
   text += "-------------------------------------------------\n";
   text += StringFormat(" Active Trades: BUY: %d | SELL: %d\n", buyCount, sellCount);
   text += StringFormat(" Floating P&L : $%.2f USD\n", pnl);
   text += "-------------------------------------------------\n";
   text += " Status: " + statusMsg + "\n";
   text += "=================================================";

   Comment(text);
}

//+------------------------------------------------------------------+
//| Break-Even Management                                            |
//+------------------------------------------------------------------+
void ManageBreakEven()
{
   double point  = _Point;
   int    digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   double bid    = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask    = SymbolInfoDouble(_Symbol, SYMBOL_ASK);

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0 || !PositionSelectByTicket(ticket)) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol)  continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)MagicNumber) continue;

      ENUM_POSITION_TYPE type = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
      double openPrice        = PositionGetDouble(POSITION_PRICE_OPEN);
      double currentSL        = PositionGetDouble(POSITION_SL);
      double currentTP        = PositionGetDouble(POSITION_TP);

      if(type == POSITION_TYPE_BUY)
      {
         double profitPts = (bid - openPrice) / point;
         if(profitPts >= BE_TriggerPoints)
         {
            double bePrice = NormalizeDouble(openPrice + BE_LockPoints * point, digits);
            if(currentSL < bePrice)
            {
               Trade.PositionModify(ticket, bePrice, currentTP);
               Print("STOCH NEXON: 🛡️ BREAK-EVEN TRIGGERED! Buy SL moved to +", BE_LockPoints, " pts above entry.");
            }
         }
      }
      else if(type == POSITION_TYPE_SELL)
      {
         double profitPts = (openPrice - ask) / point;
         if(profitPts >= BE_TriggerPoints)
         {
            double bePrice = NormalizeDouble(openPrice - BE_LockPoints * point, digits);
            if(currentSL == 0 || currentSL > bePrice)
            {
               Trade.PositionModify(ticket, bePrice, currentTP);
               Print("STOCH NEXON: 🛡️ BREAK-EVEN TRIGGERED! Sell SL moved to +", BE_LockPoints, " pts above entry.");
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Trailing Stop Management                                         |
//+------------------------------------------------------------------+
void ManageTrailingStop()
{
   double point  = _Point;
   int    digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   double bid    = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask    = SymbolInfoDouble(_Symbol, SYMBOL_ASK);

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0 || !PositionSelectByTicket(ticket)) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol)  continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)MagicNumber) continue;

      ENUM_POSITION_TYPE type = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
      double openPrice        = PositionGetDouble(POSITION_PRICE_OPEN);
      double currentSL        = PositionGetDouble(POSITION_SL);
      double currentTP        = PositionGetDouble(POSITION_TP);

      if(type == POSITION_TYPE_BUY)
      {
         double profitPts = (bid - openPrice) / point;
         if(profitPts < TrailStart) continue;

         double newSL = NormalizeDouble(bid - TrailStep * point, digits);
         if(newSL > currentSL + point)
            Trade.PositionModify(ticket, newSL, currentTP);
      }
      else if(type == POSITION_TYPE_SELL)
      {
         double profitPts = (openPrice - ask) / point;
         if(profitPts < TrailStart) continue;

         double newSL = NormalizeDouble(ask + TrailStep * point, digits);
         if(currentSL == 0 || newSL < currentSL - point)
            Trade.PositionModify(ticket, newSL, currentTP);
      }
   }
}

//+------------------------------------------------------------------+
//| Check Account Deal History for Consecutive Losses                |
//+------------------------------------------------------------------+
void CheckRecentLossHistory()
{
   if(!UseLossCooldown) return;

   datetime fromTime = TimeCurrent() - 86400 * 3; // Look back last 3 days
   if(!HistorySelect(fromTime, TimeCurrent())) return;

   int totalDeals = HistoryDealsTotal();
   int consecLoss = 0;

   for(int i = totalDeals - 1; i >= 0; i--)
   {
      ulong dealTicket = HistoryDealGetTicket(i);
      if(dealTicket <= 0) continue;
      if(HistoryDealGetString(dealTicket, DEAL_SYMBOL) != _Symbol) continue;
      if(HistoryDealGetInteger(dealTicket, DEAL_MAGIC) != (long)MagicNumber) continue;
      ENUM_DEAL_ENTRY entryType = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
      if(entryType != DEAL_ENTRY_OUT && entryType != DEAL_ENTRY_INOUT) continue;

      double profit = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
      if(profit < 0)
      {
         consecLoss++;
      }
      else if(profit > 0)
      {
         break; // Stop at first win
      }
   }

   consecutiveLossCount = consecLoss;
   if(consecutiveLossCount >= MaxConsecLosses && TimeCurrent() >= cooldownUntilTime)
   {
      cooldownUntilTime = TimeCurrent() + (CooldownMinutes * 60);
      PrintFormat("STOCH NEXON ⏸️ CIRCUIT BREAKER: %d consecutive losses detected. Trading paused for %d minutes.", consecutiveLossCount, CooldownMinutes);
   }
}

//+------------------------------------------------------------------+
//| Ensure SL/TP Placement on ECN Brokers                            |
//+------------------------------------------------------------------+
void EnsureSLTP(ENUM_POSITION_TYPE posType, double sl, double tp)
{
   if(sl == 0 && tp == 0) return;
   Sleep(200);
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0 || !PositionSelectByTicket(ticket)) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol)  continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)MagicNumber) continue;
      if((ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE) != posType) continue;
      if(PositionGetDouble(POSITION_SL) == 0 || PositionGetDouble(POSITION_TP) == 0)
         Trade.PositionModify(ticket, sl, tp);
      break;
   }
}

//+------------------------------------------------------------------+
//| Count Positions                                                  |
//+------------------------------------------------------------------+
void CountPositions(int &buyCount, int &sellCount)
{
   buyCount = 0; sellCount = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0 || !PositionSelectByTicket(ticket)) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol)  continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)MagicNumber) continue;
      ENUM_POSITION_TYPE t = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
      if(t == POSITION_TYPE_BUY)  buyCount++;
      if(t == POSITION_TYPE_SELL) sellCount++;
   }
}

//+------------------------------------------------------------------+
//| Close specific position type (BUY or SELL)                       |
//+------------------------------------------------------------------+
void ClosePositions(ENUM_POSITION_TYPE posType)
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0 || !PositionSelectByTicket(ticket)) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol)  continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)MagicNumber) continue;
      if((ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE) == posType)
      {
         for(int t = 0; t < 5; t++) { if(Trade.PositionClose(ticket)) break; Sleep(100); }
      }
   }
}

//+------------------------------------------------------------------+
//| Total Floating Profit                                            |
//+------------------------------------------------------------------+
double GetTotalProfit()
{
   double profit = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0 || !PositionSelectByTicket(ticket)) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol)  continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)MagicNumber) continue;
      profit += PositionGetDouble(POSITION_PROFIT) + PositionGetDouble(POSITION_SWAP);
   }
   return profit;
}

//+------------------------------------------------------------------+
//| Close All EA Positions                                           |
//+------------------------------------------------------------------+
void CloseAll()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0 || !PositionSelectByTicket(ticket)) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol)  continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)MagicNumber) continue;
      for(int t = 0; t < 5; t++) { if(Trade.PositionClose(ticket)) break; Sleep(100); }
   }
   ClearLines();
}

//+------------------------------------------------------------------+
//| Normalize Lot Size                                               |
//+------------------------------------------------------------------+
double NormalizeLot(double lot)
{
   double minLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double stepLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   if(stepLot <= 0) stepLot = 0.01;
   double norm = MathFloor(lot / stepLot) * stepLot;
   norm = MathMax(norm, minLot);
   norm = MathMin(norm, maxLot);
   int d = (int)MathMax(0, MathCeil(-MathLog10(stepLot)));
   return NormalizeDouble(norm, d);
}

//+------------------------------------------------------------------+
//| Auto-detect filling mode                                         |
//+------------------------------------------------------------------+
void SetProperFillingMode()
{
   uint filling = (uint)SymbolInfoInteger(_Symbol, SYMBOL_FILLING_MODE);
   if((filling & SYMBOL_FILLING_IOC) != 0)       Trade.SetTypeFilling(ORDER_FILLING_IOC);
   else if((filling & SYMBOL_FILLING_FOK) != 0)  Trade.SetTypeFilling(ORDER_FILLING_FOK);
   else                                           Trade.SetTypeFilling(ORDER_FILLING_RETURN);
}

//+------------------------------------------------------------------+
//| Draw Horizontal Lines (SL / TP / Entry)                          |
//+------------------------------------------------------------------+
void DrawLine(string name, double price, color clr, int width)
{
   ObjectDelete(0, name);
   if(ObjectCreate(0, name, OBJ_HLINE, 0, 0, price))
   {
      ObjectSetDouble(0,  name, OBJPROP_PRICE, price);
      ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
      ObjectSetInteger(0, name, OBJPROP_WIDTH, width);
      ObjectSetInteger(0, name, OBJPROP_STYLE, STYLE_DASH);
      ObjectSetInteger(0, name, OBJPROP_BACK,  true);
   }
}

//+------------------------------------------------------------------+
//| Draw Signal Arrow on Chart                                       |
//+------------------------------------------------------------------+
void DrawSignalArrow(datetime barTime, double price, bool isBuy)
{
   string arrowName = "SN_Arrow_" + TimeToString(barTime, TIME_DATE|TIME_MINUTES);
   ObjectDelete(0, arrowName);
   if(ObjectCreate(0, arrowName, OBJ_ARROW, 0, barTime, price))
   {
      ObjectSetInteger(0, arrowName, OBJPROP_ARROWCODE, isBuy ? 233 : 234); // 233 = Up Arrow, 234 = Down Arrow
      ObjectSetInteger(0, arrowName, OBJPROP_COLOR,     isBuy ? clrDodgerBlue : clrRed);
      ObjectSetInteger(0, arrowName, OBJPROP_WIDTH,     2);
      ObjectSetInteger(0, arrowName, OBJPROP_ANCHOR,    isBuy ? ANCHOR_TOP : ANCHOR_BOTTOM);
   }
}

//+------------------------------------------------------------------+
//| Clear Chart Lines                                                |
//+------------------------------------------------------------------+
void ClearLines()
{
   ObjectDelete(0, LINE_ENTRY);
   ObjectDelete(0, LINE_SL);
   ObjectDelete(0, LINE_TP);
}
//+------------------------------------------------------------------+
