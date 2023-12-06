# 首先加载环境变量
from dotenv import load_dotenv

load_dotenv()

import json
import os
import traceback
from datetime import datetime
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import openai
from llm import stream_openai_response
from mock import mock_completion
from image_generation import create_alt_url_mapping, generate_images
from prompts import assemble_prompt
from routes import screenshot
from access_token import validate_access_token

app = FastAPI(openapi_url=None, docs_url=None, redoc_url=None)

# 配置CORS设置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 用于调试的标志，当不想浪费GPT4-Vision积分时有用
# 设置为True将流式传输模拟响应而不调用OpenAI API
# TODO：只能在值为'True'时设置为True，而不是任意真值
SHOULD_MOCK_AI_RESPONSE = bool(os.environ.get("MOCK", False))

# 当在生产环境中运行时（托管版本上）
# 用作功能标志以启用或禁用某些功能
IS_PROD = os.environ.get("IS_PROD", False)

app.include_router(screenshot.router)

@app.get("/")
async def get_status():
    return HTMLResponse(
        content="<h3>您的后端正在正常运行。请打开前端URL（默认为http://localhost:5173）以使用截图转代码。</h3>"
    )

def write_logs(prompt_messages, completion):
    # 从环境中获取日志路径，如果未提供则默认为当前工作目录
    logs_path = os.environ.get("LOGS_PATH", os.getcwd())

    # 如果指定的日志路径中不存在run_logs目录，则创建它
    logs_directory = os.path.join(logs_path, "run_logs")
    if not os.path.exists(logs_directory):
        os.makedirs(logs_directory)

    print("正在写入日志目录：", logs_directory)

    # 使用当前时间戳生成唯一的文件名，存储在日志目录中
    filename = datetime.now().strftime(f"{logs_directory}/messages_%Y%m%d_%H%M%S.json")

    # 将消息字典写入每次运行的新文件中
    with open(filename, "w") as f:
        f.write(json.dumps({"prompt": prompt_messages, "completion": completion}))

@app.websocket("/generate-code")
async def stream_code(websocket: WebSocket):
    await websocket.accept()

    print("正在建立WebSocket连接...")

    async def throw_error(
        message: str,
    ):
        await websocket.send_json({"type": "error", "value": message})
        await websocket.close()

    params = await websocket.receive_json()

    print("收到参数")

    # 从请求中读取代码配置设置。如果未提供，则使用默认值。
    generated_code_config = ""
    if "generatedCodeConfig" in params and params["generatedCodeConfig"]:
        generated_code_config = params["generatedCodeConfig"]
    print(f"正在生成{generated_code_config}代码")

    # 从请求中获取OpenAI API密钥。如果未提供，则使用环境变量的值。
    # 如果都没有提供，则抛出错误。
    openai_api_key = None
    if "accessCode" in params and params["accessCode"]:
        print("访问码 - 使用平台API密钥")
        if await validate_access_token(params["accessCode"]):
            openai_api_key = os.environ.get("PLATFORM_OPENAI_API_KEY")
        else:
            await websocket.send_json(
                {
                    "type": "error",
                    "value": "无效的访问码或您的积分已用尽。请重试。",
                }
            )
            return
    else:
        if params["openAiApiKey"]:
            openai_api_key = params["openAiApiKey"]
            print("从客户端设置对话框使用OpenAI API密钥")
        else:
            openai_api_key = os.environ.get("OPENAI_API_KEY")
            if openai_api_key:
                print("从环境变量中使用OpenAI API密钥")

    if not openai_api_key:
        print("未找到OpenAI API密钥")
        await websocket.send_json(
            {
                "type": "error",
                "value": "未找到OpenAI API密钥。请在设置对话框中添加您的API密钥，或将其添加到backend/.env文件中。",
            }
        )
        return

    # 从请求中获取OpenAI基本URL。如果未提供，则使用环境变量的值。
    openai_base_url = None
    # 在生产环境中禁用用户指定的OpenAI基本URL
    if not os.environ.get("IS_PROD"):
        if "openAiBaseURL" in params and params["openAiBaseURL"]:
            openai_base_url = params["openAiBaseURL"]
            print("从客户端设置对话框中使用OpenAI基本URL")
        else:
            openai_base_url = os.environ.get("OPENAI_BASE_URL")
            if openai_base_url:
                print("从环境变量中使用OpenAI基本URL")

    if not openai_base_url:
        print("使用官方OpenAI URL")

    # 从请求中获取图像生成标志。如果未提供，则默认为True。
    should_generate_images = (
        params["isImageGenerationEnabled"]
        if "isImageGenerationEnabled" in params
        else True
    )

    print("正在生成代码...")
    await websocket.send_json({"type": "status", "value": "正在生成代码..."})

    async def process_chunk(content):
        await websocket.send_json({"type": "chunk", "value": content})

    # 组装提示
    try:
        if params.get("resultImage") and params["resultImage"]:
            prompt_messages = assemble_prompt(
                params["image"], generated_code_config, params["resultImage"]
            )
        else:
            prompt_messages = assemble_prompt(params["image"], generated_code_config)
    except:
        await websocket.send_json(
            {
                "type": "error",
                "value": "组装提示时出错。请联系support@picoapps.xyz支持。",
            }
        )
        await websocket.close()
        return

    # 用于更新的图像缓存，以便我们不必重新生成图像
    image_cache = {}

    if params["generationType"] == "update":
        # 转换为消息格式
        # TODO：将此移到前端
        for index, text in enumerate(params["history"]):
            prompt_messages += [
                {"role": "assistant" if index % 2 == 0 else "user", "content": text}
            ]

        image_cache = create_alt_url_mapping(params["history"][-2])

    if SHOULD_MOCK_AI_RESPONSE:
        completion = await mock_completion(process_chunk)
    else:
        try:
            completion = await stream_openai_response(
                prompt_messages,
                api_key=openai_api_key,
                base_url=openai_base_url,
                callback=lambda x: process_chunk(x),
            )
        except openai.AuthenticationError as e:
            print("[GENERATE_CODE] 认证失败", e)
            error_message = (
                "OpenAI密钥不正确。请确保您的OpenAI API密钥正确，或在OpenAI仪表板上创建新的OpenAI API密钥。"
                + (
                    "或者，您可以直接在此网站上购买代码生成积分。"
                    if IS_PROD
                    else ""
                )
            )
            return await throw_error(error_message)
        except openai.NotFoundError as e:
            print("[GENERATE_CODE] 模型未找到", e)
            error_message = (
                e.message
                + "。请确保您已正确按照说明获取了具有GPT视觉访问权限的OpenAI密钥：https://github.com/abi/screenshot-to-code/blob/main/Troubleshooting.md"
                + (
                    "或者，您可以直接在此网站上购买代码生成积分。"
                    if IS_PROD
                    else ""
                )
            )
            return await throw_error(error_message)
        except openai.RateLimitError as e:
            print("[GENERATE_CODE] 超过速率限制", e)
            error_message = (
                "OpenAI错误 - '您已超过当前配额，请检查您的计划和帐单详细信息。'"
                + (
                    "或者，您可以直接在此网站上购买代码生成积分。"
                    if IS_PROD
                    else ""
                )
            )
            return await throw_error(error_message)

    # 将消息字典写入日志，以便以后进行调试
    write_logs(prompt_messages, completion)

    try:
        if should_generate_images:
            await websocket.send_json(
                {"type": "status", "value": "正在生成图像..."}
            )
            updated_html = await generate_images(
                completion,
                api_key=openai_api_key,
                base_url=openai_base_url,
                image_cache=image_cache,
            )
        else:
            updated_html = completion
        await websocket.send_json({"type": "setCode", "value": updated_html})
        await websocket.send_json(
            {"type": "status", "value": "代码生成完成。"}
        )
    except Exception as e:
        traceback.print_exc()
        print("图像生成失败", e)
        await websocket.send_json(
            {"type": "status", "value": "图像生成失败，但代码已完成。"}
        )

    await websocket.close()
