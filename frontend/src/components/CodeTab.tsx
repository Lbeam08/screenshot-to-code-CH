import { FaCopy } from "react-icons/fa";
import CodeMirror from "./CodeMirror";
import { Button } from "./ui/button";
import { Settings } from "../types";
import copy from "copy-to-clipboard";
import { useCallback } from "react";
import toast from "react-hot-toast";

interface Props {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  settings: Settings;
}

function CodeTab({ code, setCode, settings }: Props) {
  const copyCode = useCallback(() => {
    copy(code);
    toast.success("已复制到剪贴板");
  }, [code]);

  const doOpenInCodepenio = useCallback(async () => {
    // TODO: 根据所使用的框架更新 CSS 和 JS 外部链接
    const data = {
      html: code,
      editors: "100", // 1: 打开 HTML，0: 关闭 CSS，0: 关闭 JS
      layout: "left",
      css_external:
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" +
        (code.includes("<ion-")
          ? ",https://cdn.jsdelivr.net/npm/@ionic/core/css/ionic.bundle.css"
          : ""),
      js_external:
        "https://cdn.tailwindcss.com " +
        (code.includes("<ion-")
          ? ",https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js,https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.js"
          : ""),
    };

    // 创建一个隐藏的表单并提交以在 CodePen 中打开代码
    // 无法直接使用 fetch API，因为我们要在新标签页中打开 URL
    const input = document.createElement("input");
    input.setAttribute("type", "hidden");
    input.setAttribute("name", "data");
    input.setAttribute("value", JSON.stringify(data));

    const form = document.createElement("form");
    form.setAttribute("method", "POST");
    form.setAttribute("action", "https://codepen.io/pen/define");
    form.setAttribute("target", "_blank");
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
  }, [code]);

  return (
    <div className="relative">
      <div className="flex justify-start items-center px-4 mb-2">
        <span
          title="复制代码"
          className="bg-black text-white flex items-center justify-center hover:text-black hover:bg-gray-100 cursor-pointer rounded-lg text-sm p-2.5"
          onClick={copyCode}
        >
          复制代码 <FaCopy className="ml-2" />
        </span>
        <Button
          onClick={doOpenInCodepenio}
          className="bg-gray-100 text-black ml-2 py-2 px-4 border border-black rounded-md hover:bg-gray-400 focus:outline-none"
        >
          在{" "}
          <img
            src="https://assets.codepen.io/t-1/codepen-logo.svg"
            alt="codepen.io"
            className="h-4 ml-1"
          />
          中打开
        </Button>
      </div>
      <CodeMirror
        code={code}
        editorTheme={settings.editorTheme}
        onCodeChange={setCode}
      />
    </div>
  );
}

export default CodeTab;
