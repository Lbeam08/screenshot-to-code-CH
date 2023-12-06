import { useState } from "react";
import { HTTP_BACKEND_URL } from "../config";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "react-hot-toast";

interface Props {
  screenshotOneApiKey: string | null;
  doCreate: (urls: string[]) => void;
}

export function UrlInputSection({ doCreate, screenshotOneApiKey }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [referenceUrl, setReferenceUrl] = useState("");

  async function takeScreenshot() {
    if (!screenshotOneApiKey) {
      toast.error(
        "请在设置对话框中添加 ScreenshotOne API 密钥。这是可选的 - 您也可以直接拖放和上传图片。",
        { duration: 8000 }
      );
      return;
    }

    if (!referenceUrl) {
      toast.error("请输入 URL");
      return;
    }

    if (referenceUrl) {
      try {
        setIsLoading(true);
        const response = await fetch(`${HTTP_BACKEND_URL}/api/screenshot`, {
          method: "POST",
          body: JSON.stringify({
            url: referenceUrl,
            apiKey: screenshotOneApiKey,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("捕获截图失败");
        }

        const res = await response.json();
        doCreate([res.url]);
      } catch (error) {
        console.error(error);
        toast.error(
          "捕获截图失败。查看控制台和后端日志以获取更多详细信息。"
        );
      } finally {
        setIsLoading(false);
      }
    }
  }

  return (
    <div className="max-w-[90%] min-w-[40%] gap-y-2 flex flex-col">
      <div className="text-gray-500 text-sm">或截取 URL...</div>
      <Input
        placeholder="输入 URL"
        onChange={(e) => setReferenceUrl(e.target.value)}
        value={referenceUrl}
      />
      <Button
        onClick={takeScreenshot}
        disabled={isLoading}
        className="bg-slate-400"
      >
        {isLoading ? "正在捕获..." : "捕获"}
      </Button>
    </div>
  );
}
