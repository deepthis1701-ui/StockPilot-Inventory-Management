import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock3,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import {
  getInventory,
  runWhatIf,
} from "../services/api.js";

import { PRODUCT_CATALOG } from "../data/productCatalog.js";

const PRODUCT_IDS = Object.keys(PRODUCT_CATALOG);

/* =========================================================
   HELPERS
========================================================= */

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const formatNumber = (value, decimals = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toFixed(decimals);
};

const getProductName = (
  id,
  fallback = "Unknown Product"
) => {
  return (
    PRODUCT_CATALOG?.[id]?.name ||
    PRODUCT_CATALOG?.[String(id)]?.name ||
    fallback
  );
};

/* =========================================================
   RISK CALCULATION
========================================================= */

const getRiskInfo = (
  currentStock,
  dailyDemand,
  leadTime
) => {
  const stock = Math.max(
    0,
    toNumber(currentStock)
  );

  const demand = Math.max(
    0,
    toNumber(dailyDemand)
  );

  const lead = Math.max(
    0,
    toNumber(leadTime)
  );

  if (stock <= 0) {
    return {
      level: "HIGH",
      label: "HIGH RISK",
      color: "#dc2626",
      background: "#fef2f2",
      border: "#fecaca",
      icon: AlertTriangle,
      message: "Stock is already unavailable.",
    };
  }

  if (demand <= 0) {
    return {
      level: "LOW",
      label: "LOW RISK",
      color: "#16a34a",
      background: "#f0fdf4",
      border: "#bbf7d0",
      icon: CheckCircle2,
      message:
        "No daily demand is currently projected.",
    };
  }

  const stockDuration = stock / demand;

  if (stockDuration <= lead) {
    return {
      level: "HIGH",
      label: "HIGH RISK",
      color: "#dc2626",
      background: "#fef2f2",
      border: "#fecaca",
      icon: AlertTriangle,
      message: `Stock may run out in ${formatNumber(
        stockDuration,
        1
      )} days.`,
    };
  }

  if (stockDuration <= lead + 3) {
    return {
      level: "MEDIUM",
      label: "MEDIUM RISK",
      color: "#d97706",
      background: "#fffbeb",
      border: "#fde68a",
      icon: Clock3,
      message: `Stock lasts about ${formatNumber(
        stockDuration,
        1
      )} days.`,
    };
  }

  return {
    level: "LOW",
    label: "LOW RISK",
    color: "#16a34a",
    background: "#f0fdf4",
    border: "#bbf7d0",
    icon: CheckCircle2,
    message: `Stock lasts about ${formatNumber(
      stockDuration,
      1
    )} days.`,
  };
};

/* =========================================================
   ACTION TEXT
========================================================= */

const getActionText = ({
  riskLevel,
  orderQuantity,
  additionalDailyDemand,
}) => {
  const order = Math.max(
    0,
    Math.ceil(toNumber(orderQuantity))
  );

  if (riskLevel === "HIGH") {
    if (order > 0) {
      return `Order ${order} units now.`;
    }

    return "Review replenishment immediately.";
  }

  if (riskLevel === "MEDIUM") {
    if (order > 0) {
      return `Plan an order of ${order} units soon.`;
    }

    return "Review the replenishment plan soon.";
  }

  if (additionalDailyDemand > 0) {
    return "Monitor demand; no immediate order is required.";
  }

  return "No immediate action required.";
};

/* =========================================================
   COMPONENT
========================================================= */

export default function WhatIfSimulator() {
  const [inventory, setInventory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [demandChange, setDemandChange] = useState(20);
  const [leadTime, setLeadTime] = useState(7);
  const [safetyStock, setSafetyStock] = useState(10);

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [scenarioResult, setScenarioResult] =
    useState(null);

  /* =========================================================
     LOAD INVENTORY
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadInventory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getInventory();

        const products = Array.isArray(response)
          ? response
          : Array.isArray(response?.products)
          ? response.products
          : Array.isArray(response?.inventory)
          ? response.inventory
          : [];

        if (!mounted) {
          return;
        }

        setInventory(products);

        if (products.length > 0) {
          const firstProduct = products[0];

          const firstId =
            firstProduct?.id ||
            firstProduct?.productId ||
            firstProduct?.product_id ||
            PRODUCT_IDS[0] ||
            "";

          setSelectedProduct(String(firstId));
        } else if (PRODUCT_IDS.length > 0) {
          setSelectedProduct(PRODUCT_IDS[0]);
        }
      } catch (err) {
        console.error(
          "Failed to load inventory:",
          err
        );

        if (mounted) {
          setError(
            "Unable to load inventory data. Please check that the backend is running."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInventory();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     SELECTED INVENTORY ITEM
  ========================================================= */

  const selectedInventory = useMemo(() => {
    if (!inventory.length) {
      return null;
    }

    const found = inventory.find((item) => {
      const id =
        item?.id ||
        item?.productId ||
        item?.product_id ||
        "";

      return (
        String(id) ===
        String(selectedProduct)
      );
    });

    return found || inventory[0] || null;
  }, [inventory, selectedProduct]);

  /* =========================================================
     PRODUCT NAME
  ========================================================= */

  const selectedProductName = useMemo(() => {
    if (!selectedInventory) {
      return "Unknown Product";
    }

    const id =
      selectedInventory?.id ||
      selectedInventory?.productId ||
      selectedInventory?.product_id ||
      selectedProduct;

    return getProductName(
      id,
      selectedInventory?.name ||
        selectedInventory?.productName ||
        "Selected Product"
    );
  }, [selectedInventory, selectedProduct]);

  /* =========================================================
     ACTUAL FORECAST DEMAND
  ========================================================= */

  const predictedDailyDemand = useMemo(() => {
    if (!selectedInventory) {
      return 0;
    }

    return toNumber(
      selectedInventory?.predictedDemand ??
        selectedInventory?.predicted_daily_demand ??
        selectedInventory?.forecastDemand ??
        selectedInventory?.forecast_demand ??
        0
    );
  }, [selectedInventory]);

  /* =========================================================
     CURRENT STOCK
  ========================================================= */

  const currentStock = useMemo(() => {
    if (!selectedInventory) {
      return 0;
    }

    return Math.max(
      0,
      toNumber(
        selectedInventory?.currentStock ??
          selectedInventory?.current_stock ??
          selectedInventory?.stock ??
          selectedInventory?.quantity ??
          selectedInventory?.inventory ??
          0
      )
    );
  }, [selectedInventory]);

  /* =========================================================
     CLEAR SCENARIO
  ========================================================= */

  const clearScenario = () => {
    setScenarioResult(null);
    setError("");
  };

  /* =========================================================
     INPUT HANDLERS
  ========================================================= */

  const handleProductChange = (event) => {
    setSelectedProduct(event.target.value);
    clearScenario();
  };

  const handleDemandChange = (event) => {
    setDemandChange(
      toNumber(event.target.value, 0)
    );

    clearScenario();
  };

  const handleLeadTimeChange = (event) => {
    setLeadTime(
      Math.max(
        0,
        toNumber(event.target.value, 7)
      )
    );

    clearScenario();
  };

  const handleSafetyStockChange = (event) => {
    setSafetyStock(
      Math.max(
        0,
        toNumber(event.target.value, 0)
      )
    );

    clearScenario();
  };

  const handleQuickDemandChange = (value) => {
    setDemandChange(value);
    clearScenario();
  };

  /* =========================================================
     RUN SCENARIO
  ========================================================= */

  const runSimulation = async () => {
    setError("");
    setScenarioResult(null);

    if (!selectedInventory) {
      setError("Please select a product.");
      return;
    }

    if (predictedDailyDemand <= 0) {
      setError(
        "Forecast demand is unavailable for this product, so a scenario cannot be calculated."
      );

      return;
    }

    setRunning(true);

    const productId =
      selectedInventory?.id ||
      selectedInventory?.productId ||
      selectedInventory?.product_id ||
      selectedProduct;

    const change = toNumber(
      demandChange,
      0
    );

    const lead = Math.max(
      0,
      toNumber(leadTime, 7)
    );

    const reserve = Math.max(
      0,
      toNumber(safetyStock, 0)
    );

    const safeCurrentStock = Math.max(
      0,
      toNumber(currentStock, 0)
    );

    /* =======================================================
       PROJECTED DEMAND
    ======================================================= */

    const safeProjectedDemand = Math.max(
      0,
      predictedDailyDemand *
        (1 + change / 100)
    );

    /* =======================================================
       STOCK DURATION
    ======================================================= */

    const daysUntilStockout =
      safeProjectedDemand > 0
        ? safeCurrentStock /
          safeProjectedDemand
        : Infinity;

    /* =======================================================
       REQUIRED STOCK
    ======================================================= */

    const requiredStock =
      safeProjectedDemand > 0
        ? Math.ceil(
            safeProjectedDemand *
              lead +
              reserve
          )
        : Math.ceil(reserve);

    /* =======================================================
       ORDER QUANTITY
    ======================================================= */

    const recommendedOrder = Math.max(
      0,
      requiredStock -
        safeCurrentStock
    );

    /* =======================================================
       ADDITIONAL DEMAND
    ======================================================= */

    const additionalDailyDemand = Math.max(
      0,
      safeProjectedDemand -
        predictedDailyDemand
    );

    /* =======================================================
       RISK
    ======================================================= */

    let riskLevel = "LOW";

    if (safeCurrentStock <= 0) {
      riskLevel = "HIGH";
    } else if (safeProjectedDemand <= 0) {
      riskLevel = "LOW";
    } else if (daysUntilStockout <= lead) {
      riskLevel = "HIGH";
    } else if (
      daysUntilStockout <=
      lead + 3
    ) {
      riskLevel = "MEDIUM";
    } else {
      riskLevel = "LOW";
    }

    const risk = getRiskInfo(
      safeCurrentStock,
      safeProjectedDemand,
      lead
    );

    risk.level = riskLevel;

    const action = getActionText({
      riskLevel,
      orderQuantity:
        recommendedOrder,
      additionalDailyDemand,
    });

    /* =======================================================
       LOCAL RESULT
    ======================================================= */

    const localResult = {
      productId,
      productName: selectedProductName,

      currentStock: safeCurrentStock,

      currentDailyDemand:
        predictedDailyDemand,

      expectedDailyDemand:
        safeProjectedDemand,

      demandChange: change,

      leadTime: lead,

      reserveStock: reserve,

      requiredStock,

      orderQuantity:
        recommendedOrder,

      additionalDailyDemand,

      daysUntilStockout,

      riskLevel,

      riskLabel: risk.label,

      riskColor: risk.color,

      riskBackground:
        risk.background,

      riskBorder: risk.border,

      riskMessage: risk.message,

      action,
    };

    setScenarioResult(localResult);

    /* =======================================================
       OPTIONAL BACKEND CALL
    ======================================================= */

    try {
      await runWhatIf({
        productId,

        demandChange: change,

        demandChangePct: change,

        leadTime: lead,

        safetyStock: reserve,

        reserveStock: reserve,

        currentStock:
          safeCurrentStock,

        predictedDemand:
          predictedDailyDemand,

        predictedDailyDemand:
          predictedDailyDemand,
      });
    } catch (err) {
      console.warn(
        "Backend What-if calculation unavailable. Local scenario calculation is being used.",
        err
      );
    } finally {
      setRunning(false);
    }
  };

  /* =========================================================
     CHART DATA
  ========================================================= */

  const chartData = useMemo(() => {
    if (!scenarioResult) {
      return [];
    }

    const duration =
      Number.isFinite(
        scenarioResult.daysUntilStockout
      )
        ? Math.max(
            1,
            Math.ceil(
              scenarioResult.daysUntilStockout
            )
          )
        : 14;

    const days = Math.min(
      Math.max(duration + 3, 7),
      30
    );

    const data = [];

    for (let day = 0; day <= days; day++) {
      const currentLevel = Math.max(
        0,
        scenarioResult.currentStock -
          scenarioResult.currentDailyDemand *
            day
      );

      const expectedLevel = Math.max(
        0,
        scenarioResult.currentStock -
          scenarioResult.expectedDailyDemand *
            day
      );

      data.push({
        day: `Day ${day}`,

        "Current Demand": Number(
          currentLevel.toFixed(2)
        ),

        "Expected Demand": Number(
          expectedLevel.toFixed(2)
        ),
      });
    }

    return data;
  }, [scenarioResult]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div
        style={{
          padding: "32px",
          color: "#64748b",
          fontSize: "15px",
        }}
      >
        Loading inventory data...
      </div>
    );
  }

  /* =========================================================
     EMPTY INVENTORY
  ========================================================= */

  if (!inventory.length) {
    return (
      <div
        style={{
          padding: "32px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#0f172a",
          }}
        >
          Inventory Planner
        </h2>

        <p
          style={{
            marginTop: "8px",
            color: "#64748b",
          }}
        >
          No inventory data is
          available for simulation.
        </p>
      </div>
    );
  }

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* =====================================================
          INPUT PANEL
      ===================================================== */}

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "22px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(220px, 1.5fr) repeat(3, minmax(150px, 1fr))",
            gap: "16px",
            alignItems: "end",
          }}
        >
          {/* PRODUCT */}

          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
                marginBottom: "7px",
              }}
            >
              Product
            </label>

            <select
              value={selectedProduct}
              onChange={handleProductChange}
              style={{
                width: "100%",
                height: "42px",
                padding: "0 12px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#0f172a",
                outline: "none",
              }}
            >
              {inventory.map(
                (item, index) => {
                  const id =
                    item?.id ||
                    item?.productId ||
                    item?.product_id ||
                    PRODUCT_IDS[index];

                  const name =
                    getProductName(
                      id,
                      item?.name ||
                        item?.productName ||
                        `Product ${
                          index + 1
                        }`
                    );

                  return (
                    <option
                      key={String(id)}
                      value={String(id)}
                    >
                      {name}
                    </option>
                  );
                }
              )}
            </select>
          </div>

          {/* DEMAND CHANGE */}

          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
                marginBottom: "7px",
              }}
            >
              Demand Change
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <input
                type="number"
                value={demandChange}
                onChange={
                  handleDemandChange
                }
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "8px",
                  color: "#0f172a",
                  outline: "none",
                }}
              />

              <span
                style={{
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                %
              </span>
            </div>
          </div>

          {/* LEAD TIME */}

          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
                marginBottom: "7px",
              }}
            >
              Supplier Lead Time
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <input
                type="number"
                min="0"
                value={leadTime}
                onChange={
                  handleLeadTimeChange
                }
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "8px",
                  color: "#0f172a",
                  outline: "none",
                }}
              />

              <span
                style={{
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                days
              </span>
            </div>
          </div>

          {/* RESERVE STOCK */}

          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
                marginBottom: "7px",
              }}
            >
              Reserve Stock
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <input
                type="number"
                min="0"
                value={safetyStock}
                onChange={
                  handleSafetyStockChange
                }
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "8px",
                  color: "#0f172a",
                  outline: "none",
                }}
              />

              <span
                style={{
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                units
              </span>
            </div>
          </div>
        </div>

        {/* QUICK DEMAND BUTTONS */}

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "16px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: "#64748b",
              alignSelf: "center",
              marginRight: "4px",
            }}
          >
            Quick change:
          </span>

          {[
            -30,
            -20,
            -10,
            0,
            10,
            20,
            30,
          ].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                handleQuickDemandChange(
                  value
                )
              }
              style={{
                border:
                  Number(
                    demandChange
                  ) === value
                    ? "1px solid #2563eb"
                    : "1px solid #cbd5e1",

                background:
                  Number(
                    demandChange
                  ) === value
                    ? "#eff6ff"
                    : "#ffffff",

                color:
                  Number(
                    demandChange
                  ) === value
                    ? "#2563eb"
                    : "#475569",

                borderRadius: "7px",
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {value > 0
                ? `+${value}%`
                : `${value}%`}
            </button>
          ))}
        </div>

        {/* RUN BUTTON */}

        <div
          style={{
            marginTop: "18px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={runSimulation}
            disabled={running}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              height: "42px",
              padding: "0 18px",
              border: "none",
              borderRadius: "8px",
              background: running
                ? "#94a3b8"
                : "#2563eb",
              color: "#ffffff",
              fontWeight: 600,
              cursor: running
                ? "not-allowed"
                : "pointer",
            }}
          >
            <Zap size={16} />

            {running
              ? "Calculating..."
              : "Run Scenario"}
          </button>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "8px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* =====================================================
          RESULTS
      ===================================================== */}

      {scenarioResult && (
        <>
          {/* ACTION BANNER */}

          <div
            style={{
              background:
                scenarioResult.riskBackground,
              border: `1px solid ${scenarioResult.riskBorder}`,
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent:
                  "space-between",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems:
                    "flex-start",
                  gap: "13px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background:
                      scenarioResult.riskColor,
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    flexShrink: 0,
                  }}
                >
                  {scenarioResult.riskLevel ===
                  "HIGH" ? (
                    <AlertTriangle
                      size={21}
                      color="#ffffff"
                    />
                  ) : scenarioResult.riskLevel ===
                    "MEDIUM" ? (
                    <Clock3
                      size={21}
                      color="#ffffff"
                    />
                  ) : (
                    <CheckCircle2
                      size={21}
                      color="#ffffff"
                    />
                  )}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "17px",
                      fontWeight: 800,
                      color:
                        scenarioResult.riskColor,
                    }}
                  >
                    {
                      scenarioResult.riskLabel
                    }
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      color: "#334155",
                      fontSize: "14px",
                    }}
                  >
                    {
                      scenarioResult.productName
                    }{" "}
                    {Number.isFinite(
                      scenarioResult.daysUntilStockout
                    )
                      ? `may run out in ${formatNumber(
                          scenarioResult.daysUntilStockout,
                          1
                        )} days.`
                      : "has sufficient projected coverage."}
                  </div>
                </div>
              </div>

              <div
                style={{
                  textAlign: "right",
                  minWidth: "190px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform:
                      "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Action Required
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {
                    scenarioResult.action
                  }
                </div>
              </div>
            </div>

            {/* DEMAND CHANGE */}

            <div
              style={{
                marginTop: "18px",
                paddingTop: "16px",
                borderTop: `1px solid ${scenarioResult.riskBorder}`,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                fontSize: "13px",
              }}
            >
              <span
                style={{
                  color: "#64748b",
                }}
              >
                Demand:
              </span>

              <strong
                style={{
                  color: "#0f172a",
                }}
              >
                {formatNumber(
                  scenarioResult.currentDailyDemand,
                  2
                )}{" "}
                units/day
              </strong>

              {scenarioResult.demandChange >=
              0 ? (
                <ArrowUp
                  size={16}
                  color="#dc2626"
                />
              ) : (
                <ArrowDown
                  size={16}
                  color="#16a34a"
                />
              )}

              <strong
                style={{
                  color:
                    scenarioResult.demandChange >
                    0
                      ? "#dc2626"
                      : scenarioResult.demandChange <
                        0
                      ? "#16a34a"
                      : "#475569",
                }}
              >
                {formatNumber(
                  scenarioResult.expectedDailyDemand,
                  2
                )}{" "}
                units/day
              </strong>

              <span
                style={{
                  color: "#64748b",
                }}
              >
                (
                {scenarioResult.demandChange >
                0
                  ? `+${scenarioResult.demandChange}%`
                  : `${scenarioResult.demandChange}%`}
                )
              </span>
            </div>
          </div>

          {/* =================================================
              RESULT CARDS
          ================================================= */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(5, minmax(0, 1fr))",
              gap: "14px",
            }}
          >
            {/* CURRENT DAILY DEMAND */}

            <div
              style={{
                background: "#ffffff",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "17px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  marginBottom: "10px",
                }}
              >
                <TrendingDown
                  size={17}
                  color="#64748b"
                />

                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  Current Daily Demand
                </span>
              </div>

              <div
                style={{
                  fontSize: "23px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {formatNumber(
                  scenarioResult.currentDailyDemand,
                  2
                )}
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  marginTop: "4px",
                }}
              >
                units / day
              </div>
            </div>

            {/* EXPECTED DAILY DEMAND */}

            <div
              style={{
                background: "#ffffff",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "17px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  marginBottom: "10px",
                }}
              >
                <TrendingUp
                  size={17}
                  color="#64748b"
                />

                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  Expected Daily Demand
                </span>
              </div>

              <div
                style={{
                  fontSize: "23px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {formatNumber(
                  scenarioResult.expectedDailyDemand,
                  2
                )}
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color:
                    scenarioResult.demandChange >
                    0
                      ? "#dc2626"
                      : scenarioResult.demandChange <
                        0
                      ? "#16a34a"
                      : "#94a3b8",
                  marginTop: "4px",
                  fontWeight: 600,
                }}
              >
                {scenarioResult.demandChange >
                0
                  ? `+${scenarioResult.demandChange}%`
                  : `${scenarioResult.demandChange}%`}{" "}
                scenario
              </div>
            </div>

            {/* STOCK DURATION */}

            <div
              style={{
                background: "#ffffff",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "17px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  marginBottom: "10px",
                }}
              >
                <Clock3
                  size={17}
                  color="#64748b"
                />

                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  Estimated Stock Duration
                </span>
              </div>

              <div
                style={{
                  fontSize: "23px",
                  fontWeight: 700,
                  color:
                    scenarioResult.riskColor,
                }}
              >
                {Number.isFinite(
                  scenarioResult.daysUntilStockout
                )
                  ? formatNumber(
                      scenarioResult.daysUntilStockout,
                      1
                    )
                  : "—"}
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  marginTop: "4px",
                }}
              >
                days remaining
              </div>
            </div>

            {/* REQUIRED STOCK */}

            <div
              style={{
                background: "#ffffff",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "17px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  marginBottom: "10px",
                }}
              >
                <Package
                  size={17}
                  color="#64748b"
                />

                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  Required Stock Level
                </span>
              </div>

              <div
                style={{
                  fontSize: "23px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {Math.ceil(
                  scenarioResult.requiredStock
                )}
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  marginTop: "4px",
                }}
              >
                units
              </div>
            </div>

            {/* ORDER QUANTITY */}

            <div
              style={{
                background: "#eff6ff",
                border:
                  "1px solid #bfdbfe",
                borderRadius: "12px",
                padding: "17px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  marginBottom: "10px",
                }}
              >
                <ShoppingCart
                  size={17}
                  color="#2563eb"
                />

                <span
                  style={{
                    fontSize: "12px",
                    color: "#2563eb",
                    fontWeight: 600,
                  }}
                >
                  Order Quantity
                </span>
              </div>

              <div
                style={{
                  fontSize: "23px",
                  fontWeight: 800,
                  color: "#1d4ed8",
                }}
              >
                {Math.ceil(
                  scenarioResult.orderQuantity
                )}
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#60a5fa",
                  marginTop: "4px",
                }}
              >
                units recommended
              </div>
            </div>
          </div>

          {/* =================================================
              CHART + RECOMMENDATION
          ================================================= */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1.6fr) minmax(300px, 0.8fr)",
              gap: "18px",
            }}
          >
            {/* CHART */}

            <div
              style={{
                background: "#ffffff",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    color: "#0f172a",
                  }}
                >
                  Stock Level Projection
                </h3>

                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  Compare stock consumption
                  under current and
                  expected demand.
                </p>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "310px",
                }}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 20,
                      left: 0,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis dataKey="day" />

                    <YAxis
                      allowDecimals={true}
                    />

                    <Tooltip />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="Current Demand"
                      stroke="#64748b"
                      strokeWidth={2}
                      dot={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="Expected Demand"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RECOMMENDATION */}

            <div
              style={{
                background: "#ffffff",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "20px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  color: "#0f172a",
                }}
              >
                Inventory Recommendation
              </h3>

              <p
                style={{
                  margin: "5px 0 18px",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                Recommended inventory
                action for this scenario.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* PRODUCT */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "15px",
                    paddingBottom: "11px",
                    borderBottom:
                      "1px solid #f1f5f9",
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    Product
                  </span>

                  <strong
                    style={{
                      color: "#0f172a",
                      fontSize: "13px",
                      textAlign: "right",
                    }}
                  >
                    {
                      scenarioResult.productName
                    }
                  </strong>
                </div>

                {/* CURRENT STOCK */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "15px",
                    paddingBottom: "11px",
                    borderBottom:
                      "1px solid #f1f5f9",
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    Current Stock
                  </span>

                  <strong
                    style={{
                      color: "#0f172a",
                      fontSize: "13px",
                    }}
                  >
                    {Math.ceil(
                      scenarioResult.currentStock
                    )}{" "}
                    units
                  </strong>
                </div>

                {/* RESERVE STOCK */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "15px",
                    paddingBottom: "11px",
                    borderBottom:
                      "1px solid #f1f5f9",
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    Reserve Stock
                  </span>

                  <strong
                    style={{
                      color: "#0f172a",
                      fontSize: "13px",
                    }}
                  >
                    {Math.ceil(
                      scenarioResult.reserveStock
                    )}{" "}
                    units
                  </strong>
                </div>

                {/* SUGGESTED ORDER */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "15px",
                    paddingBottom: "11px",
                    borderBottom:
                      "1px solid #f1f5f9",
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    Suggested Order
                  </span>

                  <strong
                    style={{
                      color: "#2563eb",
                      fontSize: "14px",
                    }}
                  >
                    {Math.ceil(
                      scenarioResult.orderQuantity
                    )}{" "}
                    units
                  </strong>
                </div>

                {/* INVENTORY STATUS */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "15px",
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    Inventory Status
                  </span>

                  <strong
                    style={{
                      color:
                        scenarioResult.riskColor,
                      fontSize: "13px",
                    }}
                  >
                    {
                      scenarioResult.riskLabel
                    }
                  </strong>
                </div>
              </div>

              {/* ACTION BOX */}

              <div
                style={{
                  marginTop: "20px",
                  padding: "14px",
                  borderRadius: "9px",
                  background:
                    scenarioResult.riskBackground,
                  border: `1px solid ${scenarioResult.riskBorder}`,
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    textTransform:
                      "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: 700,
                    color:
                      scenarioResult.riskColor,
                  }}
                >
                  Recommended Action
                </div>

                <div
                  style={{
                    marginTop: "6px",
                    color: "#0f172a",
                    fontSize: "13px",
                    fontWeight: 600,
                    lineHeight: 1.5,
                  }}
                >
                  {
                    scenarioResult.action
                  }
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              ADDITIONAL DEMAND
          ================================================= */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 16px",
              borderRadius: "10px",
              background:
                scenarioResult.additionalDailyDemand >
                0
                  ? "#fff7ed"
                  : "#f0fdf4",
              border:
                scenarioResult.additionalDailyDemand >
                0
                  ? "1px solid #fed7aa"
                  : "1px solid #bbf7d0",
              color: "#475569",
              fontSize: "13px",
            }}
          >
            {scenarioResult.additionalDailyDemand >
            0 ? (
              <TrendingUp
                size={17}
                color="#ea580c"
              />
            ) : (
              <TrendingDown
                size={17}
                color="#16a34a"
              />
            )}

            <span>
              Additional Daily Demand:{" "}
              <strong
                style={{
                  color:
                    scenarioResult.additionalDailyDemand >
                    0
                      ? "#c2410c"
                      : "#15803d",
                }}
              >
                {formatNumber(
                  scenarioResult.additionalDailyDemand,
                  2
                )}{" "}
                units/day
              </strong>
            </span>
          </div>
        </>
      )}
    </div>
  );
}