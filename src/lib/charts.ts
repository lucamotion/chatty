import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Title,
} from "chart.js";
import { CanvasRenderingContext2D } from "skia-canvas";

ChartJS.register([
  CategoryScale,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Legend,
  Title,
]);

const backgroundPlugin = {
  id: "background",
  beforeDraw: (
    chart: ChartJS,
    _args: unknown,
    options: { backgroundColor: string },
  ) => {
    const ctx = chart.ctx as CanvasRenderingContext2D;
    ctx.save();
    ctx.fillStyle = options.backgroundColor || "white";
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
  defaults: {
    backgroundColor: "white",
  },
};

ChartJS.register(backgroundPlugin);

export const Plugins = { backgroundPlugin };
export * from "chart.js";
export const Chart = ChartJS;
