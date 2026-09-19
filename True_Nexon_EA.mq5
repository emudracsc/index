//+------------------------------------------------------------------+
//|                                             True_Nexon_EA.mq5    |
//|                                  Copyright 2026, Mahesh Sutar   |
//|                                             Algorithmic Trader  |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Mahesh Sutar"
#property link      "https://t.me/@mgsutar"
#property description "True Nexon EA - RSI Signal with Guaranteed SL & TP Placement"
#property version   "10.5"

#include <Trade/trade.mqh>
CTrade obj_Trade;

//+------------------------------------------------------------------+
//| INPUT PARAMETERS                                                 |
//+------------------------------------------------------------------+
input group "=== Main Settings ===";
input double            LotSize                 = 0.01;         // Lot Size
input ulong             InpMagicNumber          = 341992;       // Magic Number
input ulong             InpSlippage             = 10;           // Max Slippage (Points)

input group "=== Stop Loss & Take Profit Settings ===";
input bool              UseFixedSLTP            = true;         // Enable Physical SL & TP
input double            StopLossPoints          = 2000.0;       // Stop Loss in Points (e.g. Gold 2000 = $2.0)
input double            TakeProfitPoints        = 4000.0;       // Take Profit in Points (e.g. Gold 4000 = $4.0)
input double            CloseWhenInProfit       = 20.0;         // Virtual Profit Target ($ USD, 0 to disable)

input group "=== RSI Settings ===";
input ENUM_TIMEFRAMES   RsiTimeframe            = PERIOD_M1;    // RSI Timeframe
input int               RsiPeriod               = 14;           // RSI Period (14 is standard)
input ENUM_APPLIED_PRICE RsiAppliedPrice        = PRICE_CLOSE;  // RSI Applied Price
input double            buyzone                 = 35.0;         // RSI Buy Zone (Cross Above)
input double            sellzone                = 70.0;         // RSI Sell Zone (Cross Below)

input group "=== Visual Zones on Chart ===";
input bool              ShowZoneLines           = true;         // Draw SL/TP Zones on Chart

//+------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                 |
//+------------------------------------------------------------------+
int handleRsi = INVALID_HANDLE;
double Rsi[];
datetime lastBarTime = 0;

string ZONE_L   = "ZN_L";
string ZONE_H   = "ZN_H";
string ZONE_T_H = "ZN_TH";
string ZONE_T_L = "ZN_TL";

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   obj_Trade.SetExpertMagicNumber(InpMagicNumber);
   obj_Trade.SetDeviationInPoints(InpSlippage);
   
   // Set proper filling mode for all brokers
   SetProperFillingMode();

   ArraySetAsSeries(Rsi, true);

   handleRsi = iRSI(_Symbol, RsiTimeframe, RsiPeriod, RsiAppliedPrice);
   if(handleRsi == INVALID_HANDLE)
   {
      Print("TRUE NEXON ERROR: RSI Handle Creation Failed! Error: ", GetLastError());
      return(INIT_FAILED);
   }

   Print("TRUE NEXON EA Initialized Successfully with Guaranteed SL/TP!");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(handleRsi != INVALID_HANDLE)
   {
      IndicatorRelease(handleRsi);
      handleRsi = INVALID_HANDLE;
   }
   ClearZones();
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   if(bid <= 0 || ask <= 0) return;

   // 1. Virtual Profit Booking Check (Every Tick)
   if(CloseWhenInProfit > 0 && GetPositionProfit() >= CloseWhenInProfit)
   {
      Print("TRUE NEXON: Profit Target $", CloseWhenInProfit, " Reached! Closing all trades.");
      CloseAllBuySell();
      return;
   }

   // 2. Check for New Bar
   datetime currentBarTime = iTime(_Symbol, RsiTimeframe, 0);
   if(currentBarTime == 0 || currentBarTime == lastBarTime) return;
   lastBarTime = currentBarTime;

   // 3. Read RSI Indicator (Bar 1 and Bar 2 for confirmed non-repainting signal)
   if(CopyBuffer(handleRsi, 0, 1, 2, Rsi) < 2)
   {
      Print("TRUE NEXON: Failed to copy RSI Buffer!");
      return;
   }

   // Ensure only 1 trade per direction / active position check
   int buyCount = 0, sellCount = 0;
   CountOpenPositions(buyCount, sellCount);

   double point = _Point;
   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   double stopsLevel = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL) * point;

   double slDistance = MathMax(StopLossPoints * point, stopsLevel + (5 * point));
   double tpDistance = MathMax(TakeProfitPoints * point, stopsLevel + (5 * point));
   double lot = NormalizeLot(LotSize);

   // 4. BUY SIGNAL (RSI crosses above buyzone)
   if(Rsi[1] <= buyzone && Rsi[0] > buyzone && buyCount == 0)
   {
      double sl = UseFixedSLTP ? NormalizeDouble(ask - slDistance, digits) : 0;
      double tp = UseFixedSLTP ? NormalizeDouble(ask + tpDistance, digits) : 0;

      Print("TRUE NEXON: Executing BUY Order at ", ask, " SL: ", sl, " TP: ", tp);

      if(obj_Trade.Buy(lot, _Symbol, ask, sl, tp, "True_Nexon_Buy"))
      {
         ulong ticket = obj_Trade.ResultOrder();
         Print("TRUE NEXON: BUY Placed Successfully! Ticket: ", ticket, " SL: ", sl, " TP: ", tp);
         
         // Fallback modification to ensure SL/TP is attached on ECN brokers
         EnsurePositionSLTP(POSITION_TYPE_BUY, sl, tp);

         if(ShowZoneLines)
         {
            drawZoneLevel(ZONE_H, ask, clrCyan, 2);
            drawZoneLevel(ZONE_L, sl, clrRed, 2);
            drawZoneLevel(ZONE_T_H, tp, clrLimeGreen, 2);
         }
      }
      else
      {
         Print("TRUE NEXON ERROR: BUY Failed! Code: ", obj_Trade.ResultRetcode(), " Desc: ", obj_Trade.ResultRetcodeDescription());
      }
   }
   // 5. SELL SIGNAL (RSI crosses below sellzone)
   else if(Rsi[1] >= sellzone && Rsi[0] < sellzone && sellCount == 0)
   {
      double sl = UseFixedSLTP ? NormalizeDouble(bid + slDistance, digits) : 0;
      double tp = UseFixedSLTP ? NormalizeDouble(bid - tpDistance, digits) : 0;

      Print("TRUE NEXON: Executing SELL Order at ", bid, " SL: ", sl, " TP: ", tp);

      if(obj_Trade.Sell(lot, _Symbol, bid, sl, tp, "True_Nexon_Sell"))
      {
         ulong ticket = obj_Trade.ResultOrder();
         Print("TRUE NEXON: SELL Placed Successfully! Ticket: ", ticket, " SL: ", sl, " TP: ", tp);
         
         // Fallback modification to ensure SL/TP is attached on ECN brokers
         EnsurePositionSLTP(POSITION_TYPE_SELL, sl, tp);

         if(ShowZoneLines)
         {
            drawZoneLevel(ZONE_L, bid, clrCyan, 2);
            drawZoneLevel(ZONE_H, sl, clrRed, 2);
            drawZoneLevel(ZONE_T_L, tp, clrLimeGreen, 2);
         }
      }
      else
      {
         Print("TRUE NEXON ERROR: SELL Failed! Code: ", obj_Trade.ResultRetcode(), " Desc: ", obj_Trade.ResultRetcodeDescription());
      }
   }
}

//+------------------------------------------------------------------+
//| Ensure SL and TP are set on the Open Position (ECN Broker Safe)  |
//+------------------------------------------------------------------+
void EnsurePositionSLTP(ENUM_POSITION_TYPE posType, double sl, double tp)
{
   if(!UseFixedSLTP || (sl == 0 && tp == 0)) return;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionSelectByTicket(ticket))
      {
         if(PositionGetString(POSITION_SYMBOL) == _Symbol && 
            PositionGetInteger(POSITION_MAGIC) == InpMagicNumber &&
            (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE) == posType)
         {
            double currentSL = PositionGetDouble(POSITION_SL);
            double currentTP = PositionGetDouble(POSITION_TP);

            if(currentSL == 0 || currentTP == 0)
            {
               if(obj_Trade.PositionModify(ticket, sl, tp))
               {
                  Print("TRUE NEXON: Position #", ticket, " SL/TP Successfully Attached via PositionModify!");
               }
               else
               {
                  Print("TRUE NEXON WARNING: PositionModify Failed! Error: ", obj_Trade.ResultRetcodeDescription());
               }
            }
            break;
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Set Proper Filling Mode for Current Broker                       |
//+------------------------------------------------------------------+
void SetProperFillingMode()
{
   uint filling = (uint)SymbolInfoInteger(_Symbol, SYMBOL_FILLING_MODE);
   if((filling & SYMBOL_FILLING_IOC) != 0)
      obj_Trade.SetTypeFilling(ORDER_FILLING_IOC);
   else if((filling & SYMBOL_FILLING_FOK) != 0)
      obj_Trade.SetTypeFilling(ORDER_FILLING_FOK);
   else
      obj_Trade.SetTypeFilling(ORDER_FILLING_RETURN);
}

//+------------------------------------------------------------------+
//| Normalize Lot Size according to Broker Rules                     |
//+------------------------------------------------------------------+
double NormalizeLot(double lot)
{
   double minLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double stepLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

   if(stepLot <= 0) stepLot = 0.01;
   
   double normalized = MathFloor(lot / stepLot) * stepLot;
   if(normalized < minLot) normalized = minLot;
   if(normalized > maxLot) normalized = maxLot;

   int digits = (int)MathMax(0, MathCeil(-MathLog10(stepLot)));
   return NormalizeDouble(normalized, digits);
}

//+------------------------------------------------------------------+
//| Count Open Positions for this EA                                 |
//+------------------------------------------------------------------+
void CountOpenPositions(int &buyCount, int &sellCount)
{
   buyCount = 0;
   sellCount = 0;
   int total = PositionsTotal();
   for(int i = total - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionSelectByTicket(ticket))
      {
         if(PositionGetString(POSITION_SYMBOL) == _Symbol && 
            PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
         {
            ENUM_POSITION_TYPE type = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
            if(type == POSITION_TYPE_BUY) buyCount++;
            if(type == POSITION_TYPE_SELL) sellCount++;
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Draw Visual Line on Chart                                        |
//+------------------------------------------------------------------+
void drawZoneLevel(string LevelName, double Price, color clr, int Width)
{
   ObjectDelete(0, LevelName);
   if(ObjectCreate(0, LevelName, OBJ_HLINE, 0, 0, Price))
   {
      ObjectSetDouble(0, LevelName, OBJPROP_PRICE, Price);
      ObjectSetInteger(0, LevelName, OBJPROP_COLOR, clr);
      ObjectSetInteger(0, LevelName, OBJPROP_WIDTH, Width);
      ObjectSetInteger(0, LevelName, OBJPROP_STYLE, STYLE_SOLID);
      ObjectSetInteger(0, LevelName, OBJPROP_BACK, true);
   }
}

//+------------------------------------------------------------------+
//| Remove Visual Lines                                              |
//+------------------------------------------------------------------+
void ClearZones()
{
   ObjectDelete(0, ZONE_H);
   ObjectDelete(0, ZONE_L);
   ObjectDelete(0, ZONE_T_H);
   ObjectDelete(0, ZONE_T_L);
}

//+------------------------------------------------------------------+
//| Close all positions belonging to this EA                         |
//+------------------------------------------------------------------+
void CloseAllBuySell()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionSelectByTicket(ticket))
      {
         if(PositionGetString(POSITION_SYMBOL) == _Symbol && 
            PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
         {
            for(int tryCount = 0; tryCount < 10; tryCount++)
            {
               if(obj_Trade.PositionClose(ticket))
                  break;
               Sleep(100);
            }
         }
      }
   }
   ClearZones();
}

//+------------------------------------------------------------------+
//| Calculate Cycle Floating Profit                                  |
//+------------------------------------------------------------------+
double GetPositionProfit()
{
   double posProfit = 0;
   int posTotal = PositionsTotal();

   for(int i = posTotal - 1; i >= 0; i--)
   {
      ulong posTicket = PositionGetTicket(i);
      if(posTicket > 0 && PositionSelectByTicket(posTicket))
      {
         if(PositionGetString(POSITION_SYMBOL) == _Symbol && 
            PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
         {
            posProfit += PositionGetDouble(POSITION_PROFIT) 
                       + PositionGetDouble(POSITION_SWAP);
         }
      }
   }
   return posProfit;
}
//+------------------------------------------------------------------+
