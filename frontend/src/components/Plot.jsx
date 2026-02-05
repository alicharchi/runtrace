import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";

export default function Plot({ series, yVarName }) {
  const points = series?.points || [];

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
