import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { iterColor } from "../utils";

export default function Plot({ series, visibleIters }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart>
        <XAxis dataKey="sim_time" type="number" />
        <YAxis />
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
              dot={true}
              isAnimationActive={false}
            />
          )
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
