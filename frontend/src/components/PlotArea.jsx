import Plot from "./Plot";
import { Spinner } from "react-bootstrap";

export default function PlotArea({ plotData, parameter, loading }) {
  return (
    <div className="position-relative">
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 400,
            backgroundColor: "rgba(255,255,255,0.6)",
            zIndex: 10,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spinner animation="border" role="status" />
        </div>
      )}
      <div style={{ opacity: loading ? 0.5 : 1 }}>
        <Plot series={{ points: plotData }} yVarName={parameter} loading={loading} />
      </div>
    </div>
  );
}
