import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FaCog } from "react-icons/fa";
import { EditorTheme, Settings } from "../types";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import { capitalize } from "../lib/utils";
import { IS_RUNNING_ON_CLOUD } from "../config";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

interface Props {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

function SettingsDialog({ settings, setSettings }: Props) {
  const handleThemeChange = (theme: EditorTheme) => {
    setSettings((s) => ({
      ...s,
      editorTheme: theme,
    }));
  };

  return (
    <Dialog>
      <DialogTrigger>
        <FaCog />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-4">设置</DialogTitle>
        </DialogHeader>

        {/* 访问代码 */}
        {IS_RUNNING_ON_CLOUD && (
          <div className="flex flex-col space-y-4 bg-slate-300 p-4 rounded dark:text-white dark:bg-slate-800">
            <Label htmlFor="access-code">
              <div>访问代码</div>
              <div className="font-light mt-1 leading-relaxed">
                购买一个访问代码。
              </div>
            </Label>

            <Input
              id="access-code dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="输入您的屏幕截图转代码访问代码"
              value={settings.accessCode || ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  accessCode: e.target.value,
                }))
              }
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Label htmlFor="image-generation">
            <div>DALL-E 占位图生成</div>
            <div className="font-light mt-2">
              更有趣，但如果您想节省费用，可以关闭它。
            </div>
          </Label>
          <Switch
            id="image-generation"
            checked={settings.isImageGenerationEnabled}
            onCheckedChange={() =>
              setSettings((s) => ({
                ...s,
                isImageGenerationEnabled: !s.isImageGenerationEnabled,
              }))
            }
          />
        </div>
        <div className="flex flex-col space-y-4">
          <Label htmlFor="openai-api-key">
            <div>OpenAI API 密钥</div>
            <div className="font-light mt-2 leading-relaxed">
              仅存储在您的浏览器中。不会存储在服务器上。会覆盖您的.env配置。
            </div>
          </Label>

          <Input
            id="openai-api-key"
            placeholder="OpenAI API 密钥"
            value={settings.openAiApiKey || ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                openAiApiKey: e.target.value,
              }))
            }
          />

          {!IS_RUNNING_ON_CLOUD && (
            <>
              <Label htmlFor="openai-api-key">
                <div>OpenAI 基础 URL（可选）</div>
                <div className="font-light mt-2 leading-relaxed">
                  如果您不想使用默认值，可以替换为代理 URL。
                </div>
              </Label>

              <Input
                id="openai-base-url"
                placeholder="OpenAI 基础 URL"
                value={settings.openAiBaseURL || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    openAiBaseURL: e.target.value,
                  }))
                }
              />
            </>
          )}

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>按 URL 配置屏幕截图</AccordionTrigger>
              <AccordionContent>
                <Label htmlFor="screenshot-one-api-key">
                  <div className="leading-normal font-normal text-xs">
                    如果您想直接使用 URL 而不是自己截图，请添加 ScreenshotOne API 密钥。{" "}
                    <a
                      href="https://screenshotone.com?via=screenshot-to-code"
                      className="underline"
                      target="_blank"
                    >
                      免费获取 100 次屏幕截图/月。
                    </a>
                  </div>
                </Label>

                <Input
                  id="screenshot-one-api-key"
                  className="mt-2"
                  placeholder="ScreenshotOne API 密钥"
                  value={settings.screenshotOneApiKey || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      screenshotOneApiKey: e.target.value,
                    }))
                  }
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>主题设置</AccordionTrigger>
              <AccordionContent className="space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <Label htmlFor="app-theme">
                    <div>应用主题</div>
                  </Label>
                  <div>
                    <button
                      className="flex rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50t"
                      onClick={() => {
                        document
                          .querySelector("div.mt-2")
                          ?.classList.toggle("dark"); // 为侧边栏启用暗模式
                        document.body.classList.toggle("dark");
                        document
                          .querySelector('div[role="presentation"]')
                          ?.classList.toggle("dark"); // 为上传容器启用暗模式
                      }}
                    >
                      切换暗模式
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="editor-theme">
                    <div>
                      代码编辑器主题 - 需要刷新页面以更新
                    </div>
                  </Label>
                  <div>
                    <Select // 在这里使用自定义 Select 组件
                      name="editor-theme"
                      value={settings.editorTheme}
                      onValueChange={(value) =>
                        handleThemeChange(value as EditorTheme)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        {capitalize(settings.editorTheme)}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cobalt">Cobalt</SelectItem>
                        <SelectItem value="espresso">Espresso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter>
          <DialogClose>保存</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsDialog;
