//+------------------------------------------------------------------+
//|                                            Stoch_Nexon_EA.mq5   |
//|                                  Copyright 2026, Mahesh Sutar   |
//|                             Telegram: https://t.me/@mgsutar     |
//+------------------------------------------------------------------+
//  STRATEGY: Stochastic Oscillator Line Crossover (Instant Entry)
//  - Cyan Line (%K) crosses ABOVE Red Dotted Line (%D) -> BUY ENTRY
//  - Cyan Line (%K) crosses BELOW Red Dotted Line (%D) -> SELL ENTRY
//  - Option: Reverse on opposite signal (Close Buy -> Open Sell, etc.)
//  - Option: Instant on crossing (Tick) OR Candle Close confirmation
//  - Option: Pure Crossover (ANY crossing) OR Zone Crossover (OB/OS)
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Mahesh Sutar"
#property link      "https://t.me/@mgsutar"
#property description "Stoch Nexon EA - Instant Stochastic Crossover Entry"
#property version   "2.0"

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
input ENUM_TRIGGER_MODE TriggerMode      = TRIGGER_INSTANT_TICK; // Trigger Timing
input bool              FilterByZone     = false;                // Require OB/OS Zone? (False = Trade ANY Cross)
input double            OverboughtLevel  = 80.0;                 // Overbought Level (if zone filter enabled)
input double            OversoldLevel    = 20.0;                 // Oversold Level (if zone filter enabled)
input bool              ReverseOnOpposite= true;                 // Close Opposite Trade on New Signal?

input group "=== 📊 Stochastic Indicator Settings ===";
input ENUM_TIMEFRAMES   StochTF          = PERIOD_CURRENT;       // Timeframe (CURRENT = Chart TF)
input int               StochK           = 5;                    // %K Period
input int               StochD           = 3;                    // %D Period
input int               StochSlowing     = 3;                    // Slowing Period
input ENUM_MA_METHOD    StochMethod      = MODE_SMA;             // MA Method (SMA)
input ENUM_STO_PRICE    StochPrice       = STO_LOWHIGH;          // Price Field (Low/High)

input group "=== 💰 Trade & Money Management ===";
input double            LotSize          = 0.01;                 // Lot Size
input ulong             MagicNumber      = 778899;               // Magic Number
input ulong             MaxSlippage      = 10;                   // Max Slippage (Points)
input int               MaxOpenTrades    = 1;                    // Max Open Trades per Direction

input group "=== 🎯 Stop Loss & Take Profit ===";
input double            SL_Points        = 300.0;                // Stop Loss in Points (0 = Disabled, Gold 300 = $3)
input double            TP_Points        = 500.0;                // Take Profit in Points (0 = Disabled, Gold 500 = $5)
input bool              UseTrailingStop  = true;                 // Enable Trailing Stop
input double            TrailStart       = 150.0;                // Trail Start Profit (Points)
input double            TrailStep        = 100.0;                // Trail Step (Points)

input group "=== 🛡️ Filters & Protection ===";
input double            MaxSpreadPoints  = 150.0;                // Max Spread Allowed (Points, Gold friendly)
input double            DailyMaxLossUSD  = 0.0;                  // Daily Max Loss ($ USD, 0 = Disabled)
input double            VirtualProfitUSD = 0.0;                  // Target Profit ($ USD to close all, 0 = Off)

input group "=== 🌐 Higher TF Filter (Optional) ===";
input bool              UseHTFFilter     = false;                // Enable Higher Timeframe Filter (Default: OFF)
input ENUM_TIMEFRAMES   HTF              = PERIOD_M15;           // Higher Timeframe
input int               HTF_StochK       = 5;                    // HTF %K
input int               HTF_StochD       = 3;                    // HTF %D
input int               HTF_StochSlowing = 3;                    // HTF Slowing

input group "=== ⏰ Session Filter (Optional) ===";
input bool              UseSessionFilter = false;                // Enable Session Filter (Default: OFF, Trade 24/7)
input int               LondonOpenHour   = 8;                    // Open GMT Hour
input int               LondonCloseHour  = 17;                   // Close GMT Hour

input group "=== 🎨 Visual Chart Elements ===";
input bool              ShowDashboard    = true;                 // Show On-Chart Live Dashboard
input bool              ShowLines        = true;                 // Draw SL/TP Lines
input bool              DrawArrows       = true;                 // Draw Buy/Sell Signal Arrows

//+------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                 |
//+------------------------------------------------------------------+
int      handleStoch       = INVALID_HANDLE;
int      handleHTFStoch    = INVALID_HANDLE;

double   StochMain[];    // %K buffer
double   StochSignal[];  // %D buffer
double   HTFMain[];
double   HTFSignal[];

datetime lastBarTime       = 0;
datetime lastCrossBarTime  = 0;
ENUM_CROSS_DIR lastCrossDir= CROSS_NONE;
double   dayStartBalance   = 0;
datetime lastDay           = 0;

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

   ArraySetAsSeries(StochMain,   true);
   ArraySetAsSeries(StochSignal, true);
   ArraySetAsSeries(HTFMain,     true);
   ArraySetAsSeries(HTFSignal,   true);

   handleStoch = iStochastic(_Symbol, StochTF, StochK, StochD, StochSlowing,
                             StochMethod, StochPrice);
   if(handleStoch == INVALID_HANDLE)
   {
      Alert("STOCH NEXON ERROR: Stochastic handle failed! Error: ", GetLastError());
      return INIT_FAILED;
   }

   if(UseHTFFilter)
   {
      handleHTFStoch = iStochastic(_Symbol, HTF, HTF_StochK, HTF_StochD, HTF_StochSlowing,
                                   StochMethod, StochPrice);
      if(handleHTFStoch == INVALID_HANDLE)
         Print("STOCH NEXON WARNING: HTF handle failed. Will trade without HTF filter.");
   }

   dayStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   lastDay         = 0;
   lastCrossBarTime= 0;
   lastCrossDir    = CROSS_NONE;

   Print("======================================================");
   Print(" STOCH NEXON EA v2.0 - INITIALIZED SUCCESSFULLY!");
   Print(" Symbol        : ", _Symbol);
   Print(" Timeframe     : ", EnumToString(StochTF));
   Print(" Trigger Mode  : ", (TriggerMode == TRIGGER_INSTANT_TICK ? "INSTANT (TICK CROSSOVER)" : "BAR CLOSE"));
   Print(" Filter By Zone: ", (FilterByZone ? "ENABLED" : "DISABLED (TRADES EVERY CROSS)"));
   Print(" Reverse Mode  : ", (ReverseOnOpposite ? "ENABLED" : "DISABLED"));
   Print(" SL / TP       : ", SL_Points, " / ", TP_Points, " pts");
   Print("======================================================");

   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                          |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(handleStoch    != INVALID_HANDLE) { IndicatorRelease(handleStoch);    handleStoch    = INVALID_HANDLE; }
   if(handleHTFStoch != INVALID_HANDLE) { IndicatorRelease(handleHTFStoch); handleHTFStoch = INVALID_HANDLE; }
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

   // 2. Trailing Stop Management (Every tick)
   if(UseTrailingStop) ManageTrailingStop();

   // 3. Virtual Profit Target Check
   if(VirtualProfitUSD > 0 && GetTotalProfit() >= VirtualProfitUSD)
   {
      Print("STOCH NEXON: Virtual profit $", VirtualProfitUSD, " reached. Closing all trades.");
      CloseAll();
      return;
   }

   // 4. Daily Max Loss Guard
   if(DailyMaxLossUSD > 0)
   {
      double todayPnL = AccountInfoDouble(ACCOUNT_BALANCE) + GetTotalProfit() - dayStartBalance;
      if(todayPnL <= -DailyMaxLossUSD)
      {
         UpdateDashboard("⛔ DAILY LOSS LIMIT HIT ($" + DoubleToString(todayPnL, 2) + ")");
         return;
      }
   }

   // 5. Read Stochastic Buffers
   // Index 0 = current forming candle (tick)
   // Index 1 = last closed candle
   // Index 2 = candle before that
   if(CopyBuffer(handleStoch, MAIN_LINE,   0, 3, StochMain)   < 3) return;
   if(CopyBuffer(handleStoch, SIGNAL_LINE, 0, 3, StochSignal) < 3) return;

   // Detect crossover based on selected trigger mode
   bool isBuyCross  = false;
   bool isSellCross = false;
   datetime currentBar = iTime(_Symbol, StochTF, 0);

   if(TriggerMode == TRIGGER_INSTANT_TICK)
   {
      // INSTANT TICK MODE:
      // Compare current bar 0 (realtime) with bar 1
      double k0 = StochMain[0];
      double d0 = StochSignal[0];
      double k1 = StochMain[1];
      double d1 = StochSignal[1];

      // Bullish Cross: previously K <= D, now K > D
      if(k1 <= d1 && k0 > d0)
      {
         // Prevent re-triggering multiple times on the same crossing event
         if(lastCrossDir != CROSS_BUY || lastCrossBarTime != currentBar)
            isBuyCross = true;
      }
      // Bearish Cross: previously K >= D, now K < D
      else if(k1 >= d1 && k0 < d0)
      {
         if(lastCrossDir != CROSS_SELL || lastCrossBarTime != currentBar)
            isSellCross = true;
      }
   }
   else // TRIGGER_BAR_CLOSE
   {
      // Only execute on new bar open
      if(currentBar == 0 || currentBar == lastBarTime)
      {
         UpdateDashboard("Waiting for new bar...");
         return;
      }

      // Check crossover that was confirmed on the just-closed bar 1
      double k1 = StochMain[1];
      double d1 = StochSignal[1];
      double k2 = StochMain[2];
      double d2 = StochSignal[2];

      if(k2 <= d2 && k1 > d1) isBuyCross  = true;
      if(k2 >= d2 && k1 < d1) isSellCross = true;
   }

   // 6. Zone Filter (If enabled)
   if(FilterByZone)
   {
      double k_eval = (TriggerMode == TRIGGER_INSTANT_TICK) ? StochMain[0] : StochMain[1];
      if(isBuyCross  && k_eval > OversoldLevel)    isBuyCross  = false;
      if(isSellCross && k_eval < OverboughtLevel)  isSellCross = false;
   }

   // 7. Higher Timeframe Filter (If enabled)
   if(UseHTFFilter && handleHTFStoch != INVALID_HANDLE)
   {
      if(CopyBuffer(handleHTFStoch, MAIN_LINE,   0, 2, HTFMain)   >= 2 &&
         CopyBuffer(handleHTFStoch, SIGNAL_LINE, 0, 2, HTFSignal) >= 2)
      {
         if(isBuyCross  && HTFMain[0] < HTFSignal[0]) isBuyCross  = false;
         if(isSellCross && HTFMain[0] > HTFSignal[0]) isSellCross = false;
      }
   }

   // 8. Session Filter (If enabled)
   if(UseSessionFilter)
   {
      MqlDateTime gmt;
      TimeToStruct(TimeGMT(), gmt);
      if(gmt.hour < LondonOpenHour || gmt.hour >= LondonCloseHour)
      {
         isBuyCross  = false;
         isSellCross = false;
      }
   }

   // 9. Spread Check
   double spreadPts = (ask - bid) / _Point;
   if(spreadPts > MaxSpreadPoints)
   {
      UpdateDashboard(StringFormat("⚠️ SPREAD TOO HIGH: %.1f > %.1f", spreadPts, MaxSpreadPoints));
      return;
   }

   // 10. Execute Trades
   int buyCount = 0, sellCount = 0;
   CountPositions(buyCount, sellCount);

   double point  = _Point;
   int    digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   double stops  = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL) * point;
   double slDist = (SL_Points > 0) ? MathMax(SL_Points * point, stops + 5.0 * point) : 0;
   double tpDist = (TP_Points > 0) ? MathMax(TP_Points * point, stops + 5.0 * point) : 0;
   double lot    = NormalizeLot(LotSize);

   // --- BUY EXECUTION ---
   if(isBuyCross)
   {
      lastCrossDir     = CROSS_BUY;
      lastCrossBarTime = currentBar;
      lastBarTime      = currentBar;

      // Close opposite SELL positions if Reverse mode is enabled
      if(ReverseOnOpposite && sellCount > 0)
      {
         Print("STOCH NEXON: BUY CROSSOVER! Closing all existing SELL positions first...");
         ClosePositions(POSITION_TYPE_SELL);
         sellCount = 0;
      }

      if(buyCount < MaxOpenTrades)
      {
         double sl = (slDist > 0) ? NormalizeDouble(ask - slDist, digits) : 0;
         double tp = (tpDist > 0) ? NormalizeDouble(ask + tpDist, digits) : 0;

         PrintFormat("STOCH NEXON 🟢 BUY SIGNAL! %K=%.2f, %D=%.2f | Price=%.5f", StochMain[0], StochSignal[0], ask);

         if(Trade.Buy(lot, _Symbol, ask, sl, tp, "SN_Buy"))
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

      // Close opposite BUY positions if Reverse mode is enabled
      if(ReverseOnOpposite && buyCount > 0)
      {
         Print("STOCH NEXON: SELL CROSSOVER! Closing all existing BUY positions first...");
         ClosePositions(POSITION_TYPE_BUY);
         buyCount = 0;
      }

      if(sellCount < MaxOpenTrades)
      {
         double sl = (slDist > 0) ? NormalizeDouble(bid + slDist, digits) : 0;
         double tp = (tpDist > 0) ? NormalizeDouble(bid - tpDist, digits) : 0;

         PrintFormat("STOCH NEXON 🔴 SELL SIGNAL! %K=%.2f, %D=%.2f | Price=%.5f", StochMain[0], StochSignal[0], bid);

         if(Trade.Sell(lot, _Symbol, bid, sl, tp, "SN_Sell"))
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

   // 11. Live Chart Dashboard
   if(ShowDashboard)
   {
      string statusText = "⚡ Monitoring Crossovers...";
      if(isBuyCross)  statusText = "🟢 BUY CROSS DETECTED!";
      if(isSellCross) statusText = "🔴 SELL CROSS DETECTED!";
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

   string text = "";
   text += "=========================================\n";
   text += " 🚀 STOCH NEXON EA v2.0 - CROSSOVER BOT\n";
   text += "=========================================\n";
   text += StringFormat(" Symbol: %s | TF: %s\n", _Symbol, EnumToString(StochTF));
   text += StringFormat(" Stochastic: %%K=%.2f | %%D=%.2f\n", kVal, dVal);
   text += StringFormat(" Trigger Mode: %s\n", (TriggerMode == TRIGGER_INSTANT_TICK ? "Instant Tick (Real-Time)" : "Bar Close"));
   text += StringFormat(" Zone Filter : %s\n", (FilterByZone ? "ON" : "OFF (Any Cross)"));
   text += StringFormat(" Spread: %.1f pts (Max: %.1f)\n", (SymbolInfoDouble(_Symbol, SYMBOL_ASK) - SymbolInfoDouble(_Symbol, SYMBOL_BID)) / _Point, MaxSpreadPoints);
   text += "-----------------------------------------\n";
   text += StringFormat(" Open Positions: BUY: %d | SELL: %d\n", buyCount, sellCount);
   text += StringFormat(" Floating P&L  : $%.2f USD\n", pnl);
   text += "-----------------------------------------\n";
   text += " Status: " + statusMsg + "\n";
   text += "=========================================";

   Comment(text);
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
//| Ensure SL/TP on ECN accounts                                     |
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
//| Count EA Positions                                               |
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
