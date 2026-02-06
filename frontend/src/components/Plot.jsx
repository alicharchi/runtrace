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
  console.info(`loading is ${loading}, yVarName is ${yVarName}, points.length is ${points.length}.`);
  if (loading && yVarName) {
    console.info("A");
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: 400 }}>
        <span>Loading plot...</span>
      </div>
    );
  }
  console.info("B");
  if (points.length === 0) {
    console.info("C");
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: 400 }}>
        <span>No data to display</span>
      </div>
    );
  }

  console.info("D");
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
