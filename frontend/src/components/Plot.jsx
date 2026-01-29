import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from "recharts";
import { iterColor } from "../utils";

export default function Plot({ series, visibleIters, yVarName }) {
  return (
    <div className="w-100" style={{ height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series.flatMap((s) => s.points)}>
          <XAxis dataKey="sim_time" type="number">
            <Label
              value="Simulation Time"
              position="insideBottom"
              offset={-5}
            />
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

          <Legend
            verticalAlign="top"
            align="right"
            layout="vertical"
            wrapperStyle={{
              position: "absolute",
              top: 20,
              right: 20,
              backgroundColor: "rgba(255,255,255,0.85)",
              padding: "6px 8px",
              borderRadius: "6px",
              fontSize: "0.85rem",
            }}
          />

          {series.map(
            (s) =>
              visibleIters[s.iter] && (
                <Line
                  key={s.iter}
                  data={s.points}
                  dataKey="value"
                  name={`iter ${s.iter}`}
                  stroke={iterColor(s.iter)}
                  dot={false}
                  isAnimationActive={false}
                />
              )
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
