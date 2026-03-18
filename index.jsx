import { useState, useMemo } from "react";

const SUMMARY = [
  { db: "DBA", label: "Sin strain", accuracy: 94.83, mae: 25.95, rmse: 69.07, n: 8760 },
  { db: "DBB", label: "Strain (DBB)", accuracy: 93.38, mae: 81.98, rmse: 200.88, n: 8760 },
  { db: "DBC", label: "Strain (DBC)", accuracy: 92.11, mae: 47.93, rmse: 121.96, n: 8760 },
];

const CLASS_ORDER = [
  "point_defect", "small", "medium_small", "medium_large", "large_small",
  "extra_large_1", "extra_large_2", "extra_large_3", "extra_large_4"
];

const CLASS_LABELS = {
  point_defect: "Point Def.", small: "Small", medium_small: "Med-S",
  medium_large: "Med-L", large_small: "Large-S", extra_large_1: "XL-1",
  extra_large_2: "XL-2", extra_large_3: "XL-3", extra_large_4: "XL-4"
};

const HEATMAP = {
  DBA: { point_defect: 100.0, small: 99.54, medium_small: 96.01, medium_large: 95.67, large_small: 90.97, extra_large_1: 95.24, extra_large_2: 98.91, extra_large_3: 94.05, extra_large_4: 92.36 },
  DBB: { point_defect: 100.0, small: 98.84, medium_small: 94.79, medium_large: 95.90, large_small: 95.64, extra_large_1: 95.08, extra_large_2: 96.45, extra_large_3: 95.54, extra_large_4: 88.43 },
  DBC: { point_defect: 100.0, small: 98.15, medium_small: 94.68, medium_large: 96.12, large_small: 94.24, extra_large_1: 98.25, extra_large_2: 95.90, extra_large_3: 87.20, extra_large_4: 85.94 },
};

const REG_MAE = {
  DBA: { point_defect: 0.0, small: 0.03, medium_small: 0.21, medium_large: 0.40, large_small: 0.58, extra_large_1: 0.48, extra_large_2: 0.41, extra_large_3: 0.57, extra_large_4: 66.82 },
  DBB: { point_defect: 0.0, small: 0.05, medium_small: 0.32, medium_large: 0.61, large_small: 0.91, extra_large_1: 1.04, extra_large_2: 0.98, extra_large_3: 1.09, extra_large_4: 211.75 },
  DBC: { point_defect: 0.01, small: 0.17, medium_small: 0.47, medium_large: 0.71, large_small: 1.02, extra_large_1: 1.43, extra_large_2: 1.10, extra_large_3: 1.66, extra_large_4: 123.17 },
};

const CONFUSION = {
  DBA: [[258,0,0,0,0,0,0,0,0],[0,1289,6,0,0,0,0,0,0],[0,8,939,31,0,0,0,0,0],[0,0,2,839,36,0,0,0,0],[0,0,0,23,584,35,0,0,0],[0,0,0,0,5,600,25,0,0],[0,0,0,0,0,0,362,4,0],[0,0,0,0,0,0,20,316,0],[0,0,0,0,0,0,0,258,3120]],
  DBB: [[258,0,0,0,0,0,0,0,0],[0,1281,14,0,0,0,0,0,0],[0,16,927,35,0,0,0,0,0],[0,0,4,841,32,0,0,0,0],[0,0,0,4,614,24,0,0,0],[0,0,0,0,13,599,18,0,0],[0,0,0,0,0,3,353,10,0],[0,0,0,0,0,0,15,321,0],[0,0,0,0,0,0,0,391,2987]],
  DBC: [[258,0,0,0,0,0,0,0,0],[0,1272,23,0,0,0,0,0,0],[0,19,926,33,0,0,0,0,0],[0,0,16,843,18,0,0,0,0],[0,0,0,16,605,21,0,0,0],[0,0,0,0,0,619,7,4,0],[0,0,0,0,0,11,351,4,0],[0,0,0,0,0,0,43,293,0],[0,0,0,0,0,0,0,475,2903]],
};

const MISCLASS_TOP = {
  DBA: [["XL-4 -> XL-3", 258], ["Med-L -> Large-S", 36], ["Large-S -> XL-1", 35], ["Med-S -> Med-L", 31], ["XL-1 -> XL-2", 25]],
  DBB: [["XL-4 -> XL-3", 391], ["Med-S -> Med-L", 35], ["Med-L -> Large-S", 32], ["Large-S -> XL-1", 24], ["XL-1 -> XL-2", 18]],
  DBC: [["XL-4 -> XL-3", 475], ["XL-3 -> XL-2", 43], ["Med-S -> Med-L", 33], ["Small -> Med-S", 23], ["Large-S -> XL-1", 21]],
};

function accColor(val) {
  if (val >= 98) return "#065f46";
  if (val >= 95) return "#047857";
  if (val >= 92) return "#059669";
  if (val >= 88) return "#d97706";
  if (val >= 85) return "#ea580c";
  return "#dc2626";
}

function accBg(val) {
  if (val >= 98) return "#d1fae5";
  if (val >= 95) return "#ecfdf5";
  if (val >= 92) return "#fef9c3";
  if (val >= 88) return "#ffedd5";
  if (val >= 85) return "#fee2e2";
  return "#fecaca";
}

function cmColor(val, maxVal) {
  if (val === 0) return "transparent";
  const intensity = Math.pow(val / maxVal, 0.4);
  const r = Math.round(30 + (1 - intensity) * 200);
  const g = Math.round(70 + (1 - intensity) * 160);
  const b = Math.round(110 + (1 - intensity) * 120);
  return `rgb(${r}, ${g}, ${b})`;
}

const Tab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 18px",
      border: "none",
      borderBottom: active ? "2px solid #1e3a5f" : "2px solid transparent",
      background: "none",
      color: active ? "#1e3a5f" : "#6b7280",
      fontWeight: active ? 700 : 500,
      fontSize: 14,
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      transition: "all 0.2s",
    }}
  >
    {label}
  </button>
);

const SummaryCard = ({ data }) => (
  <div style={{
    background: "white", borderRadius: 8, padding: "16px 20px",
    border: "1px solid #e5e7eb", flex: 1, minWidth: 200,
  }}>
    <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>
      {data.db} -- {data.label}
    </div>
    <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#1e3a5f", fontFamily: "'JetBrains Mono', monospace" }}>
          {data.accuracy}%
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af" }}>DGCNN Acc</div>
      </div>
      <div style={{ borderLeft: "1px solid #e5e7eb", paddingLeft: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#374151", fontFamily: "'JetBrains Mono', monospace" }}>
          {data.mae}
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af" }}>Reg MAE</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#6b7280", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
          {data.rmse}
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af" }}>Reg RMSE</div>
      </div>
    </div>
  </div>
);

const HeatmapView = ({ db }) => {
  const data = HEATMAP[db];
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `100px repeat(${CLASS_ORDER.length}, 1fr)`, gap: 2 }}>
        <div style={{ fontWeight: 600, fontSize: 11, color: "#6b7280", padding: 6 }}>Class</div>
        {CLASS_ORDER.map(c => (
          <div key={c} style={{
            fontWeight: 600, fontSize: 11, color: "#374151", padding: 6, textAlign: "center",
          }}>
            {CLASS_LABELS[c]}
          </div>
        ))}
        {["DBA", "DBB", "DBC"].map(dbKey => (
          <>
            <div key={dbKey} style={{ fontWeight: 600, fontSize: 12, color: "#1e3a5f", padding: "8px 6px", display: "flex", alignItems: "center" }}>
              {dbKey}
            </div>
            {CLASS_ORDER.map(c => {
              const val = HEATMAP[dbKey][c];
              return (
                <div key={`${dbKey}-${c}`} style={{
                  background: accBg(val), color: accColor(val),
                  padding: "8px 4px", textAlign: "center", borderRadius: 4,
                  fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {val.toFixed(1)}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
};

const ConfusionMatrix = ({ db }) => {
  const cm = CONFUSION[db];
  const maxVal = Math.max(...cm.flat().filter((_, i) => {
    const row = Math.floor(i / 9);
    const col = i % 9;
    return row !== col;
  }));

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>
        Filas: clase verdadera | Columnas: clase predicha | Diagonal: aciertos
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `70px repeat(9, 1fr)`, gap: 1, fontSize: 11 }}>
        <div />
        {CLASS_ORDER.map(c => (
          <div key={c} style={{ textAlign: "center", fontWeight: 600, color: "#374151", padding: 3, fontSize: 10 }}>
            {CLASS_LABELS[c]}
          </div>
        ))}
        {cm.map((row, i) => (
          <>
            <div key={`label-${i}`} style={{ fontWeight: 600, color: "#1e3a5f", padding: 3, fontSize: 10, display: "flex", alignItems: "center" }}>
              {CLASS_LABELS[CLASS_ORDER[i]]}
            </div>
            {row.map((val, j) => {
              const isDiag = i === j;
              const bg = isDiag
                ? (val > 0 ? "#dbeafe" : "transparent")
                : cmColor(val, maxVal);
              return (
                <div key={`${i}-${j}`} style={{
                  background: bg,
                  color: isDiag ? "#1e40af" : (val > 0 ? "#fff" : "#d1d5db"),
                  textAlign: "center", padding: "4px 2px", borderRadius: 2,
                  fontWeight: isDiag ? 700 : (val > 0 ? 600 : 400),
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: val > 999 ? 9 : 10,
                }}>
                  {val > 0 ? val : "-"}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
};

const RegressionView = () => {
  const classes = CLASS_ORDER.filter(c => c !== "extra_large_4");
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
        MAE de regresion por clase (sin XL-4)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "80px repeat(8, 1fr)", gap: 2, fontSize: 11 }}>
        <div />
        {classes.map(c => (
          <div key={c} style={{ textAlign: "center", fontWeight: 600, fontSize: 10, color: "#374151", padding: 3 }}>
            {CLASS_LABELS[c]}
          </div>
        ))}
        {["DBA", "DBB", "DBC"].map(db => (
          <>
            <div key={db} style={{ fontWeight: 600, color: "#1e3a5f", padding: 4, fontSize: 12 }}>{db}</div>
            {classes.map(c => {
              const val = REG_MAE[db][c];
              const maxSmall = 2.0;
              const intensity = Math.min(val / maxSmall, 1);
              const bg = `rgba(59, 130, 246, ${0.05 + intensity * 0.35})`;
              return (
                <div key={`${db}-${c}`} style={{
                  background: bg, textAlign: "center", padding: 4, borderRadius: 3,
                  fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                  color: "#1e3a5f",
                }}>
                  {val.toFixed(2)}
                </div>
              );
            })}
          </>
        ))}
      </div>
      <div style={{
        marginTop: 20, padding: 14, background: "#fef3c7", borderRadius: 6,
        border: "1px solid #fbbf24", fontSize: 12, color: "#92400e",
      }}>
        <span style={{ fontWeight: 700 }}>XL-4 (aislado por escala):</span>{" "}
        DBA = 66.82 | DBB = 211.75 | DBC = 123.17
        <br />
        <span style={{ fontSize: 11, color: "#a16207" }}>
          La clase extra_large_4 abarca rangos de vacancias muy amplios, lo que dificulta la regresion puntual.
        </span>
      </div>
    </div>
  );
};

const MisclassView = () => (
  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
    {["DBA", "DBB", "DBC"].map(db => (
      <div key={db} style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#1e3a5f", marginBottom: 8 }}>{db}</div>
        {MISCLASS_TOP[db].map(([label, count], i) => {
          const maxCount = MISCLASS_TOP[db][0][1];
          const width = (count / maxCount) * 100;
          return (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#374151", marginBottom: 2 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
                <span style={{ fontWeight: 700, color: "#dc2626" }}>{count}</span>
              </div>
              <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3 }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  width: `${width}%`,
                  background: i === 0 ? "#ef4444" : "#f59e0b",
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    ))}
  </div>
);

export default function Dashboard() {
  const [view, setView] = useState("overview");
  const [cmDb, setCmDb] = useState("DBA");

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      background: "#f8fafc", minHeight: "100vh", padding: "20px 24px",
      color: "#1e293b",
    }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0,
            letterSpacing: -0.5,
          }}>
            PIPELINE-STEIN-1 -- Resultados Test Set
          </h1>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            DGCNN clasificacion + regresion por ExtraTrees | 9 clases de vacancias | 3 bases de datos
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {SUMMARY.map(s => <SummaryCard key={s.db} data={s} />)}
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: 20, display: "flex", gap: 4 }}>
          <Tab label="Accuracy x Clase" active={view === "overview"} onClick={() => setView("overview")} />
          <Tab label="Confusion Matrix" active={view === "confusion"} onClick={() => setView("confusion")} />
          <Tab label="Regresion" active={view === "regression"} onClick={() => setView("regression")} />
          <Tab label="Misclasificaciones" active={view === "misclass"} onClick={() => setView("misclass")} />
        </div>

        {/* Content */}
        <div style={{ background: "white", borderRadius: 8, padding: 20, border: "1px solid #e5e7eb" }}>
          {view === "overview" && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
                DGCNN Accuracy por clase y base de datos (%)
              </div>
              <HeatmapView />
              <div style={{ marginTop: 16, fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
                Patron consistente: point_defect y small con accuracy near-perfect.
                La degradacion con strain es mas pronunciada en clases grandes (XL-3, XL-4).
                Las clases intermedias se mantienen estables (94-96%) entre las 3 DBs.
              </div>
            </div>
          )}

          {view === "confusion" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["DBA", "DBB", "DBC"].map(db => (
                  <button key={db} onClick={() => setCmDb(db)} style={{
                    padding: "5px 14px", borderRadius: 4, border: "1px solid #d1d5db",
                    background: cmDb === db ? "#1e3a5f" : "white",
                    color: cmDb === db ? "white" : "#374151",
                    fontWeight: 600, fontSize: 12, cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {db}
                  </button>
                ))}
              </div>
              <ConfusionMatrix db={cmDb} />
            </div>
          )}

          {view === "regression" && <RegressionView />}

          {view === "misclass" && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                Top 5 pares de confusion por base de datos
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
                Las misclasificaciones son casi exclusivamente entre clases adyacentes.
                XL-4 confundida con XL-3 domina en las 3 bases.
              </div>
              <MisclassView />
            </div>
          )}
        </div>

        {/* Footer insights */}
        <div style={{
          marginTop: 20, padding: 16, background: "#eff6ff", borderRadius: 8,
          border: "1px solid #bfdbfe", fontSize: 12, color: "#1e40af", lineHeight: 1.7,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>Observaciones clave</div>
          <div>
            1. Clasificacion DGCNN robusta (92-95%) incluso bajo strain, con errores casi siempre entre clases vecinas.
          </div>
          <div>
            2. Regresion precisa (MAE &lt; 2 vacancias) para clases point_defect hasta XL-3.
            La clase XL-4 tiene MAE desproporcionado por su amplio rango de vacancias.
          </div>
          <div>
            3. El patron XL-4 -&gt; XL-3 es el error dominante y se amplifica con strain
            (DBA: 258, DBB: 391, DBC: 475).
          </div>
        </div>
      </div>
    </div>
  );
}
