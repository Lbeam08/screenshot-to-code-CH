# 截图转代码

这个简单的应用程序将截图转换成代码（HTML/Tailwind CSS，或 React 或 Vue 或 Bootstrap）。它使用 GPT-4 Vision 生成代码，并使用 DALL-E 3 生成类似的图片。现在您还可以输入一个 URL 来克隆一个实时网站！

https://github.com/abi/screenshot-to-code/assets/23818/6cebadae-2fe3-4986-ac6a-8fb9db030045

查看下面的[示例](https://github.com/abi/screenshot-to-code#-examples)部分以获取更多演示。

## 🚀 试一试！

🆕 [在这里试用](https://screenshottocode.com/)（请使用您自己的 OpenAI 密钥 - **您的密钥必须具有访问 GPT-4 Vision 的权限。有关详细信息，请参阅 [FAQ](https://github.com/abi/screenshot-to-code#%EF%B8%8F-faqs) 部分**）。或者查看下面的[入门指南](https://github.com/abi/screenshot-to-code#-getting-started)获取本地安装说明。

## 🌟 最近更新

- 11月30日 - 深色模式，输出 Ionic 代码（感谢 [@dialmedu](https://github.com/dialmedu)），设置 OpenAI 基本 URL
- 11月28日 - 🔥 🔥 🔥 自定义您的技术栈：React 或 Bootstrap 或 TailwindCSS
- 11月23日 - 发送当前复制版本的截图（有时可以提高后续生成的质量）
- 11月21日 - 在代码编辑器中编辑代码并实时预览更改（感谢 [@clean99](https://github.com/clean99)）
- 11月20日 - 粘贴一个 URL 来截图和克隆（需要 [ScreenshotOne 免费 API 密钥](https://screenshotone.com/?via=screenshot-to-code)）
- 11月19日 - 支持深色/浅色代码编辑器主题 - 感谢 [@kachbit](https://github.com/kachbit)
- 11月16日 - 添加了一个设置，如果您不需要 DALL-E 图片生成，可以禁用它
- 11月16日 - 直接在应用程序内查看代码
- 11月15日 - 现在您可以指示人工智能根据您的要求更新代码。如果人工智能搞砸了一些样式或错过了某个部分，这将非常有帮助。

## 🛠 入门指南

该应用程序具有 React/Vite 前端和 FastAPI 后端。您需要具有访问 GPT-4 Vision API 的 OpenAI API 密钥。

运行后端（我使用 Poetry 进行包管理 - 如果您没有它，请运行 `pip install poetry`）：

```
cd backend
echo "OPENAI_API_KEY=您的秘钥" > .env
poetry install
poetry shell
poetry run uvicorn main:app --reload --port 7001
```

运行前端：

```
cd frontend
yarn
yarn dev --host
```

打开 [http://localhost:5173](http://localhost:5173/) 来使用应用程序。

如果您更喜欢在不同端口上运行后端，可以在 `frontend/.env.local` 中更新 VITE_WS_BACKEND_URL。

出于调试目的，如果您不想浪费 GPT4-Vision 的信用，您可以在模拟模式下运行后端（该模式会流式传输预先录制的响应）：

```
MOCK=true poetry run uvicorn main:app --reload --port 7001
```

## Docker

如果您的系统上安装了 Docker，在根目录中运行：

```
echo "OPENAI_API_KEY=您的秘钥" > .env
docker-compose up -d --build
```

该应用程序将在 [http://localhost:5173](http://localhost:5173/) 上启动运行。请注意，您无法使用此设置开发应用程序，因为文件更改不会触发重新构建。

## 🙋‍♂️ 常见问题

- **在设置后端时遇到错误。我该如何修复？** [尝试这个](https://github.com/abi/screenshot-to-code/issues/3#issuecomment-1814777959)。如果仍然不起作用，请提出问题。
- **如何获取 OpenAI API 密钥？** 请参阅 https://github.com/abi/screenshot-to-code/blob/main/Troubleshooting.md
- **如何提供反馈？** 欢迎提出反馈、功能请求和错误报告，或在 [Twitter](https://twitter.com/_abi_) 上联系我。

## 📚 示例

**纽约时报**

| 原始截图                                                     | 复制版本                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| <img width="1238" alt="Screenshot 2023-11-20 at 12 54 03 PM" src="https://github.com/abi/screenshot-to-code/assets/23818/3b644dfa-9ca6-4148-84a7-3405b6671922"> | <img width="1414" alt="Screenshot 2023-11-20 at 12 59 56 PM" src="https://github.com/abi/screenshot-to-code/assets/23818/26201c9f-1a28-4f35-a3b1-1f04e2b8ce2a"> |

**Instagram 页面（不包含 Taylor Swift 的图片）**

https://github.com/abi/screenshot-to-code/assets/23818/503eb86a-356e-4dfc-926a-dabdb1ac7ba1

**Hacker News**，但起初颜色不对，所以我们微调了它

https://github.com/abi/screenshot-to-code/assets/23818/3fec0f77-44e8-4fb3-a769-ac7410315e5d

## 🌍 托管版本

🆕 [在这里尝试](https://screenshottocode.com/)（请使用您自己的 OpenAI 密钥 - **您的密钥必须具有访问 GPT-4 Vision 的权限。有关详细信息，请参阅 [FAQ](https://github.com/abi/screenshot-to-code#%EF%B8%8F-faqs) 部分**）。或者查看[入门指南](https://github.com/abi/screenshot-to-code#-getting-started)获取本