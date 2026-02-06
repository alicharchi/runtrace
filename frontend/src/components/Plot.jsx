import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";

export default function Plot({ series, yVarName, loading }) {
  const points = series?.points || [];

  // Show placeholder message if loading or empty
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: 400 }}>
        <span>Loading plot...</span>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: 400 }}>
        <span>No data to display</span>
      </div>
    );
  }

  return (
    <div className="w-100" style={{ height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <XAxis dataKey="sim_time" type="number">
            <Label value="Simulation Time" position="insideBottom" offset={-5} />
          </XAxis>

          <YAxis>
            <Label
              value={yVarName}
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: "middle" }}
            />
          </YAxis>

          <Tooltip />

          <Line
            data={points}
            dataKey="value"
            name={yVarName}
            stroke="#007bff"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
