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
    <ResponsiveContainer width="100%" height={400}>
      <LineChart>        
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
        <Legend />

        {series.map(s =>
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
  );
}
