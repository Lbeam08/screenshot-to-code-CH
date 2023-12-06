import { useState, useEffect, useMemo, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";

const baseStyle = {
  flex: 1,
  width: "80%",
  margin: "0 auto",
  minHeight: "400px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: "#eeeeee",
  borderStyle: "dashed",
  backgroundColor: "#fafafa",
  color: "#bdbdbd",
  outline: "none",
  transition: "border .24s ease-in-out",
};

const focusedStyle = {
  borderColor: "#2196f3",
};

const acceptStyle = {
  borderColor: "#00e676",
};

const rejectStyle = {
  borderColor: "#ff1744",
};

// TODO: 移至独立文件
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

type FileWithPreview = {
  preview: string;
} & File;

interface Props {
  setReferenceImages: (referenceImages: string[]) => void;
}

function ImageUpload({ setReferenceImages }: Props) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({
      maxFiles: 1,
      maxSize: 1024 * 1024 * 5, // 5 MB
      accept: {
        "image/png": [".png"],
        "image/jpeg": [".jpeg"],
        "image/jpg": [".jpg"],
      },
      onDrop: (acceptedFiles) => {
        // 设置预览缩略图图像
        setFiles(
          acceptedFiles.map((file) =>
            Object.assign(file, {
              preview: URL.createObjectURL(file),
            })
          ) as FileWithPreview[]
        );

        // 将图像转换为数据URL并设置参考图像状态
        Promise.all(acceptedFiles.map((file) => fileToDataURL(file)))
          .then((dataUrls) => {
            setReferenceImages(dataUrls.map((dataUrl) => dataUrl as string));
          })
          .catch((error) => {
            toast.error("读取文件出错：" + error);
            console.error("读取文件出错：", error);
          });
      },
      onDropRejected: (rejectedFiles) => {
        toast.error(rejectedFiles[0].errors[0].message);
      },
    });

  const pasteEvent = useCallback(
    (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      const files = [];
      for (let i = 0; i < items.length; i++) {
        const file = items[i].getAsFile();
        if (file && file.type.startsWith("image/")) {
          files.push(file);
        }
      }

      // 将图像转换为数据URL并设置参考图像状态
      Promise.all(files.map((file) => fileToDataURL(file)))
        .then((dataUrls) => {
          if (dataUrls.length > 0) {
            setReferenceImages(dataUrls.map((dataUrl) => dataUrl as string));
          }
        })
        .catch((error) => {
          // TODO: 向用户显示错误
          console.error("读取文件出错：", error);
        });
    },
    [setReferenceImages]
  );

  // TODO: 确保我们不会在文本输入组件中监听粘贴事件
  useEffect(() => {
    window.addEventListener("paste", pasteEvent);
    return () => {
      window.removeEventListener("paste", pasteEvent);
    };
  }, [pasteEvent]);

  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]); // 将 files 添加为依赖

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject]
  );

  return (
    <section className="container">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <div {...getRootProps({ style: style as any })}>
        <input {...getInputProps()} />
        <p className="text-slate-700 text-lg">
          将截图拖放到这里，<br />
          或从剪贴板粘贴，<br />
          或点击上传
        </p>
      </div>
    </section>
  );
}

export default ImageUpload;
