import { Settings } from "../types";

export function PicoBadge({ settings }: { settings: Settings }) {
  return (
    <>
      <a
        href="https://screenshot-to-code.canny.io/feature-requests"
        target="_blank"
      >
        <div
          className="fixed z-50 bottom-16 right-5 rounded-md shadow bg-black
         text-white px-4 text-xs py-3 cursor-pointer"
        >
          有功能请求？
        </div>
      </a>
      {!settings.accessCode && (
        <a href="https://picoapps.xyz?ref=screenshot-to-code" target="_blank">
          <div
            className="fixed z-50 bottom-5 right-5 rounded-md shadow text-black
         bg-white px-4 text-xs py-3 cursor-pointer"
          >
            由 Pico 开源支持的项目
          </div>
        </a>
      )}
      {settings.accessCode && (
        <a href="mailto:support@picoapps.xyz" target="_blank">
          <div
            className="fixed z-50 bottom-5 right-5 rounded-md shadow text-black
         bg-white px-4 text-xs py-3 cursor-pointer"
          >
            电子邮件支持
          </div>
        </a>
      )}
    </>
  );
}
