export function OnboardingNote() {
  return (
    <div className="flex flex-col space-y-4 bg-green-700 p-2 rounded text-stone-200 text-sm">
      <span>
        要使用截图转代码工具，请先{" "}
        <a
          className="inline underline hover:opacity-70"
          href="https://buy.stripe.com/8wM6sre70gBW1nqaEE"
          target="_blank"
        >
          购买积分（100代生成36美元）
        </a>{" "}
        或使用您自己的OpenAI API密钥，具备GPT4视觉访问权限。{" "}
        <a
          href="https://github.com/abi/screenshot-to-code/blob/main/Troubleshooting.md"
          className="inline underline hover:opacity-70"
          target="_blank"
        >
          按照这些说明获取您的API密钥。
        </a>{" "}
        并将其粘贴到设置对话框中（位于上方的齿轮图标）。您的密钥仅存储在您的浏览器中，绝不存储在我们的服务器上。
      </span>
    </div>
  );
}
