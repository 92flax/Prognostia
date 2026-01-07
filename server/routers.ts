import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  // System routes
  system: systemRouter,
  
  // Auth routes
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Trading signals routes
  signals: router({
    // Get recent signals
    list: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        asset: z.string().optional(),
      }))
      .query(async ({ input }) => {
        if (input.asset) {
          return db.getRecentSignals(input.asset, input.limit);
        }
        return db.getAllRecentSignals(input.limit);
      }),

    // Create a new signal
    create: protectedProcedure
      .input(z.object({
        asset: z.string().min(1),
        direction: z.enum(["LONG", "SHORT"]),
        entryPrice: z.string(),
        takeProfitPrice: z.string(),
        stopLossPrice: z.string(),
        leverageRecommendation: z.string(), // decimal type
        confidenceScore: z.number().min(0).max(100),
        rationale: z.string(),
        riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "EXTREME"]),
        riskRewardRatio: z.string().optional(),
        dailyVolatility: z.string().optional(),
        atr: z.string().optional(),
        sentimentScore: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createSignal(input);
      }),

    // Mark signal as executed
    markExecuted: protectedProcedure
      .input(z.object({
        signalId: z.number(),
        mode: z.enum(["PAPER", "LIVE"]),
      }))
      .mutation(async ({ input }) => {
        return db.markSignalExecuted(input.signalId, input.mode);
      }),

    // Update signal outcome
    updateOutcome: protectedProcedure
      .input(z.object({
        signalId: z.number(),
        actualOutcome: z.string().optional(),
        actualPnlPercent: z.string().optional(),
        wasSuccessful: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.updateSignalOutcome(input.signalId, {
          actualOutcome: input.actualOutcome,
          actualPnlPercent: input.actualPnlPercent,
          wasSuccessful: input.wasSuccessful,
          resolvedAt: new Date(),
        });
      }),
  }),

  // Trades routes
  trades: router({
    // Get user's trade history
    list: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        mode: z.enum(["PAPER", "LIVE"]).optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getTradeHistory(ctx.user.id, input.mode, input.limit);
      }),

    // Get open trades
    getOpen: protectedProcedure
      .input(z.object({
        mode: z.enum(["PAPER", "LIVE"]).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getOpenTrades(ctx.user.id, input?.mode);
      }),

    // Create a new trade
    create: protectedProcedure
      .input(z.object({
        signalId: z.number().optional(),
        mode: z.enum(["PAPER", "LIVE"]),
        asset: z.string().min(1),
        side: z.enum(["BUY", "SELL"]),
        direction: z.enum(["LONG", "SHORT"]),
        entryPrice: z.string(),
        size: z.string(),
        margin: z.string(),
        leverage: z.number().min(1).max(125),
        takeProfitPrice: z.string().optional(),
        stopLossPrice: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createTrade({
          userId: ctx.user.id,
          ...input,
          status: "OPEN",
        });
      }),

    // Close a trade
    close: protectedProcedure
      .input(z.object({
        tradeId: z.number(),
        exitPrice: z.string(),
        pnlAbsolute: z.string(),
        pnlPercent: z.number(),
        closeReason: z.string(),
        durationSeconds: z.number().optional(),
        fees: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.closeTrade(input.tradeId, {
          exitPrice: input.exitPrice,
          pnlAbsolute: input.pnlAbsolute,
          pnlPercent: input.pnlPercent,
          closeReason: input.closeReason,
          durationSeconds: input.durationSeconds,
          fees: input.fees,
        });
      }),

    // Update unrealized PnL
    updatePnl: protectedProcedure
      .input(z.object({
        tradeId: z.number(),
        unrealizedPnl: z.string(),
        pnlPercent: z.number(),
      }))
      .mutation(async ({ input }) => {
        return db.updateTradeUnrealizedPnl(
          input.tradeId,
          input.unrealizedPnl,
          input.pnlPercent
        );
      }),
  }),

  // User stats routes
  stats: router({
    // Get user's trading statistics
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrCreateUserStats(ctx.user.id);
    }),

    // Update user stats
    update: protectedProcedure
      .input(z.object({
        totalTrades: z.number().optional(),
        winningTrades: z.number().optional(),
        losingTrades: z.number().optional(),
        netPnl: z.string().optional(),
        winRate: z.number().optional(),
        profitFactor: z.number().optional(),
        avgWinAmount: z.string().optional(),
        avgLossAmount: z.string().optional(),
        maxDrawdown: z.number().optional(),
        currentDrawdown: z.number().optional(),
        peakBalance: z.string().optional(),
        currentBalance: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.updateUserStats(ctx.user.id, input);
      }),
  }),

  // Balance history routes
  balanceHistory: router({
    // Get balance history for equity curve
    list: protectedProcedure
      .input(z.object({
        mode: z.enum(["PAPER", "LIVE"]),
        limit: z.number().min(1).max(365).default(100),
      }))
      .query(async ({ ctx, input }) => {
        return db.getBalanceHistory(ctx.user.id, input.mode, input.limit);
      }),

    // Record a balance snapshot
    record: protectedProcedure
      .input(z.object({
        mode: z.enum(["PAPER", "LIVE"]),
        balance: z.string(),
        changeAmount: z.string().optional(),
        changeReason: z.string().optional(),
        tradeId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.addBalanceHistoryEntry({
          userId: ctx.user.id,
          mode: input.mode,
          balance: input.balance,
          changeAmount: input.changeAmount,
          changeReason: input.changeReason,
          tradeId: input.tradeId,
        });
      }),
  }),

  // Paper wallet routes
  paperWallet: router({
    // Get paper wallet
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrCreatePaperWallet(ctx.user.id);
    }),

    // Update paper wallet balance
    update: protectedProcedure
      .input(z.object({
        usdtBalance: z.string().optional(),
        usedMargin: z.string().optional(),
        availableBalance: z.string().optional(),
        totalPnl: z.string().optional(),
        totalTrades: z.number().optional(),
        winningTrades: z.number().optional(),
        losingTrades: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.updatePaperWalletBalance(ctx.user.id, input);
      }),

    // Reset paper wallet
    reset: protectedProcedure.mutation(async ({ ctx }) => {
      return db.resetPaperWallet(ctx.user.id);
    }),
  }),

  // User settings routes
  settings: router({
    // Get user settings
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSettings(ctx.user.id);
    }),

    // Update user settings
    update: protectedProcedure
      .input(z.object({
        autoTradeEnabled: z.boolean().optional(),
        confidenceThreshold: z.number().min(0).max(100).optional(),
        maxLeverage: z.number().min(1).max(125).optional(),
        riskPerTrade: z.string().optional(),
        defaultTimeframe: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertUserSettings(ctx.user.id, input);
      }),

    // Update Bitget credentials
    updateBitgetCredentials: protectedProcedure
      .input(z.object({
        bitgetApiKey: z.string().optional(),
        bitgetSecret: z.string().optional(),
        bitgetPassphrase: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.updateBitgetCredentials(ctx.user.id, input);
      }),

    // Set auto-trade enabled
    setAutoTrade: protectedProcedure
      .input(z.object({
        enabled: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.setAutoTradeEnabled(ctx.user.id, input.enabled);
      }),

    // Test Bitget connection
    testConnection: protectedProcedure.mutation(async ({ ctx }) => {
      const settings = await db.getUserSettings(ctx.user.id);
      if (!settings?.bitgetApiKey || !settings?.bitgetSecret || !settings?.bitgetPassphrase) {
        await db.updateConnectionStatus(ctx.user.id, false, "Missing API credentials");
        return { connected: false, error: "Missing API credentials" };
      }
      // In production, this would test the actual Bitget API
      // For now, return success if credentials exist
      await db.updateConnectionStatus(ctx.user.id, true);
      return { connected: true, balance: 10000 };
    }),
  }),

  // Signal interactions routes
  interactions: router({
    // Create interaction (copy, execute)
    create: protectedProcedure
      .input(z.object({
        signalId: z.number(),
        wasCopied: z.boolean().optional(),
        wasExecuted: z.boolean().optional(),
        userFeedback: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createSignalInteraction({
          userId: ctx.user.id,
          signalId: input.signalId,
          wasCopied: input.wasCopied,
          wasExecuted: input.wasExecuted,
          userFeedback: input.userFeedback,
        });
      }),

    // Get user's interactions
    list: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(20),
      }))
      .query(async ({ ctx, input }) => {
        return db.getUserSignalInteractions(ctx.user.id, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
