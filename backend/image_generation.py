import asyncio
import os
import re
from openai import AsyncOpenAI
from bs4 import BeautifulSoup


async def process_tasks(prompts, api_key, base_url):
    tasks = [generate_image(prompt, api_key, base_url) for prompt in prompts]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    processed_results = []
    for result in results:
        if isinstance(result, Exception):
            print(f"发生了异常：{result}")
            processed_results.append(None)
        else:
            processed_results.append(result)

    return processed_results


async def generate_image(prompt, api_key, base_url):
    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    image_params = {
        "model": "dall-e-3",
        "quality": "standard",
        "style": "natural",
        "n": 1,
        "size": "1024x1024",
        "prompt": prompt,
    }
    res = await client.images.generate(**image_params)
    await client.close()
    return res.data[0].url


def extract_dimensions(url):
    # 用于匹配格式为 '300x200' 的数字的正则表达式
    matches = re.findall(r"(\d+)x(\d+)", url)

    if matches:
        width, height = matches[0]  # 提取第一个匹配项
        width = int(width)
        height = int(height)
        return (width, height)
    else:
        return (100, 100)


def create_alt_url_mapping(code):
    soup = BeautifulSoup(code, "html.parser")
    images = soup.find_all("img")

    mapping = {}

    for image in images:
        if not image["src"].startswith("https://placehold.co"):
            mapping[image["alt"]] = image["src"]

    return mapping


async def generate_images(code, api_key, base_url, image_cache):
    # 查找所有图像
    soup = BeautifulSoup(code, "html.parser")
    images = soup.find_all("img")

    # 提取alt文本作为图像提示
    alts = []
    for img in images:
        # 仅在图像以https://placehold.co开头且不在image_cache中时包括URL
        if (
            img["src"].startswith("https://placehold.co")
            and image_cache.get(img.get("alt")) is None
        ):
            alts.append(img.get("alt", None))

    # 排除没有alt文本的图像
    alts = [alt for alt in alts if alt is not None]

    # 去除重复项
    prompts = list(set(alts))

    # 如果没有要替换的图像，则提前返回
    if len(prompts) == 0:
        return code

    # 生成图像
    results = await process_tasks(prompts, api_key, base_url)

    # 创建将alt文本映射到图像URL的字典
    mapped_image_urls = dict(zip(prompts, results))

    # 与image_cache合并
    mapped_image_urls = {**mapped_image_urls, **image_cache}

    # 用生成的URL替换旧的图像URL
    for img in images:
        # 跳过不以https://placehold.co开头的图像（保持原样）
        if not img["src"].startswith("https://placehold.co"):
            continue

        new_url = mapped_image_urls[img.get("alt")]

        if new_url:
            # 设置width和height属性
            width, height = extract_dimensions(img["src"])
            img["width"] = width
            img["height"] = height
            # 用映射的图像URL替换img['src']
            img["src"] = new_url
        else:
            print("对alt文本为：" + img.get("alt") + " 的图像生成失败")

    # 返回修改后的HTML
    # （需要美化它，因为BeautifulSoup会破坏格式）
    return soup.prettify()
