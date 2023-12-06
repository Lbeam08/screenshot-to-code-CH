import { useEffect, useRef, useState } from "react";
import ImageUpload from "./components/ImageUpload";
import CodePreview from "./components/CodePreview";
import Preview from "./components/Preview";
import { CodeGenerationParams, generateCode } from "./generateCode";
import Spinner from "./components/Spinner";
import classNames from "classnames";
import {
  FaCode,
  FaDesktop,
  FaDownload,
  FaMobile,
  FaUndo,
} from "react-icons/fa";

import { Switch } from "./components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import SettingsDialog from "./components/SettingsDialog";
import { Settings, EditorTheme, AppState, GeneratedCodeConfig } from "./types";
import { IS_RUNNING_ON_CLOUD } from "./config";
import { PicoBadge } from "./components/PicoBadge";
import { OnboardingNote } from "./components/OnboardingNote";
import { usePersistedState } from "./hooks/usePersistedState";
import { UrlInputSection } from "./components/UrlInputSection";
import TermsOfServiceDialog from "./components/TermsOfServiceDialog";
import html2canvas from "html2canvas";
import { USER_CLOSE_WEB_SOCKET_CODE } from "./constants";
import CodeTab from "./components/CodeTab";
import OutputSettingsSection from "./components/OutputSettingsSection";

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.INITIAL);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [executionConsole, setExecutionConsole] = useState<string[]>([]);
  const [updateInstruction, setUpdateInstruction] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [settings, setSettings] = usePersistedState<Settings>(
    {
      openAiApiKey: null,
      openAiBaseURL: null,
      screenshotOneApiKey: null,
      isImageGenerationEnabled: true,
      editorTheme: EditorTheme.COBALT,
      generatedCodeConfig: GeneratedCodeConfig.HTML_TAILWIND,
      // Only relevant for hosted version
      isTermOfServiceAccepted: false,
      accessCode: null,
    },
    "setting"
  );

  const [shouldIncludeResultImage, setShouldIncludeResultImage] =
    useState<boolean>(false);

  const wsRef = useRef<WebSocket>(null);

  // 当用户已经在本地存储中有设置时，新添加的键不会添加到设置中，所以如果它是假的，我们使用默认值填充它
  useEffect(() => {
    if (!settings.generatedCodeConfig) {
      setSettings((prev) => ({
        ...prev,
        generatedCodeConfig: GeneratedCodeConfig.HTML_TAILWIND,
      }));
    }
  }, [settings.generatedCodeConfig, setSettings]);

  const takeScreenshot = async (): Promise<string> => {
    const iframeElement = document.querySelector(
      "#preview-desktop"
    ) as HTMLIFrameElement;
    if (!iframeElement?.contentWindow?.document.body) {
      return "";
    }

    const canvas = await html2canvas(iframeElement.contentWindow.document.body);
    const png = canvas.toDataURL("image/png");
    return png;
  };

  const downloadCode = () => {
    // 创建来自生成代码的 Blob
    const blob = new Blob([generatedCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    // 创建一个锚元素并设置下载属性
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html"; // 设置下载文件名
    document.body.appendChild(a); // 添加到文档中
    a.click(); // 以编程方式单击锚点以触发下载

    // 清理，删除锚点并撤消 Blob URL
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setAppState(AppState.INITIAL);
    setGeneratedCode("");
    setReferenceImages([]);
    setExecutionConsole([]);
    setHistory([]);
  };

  const stop = () => {
    wsRef.current?.close?.(USER_CLOSE_WEB_SOCKET_CODE);
    // 确保即使 WebSocket 已关闭，停止也可以更正状态
    setAppState(AppState.CODE_READY);
  };

  function doGenerateCode(params: CodeGenerationParams) {
    setExecutionConsole([]);
    setAppState(AppState.CODING);

    // 将设置与参数合并
    const updatedParams = { ...params, ...settings };

    generateCode(
      wsRef,
      updatedParams,
      (token) => setGeneratedCode((prev) => prev + token),
      (code) => setGeneratedCode(code),
      (line) => setExecutionConsole((prev) => [...prev, line]),
      () => setAppState(AppState.CODE_READY)
    );
  }

  // 初始版本创建
  function doCreate(referenceImages: string[]) {
    // 重置任何现有状态
    reset();

    setReferenceImages(referenceImages);
    if (referenceImages.length > 0) {
      doGenerateCode({
        generationType: "create",
        image: referenceImages[0],
      });
    }
  }

  // 后续更新
  async function doUpdate() {
    const updatedHistory = [...history, generatedCode, updateInstruction];
    if (shouldIncludeResultImage) {
      const resultImage = await takeScreenshot();
      doGenerateCode({
        generationType: "update",
        image: referenceImages[0],
        resultImage: resultImage,
        history: updatedHistory,
      });
    } else {
      doGenerateCode({
        generationType: "update",
        image: referenceImages[0],
        history: updatedHistory,
      });
    }

    setHistory(updatedHistory);
    setGeneratedCode("");
    setUpdateInstruction("");
  }

  const handleTermDialogOpenChange = (open: boolean) => {
    setSettings((s) => ({
      ...s,
      isTermOfServiceAccepted: !open,
    }));
  };

  return (
    <div className="mt-2 dark:bg-black dark:text-white">
      {IS_RUNNING_ON_CLOUD && <PicoBadge settings={settings} />}
      {IS_RUNNING_ON_CLOUD && (
        <TermsOfServiceDialog
          open={!settings.isTermOfServiceAccepted}
          onOpenChange={handleTermDialogOpenChange}
        />
      )}
      <div className="lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-96 lg:flex-col">
        <div className="flex grow flex-col gap-y-2 overflow-y-auto border-r border-gray-200 bg-white px-6 dark:bg-zinc-950 dark:text-white">
          <div className="flex items-center justify-between mt-10 mb-2">
            <h1 className="text-2xl ">截图生成代码</h1>
            <SettingsDialog settings={settings} setSettings={setSettings} />
          </div>

          <OutputSettingsSection
            generatedCodeConfig={settings.generatedCodeConfig}
            setGeneratedCodeConfig={(config: GeneratedCodeConfig) =>
              setSettings((prev) => ({
                ...prev,
                generatedCodeConfig: config,
              }))
            }
            shouldDisableUpdates={
              appState === AppState.CODING || appState === AppState.CODE_READY
            }
          />

          {IS_RUNNING_ON_CLOUD &&
            !(settings.openAiApiKey || settings.accessCode) && (
              <OnboardingNote />
            )}

          {(appState === AppState.CODING ||
            appState === AppState.CODE_READY) && (
              <>
                {/* 仅在编码时显示代码预览 */}
                {appState === AppState.CODING && (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-x-1">
                      <Spinner />
                      {executionConsole.slice(-1)[0]}
                    </div>
                    <div className="flex mt-4 w-full">
                      <Button
                        onClick={stop}
                        className="w-full dark:text-white dark:bg-gray-700"
                      >
                        停止
                      </Button>
                    </div>
                    <CodePreview code={generatedCode} />
                  </div>
                )}

                {appState === AppState.CODE_READY && (
                  <div>
                    <div className="grid w-full gap-2">
                      <Textarea
                        placeholder="告诉 AI 要更改什么..."
                        onChange={(e) => setUpdateInstruction(e.target.value)}
                        value={updateInstruction}
                      />
                      <div className="flex justify-between items-center gap-x-2">
                        <div className="font-500 text-xs text-slate-700 dark:text-white">
                          包括当前版本的截图？
                        </div>
                        <Switch
                          checked={shouldIncludeResultImage}
                          onCheckedChange={setShouldIncludeResultImage}
                          className="dark:bg-gray-700"
                        />
                      </div>
                      <Button
                        onClick={doUpdate}
                        className="dark:text-white dark:bg-gray-700"
                      >
                        更新
                      </Button>
                    </div>
                    <div className="flex items-center gap-x-2 mt-2">
                      <Button
                        onClick={downloadCode}
                        className="flex items-center gap-x-2 dark:text-white dark:bg-gray-700"
                      >
                        <FaDownload /> 下载
                      </Button>
                      <Button
                        onClick={reset}
                        className="flex items-center gap-x-2 dark:text-white dark:bg-gray-700"
                      >
                        <FaUndo />
                        重置
                      </Button>
                    </div>
                  </div>
                )}

                {/* 参考图像显示 */}
                <div className="flex gap-x-2 mt-2">
                  <div className="flex flex-col">
                    <div
                      className={classNames({
                        "扫描相对": appState === AppState.CODING,
                      })}
                    >
                      <img
                        className="w-[340px] 边框 边框-gray-200 圆角-md"
                        src={referenceImages[0]}
                        alt="参考"
                      />
                    </div>
                    <div className="text-gray-400 uppercase text-sm text-center mt-1">
                      原始截图
                    </div>
                  </div>
                  <div className="bg-gray-400 px-4 py-2 圆形文本-sm 隐藏">
                    <h2 className="text-lg mb-4 border-b border-gray-800">
                      控制台
                    </h2>
                    {executionConsole.map((line, index) => (
                      <div
                        key={index}
                        className="border-b border-gray-400 mb-2 text-gray-600 font-mono"
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
        </div>
      </div>

      <main className="py-2 lg:pl-96">
        {appState === AppState.INITIAL && (
          <div className="flex flex-col justify-center items-center gap-y-10">
            <ImageUpload setReferenceImages={doCreate} />
            <UrlInputSection
              doCreate={doCreate}
              screenshotOneApiKey={settings.screenshotOneApiKey}
            />
          </div>
        )}

        {(appState === AppState.CODING || appState === AppState.CODE_READY) && (
          <div className="ml-4">
            <Tabs defaultValue="desktop">
              <div className="flex justify-end mr-8 mb-4">
                <TabsList>
                  <TabsTrigger value="desktop" className="flex gap-x-2">
                    <FaDesktop /> 桌面
                  </TabsTrigger>
                  <TabsTrigger value="mobile" className="flex gap-x-2">
                    <FaMobile /> 移动
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex gap-x-2">
                    <FaCode />
                    代码
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="desktop">
                <Preview code={generatedCode} device="desktop" />
              </TabsContent>
              <TabsContent value="mobile">
                <Preview code={generatedCode} device="mobile" />
              </TabsContent>
              <TabsContent value="code">
                <CodeTab
                  code={generatedCode}
                  setCode={setGeneratedCode}
                  settings={settings}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
