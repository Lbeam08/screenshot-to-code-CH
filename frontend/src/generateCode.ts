import toast from "react-hot-toast";
import { WS_BACKEND_URL } from "./config";
import { USER_CLOSE_WEB_SOCKET_CODE } from "./constants";

const ERROR_MESSAGE = "生成代码出错。请查看开发者控制台和后端日志获取详细信息。随时可以打开 Github 问题。";

const STOP_MESSAGE = "代码生成已停止";

export interface CodeGenerationParams {
  generationType: "create" | "update";
  image: string;
  resultImage?: string;
  history?: string[];
  // isImageGenerationEnabled: boolean; // TODO: 与 types.ts 中的 Settings 类型合并
}

export function generateCode(
  wsRef: React.MutableRefObject<WebSocket | null>,
  params: CodeGenerationParams,
  onChange: (chunk: string) => void,
  onSetCode: (code: string) => void,
  onStatusUpdate: (status: string) => void,
  onComplete: () => void
) {
  const wsUrl = `${WS_BACKEND_URL}/generate-code`;
  console.log("连接到后端 @ ", wsUrl);

  const ws = new WebSocket(wsUrl);
  wsRef.current = ws;

  ws.addEventListener("open", () => {
    ws.send(JSON.stringify(params));
  });

  ws.addEventListener("message", async (event: MessageEvent) => {
    const response = JSON.parse(event.data);
    if (response.type === "chunk") {
      onChange(response.value);
    } else if (response.type === "status") {
      onStatusUpdate(response.value);
    } else if (response.type === "setCode") {
      onSetCode(response.value);
    } else if (response.type === "error") {
      console.error("生成代码出错", response.value);
      toast.error(response.value);
    }
  });
  ws.addEventListener("close", (event) => {
    console.log("连接已关闭", event.code, event.reason);
    if (event.code === USER_CLOSE_WEB_SOCKET_CODE) {
      toast.success(STOP_MESSAGE);
    } else if (event.code !== 1000) {
      console.error("WebSocket 错误代码", event);
      toast.error(ERROR_MESSAGE);
    }
    onComplete();
  });

  ws.addEventListener("error", (error) => {
    console.error("WebSocket 错误", error);
    toast.error(ERROR_MESSAGE);
  });
}
