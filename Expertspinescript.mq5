//+------------------------------------------------------------------+
//|                                        Smart_Money_Concepts.mq5 |
//|                                  Copyright 2026, LuxAlgo Port    |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property indicator_chart_window
#property indicator_buffers 2
#property indicator_plots   2

//--- Inputs
input group "--- Swing Structure ---"
input int    InpSwingLength = 5;       // Swing Detection Length
input bool   InpShowBOS     = true;    // Show BOS (Break of Structure)
input bool   InpShowCHoCH   = true;    // Show CHoCH (Change of Character)

input group "--- Order Blocks ---"
input bool   InpShowOB      = true;    // Show Order Blocks

//--- Global Buffers
double HighBuffer[];
double LowBuffer[];

//+------------------------------------------------------------------+
//| Custom indicator initialization function                         |
//+------------------------------------------------------------------+
int OnInit()
{
   SetIndexBuffer(0, HighBuffer, INDICATOR_DATA);
   SetIndexBuffer(1, LowBuffer, INDICATOR_DATA);
   
   PlotIndexSetString(0, PLOT_LABEL, "Swing High");
   PlotIndexSetString(1, PLOT_LABEL, "Swing Low");
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Custom indicator iteration function                              |
//+------------------------------------------------------------------+
int OnCalculate(const int rates_total,
                const int prev_calculated,
                const datetime &time[],
                const double &open[],
                const double &high[],
                const double &low[],
                const double &close[],
                const long &tick_volume[],
                const long &volume[],
                const int &spread[])
{
   if(rates_total < InpSwingLength * 2 + 1) return(0);

   int start = (prev_calculated > 0) ? prev_calculated - 1 : InpSwingLength;

   for(int i = start; i < rates_total - InpSwingLength; i++)
   {
      // Core Swing High / Low Logic equivalent to Pine Script ta.highest / ta.lowest
      bool is_swing_high = true;
      bool is_swing_low  = true;

      for(int j = 1; j <= InpSwingLength; j++)
      {
         if(high[i] <= high[i - j] || high[i] <= high[i + j]) is_swing_high = false;
         if(low[i]  >= low[i - j]  || low[i]  >= low[i + j])  is_swing_low  = false;
      }

      if(is_swing_high)
         HighBuffer[i] = high[i];
      else
         HighBuffer[i] = EMPTY_VALUE;

      if(is_swing_low)
         LowBuffer[i] = low[i];
      else
         LowBuffer[i] = EMPTY_VALUE;
   }

   return(rates_total);
}